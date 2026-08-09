# CONTRIBUTING · Instrument Atlas

Everything needed to keep building this, whether by hand or with Claude Code.
Read §1–§4 before the first edit; §8 has ready-to-paste prompts.

Live: https://instrumentatlas.pages.dev

---

## 1. What this is

Three things that share a domain and a visual language:

**The Atlas** is a reference for composers writing for the orchestra. Four
families, twenty instruments. Each instrument has tone colour by register,
characteristics, articulations, blends, limits, audio demos, a range-and-timbre
chart, and a video gallery. Each family has an ensemble-size slider and a
seating map.

**The Studio** is a dock at the bottom of the window, opened from the nav. It
plays the same passage rendered once per part and once per section size. It
lives outside the router's view container, so playback survives navigation.

**The Viewer** is a 3D instrument explorer with annotated hotspots, at
`/viewer/`, embedded into the plate on instrument pages that have a model.

All static. No build step, no npm, no framework. Push to `main`, Cloudflare
Pages redeploys in ~20 seconds.

### Current state

| | Status |
|---|---|
| Instruments written | **20 of 20** |
| Families complete | **4 of 4** |
| 3D models | 8 `.glb`. cello, horn, viola, violin wired to plates; trumpet, bassoon, clarinet, violin2 in the viewer only |
| Model attribution | **cello and horn only.** viola, bassoon, clarinet and violin2 say "Attribution pending, do not publish" |
| Studio | Theme 1 only, 3 tracks, 7 renders |
| Instrument audio | 11 of 20: cello, oboe, horn, violin, viola, double bass, bassoon, flute, tuba, trombone, trumpet. The other nine show the placeholder line |
| Family audio | **none rendered yet.** All four families have `demos` wired; the twelve files at `audio/families/<id>/` are still to come |
| Plate artwork | Placeholder gold line art everywhere except the oboe, which is a converted engraving. Its credit is still pending |
| Family footage | strings, woodwinds, brass. Percussion has none, by design |
| Gallery videos | Shared placeholder set of nine; per-instrument sets not yet chosen |

---

## 2. File map

```
index.html         page shell: nav, dock container, footer, script tags
atlas.css          all styles, one file
atlas-data.js      ← content lives here. Edit this most.
atlas.js           rendering, routing, seating map, timbre chart, tabs,
                   demo players, family hover footage
atlas-studio.js    the studio dock: audio engine, transport, piano roll
_headers           Cloudflare caching + framing
audio/
  theme-1/         the studio's renders, one per part per section size
  instruments/     per-instrument demo clips
video/             family hover footage, one .mp4 per family that has one
viewer/
  instruments.html the whole 3D viewer, self-contained
  *.glb            eight models, flat in this folder, NOT in a subfolder
```

**Load order is `atlas-data.js`, then `atlas.js`, then `atlas-studio.js`**, all
`defer`. Top-level `const` in a classic script is visible to later scripts,
which is why the data file needs no exports. Do not switch any of them to
`async` or `type="module"`.

**The `.glb` files are flat.** `file:'cello.glb'`, never `'models/cello.glb'`.
The GitHub web uploader flattened the structure and the code follows it.

**three.js comes from unpkg** via the import map in `viewer/instruments.html`.
There is no local `vendor/` any more. Note that this makes the viewer
unverifiable on a machine that cannot reach unpkg.

---

## 3. Data schema

All of this is in `atlas-data.js`.

### `COLLECTION`
Title and lede for the home page. One collection today (`orchestral`); the
three-level shape (collection → family → instrument) exists so a second one can
be added without restructuring.

### `TIERS`: six ensemble sizes
`{id, label, tick, players, era}`. Indexes 0–5 run quartet → maximum forces.
Every family's `sizes` array must have exactly six entries, in this order.

### `FAMILIES`: array, order controls the home page
```js
{
  id, name, tagline,
  lede,                    // one or two sentences
  role: [ '<b>Lead.</b> Explanation.', … ],   // HTML allowed, 3–5 items
  video,                   // optional: hover footage for the home page card
  demos,                   // optional: [{label, note, file}] × 3, played as
                           // pills under the lede. No key renders nothing.
  smallName,               // what tier 0 means for this family
  sizes: { instrumentId: [t0,t1,t2,t3,t4,t5] },  // number, or '16 + 14'
  members: [ instrumentId, … ]                    // order shown everywhere
}
```
`sizes` keys **must exactly match** `members`, or the ensemble table renders
undefined rows. A `'16 + 14'` string means two desks (Violin I and II) and is
summed for totals. A family with no `video` key simply fades nothing in.

