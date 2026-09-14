# Evenant Interactive — master handoff

Everything built, everything planned, and everything an agent needs to continue
without seeing the conversation that produced it.

Live: **https://instrumentatlas.pages.dev**

---

## 0. Read this first

Four things are being built. They share a repo, a design system, an audio
pipeline and a philosophy. They are not four products.

| | What it is | State |
|---|---|---|
| **Instrument Atlas** | Reference for every orchestral instrument | 10 of 20 instruments written, 30 audio demos live |
| **3D Viewer** | Rotatable instruments with annotated hotspots | 8 models, embedded in instrument plates |
| **Score View** | A composition dissected stem by stem, with annotations | Complete, one piece loaded |
| **The Accelerator** | Interactive companion to the ebook | Module 1 complete, 6 lessons, 6 widgets |

### The philosophy, in one line

> Demonstrate before you explain. If something can only be described, it stays
> as text.

This is the rule that keeps scope sane. It is why the atlas has audio rather
than adjectives, why the score view exists at all, and why a lesson without a
demonstration does not become a lesson.

---

## 1. Repository

```
instrument-atlas/
├── index.html              the atlas shell
├── atlas.css
├── atlas-data.js           ← atlas content: families, instruments, plates
├── atlas.js                router, seating map, timbre chart, tabs
├── accelerator.html        the companion (single file — see §7)
├── _headers                Cloudflare caching + framing
├── viewer/
│   ├── instruments.html    the 3D viewer, self-contained
│   └── *.glb               models, flat, beside the page
├── audio/
│   ├── instruments/<id>/   3 demos each
│   ├── families/<id>/      3 demos each (pending)
│   └── scores/<id>/        stems for the score view
├── video/                  family hover backgrounds
└── plates/                 engravings (pending)
```

**Static. No build step, no npm, no framework.** Cloudflare Pages redeploys on
every push to `main` in about twenty seconds. Branches get preview URLs.

### Conventions that apply everywhere

- Every class is prefixed `.atl-` in the atlas so it can be embedded
- Data is separated from rendering, always
- Scripts load with `defer` in dependency order; top-level `const` is visible to
  later scripts, which is why nothing exports
- Paths resolve from a single base constant, never hardcoded per entry
- Nothing loads audio, video or 3D until the user asks for it

---

## 2. Design system

| | |
|---|---|
| Background | `#080C14` |
| Gold | `#D4A04A` → `#C08830` · the accent, and "what you are reading now" |
| Blue | `#8FB4E0` · secondary, ambience |
| Warn / OK | `#C0603A` / `#5FB89A` |
| Text | `#BEC0C8` · dim `#7E808A` · faint `#4E505A` |
| Hairlines | `rgba(255,255,255,.07)` · gold `rgba(212,160,74,.24)` |
| Display | Playfair Display 500; italic gold for epithets and claims |
| Body | DM Sans 300/400/500 |
| Labels | DM Sans 700, 9–11px, uppercase, 1.6–2.6px tracking |

**Family colours** — woodwinds `#6FB7E8`, brass `#D4A04A`, strings `#CF5F52`,
percussion `#9B8FD4`, choir `#7FD1B9`.

**Role colours** (score view) — melody `#D4A04A`, counter `#C6A97C`, harmony
`#6E8FB8`, texture `#5C6B7C`, rhythm `#8B94A2`. One accent, then neutrals — a
hierarchy rather than five competing hues.

### Rules that hold the look together

- Cards: 1px hairline, `rgba(255,255,255,.02)` fill, warming to gold on hover
- Left-aligned throughout; nothing is centred except deliberately
- Fade-up on scroll; everything respects `prefers-reduced-motion`
- **Above the fold matters.** Home, family and instrument pages each fit one
  laptop screen. Tabs exist to protect that. If new content does not fit, find
  the space rather than letting the page grow — and say what you traded.

---

## 3. Audio pipeline

Every clip in the project goes through the same treatment, which is why
switching between instruments never jumps in level.

| | |
|---|---|
| Format | AAC 192 kbps (`.aac`, raw ADTS) |
| Sample rate | 48 kHz |
| Loudness | −18 LUFS integrated, true peak −1.5 dBTP |
| Head | Silence trimmed to ~10 ms before the attack |
| Length | 8–25 s for demos; whole piece for score stems |

Two-pass `loudnorm` in ffmpeg — measure, then apply with `linear=true`.

**Never MP3.** Its encoder padding varies per file, which destroys alignment
between stems. Raw `.aac` has a fixed priming delay, so it is fine *provided
every file in a set is encoded with the same encoder and settings*.

**For anything compared or layered** — stems, A/B renders, library comparisons —
the files must be the same passage, same tempo, same length, same start offset,
bounced from the same project. Misalignment reads as a flam and gets blamed on
the sample library.

---

## 4. The Instrument Atlas

