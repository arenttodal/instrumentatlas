# Inventory for a new sub-module: Scales & Modes

**Date:** 3 November 2026
**Scope:** read-only survey. No code was changed; this file is the only thing written.

**Repositories surveyed**

| Repo | Path in this session | HEAD | What it is |
|---|---|---|---|
| `arenttodal/instrumentatlas` | `/home/user/instrumentatlas` | working tree, branch `claude/clever-newton-747bvj` | The Evenant suite: Instrument Atlas, Score Viewer, Ear Training, The Accelerator, 3D Viewer, All-tools hub |
| `arenttodal/voicing-atlas` | `/home/user/voicing-atlas` | `f8ab8f4` (shallow clone, taken today) | **A separate product and a separate deploy.** Voicing Atlas + Chord Explorer. Shares no code with the suite. |

Throughout, "the suite" means `instrumentatlas` and "VA" means `voicing-atlas`.

---

## 1. Suite shell and routing

### 1.1 Repo layout (suite)

```
/                       index.html (Atlas)  atlas.css  atlas.js  atlas-data.js  atlas-studio.js
                        tools.html  tools.js                 ← the All-tools hub
                        accelerator.html                     ← shell only; 180 lines of inline CSS
                        evenant-modules.js  evenant-nav.js  evenant-nav.css   ← the shared shell
                        evenant-gate.js     evenant-gate.css                  ← the access gate
                        _headers                             ← Cloudflare Pages
                        README.md  Handoff.md  Port.md  CONTRIBUTING.md
accelerator/            data.js model.js audio.js activities.js widgets.js app.js
                        base.css ui.css  ← ORPHANS, see §2.3
                        audio/<instrument>/<Note>.mp3   (9 instruments)
                        tests/model.cjs  tests/browser.cjs
dojo/                   index.html modes.js modes.css        ← mode menu
                        belts.html dojo.js dojo-data.js dojo.css
                        layers.html layers.js layers-data.js layers.css
                        blend.html  blend.js  blend-data.js  blend.css
                        themes.js        ← shared theme/stem library
                        audio.js         ← shared playback engine
                        dojo-base.css    ← shared tokens + controls for the dojo only
                        BLEND.md
valley-sunrise-app/     score.html (76 KB, everything inline)  score.json  annotations.json  valley-sunrise.mid
                        audio/scores/valley-sunrise/*.aac
viewer/                 instruments.html  *.glb
audio/ plates/ plates-source/ video/ tools/ .github/workflows/
```

### 1.2 How a tool is registered

One table: **`evenant-modules.js`**.

```js
const EVENANT_ROOT   = …          // derived from document.currentScript.src
const EVENANT_ACTIVE = …          // from <script … data-module="dojo">
const EVENANT_LOGO   = 'data:image/png;base64,…'
const EVENANT_ICONS  = { tools, atlas, score, ear, accelerator }   // 16px inline SVG paths
const EVENANT_TOOLS_HOME = { id:'tools', name:'All tools', path:'tools.html', icon:'tools', status:'available', blurb }
const EVENANT_MODULES = [{ id, name, navName?, icon, status, path, blurb }]

const evenantHref       = m => EVENANT_ROOT + m.path
const evenantReachable  = m => m.status !== 'soon'       // is it a link at all
const evenantUnreleased = m => m.status !== 'available'  // does it wear "Coming soon"
const evenantModule     = id => …
```

`status` is one of three (`evenant-modules.js:55-69`):

| status | row is a link | shows "Coming soon" | used by |
|---|---|---|---|
| `available` | yes | no | atlas, score, dojo |
| `soon` | **no** | yes | (none at present) |
| `locked` | yes | yes | `accelerator` |

`locked` exists specifically so a gated-but-reachable tool can carry the badge and still be clicked through to its code prompt.

**Consumers of the table:**

- `evenant-nav.js` — an IIFE that finds `document.querySelector('[data-ev-switch]')` and replaces it with logo + divider + label + chevron, plus a `position:fixed` menu (fixed because `score.html` clips at `html,body{overflow:hidden}`). `row(m)` at `evenant-nav.js:76` renders each entry. Full keyboard support: ArrowUp/Down/Home/End/Escape/Tab.
- `tools.js` — the hub grid; `grid.innerHTML = EVENANT_MODULES.map(…)` at `tools.js:19`.

**Breadcrumbs are not in the system.** Every page hand-writes its own, e.g. `dojo/blend.html:25-27`:

```html
<div class="atl-crumb"><a href="index.html">Modes</a><i>/</i><span>Blend</span></div>
```

The Atlas and the Accelerator each build their own crumb in JS (`atlas.js`, `accelerator/app.js:13` `lessonView` → `<nav class="crumb">`). There is no shared breadcrumb component.

### 1.3 Routing — three different approaches coexist

| Tool | Approach | Entry point |
|---|---|---|
| Instrument Atlas | hash router, `#/<family>/<instrument>` | `atlas.js` |
| The Accelerator | hash router, `#/<module>/<lesson>` | `accelerator/app.js:35` → `route(next, restore)` |
| Ear Training | **one HTML file per mode**, no router | `dojo/index.html` lists `DOJO_MODES` → `belts.html` / `layers.html` / `blend.html` |
| Score Viewer | single page, no routes | `valley-sunrise-app/score.html` |
| 3D Viewer | query string `?i=<id>&author=1` | `viewer/instruments.html` |

The Accelerator router (`app.js`) is the one worth copying for a lesson module. It:
- parses `location.hash`, `route()` splits into `[module, lesson]`
- tears down the previous widget (`active.capture(); active.destroy(); AccelAudio.stop(); observer?.disconnect()`)
- re-renders `#view`
- restores scroll position per lesson
- guards against being framed (`inFrame`): inside an iframe it does **not** `history.pushState`

### 1.4 What a new tool needs to appear everywhere

1. An entry in `EVENANT_MODULES` (`evenant-modules.js`) with `id`, `name`, `icon`, `status`, `path`, `blurb`.
2. An icon path in `EVENANT_ICONS` (16×16 viewBox, stroke-only, no fill).
3. Its page, carrying:
   ```html
   <link rel="stylesheet" href="evenant-nav.css">
   <nav class="… ev-bar"><div class="…-nav-left">
     <div data-ev-switch data-ev-home="…"></div>
     …breadcrumb…
   </div>…</nav>
   <script defer src="evenant-modules.js" data-module="<id>"></script>
   <script defer src="evenant-nav.js"></script>
   ```
4. Nothing else. `tools.html` and every switcher pick it up automatically.

There is **no sub-module registry**. `dojo/modes.js` (`DOJO_MODES = [{id,name,href,status,blurb,meta}]` + a `MODE_ART` SVG per mode) is the only precedent for a tool containing modes, and it is local to the dojo — not shared, not referenced by the suite shell.

### 1.5 Deploy

- **Cloudflare Pages.** `_headers` at repo root (invariant: "only works from the root of the deploy output").
- **No build step. No `package.json`, no lockfile, no bundler, no TypeScript, no Makefile.** Everything is served as authored.
- Cache policy in `_headers`: `/viewer/*.glb`, `/audio/*`, `/plates/*`, `/video/*` → `max-age=31536000, immutable`; `/*.html` → `max-age=0, must-revalidate`.
- CSP: `frame-ancestors 'self' https://*.webflow.io https://evenant.com https://*.evenant.com` — the suite is designed to be framed by the Webflow site.
- No `_redirects` in the suite. (VA has one; see §8.)
- CI: `.github/workflows/accelerator-checks.yml` only. Runs on PRs touching `accelerator.html` or `accelerator/**`: `node accelerator/tests/model.cjs`, then Playwright 1.55.0 + `node accelerator/tests/browser.cjs` against `python3 -m http.server 8765`. **Nothing else in the repo has CI.**

