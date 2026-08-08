# CONTRIBUTING — Instrument Atlas

Everything needed to keep building this, whether by hand or with Claude Code.
Read §1–§4 before the first edit; §7 has ready-to-paste prompts.

Live: https://instrumentatlas.pages.dev

---

## 1. What this is

Two things that share a domain and a visual language:

**The Atlas** — a reference for composers writing for the orchestra. Four
families, twenty instruments. Each instrument has tone colour by register,
characteristics, articulations, blends, limits, audio demos, a range-and-timbre
chart, and a video gallery. Each family has an ensemble-size slider and a
seating map.

**The Viewer** — a 3D instrument explorer with annotated hotspots, at
`/viewer/`, embedded into instrument pages that have a model.

Both are static. No build step, no npm, no framework. Push to `main`, Cloudflare
Pages redeploys in ~20 seconds.

### Current state

| | Status |
|---|---|
| Instruments written | **7 of 20** — flute, horn, cello, violin, viola, double bass, harp |
| Families complete | **Strings (5/5)** |
| 3D models | cello, horn wired · trumpet, violin models exist but unwired |
| Audio demos | **UI only** — players are placeholders, no files yet |
| Plate artwork | **Placeholder line art** — to be replaced with public-domain engravings |
| Gallery videos | Shared placeholder set of nine; per-instrument sets not yet chosen |

---

## 2. File map

```
index.html        page shell — nav, footer, script tags. Rarely changes.
atlas.css         all styles. One file, ~29KB.
atlas-data.js     ← content lives here. Edit this most.
atlas.js          rendering, routing, seating map, timbre chart, tabs.
_headers          Cloudflare caching + framing.
_redirects        empty, deliberately.
.assetsignore     only matters on Workers deploys, harmless on Pages.
viewer/
  instruments.html   the whole 3D viewer, self-contained except for:
  models/*.glb       four models, ~8MB
  vendor/            three.js r170, vendored — never bundled or minified
```

**Load order is `atlas-data.js` then `atlas.js`**, both `defer`. Top-level
`const` in a classic script is visible to later scripts, which is why the data
file needs no exports. Do not switch either to `async` or `type="module"`.

---

## 3. Data schema

All of this is in `atlas-data.js`.

### `COLLECTION`
Title and lede for the home page. One collection today (`orchestral`); the
three-level shape (collection → family → instrument) exists so a second one can
be added without restructuring.

### `TIERS` — six ensemble sizes
`{id, label, tick, players, era}`. Indexes 0–5 run quartet → maximum forces.
Every family's `sizes` array must have exactly six entries, in this order.

### `FAMILIES` — array, order controls the home page
```js
{
  id, plate, name, tagline,
  lede,                    // one or two sentences
  role: [ '<b>Lead.</b> Explanation.', … ],   // HTML allowed, 3–5 items
  smallName,               // what tier 0 means for this family
  sizes: { instrumentId: [t0,t1,t2,t3,t4,t5] },  // number, or '16 + 14'
  members: [ instrumentId, … ]                    // order shown everywhere
}
```
`sizes` keys **must exactly match** `members`, or the ensemble table renders
undefined rows. A `'16 + 14'` string means two desks (Violin I and II) and is
summed for totals.

### `INSTRUMENTS` — the bulk of the work
```js
id: {
  family, plate, name, latin,
  epithet,          // one line, opinionated, sits under the title
  status,           // 'live' = full page · 'plan' = greyed in menus
  model,            // optional: id of a .glb in viewer/models/ → adds a 3D tab
  summary,          // 2–3 sentences
  range:  {lo, hi, note, transposition},   // lo/hi are MIDI numbers, 60 = C4
  timbre,           // 0 = darkest … 1 = brightest. Position on the timbre chart
  facts:  [[label, value, unit?], ×3],
  registers: [{label, pitch, text}, ×3],
  characteristics: [ string, ×4 ],
  articulations:   [ string, … ],
  blends: [{id, label, note}, …],   // id MUST be a real instrument
  limits: [ string, ×3 ],           // what goes wrong, not what goes right
  demos:  [{label, note, dur}, …],
  prev, next        // pager, '' to end a chain
}
```