Family demo audio resolves as `audio/families/<familyId>/<file>.aac`, built in
one place (`FAM_AUDIO` in `atlas.js`). The pills share the instrument pages'
player rather than carrying a second implementation: one `Audio` object serves
both, so a family clip and an instrument clip can never sound at once, and
either one pauses the studio dock when it starts.

### `INSTRUMENTS`: the bulk of the work
```js
id: {
  family, name, latin,
  epithet,          // one line, opinionated, sits under the title
  status,           // 'live' = full page · 'plan' = greyed in menus
  model,            // optional: id of an entry in viewer/instruments.html
  modelCredit,      // required alongside model: title, author, modification
  modelSource,      // optional: link to the model's source page
  summary,          // 2–3 sentences
  range:  {lo, hi, note, transposition},   // lo/hi are MIDI numbers, 60 = C4
  timbre,           // 0 = darkest … 1 = brightest. Position on the timbre chart
  facts:  [[label, value, unit?], ×3],
  registers: [{label, pitch, text}, ×3 or ×4],
  characteristics: [ string, ×4 ],
  articulations:   [ string, … ],
  blends: [{id, label, note}, …],   // id MUST be a real instrument
  limits: [ string, ×3 ],           // what goes wrong, not what goes right
  demos:  [{label, note, dur, file?}, …],  // file omitted = inert player
  prev, next        // pager, '' to end a chain
}
```

There is **no `plate` field**. Instrument pages show the family name above the
title, and family pages show "The Orchestra".

The **section-size fact is computed**, not typed: whatever you write for a fact
labelled "Section size" is replaced at render time by the span the family's own
`sizes` array covers, so the instrument page and the family table cannot
disagree.

Unpitched percussion still carry a `range`, because the timbre chart plots all
twenty instruments and needs somewhere to put them. Say so in the `range.note`
so the numbers are not read as a claim about pitch.

A `'plan'` stub needs only `{family, name, status, range, timbre}`. Do not give
a stub a `model`, or the 3D toggle appears on a page that does not exist.

### `PLATES` / `THUMBS`
SVG strings keyed by instrument id. Gold line art on transparent, stroke only.
`viewBox="0 0 300 520"` for plates, `"0 0 40 52"` for thumbs. The violin family
is generated from `stringPlate()` / `stringThumb()` with proportion arguments
rather than four copies.

### `AUDIO` and `PASSAGES`: the studio
```js
const AUDIO = { base:'audio/', ext:'aac' };
```
Audio paths resolve as `${AUDIO.base}${passageId}/${variant.file}.${AUDIO.ext}`
and are built in exactly one place. Never hard-code a path anywhere else.

```js
PASSAGES['theme-1'] = {
  title, subtitle, tempo, beats, bars,
  tracks: [{
    id,              // unique within the passage
    instrument,      // an atlas instrument id, used to link the track name
    family,          // drives colour
    role,
    variants: [{v, label, file}, …],   // one entry means no chips are drawn
    default,         // optional; otherwise the LAST variant wins
    notes: [[startBeat, durationBeats, midiPitch], …]
  }]
};
```
`instrument` and `id` are separate on purpose: a passage may hold two horn
tracks. The first note should be at beat 0.

**Adding a theme:** render the parts at one tempo and length with the first note
at time zero, drop them in `audio/<id>/`, add one `PASSAGES` entry. It appears
in the dropdown by itself. Nothing else changes.

### `GALLERY`
`{v, title, perf, why, chan}`, where `v` is a YouTube id. Shared across instruments
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

**Two family palettes, deliberately.** `FAM_COLOR` in `atlas.js` colours the
timbre chart, which separates twenty instruments and needs four well-spaced
hues: strings `#9B8FD4`, woodwinds `#5FB89A`, brass `#6C9BD8`, percussion
`#C9834F`. `STUDIO_FAM` in `atlas-data.js` colours the dock, which shows three
tracks at a glance on a dark strip: woodwinds `#6FB7E8`, brass `#D4A04A`,
strings `#CF5F52`, percussion `#9B8FD4`. Gold means brass inside the dock and
nowhere else, which is why the dock's pressed variant chip and solo button take
the family colour rather than gold.