---

## 2. Design system

### 2.1 Tokens

Identical token block, **duplicated in seven files**:

| File | Line |
|---|---|
| `atlas.css` | 14 |
| `dojo/dojo-base.css` | 23 |
| `accelerator/base.css` | (orphan, see 2.3) |
| `accelerator.html` (inline) | ~18 |
| `tools.html` (inline) | — |
| `valley-sunrise-app/score.html` (inline) | — |
| `viewer/instruments.html` (inline) | — |

Values (`Handoff.md` §2, `Port.md` §5):

```
--bg:#080C14  --gold:#D4A04A  --gold-deep:#C08830  --blue:#8FB4E0
--warn:#C0603A  --ok:#5FB89A
--text:#BEC0C8  --dim:#7E808A  --faint:#4E505A
--hair:rgba(255,255,255,.07)  --hair-gold:rgba(212,160,74,.24)
```
Family colours: woodwinds `#6FB7E8`, brass `#D4A04A`, strings `#CF5F52`, percussion `#9B8FD4`, choir `#7FD1B9` (`valley-sunrise-app/score.html:774` as `FAM`, also `STUDIO_FAM` in `atlas-data.js`).

Type: Playfair Display 500 (display, italic for claims), DM Sans 300/400/500 (body), DM Sans 700 9.5–11px uppercase 1.8–2.6px tracking (labels). **Loaded per page from Google Fonts** — every page repeats its own `<link href="https://fonts.googleapis.com/css2?…">`. There is no shared font include.

### 2.2 Is CSS shared?

Partly, and only recently.

**Genuinely shared across tools:**
- `evenant-nav.css` (144 lines) — `.ev-bar`, `.ev-switch`, `.ev-menu`, `.ev-item`, `.ev-soon`. Every page links it.
- `evenant-gate.css` (86 lines) — the access gate. Linked by `accelerator.html` only.

**Shared within one tool:**
- `dojo/dojo-base.css` (191 lines) — tokens, reset, nav, breadcrumb, and *all* shared dojo controls: `.dj-eyebrow`, `.dj-display`, `.dj-play`, `.dj-meter`, `.dj-opt`, `.dj-hear`, `.dj-result`, `.is-ghost`, `.dj-next`, `.dj-link`, `.dj-mark`, `.dj-score`. Linked by all four dojo pages.

**Not shared:** `atlas.css` (743 lines, Atlas only); the Accelerator's inline block; `score.html`'s 295 inline lines; `viewer/instruments.html`'s 125.

### 2.3 Orphaned files — verify before reusing

`accelerator/base.css` (202 lines) and `accelerator/ui.css` (25 lines) are **not linked by any page in the repo** (checked every `.html`). The Accelerator's live styles are the 180-line inline `<style>` in `accelerator.html` (lines 16–195). `base.css` was last touched in `8943792 Improve Accelerator audio, activities and learning flow`. Treat both as dead until proven otherwise — but note `base.css` is the file that still carries the `.w-grid` / `.w-stage` / `.w-side` widget-chrome classes `Port.md` §5 advertises.

### 2.4 Reusable components

| Component | Where | Notes |
|---|---|---|
| Hub cards | `tools.js:19-33` + `tools.html` inline CSS `.card`, `.card-head`, `.here`, `.go`, `.card[data-soon]` | Driven entirely by `EVENANT_MODULES` |
| Mode cards | `dojo/modes.js` `DOJO_MODES` + `MODE_ART`, `dojo/modes.css` | Per-mode SVG diagram; the closest precedent to a sub-module index |
| Lesson stepper / progress bar | `accelerator.html:206-207` (`#prog-txt`, `#prog-fill`, `.prog-bar`) + `accelerator/app.js:7` `progress()` | Renders "N of 12" and a width-% fill. **Hard-wired to `LESSONS.length`** |
| Lesson outline / "1 of 9" | `app.js:8` `outline(l)`, `app.js:13` `lessonView(l)` → `Lesson N of 12` | The "of 12" is a **literal** in `lessonView` and in the pager (`i<11`) |
| Back / Next pager | `app.js:lessonView` → `<nav class="pager">` | Previous/Next with lesson titles; "Next module" when the module changes |
| Demo panel + side controls | `accelerator/widgets.js:33` `mount()` → `.ac-transport`, `.ac-timeline`, `[data-roll]`, `.ac-controls`, `.w-read`, `.ac-actions` | This is the real widget chrome in use, **not** `Port.md`'s `.w-grid`/`.w-side` |
| Option buttons | `widgets.js` `button/select/range/toggle/group` → `.btn`, `.ac-field`, `.ac-group` | All built as real DOM with labels; accessible by construction |
| Quiz answer buttons | `app.js:23` `quizzes(l)` → `.q`, `.opts`, `.opt.right`, `.opt.wrong`, `.why.on` | Two-question MCQ, immediate feedback + *why*, answers persisted |
| Score counter | dojo: `.dj-score` (`dojo-base.css`), painted in each mode's `paintChrome()` | `<b>correct</b><span>/asked</span><i>pct%</i>` |
| Access gate | `evenant-gate.js` + `evenant-gate.css` | See §8 |

---

## 3. Lesson engine (The Accelerator)

> `Port.md` opens with: *"This document is the original design brief… Earlier descriptions of audio, persistence and interaction below are historical."* Several of its claims are now wrong — file names (`accel-data.js` etc.), the `WIDGETS` registry, `.w-grid` chrome. `accelerator/README.md` is the current doc. **Read the source, not Port.md.**

### 3.1 Data model (`accelerator/data.js`, 52 KB)

```js
const MODULES = [{ id, n, title, subtitle, lede }]
// currently: foundations (n:1), composition (n:2). Comment: "form, orchestration and production follow"

const LESSONS = [{
  id,        // route segment AND the widget key — see 3.2
  module,    // MODULES.id
  n,         // number within module
  title,
  short,     // one line for the index card
  claim,     // one sentence, rendered as .claim
  demo,      // ⚠ DEAD FIELD — see 3.2
  demoNote,  // overwritten wholesale at data.js:411 from the CAPTIONS table
  source,    // which ebook chapter this condenses; rendered in the footer
  body: [ '…html string…' ],          // <strong>/<em> allowed
  ex: { beginner, intermediate, advanced },
  quiz: [ { q, o:[…], a:<index>, why } ]
}]

const lessonById = id => LESSONS.find(l => l.id === id)   // data.js:396
```

After the array, `data.js:411-418` mutates it: `LESSONS.forEach(l => l.demoNote = CAPTIONS[l.id])`, then six `lessonById(...)` patches that rewrite individual `body[]` entries and `quiz[]` items. A new module must either follow that pattern or avoid it; the array literal alone is not the whole truth.

12 lessons across 2 modules. `app.js` hard-codes `12` in two places (`'Lesson '+(i+1)+' of 12'`, and `i<11` in the pager) and `6` in the overview (`… of 6 complete`).

### 3.2 Widget contract

**Registration is by `lesson.id`, not by `lesson.demo`.** `widgets.js:33` `mount()` does:

```js
spec = AccelActivities[lesson.id](state, kit);
```

