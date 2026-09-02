#!/usr/bin/env python3
"""Check every video id in GALLERY against YouTube.

Run it from the repo root, on a machine that can reach YouTube:

    python3 tools/gallery-check.py            # check everything
    python3 tools/gallery-check.py --quiet    # only print problems

For each id it asks YouTube's oEmbed endpoint what that video is. Three
things can come back:

  ok       the video exists, and the title and channel we store match what
           YouTube reports closely enough
  drift    the video exists but our title or channel has gone stale, or was
           wrong to begin with. The reported values are printed so they can
           be corrected in atlas-data.js
  gone     404 or 401: deleted, made private, or the id is wrong. These are
           the ones that leave a dead card in the gallery

oEmbed answers for a video that exists but has embedding disabled, so this
cannot tell you whether the player will actually run inside the page. The
gallery degrades honestly in that case, the card still links out to YouTube,
but if you want certainty, click through the ones you care about.

Exits non-zero if anything is gone, so it can be a pre-deploy gate.
"""

import argparse
import json
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'atlas-data.js'
OEMBED = 'https://www.youtube.com/oembed'
TIMEOUT = 15


def gallery():
    """Read GALLERY out of atlas-data.js by evaluating it, so the source of
    truth is the file itself rather than a second copy of the parsing rules."""
    script = (
        "const fs=require('fs'),vm=require('vm');const sb={};vm.createContext(sb);"
        f"vm.runInContext(fs.readFileSync({json.dumps(str(DATA))},'utf8')"
        "+';globalThis.__x={GALLERY,INSTRUMENTS};',sb);"
        "const {GALLERY:G,INSTRUMENTS:I}=sb.__x;"
        "const used={};Object.entries(I).forEach(([id,it])=>(it.gallery||[]).forEach("
        "v=>{(used[v]=used[v]||[]).push(id)}));"
        "console.log(JSON.stringify({gallery:G,used}));"
    )
    out = subprocess.run(['node', '-e', script], capture_output=True, text=True, cwd=ROOT)
    if out.returncode:
        sys.exit(f'could not read atlas-data.js:\n{out.stderr.strip()}')
    return json.loads(out.stdout)


def norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', (s or '').lower()).strip()


def look_up(vid):
    url = f'{OEMBED}?url=' + urllib.parse.quote(
        f'https://www.youtube.com/watch?v={vid}', safe='') + '&format=json'
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT) as r:
            return json.loads(r.read().decode('utf-8')), None
    except urllib.error.HTTPError as e:
        return None, ('gone' if e.code in (401, 403, 404) else f'http {e.code}')
    except Exception as e:                      # network, DNS, proxy, timeout
        return None, f'unreachable ({e.__class__.__name__})'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--quiet', action='store_true', help='print only problems')
    args = ap.parse_args()

    data = gallery()
    rows, used = data['gallery'], data['used']
    gone, drift, unreachable = [], [], []

    for g in rows:
        vid = g['v']
        info, err = look_up(vid)
        where = ', '.join(used.get(vid, [])) or 'shared set only'
        if err == 'gone':
            gone.append((vid, g['title'], where))
            print(f'  GONE  {vid}  {g["title"]}  [{where}]')
            continue
        if err:
            unreachable.append((vid, err))
            print(f'  ??    {vid}  {err}')
            continue
        title_ok = norm(g['title'])[:24] in norm(info.get('title')) or \
                   norm(info.get('title'))[:24] in norm(g['title'])
        chan_ok = norm(g['chan'])[:12] in norm(info.get('author_name'))
        if title_ok and chan_ok:
            if not args.quiet:
                print(f'  ok    {vid}  {g["title"]}')
        else:
            drift.append((vid, info.get('title'), info.get('author_name')))
            print(f'  DRIFT {vid}  we say: {g["title"]} / {g["chan"]}')
            print(f'                youtube says: {info.get("title")} / {info.get("author_name")}')

    print(f'\n{len(rows)} videos: {len(rows) - len(gone) - len(drift) - len(unreachable)} ok, '
          f'{len(drift)} drifted, {len(gone)} gone, {len(unreachable)} unreachable')
    if unreachable:
        print('unreachable usually means no route to youtube.com from here, '
              'not that the videos are bad')
    return 1 if gone else 0


if __name__ == '__main__':
    sys.exit(main())
