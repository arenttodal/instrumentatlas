#!/usr/bin/env python3
"""Turn scanned-looking engravings into atlas plates.

Sources are black line art on white paper, one PNG per instrument, in
plates-source/. Each is trimmed, inverted, and used as an alpha mask over a
solid gold fill, so what lands in plates/ is gold line work on transparency
that sits on the page background without a paper rectangle behind it.

    python3 tools/plates.py                 # everything in plates-source/
    python3 tools/plates.py oboe            # just this one
    python3 tools/plates.py --force         # rebuild even if up to date

The source file name is the instrument's atlas id: plates-source/oboe.png
becomes plates/oboe.png. Rename the source if it does not already match, the
tool will tell you when an id is not in atlas-data.js.

Two things here are deliberate and easy to undo by accident:

  * The alpha is never thresholded. Engraved line ends taper to nothing, and
    the taper is carried entirely by partial transparency. Round it off and
    the plate stops reading as drawn and starts reading as cut out.
  * The gold is a solid fill masked by the drawing, not a recolouring of the
    original. Every pixel, including the fully transparent ones, carries the
    same RGB, which is what stops a pale halo appearing around the strokes.
"""

import argparse
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / 'plates-source'
OUT_DIR = ROOT / 'plates'
DATA = ROOT / 'atlas-data.js'

GOLD = '#D4A04A'      # --gold in atlas.css. The plates are the only place it
                      # is baked into a file rather than read from a variable.
LONG_SIDE = 1400
MARGIN_PCT = 3.0      # of the long side, applied evenly on all four sides
FLOOR = 4             # headroom above the measured paper level, in 0-255. Any
                      # higher and the faintest strokes start disappearing


def rel(path):
    """Repo-relative for printing, absolute when the path is somewhere else."""
    try:
        return path.relative_to(ROOT)
    except ValueError:
        return path


def hex_rgb(value):
    v = value.lstrip('#')
    if len(v) != 6:
        raise argparse.ArgumentTypeError(f'expected a 6 digit hex colour, got {value!r}')
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def known_ids():
    """Instrument ids from atlas-data.js, for a name check. Best effort: if the
    file moves or the shape changes, the check goes quiet rather than lying."""
    try:
        text = DATA.read_text(encoding='utf-8')
    except OSError:
        return set()
    block = re.search(r'const INSTRUMENTS\s*=\s*\{(.*?)\n\};', text, re.S)
    if not block:
        return set()
    # keys sit at two spaces of indent and are bare or quoted: piccolo:{ ...
    return set(re.findall(r"^  '?([a-z0-9-]+)'?\s*:\s*\{", block.group(1), re.M))


def load_options(src_dir):
    """Per source overrides, if plates-source/options.json exists:

        { "oboe": { "crop": [44, 44, 43, 122] } }

    crop is an inset in pixels from the left, top, right and bottom edges,
    for sources that arrive with a frame, a caption or anything else that is
    not the instrument. Everything else about a plate is uniform, so this file
    stays empty until a source needs it."""
    path = src_dir / 'options.json'
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError) as err:
        sys.exit(f'{path}: {err}')


def crop_arg(value):
    parts = [p.strip() for p in value.split(',')]
    if len(parts) != 4 or not all(p.lstrip('-').isdigit() for p in parts):
        raise argparse.ArgumentTypeError('expected four integers: left,top,right,bottom')
    return [int(p) for p in parts]


