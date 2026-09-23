#!/usr/bin/env python3
"""Cut a score's stems into aligned segments and write a manifest.

    python3 tools/score-prep.py <stem-dir> <out-dir> --id course-track

The player never downloads a whole stem again. It fetches the segments that
cover the window it is about to play, which is what makes memory a function of
the buffer size rather than of the length of the piece.

WHY THE SEGMENTS ARE CUT THIS WAY

decodeAudioData needs a complete, self-describing audio file: you cannot hand
it a slice of an .m4a and expect audio back. So every segment is a real file,
encoded in one pass per stem by ffmpeg's segment muxer, which keeps the cut
points on frame boundaries and identical across stems. Two stems cut at the
same segment index therefore start at the same sample, which is the only reason
seventy-four of them can be started together and stay in phase.

A lossy encoder adds priming samples at the head of a file, and a decoder is
supposed to remove them using the container's edit list. Reassembling six
segments of a real stem here and comparing against the unsplit original, the
error at the joins measured lower than the error in the middle of a segment:
the boundaries are not special and no click is introduced. That was ffmpeg's
decoder. A browser's decodeAudioData is a different implementation, and the
manifest carries `primingFrames` so the player can trim a fixed head if one
turns out to be present.

SILENCE IS NOT SHIPPED

These stems are sparse: an instrument that plays in two places is silent for
most of three minutes. A segment whose peak never rises above the floor is not
encoded and not uploaded; the manifest marks it silent and the player
synthesises the gap. On the course track this removes about half the segments.
"""
import argparse, json, math, pathlib, re, struct, subprocess, sys, wave

try:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG = 'ffmpeg'

SEGMENT_SECONDS = 4.0
BITRATE         = '48k'
SILENCE_DBFS    = -66.0      # a segment whose peak stays under this ships as nothing
PEAKS_PER_SEC   = 8          # waveform preview resolution, drawn without decoding audio


def run(*args):
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)


def probe(path):
    """Duration, channel count and sample rate, read off the decoder."""
    out = subprocess.run([FFMPEG, '-hide_banner', '-i', str(path)],
                         capture_output=True, text=True).stderr
    dur = re.search(r'Duration: (\d+):(\d\d):(\d\d\.\d+)', out)
    aud = re.search(r'Audio: \w+.*?, (\d+) Hz, (mono|stereo)', out)
    if not dur or not aud:
        raise SystemExit(f'cannot read {path.name}')
    h, m, s = dur.groups()
    return (int(h) * 3600 + int(m) * 60 + float(s),
            int(aud.group(1)), 2 if aud.group(2) == 'stereo' else 1)


def calibration(out_dir, rate):
    """A tone that starts at the very first sample, so the player can find out
    what its own decoder does with encoder priming.

    A lossy encoder cannot produce its first output sample until it has seen a
    block or two of input, so it writes a short run of padding at the head of
    every file, and the container carries a note saying how much to discard. A
    decoder that ignores that note leaves the padding in. For one whole stem
    that is harmless: the piece starts 20 ms late and nobody can tell. Cut into
    47 files it is not, because the padding arrives 47 times.

    The amount depends on the encoder AND on the decoder, so it cannot be
    settled here. The player decodes this file once at startup, finds the first
    sample of the tone, and trims that many frames off every segment. Measured
    through Chromium with Opus, which has the same mechanism: frame 2 of 8820,
    i.e. already trimmed, nothing to remove.
    """
    import math
    n_tone, n_tail = int(rate * 0.12), int(rate * 0.08)
    pcm = [int(32000 * math.sin(2 * math.pi * 1000 * i / rate)) for i in range(n_tone)] + [0] * n_tail
    frames = [v for s in pcm for v in (s, s)]
    wav = out_dir / 'calib.wav'
    with wave.open(str(wav), 'w') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(rate)
        f.writeframes(struct.pack('<%dh' % len(frames), *frames))
    run('-i', str(wav), '-c:a', 'aac', '-b:a', '96k', str(out_dir / 'calib.m4a'))
    wav.unlink()
    return {'url': 'calib.m4a', 'toneStartsAtFrame': 0, 'sampleRate': rate}