A `'plan'` stub needs only `{family, name, status, range, timbre}` — enough to
appear in the menus and on the timbre chart.

### `PLATES` / `THUMBS`
SVG strings keyed by instrument id. Gold line art on transparent, stroke only.
The violin family is generated from `stringPlate()` / `stringThumb()` with
proportion arguments rather than four copies.

### `GALLERY`
`{v, title, perf, why, chan}` — `v` is a YouTube id. Shared across instruments
unless an instrument defines its own `gallery: ['id', …]`.

---

## 4. Design system

| | |
|---|---|
| Background | `#080C14` |
| Gold | `#D4A04A` → `#C08830` gradient · accents, active states, the selected instrument |
| Blue | `#8FB4E0` · other instruments, ambience |
| Body text | `#BEC0C8` · dim `#7E808A` · faint `#4E505A` |
| Hairlines | `rgba(255,255,255,.07)` · gold `rgba(212,160,74,.22)` |
| Display | Playfair Display, 500 · italic for epithets and latin names |
| Body | DM Sans, 300/400/500 |
| Labels | DM Sans 700, 9.5–11px, uppercase, 1.5–2.6px tracking |

**Family colours** (timbre chart, `FAM_COLOR` in `atlas.js`): strings `#9B8FD4`,
woodwinds `#5FB89A`, brass `#6C9BD8`, percussion `#C9834F`. Gold is never a
family colour — it is reserved for whatever you are currently reading.

### Rules that hold the look together

- Every class is prefixed `.atl-`. The page is namespaced so it can be embedded.
- Cards: 1px hairline border, `rgba(255,255,255,.02)` fill, warming to gold on hover.
- Nothing is centred except deliberately — the layout is left-aligned throughout.
- Fade-up on scroll via `.atl-fade`, driven by `observeFades()`.
- Everything respects `prefers-reduced-motion`.
- **Above the fold matters.** Home, family and instrument pages are each designed
  to fit one screen on a laptop. Tabs exist to protect that. If you add content,
  find the space rather than letting the page grow.

---

## 5. Invariants — these break things silently

1. `atlas-data.js` loads before `atlas.js`. Both `defer`.
2. Every `blends[].id` and `prev`/`next` must be a real instrument key.
3. `sizes` keys must match `members` exactly, per family.
4. Every `status:'live'` instrument needs an entry in both `PLATES` and `THUMBS`.
5. `viewer/vendor/` and `viewer/models/` must never be minified, bundled or
   passed through an image optimiser. The `.glb` files are binary.
6. `_headers` only works from the root of the deploy output.
7. `.atl-wrap` must keep `width:100%`. It sits inside flex columns, and an auto
   cross-axis margin without an explicit width makes the page shift between tabs.
8. `html` keeps `overflow-y:scroll` / `scrollbar-gutter:stable`, or switching to
   a taller tab jumps the layout sideways.
9. The CC BY credits in the viewer must stay visible. Four models, four
   attributions, legally required:

| Model | Title | Author | Source |
|---|---|---|---|
| cello | Cello Sketchfab | Limpskin | https://skfb.ly/pICFS |
| horn | French Horn | Bethanycrandallart | https://skfb.ly/6TxEP |
| trumpet | B♭ Trumpet Model | Pakaku | https://skfb.ly/otwwn |
| violin | Violin Texturing | ilushandro | https://skfb.ly/oAVFz |

All CC BY 4.0 — commercial use permitted, attribution and a statement of
modification required. Every model was decimated, re-centred and normalised.

---

## 6. Backlog, in the order I'd do it

1. **Write the remaining 13 instruments.** Woodwinds next — flute is done,
   piccolo/oboe/clarinet/bassoon remain. Then brass, then percussion.
2. **Record and wire the audio demos.** Render every instrument's signature
   phrase from a CC0 library (VSCO 2 CE) so levels and room match. Then connect
   the players, which are currently non-functional UI.
3. **Replace the placeholder plates** with public-domain engravings — Met Open
   Access (CC0) or 19th-century encyclopaedia plates. Cut out, gold-tint, keep
   the caption format.