Four families, twenty instruments, three-level structure
(collection → family → instrument) so a second collection can be added as a
sibling without restructuring.

### Data model (`atlas-data.js`)

```js
COLLECTION  { id, name, title[], lede }
TIERS       [{id, label, tick, players, era}]        six ensemble sizes
FAMILIES    [{id, plate, name, tagline, lede, role[], smallName,
              sizes:{instrumentId:[t0..t5]}, members[], video?}]
INSTRUMENTS { id: {family, plate, name, latin, epithet, status,
              model?, modelCredit?, summary, range:{lo,hi,note,transposition},
              timbre, facts[], registers[], characteristics[], articulations[],
              blends[{id,label,note}], limits[], demos[{label,note,dur,src}],
              gallery?, prev, next} }
PLATES      { id: svgString | {img:'plates/<id>.png'} }
THUMBS      { id: svgString }
GALLERY     [{v, title, perf, why, chan}]            YouTube ids
```

`sizes` keys **must** match `members` exactly, six entries each. `range.lo/hi`
are MIDI numbers; `timbre` is 0 (darkest) to 1 (brightest) and positions the
instrument on the timbre chart.

### Distinctive features

- **Ensemble sizer** — a six-stop slider from quartet to maximum forces, with
  counts researched against real scores (chamber 6-5-4-4-2, symphonic
  16-14-12-10-8, maximum following Gurrelieder). Instruments absent at a size
  grey out rather than disappearing.
- **Seating map** — a fan above the table, one dot per player, redrawing live as
  the slider moves. The current family lights gold, the rest stay faint.
- **Timbre chart** — every instrument plotted, pitch horizontal, brightness
  vertical, coloured by family, with collision-resolved labels.
- **Family hover video** — on the home page, hovering a family fades in dark
  footage at 30% opacity. Lazy, and removed entirely on touch devices.
- **2D/3D plate toggle** — instruments with a model get a small pill on the
  plate that swaps the engraving for the viewer.

### Remaining work

- **10 instruments unwritten** — piccolo, clarinet, cello, harp, timpani,
  cymbals, snare drum, bass drum, gong, celesta. Content brief exists with full
  text for all of them plus six gallery videos each.
- **Plates** are placeholder line art; the brief for generating and converting
  public-domain-style engravings exists.
- **Family audio demos** — 12 files, three per family, not yet recorded.

---

## 5. The 3D Viewer

`viewer/instruments.html`, self-contained, three.js from CDN via import map.
Models sit **flat beside the page**, not in a subfolder.

**The design bet:** hotspots are *points in normalised model space with a
radius*, not named sub-meshes. Highlighting is a proximity glow computed in a
shader injected via `onBeforeCompile` — `1 - smoothstep(0, radius, distance)`.
That is why any CC-licensed model works without being re-authored.

Every model is centred on origin and scaled so the longest axis is 1.0, which is
what makes hotspot coordinates portable between them.

`?i=<id>` selects an instrument, `?h=<hotspotId>` deep-links a hotspot,
`?author=1` enables author mode — double-click the model and coordinates print to
the console.

**Attribution is legally required.** All models are CC BY 4.0: title, author,
source link, licence link, and a statement of modification, kept visible.

---

## 6. The Score View

A whole composition, stem by stem, with MIDI, annotations and a guided mode.

### The constraint that shaped it

Decoding twelve stems of a two-minute piece at 48 kHz stereo costs **553 MB of
RAM**. Download is not the problem — 29 MB — decoded PCM is. Three fixes:

1. `AudioContext` at **32 kHz**; `decodeAudioData` resamples on the way in
2. Stems decode **lazily**, only when first audible, starting at the current
   transport position so they drop in sample-aligned mid-playback
3. Every playing node lives in a `LIVE` registry — created only through
   `startNode()`, destroyed only through `killNode()`. An earlier version keyed
   them in a Map and overwrote entries, orphaning nodes that kept playing with
   no reference: audible as phasing, as solo failing to isolate, and as sound
   continuing after stop.

Playback is **always stereo**. Summing an orchestral mix with shared reverb to
mono comb-filters it and sounds like a fault.

### Data

```js
score.json        {title, tempo, beats, bars, duration, audioBase,
                   tracks:[{id, name, family, file, notes:[[startBeat,lenBeats,midi]]}],
                   tips:[{id, bar, beats, tracks[], title, body, action?}]}
annotations.json  {sections:[{bar, to, name, note}],
                   roles:[{track, from, to, role, note}]}
```

Region ends are **exclusive** positions, which is what makes half-bar snapping
unambiguous. `tools/midi2json.py` converts MIDI to the `notes` format — run at
commit time, never in the browser.

### Features

