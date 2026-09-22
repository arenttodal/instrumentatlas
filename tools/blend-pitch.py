#!/usr/bin/env python3
"""Derive each blend render's octave against the rest of its theme, from audio.

The file names mostly say it -- 8va up, 8vb down -- but not always. Theme 2's
bassoon is an octave down and unmarked; SO_Flute means the written octave in one
theme and the octave above in another; and at least four names disagree outright
with what the file plays. Guessing wrong puts a wrong answer in level 3, so this
measures instead.

The renders of a theme are bounced from one project and are sample-aligned, so
the same window is the same note in every file. That is the whole trick: f0 is
taken at identical sample offsets across the set and compared window by window,
which never compares a file's low note against another's high one. Comparing
whole-phrase medians does exactly that and is far noisier.

Pitch per window is harmonic product spectrum, chosen because it is the method
that does not make octave errors -- the one error that would matter here.

No dependencies: the FFT is below.
"""
import struct, glob, math, sys, os, cmath, statistics

DECIM = 3
N     = 8192          # ~0.5 s at 16 kHz
WINS  = 16            # how many aligned windows to vote over

def wav_mono(path, decim=DECIM):
    d = open(path, 'rb').read(); i = 12; fmt = None; data = None
    while i < len(d) - 8:
        cid = d[i:i+4]; sz = struct.unpack('<I', d[i+4:i+8])[0]
        if cid == b'fmt ':   fmt = struct.unpack('<HHIIHH', d[i+8:i+8+16])
        elif cid == b'data': data = d[i+8:i+8+sz]
        i += 8 + sz + (sz & 1)
    ch, sr, bits = fmt[1], fmt[2], fmt[5]; step = bits // 8
    n = len(data) // step // ch
    out = []
    for k in range(0, n, decim):
        o = (k * ch) * step
        out.append(int.from_bytes(data[o:o+step], 'little', signed=True) / (1 << (bits - 1)))
    return sr / decim, out

def fft(a):
    n = len(a)
    if n & (n - 1): raise ValueError('power of two please')
    a = list(a); j = 0
    for i in range(1, n):
        bit = n >> 1
        while j & bit: j ^= bit; bit >>= 1
        j |= bit
        if i < j: a[i], a[j] = a[j], a[i]
    ln = 2
    while ln <= n:
        wl = cmath.exp(-2j * math.pi / ln)
        for i in range(0, n, ln):
            w = 1 + 0j
            for k in range(ln // 2):
                u = a[i+k]; v = a[i+k+ln//2] * w
                a[i+k] = u + v; a[i+k+ln//2] = u - v
                w *= wl
        ln <<= 1
    return a

HAN = [0.5 - 0.5 * math.cos(2 * math.pi * i / (N - 1)) for i in range(N)]

def f0_at(sr, x, s):
    """f0 of one window, harmonic product spectrum, four terms"""
    seg = [x[s+i] * HAN[i] for i in range(N)]
    sp = fft([complex(v, 0) for v in seg])
    mag = [abs(sp[i]) for i in range(N // 2)]
    hps = list(mag)
    for h in (2, 3, 4):
        for i in range(len(mag) // h):
            hps[i] *= mag[i*h]
    lo = int(30 * N / sr); hi = min(int(1800 * N / sr), len(hps))
    k = max(range(lo, hi), key=lambda i: hps[i])
    return k * sr / N

def rms(x, s):
    return math.sqrt(sum(v*v for v in x[s:s+N]) / N)

theme = sys.argv[1]
# Only ever compare renders of the SAME line. A theme's countermelody and chord
# stems are different music, so their f0 against the melody means nothing --
# pass them as a comma-separated filter to keep a run to one layer.
only = None
argv = sys.argv[2:]
if argv and argv[0].startswith('--only='):
    only = argv.pop(0).split('=', 1)[1].split(',')
src = argv[0] if argv else '/root/.claude/uploads/ed67b014-a4bd-5947-8736-fbf52a22b7fd'
files = sorted(glob.glob(f'{src}/*{theme}_*.wav'))
if only: files = [f for f in files if any(o in os.path.basename(f) for o in only)]
if not files: sys.exit(f'no files for {theme}')

sig = {}
for f in files:
    name = os.path.basename(f).split(theme + '_')[1].replace('.wav', '')
    sr, x = wav_mono(f)
    sig[name] = x
names = list(sig)
length = min(len(v) for v in sig.values())
peak = {n: max(rms(sig[n], s) for s in range(0, length - N, N)) for n in names}

# windows where nearly everyone is sounding, strongest first
cands = []
for s in range(0, length - N, N // 2):
    live = [n for n in names if rms(sig[n], s) > 0.10 * peak[n]]
    if len(live) >= max(2, int(0.75 * len(names))):
        cands.append((sum(rms(sig[n], s) for n in live), s, live))
cands.sort(reverse=True)
cands = cands[:WINS]

dev = {n: [] for n in names}
for _, s, live in cands:
    got = {n: f0_at(sr, sig[n], s) for n in live}
    mid = statistics.median(math.log2(v) for v in got.values())
    for n, v in got.items():
        dev[n].append(math.log2(v) - mid)

print(f'{theme} — {len(cands)} aligned windows, {len(names)} renders\n')
print(f'{"file":<24} {"octaves":>8} {"spread":>7} {"n":>3}  reading')
rows = sorted(names, key=lambda n: -statistics.median(dev[n]))
for n in rows:
    d = dev[n]
    m = statistics.median(d)
    spread = max(d) - min(d)
    near = round(m)
    flag = '' if abs(m - near) < 0.25 else '   <-- not near a whole octave'
    agree = sum(1 for v in d if round(v) == near)
    print(f'{n:<24} {m:>+8.2f} {spread:>7.2f} {agree:>2}/{len(d)}  {near:+d}{flag}')