def paper_is_light(grey):
    """True when the four corners are paper rather than ink. Sources are meant
    to be black on white; this catches one handed to us the other way round."""
    w, h = grey.size
    corners = [grey.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    return sum(corners) / len(corners) > 127


def border_level(img):
    """Median luminance of the outermost ring: the paper, whatever shade it is."""
    w, h = img.size
    px = img.load()
    ring = ([px[x, 0] for x in range(0, w, 5)] + [px[x, h - 1] for x in range(0, w, 5)] +
            [px[0, y] for y in range(0, h, 5)] + [px[w - 1, y] for y in range(0, h, 5)])
    ring.sort()
    return ring[len(ring) // 2]


def lift_black(alpha):
    """Pull the paper to fully transparent without flattening the line work.

    A source whose background is near-black rather than black leaves every
    pixel faintly gold, which reads as a grey box behind the drawing. This
    subtracts the measured paper level and rescales what is left, so the paper
    goes to zero while the strokes keep their gradation. It is a black point,
    not a threshold: nothing above the paper is rounded to on or off."""
    lo = min(250, border_level(alpha) + FLOOR)
    if lo <= 0:
        return alpha, 0
    scale = 255 / (255 - lo)
    return alpha.point(lambda p: 0 if p <= lo else min(255, round((p - lo) * scale))), lo


def convert(src, out, colour, long_side, margin_pct, crop=None):
    with Image.open(src) as im:
        im.load()
        # Flatten onto white first: a source saved with transparency would
        # otherwise trim and invert against undefined pixels.
        if im.mode in ('RGBA', 'LA') or 'transparency' in im.info:
            flat = Image.new('RGB', im.size, (255, 255, 255))
            flat.paste(im.convert('RGBA'), mask=im.convert('RGBA').split()[-1])
            grey = flat.convert('L')
        else:
            grey = im.convert('L')

    if crop:
        l, t, r, b = crop
        grey = grey.crop((l, t, grey.width - r, grey.height - b))

    inverted_source = not paper_is_light(grey)
    if inverted_source:
        grey = ImageChops.invert(grey)

    alpha = ImageChops.invert(grey)   # line work light, paper black
    alpha, floor = lift_black(alpha)

    # Trim to the drawing. The paper is now exactly zero, so the bounding box
    # of anything non-zero is the line work and nothing else.
    box = alpha.getbbox()
    if box:
        alpha = alpha.crop(box)

    margin = max(1, round(max(alpha.size) * margin_pct / 100))
    padded = Image.new('L', (alpha.width + margin * 2, alpha.height + margin * 2), 0)
    padded.paste(alpha, (margin, margin))

    scale = long_side / max(padded.size)
    size = (max(1, round(padded.width * scale)), max(1, round(padded.height * scale)))
    padded = padded.resize(size, Image.LANCZOS)

    plate = Image.new('RGBA', size, colour + (0,))
    plate.putalpha(padded)            # solid fill, drawing as the mask

    out.parent.mkdir(parents=True, exist_ok=True)
    plate.save(out, 'PNG', optimize=True)
    return size, out.stat().st_size, inverted_source, floor


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('ids', nargs='*', help='instrument ids to build (default: all)')
    ap.add_argument('--src', type=Path, default=SRC_DIR)
    ap.add_argument('--out', type=Path, default=OUT_DIR)
    ap.add_argument('--size', type=int, default=LONG_SIDE, help='long side in px')
    ap.add_argument('--margin', type=float, default=MARGIN_PCT, help='margin, %% of long side')
    ap.add_argument('--gold', type=hex_rgb, default=hex_rgb(GOLD))
    ap.add_argument('--crop', type=crop_arg, metavar='L,T,R,B',
                    help='inset in px, overriding options.json for this run')
    ap.add_argument('--force', action='store_true', help='rebuild up to date plates')
    args = ap.parse_args(argv)

    if not args.src.is_dir():
        sys.exit(f'no source directory at {args.src}')

    sources = sorted(args.src.glob('*.png'))
    if args.ids:
        wanted = set(args.ids)
        sources = [s for s in sources if s.stem in wanted]
        for missing in sorted(wanted - {s.stem for s in sources}):
            print(f'  !  {missing}: no {args.src.name}/{missing}.png')
    if not sources:
        sys.exit(f'nothing to do: no matching PNGs in {args.src}')

    ids = known_ids()
    options = load_options(args.src)
    built = 0
    for src in sources:
        out = args.out / f'{src.stem}.png'
        if ids and src.stem not in ids:
            print(f'  !  {src.name}: not an instrument id in atlas-data.js, rename it')
            continue
        if not args.force and out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
            print(f'  =  {rel(out)} up to date')
            continue
        crop = args.crop or options.get(src.stem, {}).get('crop')
        size, nbytes, flipped, floor = convert(src, out, args.gold, args.size,
                                               args.margin, crop)
        notes = []
        if crop:
            notes.append(f'cropped {",".join(str(c) for c in crop)}')
        if flipped:
            notes.append('source was light on dark')
        if floor:
            notes.append(f'paper lifted off {floor}')
        note = ('  (' + '; '.join(notes) + ')') if notes else ''
        print(f'  ok {rel(out)}  {size[0]}x{size[1]}  {nbytes / 1024:.0f} KB{note}')
        if nbytes > 300 * 1024:
            print(f'  !  {out.name} is over the 300 KB budget')
        built += 1

    print(f'{built} plate{"" if built == 1 else "s"} written to {rel(args.out)}')


if __name__ == '__main__':
    main()