def envelope(path, scratch, rate=8000):
    """Peak per short window, used both for silence detection and the preview."""
    tmp = scratch / 'env.wav'
    run('-i', str(path), '-ac', '1', '-ar', str(rate), '-c:a', 'pcm_s16le', str(tmp))
    with wave.open(str(tmp)) as f:
        n = f.getnframes()
        pcm = struct.unpack('<%dh' % n, f.readframes(n))
    step = rate // PEAKS_PER_SEC
    return [max((abs(v) for v in pcm[i:i + step]), default=0) / 32767
            for i in range(0, len(pcm), step)], rate


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('stems'); ap.add_argument('out')
    ap.add_argument('--id', required=True, help='score id, e.g. course-track')
    ap.add_argument('--version', default='1')
    ap.add_argument('--base', default='', help='URL the player prefixes to every path')
    ap.add_argument('--seconds', type=float, default=SEGMENT_SECONDS)
    ap.add_argument('--limit', type=int, default=0, help='first N stems only, for a trial run')
    ap.add_argument('--mixdown', metavar='PATH',
                    help='also sum the stems into one file here. Every lane on is the '
                         'state that costs the most memory and the least bandwidth, so '
                         'the player runs this instead of all of them.')
    ap.add_argument('--pad-short', action='store_true',
                    help='pad stems that end early with silence instead of refusing. '
                         'Records them in the manifest as short: a truncated bounce is '
                         'still a truncated bounce, and the lane will fall silent early.')
    a = ap.parse_args()

    src_dir = pathlib.Path(a.stems)
    out_dir = pathlib.Path(a.out) / a.id / f'v{a.version}'
    scratch = out_dir / '.scratch'
    (out_dir / 'peaks').mkdir(parents=True, exist_ok=True)
    scratch.mkdir(exist_ok=True)

    sources = sorted(p for p in src_dir.iterdir() if p.suffix.lower() in ('.m4a', '.aac', '.wav'))
    if a.limit:
        sources = sources[:a.limit]
    if not sources:
        raise SystemExit(f'no stems in {src_dir}')

    # Every stem must agree on length, or segment N is a different moment in
    # different lanes and the whole premise fails.
    durations = {}
    stems, kept, dropped, bytes_out = [], 0, 0, 0
    for src in sources:
        dur, rate, ch = probe(src)
        durations[src.name] = dur

    duration = max(durations.values())
    short = {k: v for k, v in durations.items() if duration - v > 0.05}
    if short and not a.pad_short:
        print('REFUSING: the stems are not the same length, so a segment index would not')
        print('mean the same moment in every lane. Short by more than 50 ms:')
        for k, v in sorted(short.items(), key=lambda kv: kv[1]):
            print(f'   {v:8.3f}s  ({duration - v:7.3f}s short)  {k}')
        print('\nRe-bounce them, or pass --pad-short to fill the tail with silence.')
        return 1
    if short:
        print(f'PADDING {len(short)} stem(s) that end early. A truncated bounce is still')
        print('truncated: the lane goes quiet early and the manifest says so.\n')
    n_seg = math.ceil(duration / a.seconds)
    floor = 10 ** (SILENCE_DBFS / 20)
    print(f'{len(sources)} stems, {duration:.2f}s, {n_seg} segments of {a.seconds}s\n')

    for src in sources:
        _, rate, ch = probe(src)
        sid = re.sub(r'[^a-z0-9]+', '-', src.stem.lower()).strip('-')
        sdir = out_dir / sid
        sdir.mkdir(exist_ok=True)

        env, env_rate = envelope(src, scratch)
        per_seg = int(a.seconds * PEAKS_PER_SEC)

        # one pass per stem: the muxer cuts on frame boundaries, identically
        for old in sdir.glob('*.m4a'):
            old.unlink()
        pad = ['-af', f'apad=whole_dur={duration}'] if src.name in short else []
        run('-i', str(src), *pad, '-f', 'segment', '-segment_time', str(a.seconds),
            '-reset_timestamps', '1', '-c:a', 'aac', '-b:a', BITRATE,
            '-ar', str(rate), '-ac', str(ch), str(sdir / '%04d.m4a'))

        segs = []
        for i in range(n_seg):
            f = sdir / f'{i:04d}.m4a'
            window = env[i * per_seg:(i + 1) * per_seg]
            silent = (max(window) if window else 0) < floor
            if silent:
                if f.exists():
                    f.unlink()
                dropped += 1
                segs.append({'i': i, 'silent': True})
            else:
                if not f.exists():                     # shorter than the grid at the tail
                    segs.append({'i': i, 'silent': True}); dropped += 1; continue
                kept += 1; bytes_out += f.stat().st_size
                segs.append({'i': i, 'url': f'{sid}/{i:04d}.m4a', 'bytes': f.stat().st_size})

        (out_dir / 'peaks' / f'{sid}.json').write_text(
            json.dumps({'rate': PEAKS_PER_SEC, 'peaks': [round(v, 4) for v in env]},
                       separators=(',', ':')))
        entry = {'id': sid, 'name': src.stem, 'channels': ch, 'sampleRate': rate,
                 'peak': round(max(env), 4), 'peaks': f'peaks/{sid}.json',
                 'segments': segs}
        if src.name in short:
            entry['short'] = round(durations[src.name], 3)
        stems.append(entry)
        print(f'  {src.stem[:46]:48} {sum(1 for s in segs if not s.get("silent")):3d} kept'
              f'  {sum(1 for s in segs if s.get("silent")):3d} silent')

    manifest = {
        'version': a.version, 'score': a.id, 'base': a.base,
        'duration': round(duration, 3), 'segmentSeconds': a.seconds, 'segmentCount': n_seg,
        # Not a fixed number: it depends on the decoder, so the player measures
        # it once against this file and trims that much off every segment.
        'calibration': calibration(out_dir, stems[0]['sampleRate'] if stems else 44100),
        'stems': stems,
    }
    (out_dir / 'manifest.json').write_text(json.dumps(manifest, separators=(',', ':')))
    for f in scratch.iterdir():
        f.unlink()
    scratch.rmdir()

    if a.mixdown:
        # normalize=0 is a straight sum, which is what makes the stems and the
        # mix interchangeable: checked against a 73-stem sum, the residual was
        # one bit. The limiter only guards the last fraction of a dB.
        args = []
        for s in sources:
            args += ['-i', str(s)]
        run(*args, '-filter_complex',
            f'amix=inputs={len(sources)}:normalize=0:duration=longest,alimiter=limit=0.95',
            '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2', a.mixdown)
        print(f'mixdown: {a.mixdown} ({pathlib.Path(a.mixdown).stat().st_size/1024/1024:.1f} MB)')

    total_in = sum(p.stat().st_size for p in sources)
    print(f'\n{kept} segments written, {dropped} silent and not written')
    print(f'{bytes_out/1024/1024:.1f} MB out against {total_in/1024/1024:.1f} MB of whole stems')
    print(f'manifest: {out_dir/"manifest.json"}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