The `demo:` field in `data.js` holds values (`timbre`, `voiceleading`, `motif`, `qanda`) that do not match any activity key (`tone-colour`, `voice-leading`, `motifs`, `question-answer`). It is dead. **Do not add a `demo` field to a new module expecting it to select the widget.**

`AccelActivities` (`accelerator/activities.js`) is a plain object, 12 keys: `overtones, perspective, separation, tone-colour, voicing, voice-leading, motifs, prevade, question-answer, harmony, countermelody, ostinato`.

**An activity is `(state, kit) => spec`:**

```js
spec = {
  build()      → { events:[…], bpm?, beats? }   // the audio; called on every update()
  render()     → void        // draws controls into kit.host
  read()       → string      // the live text read-out
  check()      → { ok:boolean, text:string }    // the challenge verdict
  draw?(rollHost) → void     // optional overlay on the piano roll
}
```

**`kit` (the `u` parameter) provides:**

```
host        the .ac-controls element to append to
button(host,label,fn)   group(host,label)   select(host,label,values,value,onchange)
range(host,label,value,min,max,step,onchange)   toggle(host,label,value,onchange)
editor(host,label,notes,onchange,steps=8)       pitches(lo=36,hi=84)
update()    rebuild audio + roll + read-out + save
redraw()    cleanup + clear controls + render() + update()
clean(fn)   register a teardown callback
say(text)   write to the read-out
saveSketch(values,text)   write to the cross-lesson shared sketch
play()      transport.play(0)
preview(events,bpm=88,beats=4)   one-shot playback off the main transport
error(e)    show a message in the status line
defaults(values)   seed state keys that are missing or the wrong type
notes(key,fallback)  seed a note array, validated by Accel.valid
```

**`mount(host, lesson)` returns** `{ check(), play(), inspect(), capture(), destroy() }`.

**Cleanup:** there is no `host._cleanup` in the Accelerator — that convention belongs to the Score View (`Handoff.md` invariant 10). The Accelerator uses `kit.clean(fn)`, chained, and invoked by `redraw()` and `destroy()`. `app.js:35` `route()` calls `active.capture(); active.destroy()` before re-rendering.

`mount()` also injects, for free, on every lesson: a transport bar (Play/Pause, Restart, Stop, Loop checkbox, Volume, time read-out), a status line, a progress bar, a piano roll, a read-out, and a **Compare and revise** group (Keep A/B, Hear A/B, Undo, Redo, Restore lesson start) with a 40-step undo stack.

### 3.3 Step types

There are none — the lesson shape is **fixed** in `app.js:13` `lessonView(l)`, five sections, always in this order:

`#explore` (claim + `demoNote` + widget) → `#why` (`body[]`) → `#challenge` (prompt + Check my attempt / Show a hint / Replay my work) → `#practice` (level select + `ex[level]` + "Mark practised") → `#check` (quiz + retry).

The challenge prompt comes from a **hard-coded map keyed by lesson id** at `app.js:28` (`const prompts = {overtones:'…', perspective:'…', …}`), not from `LESSONS`. A new module must extend that object or the prompt renders `undefined`.

### 3.4 Progress storage

`accelerator/model.js`, the `Accel` IIFE. `localStorage` key **`accel-work-v2`**:

```js
{ version:2,
  lessons: { <lessonId>: { seen, exerciseDone, quizPassed, answers[], bestScore,
                           lastScore, level, practisedLevel, challengeAttempts,
                           challengePassed, widget:{…}, comparisons:{A,B}, scroll } },
  sketch:  { motif:[{m,s,d}] },     // shared across lessons
  last:    '/module/lesson' }
```

Migrates from a legacy `accel-progress` key. `Accel.writable()` reports storage failure and `app.js` shows a banner. Export/import to JSON is built in (`Accel.export()`, `Accel.import(text)`, 2 MB cap, import keeps already-completed progress).

`Accel` also exposes music helpers used by the activities: `note(midi)`, `seed()`, `valid(ns)`, `chords[]` (9 entries, `{name, rn, pcs, v}` — C/F/G/Dm/Am/Em/D♭/A♭/B♭), `voicing(ns)`, `transform(ns,kind)`, `phrase(ns,slots,ending)`, `fit(ns,chord,bar)`.

### 3.5 Can a second module reuse the engine as-is?

**Mostly yes, with four specific edits.** The engine is not tied to the ebook's *content*, but it is tied to the ebook's *count and shape*:

| Blocker | Where | Size |
|---|---|---|
| `12` and `11` hard-coded in the lesson header and pager | `app.js:lessonView` | trivial |
| `… of 6 complete` hard-coded per module | `app.js:9` `overview` | trivial |
| Challenge prompts in a literal map keyed by lesson id | `app.js:28` | trivial |
| `data.js` is one 52 KB file holding both `MODULES` and `LESSONS` as top-level `const`s; a second module either appends to it or needs the load order and the `const` collision solved | `accelerator/data.js`, `accelerator.html` script tags | small |

Everything else — router, progress, quiz, exercise levels, transport, undo/compare, backup — is content-agnostic. The five-section shape is fixed, which matches the requested **claim → try it → why → exercise → check** exactly. **Video is not a step type; there is no slot for it** (§9).

---

## 4. Audio

Four independent engines. None of them share code except that `dojo/audio.js` says it was derived from `AudioCompare`.

### 4.1 `AccelAudio` — the Accelerator (`accelerator/audio.js`, 7.3 KB) — **this is the scheduler**

**Yes, there is a transport.** `class AccelAudio.Transport`:

```js
new AccelAudio.Transport(onstate(t), onprogress(position, duration))
  .configure(events, bpm=88, beats=4)
  .play(offset=this.offset, lead=.035)   async
  .pause()      .stop()      .destroy()
  .replace(events, bpm, beats)   // swap material while playing, keeps position
  .loop          // boolean, default true
  get duration() // beats*60/bpm
  get position()
  .status        // 'idle' | 'loading' | 'playing' | 'paused' | 'error'
```

- **Tempo:** yes, `bpm` + `beats` per phrase.
- **Looping:** yes, `loop` flag, cycle-aware re-queue.
- **Playhead callback:** yes, `onprogress(position, duration)` driven by `requestAnimationFrame`; `widgets.js` moves `.ac-playhead` and fills `[data-progress]` from it.
- **Melody + chords together:** yes — one flat `events` array, any number of simultaneous notes, per-note `instrument`.
- **Scheduling:** audio-clock, `setInterval(…, 25)` pump with a 120 ms horizon, notes scheduled against `ctx.currentTime`. Not `setTimeout` per note.
- **Single owner:** a module-level `owner` — starting one Transport stops any other. Auto-pauses on `visibilitychange`, stops on `pagehide`.

**Event shape:**
```js
{ m:<midi>, s:<start in beats>, d:<duration in beats>,
  instrument?:'piano'|'flute'|…|'synth',
  gain?=0.14, accent?:bool, layer?:string, voice?:bool,
  partials?:[…],     // synth only, additive
  match?:bool,       // level-matching behaviour
  src?:'<url>' }     // play a whole file instead of a pitched sample
```

**Instruments and load time.** Sample banks (`audio.js:banks`), files at `accelerator/audio/<instrument>/<NoteName>.mp3`:

| instrument | anchor notes | files |
|---|---|---|
| piano | 36, 43, 48, 55, 60, 67, 72, 79, 84 | 9 |
| flute, oboe, clarinet, horn, trumpet, violin, viola | 48, 60, 72 | 3 each |
| cello | 36, 48, 60 | 3 |