Piano roll with independent horizontal and vertical zoom, cursor-anchored like a
DAW · minimap · loop regions dragged on the ruler, looping via buffer loop
points rather than restarts · additive solo with alt-click for exclusive ·
double-click any lane for a temporary solo that restores the exact previous mix ·
presets by family and by role, where **role presets re-solo themselves as the
playhead crosses into a new section**, so "Melody only" plays you the tune moving
through the orchestra · an annotate mode that exports its own JSON, so authoring
never means hand-editing · four region display styles, of which *tint the notes*
is the default because it says the line **is** the melody rather than there being
a box around it.

---

## 7. The Accelerator

See `PORT.md` inside the accelerator folder for the full spec. Summary:

Module 1 (Foundations) complete — overtones, perspective, separation, tone
colour, **chord voicing**, voice leading. Every widget synthesises its own audio,
so it runs with no assets.

**The flagship is the voicing widget**: four draggable noteheads with live checks
against the ebook's two principles — spacing follows the overtone series,
doubling follows 4:2:1 — plus Bad voicing / Fix it for immediate A/B.

Four modules remain, with a demonstration designed for each lesson. The second
flagship is **PReVaDe**: the reader writes a motif, then builds a phrase from it
in four slots with automatic variations offered. It is the ebook's central method
and mechanical enough to build.

---

## 8. Invariants — these break things silently

1. `atlas-data.js` loads before `atlas.js`. Both `defer`. Never `async`.
2. Every `blends[].id` and `prev`/`next` must be a real instrument key.
3. A family's `sizes` keys must match `members` exactly, six entries each.
4. Every `status:'live'` instrument needs both `PLATES` and `THUMBS` art.
5. Never minify, bundle or optimise `viewer/` — `.glb` files are binary and
   three.js is already built.
6. `_headers` only works from the root of the deploy output.
7. `.atl-wrap` must keep `width:100%`. It sits in flex columns, and an auto
   cross-axis margin without an explicit width makes the page shift between tabs.
8. `html` keeps `overflow-y:scroll` / `scrollbar-gutter:stable`, or switching to
   a taller tab jumps the layout sideways.
9. The `AudioContext` must not be created at load — browsers require a gesture.
10. Score-view widgets that start a loop must set `host._cleanup`.
11. Model credits stay visible. CC BY 4.0, four models, legally required.

---

## 9. Legal

**Models** — all CC BY 4.0: Cello Sketchfab by Limpskin, French Horn by
Bethanycrandallart, B♭ Trumpet Model by Pakaku, Violin Texturing by ilushandro,
plus viola, bassoon and clarinet pending attribution. Commercial use permitted;
attribution and a statement of modification required.

**Video** — Adobe Stock standard licence. Covers web use on your own site, no
on-page credit needed, per-seat and non-transferable.

**Audio** — rendered from commercially licensed sample libraries whose developers
are known personally. **Get written permission anyway**, and ask specifically
about *isolated stems*, since EULAs commonly permit distributing music while
prohibiting anything usable as sample content. A two-minute soloable horn stem is
a different thing from a mixed demo.

**Public-domain repertoire** — composition and recording are separate copyrights.
Holst (d. 1934), Ravel (d. 1937), Debussy, Tchaikovsky, Beethoven are all PD in
the EU/Norway. Stravinsky is not until 2042. A PD recording of a PD composition
is the only safe pair; everything else should link out rather than embed.

**Fair use will not cover this.** The product is commercial, EU law has no fair
use doctrine, and a tool that makes a work more consumable is the opposite of
"does not harm the market for the original".

---

## 10. Backlog, in order

1. **Finish the ten remaining instruments.** Content and gallery briefs exist.
2. **Family audio demos** — 12 files.
3. **Hotspot coordinate pass** on horn, trumpet, violin, viola, bassoon,
   clarinet. `?author=1`, double-click, paste. Ten minutes each.
4. **Replace the placeholder plates** with engravings.
5. **Library comparison directory** — spec exists. Nine renders, three
   libraries × three instruments, dry and loudness-matched. Editorial only at
   first; community submissions need alignment checks, server-side
   normalisation and a rights warranty.
6. **Accelerator module 2** — Composition, led by PReVaDe.
7. **SEO** — everything renders client-side, so crawlers see only the shell.
   Prerendering the twenty instrument pages is the fix.

---

## 11. How to work on this

**Claude Code, in the repo**, for anything concrete — content, new instruments,
fixes, refactors. It has the files and git.

**Chat**, for design exploration where seeing three options matters more than
committing to one, and for audio processing. Paste in the single relevant file,
not the whole repo.

**Work on a branch.** Cloudflare deploys every push to `main`, so an unfinished
instrument on `main` is live immediately. Preview URLs do the reviewing.

**Verify in a browser before reporting success.** Serve the site, load the
affected pages, check the console. Code that looks right is not evidence.

**Voice matters and will drift.** The writing is opinionated and practical,
aimed at a composer deciding what to write — not a student memorising facts. The
`limits` array on each instrument is the most valuable part of the atlas: say
what goes wrong and why. If a new instrument entry reads like an encyclopaedia,
reject it and restate the instruction.