4. **Hotspot coordinate pass on the viewer.** Horn, trumpet and violin positions
   are estimates. `viewer/instruments.html?i=horn&author=1`, double-click each
   part, paste the console output. Ten minutes each.
5. **Wire trumpet and violin** into the atlas with `model:` once their hotspots
   are fixed.
6. **Per-instrument gallery videos** instead of the shared nine.
7. **SEO** — the page renders entirely client-side, so crawlers see only the
   shell. Consider prerendering the twenty instrument pages to static HTML.

---

## 7. Prompts for Claude Code

Paste these from the repo root. Each assumes it will read the relevant file first.

### Add an instrument

> Read `atlas-data.js` and add full content for **[instrument]**, following the
> `cello` and `harp` entries as the model for depth and voice. Replace its
> `status:'plan'` stub. Fill every field in the schema in `CONTRIBUTING.md` §3.
>
> Voice: opinionated and practical, written for a composer deciding what to write,
> not a student memorising facts. The `limits` array is the most valuable part —
> say what goes wrong and why, not what the instrument can do. Prefer the specific
> and slightly surprising over the encyclopaedic.
>
> Add matching `PLATES` and `THUMBS` entries in the same gold line-art style —
> stroke only, no fill, viewBox `0 0 300 520` for plates and `0 0 40 52` for
> thumbs. Reuse `stringPlate()` if it is a bowed string instrument.
>
> Then verify: every `blends[].id` resolves to a real instrument, `prev`/`next`
> chain correctly with its neighbours, and the instrument has both plate and
> thumb art. Serve the site and confirm the page renders before telling me it's done.

### Complete a family

> Write full content for every remaining `status:'plan'` instrument in the
> **[family]** family, following `CONTRIBUTING.md` §3 and §7. Do them one at a
> time and show me each before starting the next. When the family is complete,
> check its family page: the ensemble table, the seating map, the instrument grid
> and the timbre chart should all reflect the new instruments with no code changes.

### Restyle something

> Read `atlas.css` and `CONTRIBUTING.md` §4 first. [Describe the change.]
>
> Constraints: keep the `.atl-` prefix, use the existing CSS variables rather than
> new hex values, keep the page fitting one screen on a laptop, and do not touch
> the invariants in §5. Show me the diff of just the changed rules.

### Wire a 3D model

> Add **[instrument]** to the 3D viewer. Its model is at
> `viewer/models/[id].glb`. Add an entry to the `INSTRUMENTS` object inside
> `viewer/instruments.html` with `dist`, `credit` and a `hotspots` array — read
> the existing `cello` entry for the shape. Hotspot `pos` values are coordinates
> in normalised model space (models are centred on origin, longest axis 1.0), so
> use plausible estimates and tell me to refine them with `?author=1`.
>
> Then add `model: '[id]'` to that instrument in `atlas-data.js`. The 3D Model tab
> appears automatically. Confirm the credit string carries title, author, source
> link, CC BY link and a note that the model was modified.

### Connect the audio

> The audio players on instrument pages are UI only. Wire them to real files.
> Files will live at `audio/[instrument]/[slug].mp3`. Add an `src` to each entry
> in the `demos` arrays in `atlas-data.js`, then implement playback in `atlas.js`:
> one `Audio` object reused across the page, play/pause state on the button,
> progress reflected in the existing waveform bars, and only one clip playing at
> a time. Handle a missing file by disabling that row rather than throwing.

### General health check

> Read `CONTRIBUTING.md` §5 and verify every invariant currently holds. Report
> anything broken with the file and line. Do not fix anything until I've seen the list.

---

## 8. Working with chat vs Claude Code

**Claude Code** for anything concrete — content, fixes, refactors, new
instruments. It has the files and git, edits in place, and can verify by serving
the site.

**Chat** for design exploration where seeing three options matters more than
committing to one. Paste in the single relevant file, not all four.

The split into four files exists so that both can work without stepping on each
other: content changes touch `atlas-data.js`, visual changes touch `atlas.css`,
and behaviour changes touch `atlas.js`.