### Rules that hold the look together

- Every class is prefixed `.atl-`. The page is namespaced so it can be embedded.
- Cards: 1px hairline border, `rgba(255,255,255,.02)` fill, warming to gold on
  hover. The hovered home card is the exception: it takes a near-opaque dark
  fill so the footage reads around it, not through it.
- Nothing is centred except deliberately. The layout is left-aligned throughout.
- Fade-up on scroll via `.atl-fade`, driven by `observeFades()`.
- Everything respects `prefers-reduced-motion`.
- **No em dashes.** Anywhere: copy, comments, commit messages. Use a colon, a
  full stop or a comma. Ranges use en dashes (`C2 – A5`), which are not the same
  character and are correct.
- **Above the fold matters.** Home, family and instrument pages are each designed
  to fit one screen on a laptop, which is why tabs exist. If you add content,
  find the space rather than letting the page grow, and say what you traded.

---

## 5. Invariants: these break things silently

1. `atlas-data.js`, then `atlas.js`, then `atlas-studio.js`. All `defer`.
2. Every `blends[].id` and `prev`/`next` must be a real instrument key.
3. `sizes` keys must match `members` exactly, per family, six tiers each.
4. Every `status:'live'` instrument needs an entry in both `PLATES` and `THUMBS`.
5. Never minify, bundle or run an optimiser over anything in `viewer/`. The
   `.glb` files are binary and will be corrupted.
6. `_headers` only works from the root of the deploy output.
7. `.atl-wrap` must keep `width:100%`. It sits inside flex columns, and an auto
   cross-axis margin without an explicit width makes the page shift between tabs.
8. `html` keeps `overflow-y:scroll` / `scrollbar-gutter:stable`, or switching to
   a taller tab jumps the layout sideways.
9. **The studio dock must stay outside `#atl-view`.** Routing replaces that
   element's contents on every navigation. A dock inside it stops playing the
   moment you click a link, which is the entire reason it is a dock.
10. **Element-qualified resets under `.atl` outrank plain component classes.**
    `.atl button{font:inherit}` is (0,1,1) and beats `.atl-dock-var` at (0,1,0);
    `.atl h1,.atl h2,.atl h3,.atl h4` beat `.atl-blockhead` the same way. Both
    silently discarded a component's own type styles for months. Any new
    component class that fights one of these needs a `.atl` or parent-class
    prefix. This has bitten three times.
11. **The models are normalised to a longest axis of 2.0, not 1.0.** Hotspot
    `pos` values live in a −1.0…1.0 space. Author mode prints correct
    coordinates; hand-estimated ones written against −0.5…0.5 sit bunched around
    the centre of the instrument.
12. The engraving and the 3D box share one `--plate-art-h`. Give them separate
    sizing and the caption jumps when the 2D/3D toggle is used.
13. Sub-pages hide the topbar with `visibility`, not `display`, so its box is
    still reserved and every page's first headline starts at the same height.
14. The CC BY credits must stay visible. Where the viewer is embedded it hides
    its own credit **because the plate caption carries the full attribution
    beneath it**. Do not reuse `embed=1` anywhere that caption is absent.

| Model | Title | Author | Source |
|---|---|---|---|
| cello | Cello Sketchfab | Limpskin | https://skfb.ly/pICFS |
| horn | French Horn | Bethanycrandallart | https://skfb.ly/6TxEP |
| trumpet | B♭ Trumpet Model | Pakaku | https://skfb.ly/otwwn |
| violin | Violin Texturing | ilushandro | https://skfb.ly/oAVFz |
| viola, bassoon, clarinet, violin2 | **attribution pending** | | |

All CC BY 4.0: commercial use permitted, attribution and a statement of
modification required. Every model was decimated, re-centred and normalised.
**The four pending models must not reach production** until real attribution
replaces the placeholder string.

---

## 6. Known problems

- **The viola model is broken.** It renders as a fragmented sliver rather than an
  instrument, and its bounding box is nearly as deep as it is wide. It is wired
  to the viola plate; reverting that one block in `atlas-data.js` removes the
  toggle while a replacement is converted.
- **The bassoon model is degenerate**: a thin featureless rod, untextured, with
  no bell flare, boot joint or keywork. Not wired to anything.