Total 30 MP3s, ~1.2 MB, in-repo. Pitches between anchors are **resampled** (`playbackRate = 2**((m - anchor)/12)`), so a note a tritone from its anchor is audibly stretched. Loading is lazy and per-URL (`load(url)`, `cache` + `pending` Maps) and happens on first Play — `await Promise.all(...)` over the distinct URLs the phrase needs, so first play of a 3-sample phrase is one round trip. Decode also measures RMS and stores a `trim` gain so samples sit at a comparable level.

`instrument:'synth'` is the additive path: oscillators per partial from `n.partials` (default `[1,.3,.15,.08]`), optional energy normalisation via `n.match`. **There is no function called `tone()` anywhere in either repo** — this is the synth the brief refers to.

Also exposed: `AccelAudio.preview(events,bpm,beats)`, `AccelAudio.load(url)`, `AccelAudio.spectrum()` (2048-point analyser, used by the `tone-colour` widget), `volume()/setVolume()`, `stop()`, `inspect()`.

### 4.2 `AudioCompare` — the Studio (`atlas-studio.js:27-162`)

Sample-locked multi-track comparison, **not** a scheduler. `new AudioCompare(tracks, {loop, initial, onstate, onprogress})` where `tracks = [{id, src}]`. `load(onProgress)` fetches + decodes everything up front; play starts every buffer at one scheduled time and switching is a 30 ms gain ramp (`_applyGains`). No tempo, no beats, no note events — it plays whole files. Exposed as `window.AudioCompare`.

### 4.3 `makeDojoAudio` — Ear Training (`dojo/audio.js`, 12.5 KB)

Derived from `AudioCompare`, with a node registry. `makeDojoAudio({srcOf, sampleRate?, cacheMax?})` →

```js
{ play(ids, {loop, gains, cut, lock}), extend(ids, opts), stop(),
  setGains(map, ramp), select(id), solo(id), position(), levels(), ensureCtx(),
  playing, loading, duration, error, set onstate }
```

Notable: `extend()` adds clips to an already-running mix **in phase** (computes the buffer offset from the running loop), a `LIVE` Set so nothing is orphaned, generation tokens that abandon in-flight decodes, and `cut:{start,dur}` which slices a decoded buffer down to a section with edge fades. Again **no tempo/beat concept** — it is file playback with gain control.

### 4.4 Score Viewer (`valley-sunrise-app/score.html`, inline)

Its own engine: `ctx`, `buffers` Map, `LIVE` Set, `loopA/loopB` in beats, per-track mute/solo. `score.json` carries `{tempo, beats, bars, duration, tracks:[{id,name,family,notes:[[startBeat, durBeats, midi], …]}]}`. It has a transport in the sense of position/loop over 12 stems, but it plays audio files, not notes — the note data is only drawn.

### 4.5 Voicing Atlas — **smplr** (separate repo)

`index.html:7853`:
```js
import { SplendidGrandPiano, ElectricPiano, Soundfont, Soundfont2Sampler,
         Reverb, Mallet, Mellotron } from 'https://unpkg.com/smplr@0.16.4/dist/index.mjs';
```
- **71 instruments** in a registry at `index.html:7909+` — `{id, name, type:'splendid'|'electric'|'soundfont'|'sf2'|…, key, category, icon}`, categories `pianos, strings, ensemble, brass, woodwinds, …`, keys are General MIDI names (`acoustic_grand_piano`, `french_horn`, `tremolo_strings`…).
- Selection: `loadInstrumentByEntry(entry)` switches on `entry.type`, constructs the right smplr class, `await synth.load`, sets `document.body.classList.add('loading-samples')` while loading. **Load time is a network fetch of a soundfont per instrument** — the UI has an explicit loading state and a retry count, which tells you it is slow enough to matter.
- Playback: `synth.start({ note, velocity, time, duration })` → returns a stop function. Scheduling is manual (`time: now + i*0.015` for strums, `beatDuration*4` for progression steps). Effects: `Reverb` via `output.addEffect('reverb', new Reverb(ctx), 0.15)`, plus a `DynamicsCompressor` in the suite's own chain.
- **No transport class.** Progressions are played by computing absolute times in a loop. Jam Room / Improv Mode schedule chords ahead with `time:` offsets.
- **Not in the suite's repo**, and it is a `https://unpkg.com` ES-module import. Importing it into the suite is a one-line `<script type="module">` — but note the Accelerator's scripts are classic (non-module) and rely on top-level `const` being visible across files; mixing in a module changes that page's load semantics.

---

## 5. Keyboard / piano renderer

**None in the suite.** No piano keyboard component exists in `instrumentatlas` — searched all JS/HTML.

**Several in Voicing Atlas, none of them a component.** `index.html` alone contains at least nine separate renderers:

| Function | Line | Purpose |
|---|---|---|
| `createPianoVisual(notes, rangeOverride)` | 9394 | returns an HTML **string**; one `active` class |
| `createMovementPianoVisual(notesA, notesB, labelA, labelB, range)` | 9416 | A/B comparison, classes `active-a`/`active-b`/`active-both` |
| `renderLivePiano()` | 10998 | the big interactive one, writes into `#livePiano` |
| `renderCreatorPiano()` | 11737 | custom voicing creator |
| `renderEditPiano()` | 12142 | admin edit modal |
| `renderPracticePiano()` | 12649 | practice mode |
| `renderJamChordPiano()` | 13396 | jam room |
| `renderProgChordPiano()` | 10327 | progression builder |
| `buildPianoKeys(startMidi, endMidi)` | 9375 | shared key-list builder → `{whites, blacks}` |
| `getOptimalPianoRange(notes)` / `getCardPianoRange()` / `calculatePianoRange()` | 9321 / 9365 / 10900 | three different range calculators |

**Highlighting.** Two mechanisms:
1. Class-based state, `getKeyState(note)` at `index.html:11003` → `'correct' | 'wrong' | 'active' | 'target' | ''`.
2. Overlay roles, `ceApplyPianoOverlays(pianoId, overlays)` at `index.html:15066` — `overlays` is a `{ '<noteName>': '<role>' }` map, colours from `CE_ROLE_COLORS[role].{white,black}`, applied as inline `background` with `!important` (because `#livePiano .correct/.wrong/.guide` already use `!important`). `ceClearPianoOverlays()` removes them.