- **`violin2.glb` is tilted** about 30° in model space, which is why its
  bounding box is near-cubic and it is the only model not centred on origin.
  It is otherwise the better violin: 14.6k triangles against 100k, 462 KB
  against 1.86 MB, and it includes a bow. Re-export it upright and it should
  replace `violin.glb`.
- **horn, trumpet and violin cannot be textured.** Those three `.glb` files
  contain no materials, no textures, no images, and critically **no UV
  coordinates and no vertex normals**. A texture map has nothing to sample
  against without UVs, so no amount of work in the viewer can give them a
  surface: they will read as flat colour until the asset itself changes. This
  is why they look plastic next to the cello, whose file carries five real maps
  (baseColor, metallicRoughness, normal, emissive, AO).

  | model | materials | textures | UVs | normals |
  |---|---|---|---|---|
  | cello | 1 | 5 | yes | no |
  | viola, bassoon, clarinet | 1 | 1 (baseColor only) | yes | yes |
  | violin2 | 2 | 0 | yes | yes |
  | **horn, trumpet, violin** | **0** | **0** | **no** | **no** |

  Three ways out, cheapest first: replace those models with textured ones;
  UV-unwrap and bake in Blender; or implement triplanar projection in the
  viewer's shader, which fakes UVs from world position and is the only fix that
  needs no new asset.
- **Hotspot coordinates are estimates** for every instrument, and all of them
  were written against the wrong model space (see invariant 11). Redo them with
  `viewer/instruments.html?i=<id>&author=1`, double-clicking each part.
- **AAC and H.264 cannot be decoded by an open-source Chromium build**, which
  most headless test browsers are. Audio and video playback cannot be verified
  in that environment; only the code around the codec can.

---

## 7. Health check

Run this from the repo root. It checks every invariant that is checkable.

```bash
node -e "
const fs=require('fs'),vm=require('vm');const sb={};vm.createContext(sb);
vm.runInContext(fs.readFileSync('atlas-data.js','utf8')+
  ';globalThis.__x={TIERS,FAMILIES,INSTRUMENTS,PLATES,THUMBS,GALLERY,PASSAGES,AUDIO};',sb);
const {TIERS,FAMILIES:F,INSTRUMENTS:I,PLATES:P,THUMBS:T,GALLERY:G,PASSAGES:PA,AUDIO:A}=sb.__x;
const bad=[];
for(const [id,it] of Object.entries(I)){
  (it.blends||[]).forEach(b=>{ if(!I[b.id]) bad.push('blend '+id+' -> '+b.id); });
  ['prev','next'].forEach(k=>{ if(it[k]&&!I[it[k]]) bad.push(k+' '+id+' -> '+it[k]); });
  if(it.status==='live'){ if(!P[id]) bad.push('no plate '+id); if(!T[id]) bad.push('no thumb '+id); }
  if(it.model&&!it.modelCredit) bad.push('model without credit '+id);
  (it.demos||[]).forEach(d=>{ if(!d.file) return; const f=A.base+'instruments/'+id+'/'+d.file+'.'+A.ext;
    if(!fs.existsSync(f)) bad.push('missing audio '+f); });
  const f=F.find(x=>x.id===it.family);
  if(!f) bad.push(id+' unknown family'); else if(!f.members.includes(id)) bad.push(id+' not in members');
}
for(const f of F){
  if(Object.keys(f.sizes).sort().join()!==[...f.members].sort().join()) bad.push('sizes != members '+f.id);
  f.members.forEach(m=>{ if((f.sizes[m]||[]).length!==TIERS.length) bad.push('tiers '+f.id+' '+m); });
  if(f.video&&!fs.existsSync(f.video)) bad.push('missing video '+f.video);
  f.members.forEach((m,i)=>{ if(I[m].status!=='live') return;
    const wp=i?f.members[i-1]:'', wn=i<f.members.length-1?f.members[i+1]:'';
    if((I[m].prev||'')!==wp||(I[m].next||'')!==wn) bad.push('pager out of step '+m); });
}
for(const [pid,p] of Object.entries(PA)) p.tracks.forEach(t=>{
  if(!I[t.instrument]) bad.push('passage track '+t.instrument);
  t.variants.forEach(v=>{ const f=A.base+pid+'/'+v.file+'.'+A.ext;
    if(!fs.existsSync(f)) bad.push('missing render '+f); }); });
/* family demo audio is expected to be missing until it is rendered, so it is
   reported as pending rather than as a failure */
const pending=[];
F.forEach(f=>(f.demos||[]).forEach(d=>{
  const p='audio/families/'+f.id+'/'+d.file+'.aac';
  if(!fs.existsSync(p)) pending.push(p); }));
console.log(bad.length?'FINDINGS:\n  '+bad.join('\n  '):'all checks pass');
if(pending.length) console.log('pending family audio ('+pending.length+'):\n  '+pending.join('\n  '));
console.log('live '+Object.values(I).filter(i=>i.status==='live').length+' of '+Object.keys(I).length);
"
```

Then serve and look, because none of the above catches a layout regression:

```bash
python3 -m http.server 8000
```

- Home, family and instrument pages all start their first headline at the same
  height, at several window heights.
- An instrument page fits one screen at ~1000px tall.
- The 2D/3D toggle does not move the caption.
- The studio survives navigation with playback running.
- The console is clean.

---

## 8. Prompts for Claude Code

### Add an instrument

> Read `atlas-data.js` and add full content for **[instrument]**, following the
> `cello` and `harp` entries as the model for depth and voice. Replace its
> `status:'plan'` stub. Fill every field in the schema in `CONTRIBUTING.md` §3.
>
> Voice: opinionated and practical, written for a composer deciding what to write,
> not a student memorising facts. The `limits` array is the most valuable part:
> say what goes wrong and why, not what the instrument can do. Prefer the specific
> and slightly surprising over the encyclopaedic. No em dashes.
>
> Add matching `PLATES` and `THUMBS` entries in the same gold line-art style,
> stroke only, no fill, viewBox `0 0 300 520` for plates and `0 0 40 52` for
> thumbs. Reuse `stringPlate()` if it is a bowed string instrument.
>
> Then run the health check in §7 and serve the site to confirm the page renders
> before telling me it is done.

### Wire a 3D model

> Add **[instrument]** to the 3D viewer. Its model is at `viewer/[id].glb`,
> flat in that folder. Add an entry to the `INSTRUMENTS` object inside
> `viewer/instruments.html` with `credit`, `rotY` and a `hotspots` array; read
> the existing `cello` entry for the shape.
>
> Hotspot `pos` values are in normalised model space, which runs −1.0 to 1.0:
> the models are normalised to a longest axis of 2.0, not 1.0. Load it, check it
> is upright and facing forward, and report if it is not rather than correcting
> the rotation in code, because that means the conversion was wrong.
>
> Then add `model:` and `modelCredit:` to that instrument in `atlas-data.js`,
> but only if it is `status:'live'`. The plate toggle appears automatically.

### Connect audio for an instrument

> Files go at `audio/instruments/<instrumentId>/<slug>.aac`. Add `file:'<slug>'`
> to each entry in that instrument's `demos` array. Never write a path: the only
> place that builds one is `INST_AUDIO()` in `atlas.js`. Playback is already
> implemented there: one reused `Audio` object, progress in the waveform bars,
> route changes stop it, and a demo without a `file` stays inert. Update `dur`
> to the real lengths, though the player corrects the display from the file
> itself once a clip has loaded.

### Restyle something

> Read `atlas.css` and `CONTRIBUTING.md` §4 first. [Describe the change.]
>
> Constraints: keep the `.atl-` prefix, use the existing CSS variables rather than
> new hex values, keep the page fitting one screen on a laptop, and do not touch
> the invariants in §5. Note invariant 10 before adding any component class that
> sets type on a `button` or an `h1`–`h4`. Show me the diff of just the changed
> rules.

### Health check

> Run the health check in `CONTRIBUTING.md` §7 and verify every invariant in §5
> currently holds. Report anything broken with the file and line. Do not fix
> anything until I have seen the list.

---

## 9. Working with chat vs Claude Code

**Claude Code** for anything concrete: content, fixes, refactors, new
instruments. It has the files and git, edits in place, and can verify by serving
the site.

**Chat** for design exploration where seeing three options matters more than
committing to one. Paste in the single relevant file, not all five.

The split into separate files exists so that both can work without stepping on
each other: content changes touch `atlas-data.js`, visual changes touch
`atlas.css`, behaviour changes touch `atlas.js`, and the dock is self-contained
in `atlas-studio.js`.