**Labels:** white keys get a `<span class="note-label">` only on C (or on the range's octave starts).

**Click-to-play:** yes, via `data-note="<name>"` on each key and a delegated handler funnelling into `playNote`/`stopNote`.

**MIDI input:** yes — `standalone-keyboard.html` has `handleMIDIMessage(msg)` (941), `updateMIDIStatus(connected, deviceName)` (918), `midiNoteToName(midiNote)` (972), plus a musical-typing layer (`offsetToNote`, `flashTypingKey`, `releaseAllTypingNotes`) and `window.setKeyboardInputMode(mode)`. `index.html` has the same under `// ==== LIVE KEYBOARD / MIDI ====` (10891).

**Is it decoupled enough to drop into a lesson widget? No.**
- Every renderer is an inline function in a 756 KB (or 44 KB) single-file app.
- They read module-scope globals: `activeNotes`, `targetNotes`, `targetVoicing`, `ceNoteOverlays`, `liveKeyboardNotes`, `voiceRegistry`, `synth`.
- They write to fixed element ids (`#livePiano`).
- Styling lives in a 2000-line inline `<style>` with a different token set (`--accent-primary:#3B82F6`, Inter font) — **not** the suite's design system.

`standalone-keyboard.html` is the nearest thing to a component and is explicitly named "Standalone", but it is still a whole page with globals, light/dark themes and its own audio chain. Extracting a `makeKeyboard({host, lo, hi, onNoteOn, onNoteOff, setStates})` is real work — see Gaps.

---

## 6. Theory utilities

### 6.1 In the suite

`accelerator/model.js` only, and it is minimal:

- `Accel.note(m)` — MIDI → name, from a **fixed 12-entry table** `['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B']`. Mixed sharps and flats, not key-aware.
- `Accel.chords` — 9 hard-coded chords `{name, rn, pcs, v}` with roman numerals, C major / A minor only.
- `Accel.voicing(ns)` — six C-major-specific checks.
- `Accel.transform`, `Accel.phrase`, `Accel.fit` — motif development and chord/melody overlap scoring.

**No scales, no modes, no interval naming, no chord detection, no key signatures.** No Tonal.js or any other theory library, in either repo.

### 6.2 In Voicing Atlas — substantial, and directly on-topic

`index.html`, Chord Explorer (`// ==== CHORD EXPLORER ====`, 14447) and Keys (`// ==== KEYS ====`, 15761):

```js
// --- spelling ---
const CE_ROOT_LABELS = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']  // 14450
const NOTE_NAMES_CE  = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']  // 14451
const CK_SHARP       = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']  // 15766
const NOTE_TO_SEMITONE = { C:0, 'C#':1, Db:1, … }                               // 8605

// --- chord types ---
CE_TRIADS / CE_SEVENTHS / CE_EXTS → CE_ALL_TYPES          // {id,label,sym,iv:[…],formula,desc,feel,roles}
ceGetChordNotes(root, intervals, oct)                      // 14545
ceTransposeNote(root, iv, oct)   ceStripOct(n)   ceRootLabel(root)

// --- modes: ALL SEVEN, already in brightness order ---  // 15843
const CK_MODE_SCALES = {
  lydian:[0,2,4,6,7,9,11], ionian:[0,2,4,5,7,9,11], mixolydian:[0,2,4,5,7,9,10],
  dorian:[0,2,3,5,7,9,10], aeolian:[0,2,3,5,7,8,10], phrygian:[0,1,3,5,7,8,10],
  locrian:[0,1,3,5,6,8,10] }
const CK_MODE_LABELS = { lydian:'Lydian', ionian:'major', …, locrian:'Locrian' }

// --- diatonic harmony ---
CK_MODES.major/.minor   // degrees, numerals, triads, sevenths, functions(home|motion|tension)
ckQualityAt(scale, i)   → { triad:'major'|'minor'|'dim'|'aug', seventh:'maj7'|'dom7'|'min7'|'hdim'|'dim7', degree }
ckDiatonic(keyRoot, mode, useSevenths) → [{ root, rootPc, typeId, iv, label, notes, pcs, roles,
                                            numeral, fn, degree }]
ckChord(keyRoot, degreeSemitones, typeId, oct)
ckBorrowedRow(keyRoot, mode, sourceMode, useSevenths)   // modal interchange, 7 slots
ckBorrowLabel(pc, borrowedDegree, diatonicDegree)       // sharp for raised, flat for lowered
ckBorrowNumeral(index, q, diatonicDegree)               // '#iv°', 'bVII', …
ckSecondaryDominantOf(keyRoot, mode, rootPc, typeId)    // 'V/ii' etc.
ckNoteToMidi(n)   ckMidiToNote(midi)
```

**Chord detection:** `standalone-keyboard.html:762` `detectChord(notes)`, with `generateCombinations`, `matchChordScore(actual, pattern)` and `intervalToName(interval)`.

### 6.3 What is missing for correct 7-mode spelling on any root

`ckQualityAt` already gives you the triad and seventh quality of **every degree of every mode**, so the chord grid is essentially solved. The gap is spelling:

1. **No key-aware note spelling.** `CE_ROOT_LABELS` is one fixed label per pitch class, leaning flat. It cannot produce E♯, F♭, B♯, C♭ or any double accidental. Written honestly in the source itself at `index.html:15884`: *"CE_ROOT_LABELS prefers flats, which is right for lowered borrowings and for the diatonic row, but wrong for raised ones."* `ckBorrowLabel` is a two-case patch over that, not a solution.
   - Consequence for Scales & Modes: **G♯ Lydian, D♭ Locrian, F♯ Phrygian etc. will be spelled wrongly.** A correct implementation needs letter-name-plus-accidental spelling (pick the letter from the degree index, derive the accidental from the pitch class), which is ~30 lines and does not exist in either repo.
2. **No key signature model** (how many sharps/flats, and which).
3. **No scale-degree naming** (tonic/supertonic…, or ♭2/♯4 labels relative to Ionian) — the brightness slider wants "the notes that change", which needs degree-by-degree diffing against the previous mode. `ckQualityAt` gives intervals, not this.
4. **No interval naming** in the suite; VA has `intervalToName` in `standalone-keyboard.html` only.
5. **No transposition of a melody by scale degree** — the Reharmonizer's core operation. `Accel.transform(ns,'third')` transposes by a fixed +3 semitones, which is not degree-aware.

---

## 7. Visual reuse

### 7.1 Score Viewer piano roll — **not** a good fit

`valley-sunrise-app/score.html:779` `function draw()` builds SVG as **strings**. It is coupled to:
`S` (the whole 65-bar score), `ppb` (pixels per beat), `LANE`, `RULER`, `DISP`, `ANN` (section annotations), `solos`/`muted` Sets, `gridW()/gridH()`, horizontal + vertical zoom, a minimap (`drawMini`), a sidebar (`drawSidebar`), an info bar and a corner. It renders one track per lane for a fixed piece. Lifting "a short phrase with highlighted notes" out of it means re-writing it.

### 7.2 `AccelWidgets.roll()` — **this is the one to use**

`accelerator/widgets.js:22` — `roll(host, events, beats)`. Self-contained, ~15 lines, no globals:
- 720×210 SVG, `viewBox` fixed, bar lines every beat with stronger lines on bar boundaries.
- Pitch range auto-fits: `lo = min(36, …) - 2`, `hi = max(72, …) + 2`.
- Up to 4 layers coloured `['#D4A04A','#8FB4E0','#5FB89A','#CB99DF']`, keyed off `n.layer`.
- Per-note `<title>` with note name, beat and duration — accessible by default.
- Optional polyline per layer for notes carrying `voice:true`.
- Bar numbers every 4 beats, and a legend.
- A playhead `<i class="ac-playhead">` positioned by `widgets.js`'s `onprogress` handler.

Highlighting a subset would mean adding a class or colour per note — a small change, since each note already renders its own `<rect>`.

### 7.3 Staff / notehead rendering — **not found**

`Port.md:176` describes the voicing widget as *"four draggable noteheads on a pitch grid"*. The current implementation (`activities.js:61`, `activities.voicing`) is **four `<select>` dropdowns** plus three buttons (Close voicing / Suggested spacing / Arpeggiate). There is no staff, no clef, no notehead glyph and no music font anywhere in either repo.

### 7.4 Ear Training quiz engine — can it take "name the mode"?

Three separate engines, not one:

| Mode | Question model | File |
|---|---|---|
| **Belts** | `BELTS = [{ id, n, title, ask, lede, pool: clip=>bool, answer: clip=>string, options, layers, unlock }]`; `buildQuestion(belt)` at `dojo.js:202` picks a clip from `CLIPS`, derives the answer from it, and draws distractors from `CONFUSIONS` | `dojo/dojo-data.js`, `dojo/dojo.js` |
| **Layers** | `LAYER_EXERCISES = [{ id, theme, section, use:[…files] }]`; roles read from `themes.js`; drag-to-bucket | `dojo/layers-data.js`, `dojo/layers.js` |
| **Blend** | theme-part driven; `buildQuestion()` picks a theme and a melody set; multi-select grid + 3 octave rows | `dojo/blend-data.js`, `dojo/blend.js` |

**Belts is the closest shape** — "hear X, choose from 4 options, wrong answer gives A/B" — and its 7 belts are declarative. But its contract is **clip-driven**: `pool` and `answer` are both functions *of a clip object*, and `CLIPS` entries point at files on disk (`audio/<…>.aac`). A mode quiz has no pre-rendered clip; the audio has to be generated from a root + a mode. So Belts cannot take "name the mode" without either (a) pre-rendering a clip per mode per root, or (b) changing `buildQuestion`/`pickClip` to accept a synthesised source.

What **is** reusable from the dojo without modification: `dojo/audio.js` (if you pre-render clips), `dojo-base.css`'s whole control set (`.dj-display`, `.dj-opt`, `.dj-play`, `.dj-next`, `.dj-mark`, `.dj-score`, `.is-ghost`), the A/B-on-a-wrong-answer pattern, and the "nothing moves after answering" discipline.

The Voicing Atlas quiz (`ceStartQuiz`, `ceCheckQuizInput(activeNoteNames)`, `ceNextQuestion`, `ceUpdateQuizStats`, groups at `index.html:14833`) is a **play-it-on-the-keyboard** quiz scored against held notes — a different interaction again, but the right one if "which mode is this?" ever becomes "play this mode".

---

## 8. Access control

### 8.1 The suite — `evenant-gate.js` (added this session)

```html
<!-- in <head>, before any paint -->
<script>document.documentElement.dataset.gate = 'locked';</script>
<link rel="stylesheet" href="evenant-gate.css">
<!-- with the deferred scripts -->
<script defer src="evenant-gate.js" data-gate="accelerator"
        data-gate-hash="g3j74oa" data-gate-name="The Accelerator"></script>
```

- **Client-side only.** `evenantGateHash(s)` is **djb2**, not a cryptographic hash: upper-cases and trims, then `h = ((h<<5)+h) ^ charCode`, base-36.
- Stores the hash in `localStorage['evenant-gate-<key>']`; a match on load opens silently.
- The inline `<head>` line is what prevents a flash of the gated page; CSS `html[data-gate] body > *:not(.ev-gate){visibility:hidden !important}`.
- The file's own header says it plainly: *"THIS IS A CURTAIN, NOT A LOCK… anyone who opens the developer tools can walk straight past it."*
- Currently used on `accelerator.html` only. Code: `CMACC`.

### 8.2 Voicing Atlas — three mechanisms, all client-side

**(a) The Atlas code gate — this is the one the brief refers to.**
```js
const ATLAS_CODES = ['PFC26'];                       // index.html:17814, PLAINTEXT in source
const ATLAS_STORAGE_KEY = 'voicingAtlas_betaAccess';
function submitAtlasCode(){                          // 17860
  if (ATLAS_CODES.includes(code)) {
    localStorage.setItem(ATLAS_STORAGE_KEY, 'granted');
    openVoicingAtlasApp();
  } else { …'Invalid access code'… }
}
```
Codes live in the shipped JavaScript. Bypass is `localStorage.setItem('voicingAtlas_betaAccess','granted')`.

**(b) A license system — server-validated, but currently switched off.**
```js
const LICENSE_KEY       = 'voicing_atlas_license';         // index.html:12265
const LICENSE_VALID_KEY = 'voicing_atlas_license_valid';
const LICENSE_API_URL   = 'https://api.voicingatlas.com/api/validate-license';
const FREE_VOICINGS_PER_MOOD = 10;
let isUnlocked = true;   // ⚠ "unlock gating removed for now"
…
function openUnlockModal(){ /* Unlock gating removed for now.no-op */ }
```
`validateLicense(code)` POSTs `{code}` and expects `{valid, error}`. Code format `VA-XXXX-XXXX-XXXX`. On success it writes `voicing_atlas_license_valid='true'` to localStorage and **never re-validates** — so even when re-enabled, the client caches the verdict and the gate is bypassable by setting one localStorage key.

**`api.voicingatlas.com` is not in either repo.** Where it is hosted, and what backs it, is unknown from the code. **No Supabase, Stripe, Shopify or Circle SDK, key or endpoint appears in either repository** (the only `stripe` hits in VA are the CSS variable `--stripe` and `.section-stripe`).

**(c) Admin mode.** `ADMIN_PASSWORD_HASH = '7c82602500857aa6ed0cf38c4c3e4ec645bdcaa82c00b9155eb08be100c778a9'` at `index.html:11935`, verified with real `crypto.subtle.digest('SHA-256', …)`, flag in `sessionStorage['voicingAtlas_admin']`. An unsalted SHA-256 of a password in public source is offline-crackable.

### 8.3 Anything linked to purchases?

**Not found in code.** `landing.html` advertises "$15" and links to `#pricing` — an anchor, not a checkout. No payment SDK, no webhook handler, no order lookup. Whatever issues `VA-XXXX-XXXX-XXXX` codes lives behind `api.voicingatlas.com`.

### 8.4 Recommendation for per-module locking

The honest framing first: **on a static Cloudflare Pages site, no client-side gate is more than a curtain.** The page, its scripts and the check are all delivered to anyone who requests the URL. Any approach below that keeps the module's code in the same static bundle is bypassable with devtools in under a minute.

**Simplest thing that is not trivially bypassable, in increasing order of work:**

1. **Cloudflare Access / Pages "protected path"** — no code at all. Put the module under `/modes/` and protect that path at the edge. The HTML is never sent to an unauthenticated visitor. This is the only option on this list that actually withholds the content, and it needs no API. Trade-off: it is an identity gate (email one-time PIN or SSO), not a shareable purchase code.
2. **A Cloudflare Pages Function (`/functions/api/unlock.ts`) in this repo** that validates a code against a list in an environment variable (or a KV namespace) and sets a signed, httpOnly cookie; a second Function serves the module's data file only when the cookie verifies. Keeps codes out of the bundle, keeps the content off the wire until unlocked, and introduces the repo's first server-side code — but no new service and no new bill. **This is my recommendation** if codes must be shareable.
3. **Reuse `evenant-gate.js` as-is** (`status:'locked'` + a `data-gate-hash`). Zero new infrastructure, consistent with the Accelerator, and honest about what it is. Appropriate for "not finished yet", not for "paid".
4. **Point at `api.voicingatlas.com`** — reuses an existing validator, but couples the suite to an unknown service and still caches the verdict client-side.

Whichever is chosen, the switcher integration already exists: set `status:'locked'` in `EVENANT_MODULES` and the row renders "Coming soon" while staying clickable. If the module should be *invisible* until bought, that needs a fourth status (`hidden`) and one `filter()` in `evenant-nav.js:row` and `tools.js` — about five lines.

---

## 9. Video

**There is no video player or embed component.**

- `video/` holds exactly three files: `brass.mp4` (570 KB), `strings.mp4` (523 KB), `woodwinds.mp4` (572 KB).
- They are **background hover footage on the Atlas home page only**. `atlas-data.js:49/73/96` give three of the four families a `video:'video/…mp4'`; `atlas.js:879` builds `<video data-fam preload="none" muted playsinline loop>` elements into `#atl-famvid`, and hover toggles `is-on`. No controls, no sound, no poster.
- There is **one** YouTube iframe, at `atlas.js:496`: `title="YouTube video" allow="autoplay; encrypted-media; fullscreen"`. It is built ad hoc inside the Atlas, not a reusable component.
- `_headers` caches `/video/*` for a year, immutable.
- The Accelerator lesson template (`app.js:lessonView`) has **no video slot**. Three videos per lesson across one intro + seven modes is ~22 videos; at the current 0.5 MB each that is ~11 MB in-repo, which the repo could carry, but the lesson shape and `_headers` both assume immutable filenames (`CONTRIBUTING.md` §5.6, "bump the name if a plate is ever re-cut").

---

## 10. Constraints and gotchas

### 10.1 Conventions a new module must follow

From `Handoff.md` §8 and `CONTRIBUTING.md` §5 (both call these "invariants — these break things silently"):

1. **Load order is load-bearing.** Data file → engine → app, all `defer`, never `async`. Top-level `const` in classic scripts is the module system; **nothing exports**. Converting one file to `type="module"` breaks every file after it.
2. **The `AudioContext` must not be created at load** — browsers require a gesture (`Handoff.md` invariant 9).
3. **Element-qualified resets under `.atl` outrank plain component classes.** `.atl button{font:inherit}` is specificity (0,1,1) and beats any single-class rule at (0,1,0). `CONTRIBUTING.md` records this has *"bitten three times"*. The dojo works around it with `:where()`. Any new component class under `.atl` needs a parent-class prefix.
4. `html` keeps `overflow-y:scroll` / `scrollbar-gutter:stable`, or switching to a taller tab shifts the layout sideways. (This also means the page's centre line is ~7 px left of the viewport centre — expected, not a bug.)
5. `_headers` only works from the root of the deploy output.
6. Never minify or bundle `viewer/` — the `.glb` files are binary.
7. **`source` must stay accurate** on every Accelerator lesson — it names the ebook chapter the lesson condenses, and `Port.md` §3 calls it *"the thing that stops the companion drifting from the book"*. It is rendered in the lesson footer.
8. CC BY credits must stay visible (3D models, and the FluidR3 / MIDI.js Soundfonts credit in the Accelerator footer).
9. Audio pipeline (`Handoff.md` §3): **AAC 192k, 48 kHz, −18 LUFS integrated, −1.5 dBTP.** Never MP3 for new suite audio. Aligned sets must not be trimmed per file.

### 10.2 Documentation drift

- **`Port.md` is stale** and says so at the top. Its file names (`accel-data.js`, `accel-widgets.js`, `accel.js`, `accel.css`), its `WIDGETS` registry, its `.w-grid`/`.w-side` chrome and its persistence description no longer match the code. `accelerator/README.md` is current.
- The repo has **four** overlapping docs: `README.md`, `Handoff.md` (master), `Port.md` (historical), `CONTRIBUTING.md` (Atlas-specific). Invariants are listed in two of them with slightly different wording.

### 10.3 Duplicated code that will bite

| Duplication | Count | Where |
|---|---|---|
| Design tokens | 7 copies | §2.1 |
| Google Fonts `<link>` | per page | every HTML file |
| Piano renderers (VA) | 9 | §5 |
| Piano range calculators (VA) | 3 | `getOptimalPianoRange`, `getCardPianoRange`, `calculatePianoRange` |
| Note-name tables | 5+ | `Accel.names`, `NOTE_NAMES`, `NOTE_NAMES_CE`, `CE_ROOT_LABELS`, `CK_SHARP` |
| Audio engines | 4 in suite + 1 in VA | §4 |
| `esc()` html-escaper | 6+ | `accelerator/widgets.js`, `dojo/dojo.js`, `dojo/blend.js`, `dojo/layers.js`, `evenant-nav.js`, `tools.js` |

### 10.4 File size

- `voicing-atlas/index.html` is **756 KB of hand-written single-file app** (~18 000 lines). If any of its theory code is to be reused, it must be extracted, not imported.
- `valley-sunrise-app/score.html` is 76 KB inline.
- `accelerator/data.js` is 52 KB; `atlas-data.js` is 84 KB. Adding a 9-lesson module with full prose roughly doubles the Accelerator data file.
- Repo total is already ~45 MB (`viewer/*.glb` ~17 MB, `plates-source/*.png` ~28 MB). The `.glb` and plate sources are uncompressed originals.

### 10.5 Mobile

- The dojo is the only part with a verified mobile story: breakpoints at 860 px and 760 px, tap targets ≥ 32 px (the solo control uses a 22 px face with a 44 px `::after` hit area), HTML5 drag replaced by a tap-to-lift model because **drag events never fire on touch**.
- `accelerator/README.md` records a 390 px overflow test in the browser suite.
- Any new drag interaction (the brightness slider is fine; a drag-to-reorder is not) needs a tap path from day one.

### 10.6 Known bugs and limitations carried forward

- **Chromium builds without proprietary codecs cannot decode AAC or H.264**, which is why the dojo's Playwright tests intercept `*.aac` and serve WAV fixtures. Any new test that plays suite audio needs the same.
- Accelerator samples are 3 anchors per instrument — notes far from an anchor are audibly resampled.
- `accelerator/base.css` and `ui.css` appear to be orphans (§2.3).
- `lesson.demo` is a dead field (§3.2).
- 3D viewer: viola model broken, bassoon degenerate, horn/trumpet/violin have no UVs. Irrelevant to this module but listed in `CONTRIBUTING.md` §6.

---

# Reuse map

| Planned feature | Reuse | Where |
|---|---|---|
| Lesson shell (claim → try it → why → exercise → check) | **Reuse as-is** | `accelerator/app.js:13` `lessonView` |
| Lesson router `#/<module>/<lesson>` | **Reuse as-is** | `accelerator/app.js:35` `route()` |
| Progress, quiz scoring, export/import | **Reuse as-is** | `accelerator/model.js` (`Accel`) |
| Stepper / "N of M" / Back-Next pager | **Reuse after un-hard-coding 12/11/6** | `app.js:7` `progress`, `app.js:13` `lessonView` |
| Widget mount, transport bar, undo/compare | **Reuse as-is** | `accelerator/widgets.js:33` `mount()` |
| Widget controls (button/select/range/toggle/group) | **Reuse as-is** | `accelerator/widgets.js` |
| Scheduler: melody + chords, tempo, loop, playhead | **Reuse as-is** | `AccelAudio.Transport` |
| Reharmonizer loop playback | **Reuse** — `transport.replace(events,bpm,beats)` keeps position while material changes | `accelerator/audio.js` |
| Piano roll with highlighted notes | **Reuse, small extension** for a per-note highlight class | `AccelWidgets.roll()` |
| Instrument sounds | **Reuse** (9 instruments, in-repo) or **import smplr** (71 instruments, CDN) | `accelerator/audio/`, VA `index.html:7853` |
| Chord grid: diatonic triads/7ths of a mode | **Port from VA** | `ckDiatonic`, `ckQualityAt`, `CE_ALL_TYPES`, `ceGetChordNotes` |
| 7 modes in brightness order | **Port from VA** | `CK_MODE_SCALES`, `CK_MODE_LABELS` |
| Roman numerals + harmonic function | **Port from VA** | `CK_MODES`, `ckBorrowNumeral`, `CK_FUNCTION_COLORS` |
| Signature chord of a mode | **New** (the data exists; nothing marks "signature") | — |
| Keyboard: render, highlight, click-to-play | **Extract and rewrite from VA** — not droppable | VA `createPianoVisual`, `renderLivePiano`, `ceApplyPianoOverlays` |
| MIDI input | **Port from VA** | `standalone-keyboard.html:918-992` |
| Chord detection | **Port from VA** | `standalone-keyboard.html:762-917` |
| "Which mode is this?" quiz | **New engine** — Belts is clip-driven and cannot generate audio | — |
| Quiz chrome (option buttons, score, A/B on wrong) | **Reuse** | `dojo/dojo-base.css`, `dojo/dojo.js` |
| Access gate | **Reuse `evenant-gate.js`**, or replace per §8.4 | `evenant-gate.js` |
| Switcher / hub entry / "Coming soon" | **Reuse as-is** | `evenant-modules.js` `status:'locked'` |
| Embedded video | **New** | — |
| Correct note spelling on any root | **New** | — |
| Degree-wise transposition (Reharmonizer) | **New** | — |
| Staff / notehead rendering | **New** (if needed at all) | — |

---

# Gaps — what must be built, sized

**S — a day or less each**

- Un-hard-code `12`/`11`/`6` in `app.js`; derive from `LESSONS.filter(l => l.module === …)`.
- Move the challenge prompts out of the `app.js:28` literal into `LESSONS`.
- Add a 4th module status (`hidden`) if the module must be invisible before purchase (~5 lines across `evenant-nav.js` and `tools.js`).
- Per-note highlight class in `AccelWidgets.roll()`.
- Mark the signature chord per mode (a data field plus a style).
- Brightness slider UI itself — `kit.range()` already exists.

**M — a few days each**

- **Correct note spelling.** Letter-name + accidental derived from degree index and pitch class, covering double accidentals; plus key signatures. ~30–60 lines of real code and a test table of all 7 modes × 15 roots.
- **Port the mode/diatonic theory out of VA's `index.html`** into a standalone `modes-theory.js` with no globals: `CK_MODE_SCALES`, `ckQualityAt`, `ckDiatonic`, `CE_ALL_TYPES`, `ceGetChordNotes`. It is written cleanly and commented; the work is extraction and de-globalising, not design.
- **Degree-wise remapping** for the Reharmonizer: map a melody note to its scale degree in the source mode and back out in the target mode, with chromatic notes handled explicitly. Plus the diff that says which notes changed.
- **The "which mode is this?" quiz.** New question builder (root + mode → generated phrase), distractor policy (adjacent modes on the brightness axis are the pedagogically right confusions — the dojo's `CONFUSIONS` table is the precedent), and the answer UI. Reuses `dojo-base.css` chrome and `AccelAudio.Transport` for audio.
- **Video.** Pick hosting (see Open questions), build a lesson-level video block with poster, lazy loading and captions, and decide where it sits in the five-section shape.

**L — a week or more each**

- **A real keyboard component.** `makeKeyboard({host, lo, hi, labels, onNoteOn, onNoteOff})` with a `setStates(map)` API, built to the suite's design system, with click/touch/MIDI/typing input. VA has all the pieces across three files with global state and a different visual language; this is a rewrite that *borrows*, not a port.
- **Server-side access control** (§8.4 option 2): Cloudflare Pages Functions, code storage, signed cookie, and gating the module's data file. Introduces the repo's first backend code and its first CI concern beyond the Accelerator.
- **Content.** One intro plus one lesson per mode is 8 lessons; at the existing Accelerator density that is ~400 words of `body` prose, 3 exercise levels, 2 quiz questions and a `source` line each — plus 24 videos. This is the largest single item and none of it is code.

---

# Recommended location

**Folder:** `modes/` at repo root, mirroring `dojo/`.

```
modes/
  index.html          mode-lab menu (the four widgets), styled like dojo/index.html
  modes-base.css      tokens + shared controls   ← copy dojo-base.css's role
  modes-theory.js     the extracted theory layer (no DOM, no globals)
  keyboard.js         the new keyboard component
  lessons.html        the Accelerator engine, pointed at this module's data
  lessons-data.js     MODULES/LESSONS for Scales & Modes
  brightness.js  chords.js  reharm.js  quiz.js        the four Mode Lab widgets
  video/              or an external host — see Open questions
```

**Why a sibling folder rather than a third module inside `accelerator/`:** the Accelerator's `data.js` is one 52 KB top-level `const`, its `app.js` hard-codes its lesson count, and its scripts are classic (non-module). A sibling folder lets Scales & Modes load its own data file and its own widget registry through the same engine files without either module's content colliding with the other's. If the two are ever genuinely merged, that is a later refactor with a working second module to test it against.

**Route:** `/modes/` for the menu, `/modes/lessons.html#/<module>/<lesson>` for lessons. Consistent with the dojo (file per mode) and the Accelerator (hash per lesson).

**Switcher entry** (`evenant-modules.js`):

```js
{
  id:'modes', name:'Scales & Modes', icon:'modes', status:'locked',
  path:'modes/',
  blurb:'The seven modes from brightest to darkest — what changes, what it does to a chord, and how to hear it.'
}
```
plus a `modes:` entry in `EVENANT_ICONS`. With `status:'locked'` it appears in every switcher and on the hub, wearing "Coming soon", and clicks through to the code prompt. Nothing else in the shell changes.

---

# Open questions — owner only

1. **Access control.** Is Scales & Modes a *paid* module or a *not-finished-yet* module? A curtain (`evenant-gate.js`, 10 minutes) and a real gate (Cloudflare Access or a Pages Function, days) are different projects. If paid: what issues the codes today, and is `api.voicingatlas.com` something this repo may call?
2. **What is `api.voicingatlas.com`?** It is referenced from VA's client and exists in neither repo. Who runs it, what is it built on, can it mint and validate codes for a second product, and is its source somewhere I have not been shown?
3. **Is a purchase system planned at all?** No Stripe/Shopify/Circle integration exists in either repo. If buying is meant to grant access automatically, that whole path is unbuilt.
4. **Video hosting.** 24 short videos. In-repo (`video/`, ~12 MB, immutable cache, free) or external (Vimeo/Mux/YouTube — better delivery, a bill, and a third-party embed inside a CSP that currently allows no frame sources)? The current `_headers` CSP sets `frame-ancestors` but no `frame-src`, so an external player would need a policy change.
5. **One keyboard or two?** Building the keyboard component properly makes it reusable by the Accelerator's `voicing` lesson (currently four dropdowns) and could eventually replace VA's nine renderers. That is a larger, better investment than a keyboard that only serves this module. Is that in scope?
6. **Does Voicing Atlas merge into the suite eventually?** It is a separate repo, separate deploy, separate design system (Inter, `#3B82F6`) and separate audio stack (smplr). Porting theory out of it creates a second copy that will drift. If a merge is ever intended, extracting `modes-theory.js` as a *shared* file — and the repo arrangement that allows that — is a decision to make now, not later.
7. **smplr or the in-repo samples?** 71 instruments from a CDN with a visible loading state, or 9 instruments already in the repo that load instantly and work offline. For a module about scales this probably only needs piano — but the chord grid might want strings.
8. **Scale of the lesson content.** Eight lessons at the existing Accelerator density is a substantial writing job, and the `source` field convention requires each to name the ebook chapter it condenses. Is there ebook material for all seven modes, or does some of this need writing from scratch?
9. **`Port.md` and the orphaned CSS.** Should `Port.md` be marked superseded and `accelerator/base.css` / `ui.css` deleted or re-linked? Both are traps for whoever builds this next.
