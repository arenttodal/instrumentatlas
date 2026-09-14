# The Accelerator — portable specification

Everything another agent needs to rebuild, extend or port this. Self-contained:
no other document is required.

---

## 1. What this is

An interactive companion to the **Cinematic Music Accelerator** ebook by Arn
Andersson (Evenant). Each ebook chapter becomes a lesson where the concept is
**demonstrated before it is explained**.

**Module 1, Foundations, is complete — six lessons, six working widgets, no
assets required.** Every widget synthesises its own audio through the Web Audio
API, so the whole thing runs from a static folder with nothing to download.

### The governing rule

> If a lesson has no demonstration, it stays in the ebook and does not become a
> lesson.

Interactivity for its own sake is worse than prose. Before building any widget,
ask whether a paragraph would do the same job. If yes, write the paragraph.

---

## 2. Files

```
accelerator/
├── index.html          shell — nav, progress meter, script tags
├── accel.css           all styles, including widget chrome
├── accel-data.js       ← content: MODULES, LESSONS
├── accel-widgets.js    audio core + the six widgets
├── accel.js            router, progress, lesson rendering
└── PORT.md             this file
```

Static. No build step, no dependencies, no npm. Serve over http — `file://`
works for everything except the audio-file upgrade path in §6.

**Load order is load-bearing.** `accel-data.js` → `accel-widgets.js` →
`accel.js`, all `defer`. Top-level `const` in a classic script is visible to
later scripts, which is why nothing exports anything. Do not convert to modules
without rewriting all three.

---

## 3. Data model

```js
MODULES = [{ id, n, title, subtitle, lede }]

LESSONS = [{
  id,          // route segment
  module,      // MODULES.id
  n,           // number within the module
  title,
  short,       // one line for the index
  claim,       // THE sentence — rendered italic gold under the title
  demo,        // key into WIDGETS
  demoNote,    // caption telling the reader what to try
  body: [],    // paragraphs, <strong> and <em> allowed
  ex: { beginner, intermediate, advanced },
  quiz: [{ q, o: [], a: index, why }],
  source       // which ebook chapter this condenses — shown in the footer
}]
```

`source` exists so the teaching can always be checked against the original. Keep
it accurate; it is the thing that stops the companion drifting from the book.

---

## 4. Lesson anatomy

Five sections, always in this order:

1. **Claim** — one sentence, the thing to remember.
2. **Try it** — the widget. This is the lesson.
3. **Why it works** — 200–400 words condensed from the chapter.
4. **Practise** — the ebook's own quests at three levels.
5. **Check yourself** — two questions with immediate feedback and a *why*.

Demonstration comes **before** explanation deliberately. Hearing the problem is
what makes someone want the explanation. This is the opposite of the ebook's
order and it is intentional.

---

## 5. Design system

Shared with the Instrument Atlas so the two read as one product.

| | |
|---|---|
| Background | `#080C14` |
| Gold accent | `#D4A04A` → `#C08830` |
| Blue | `#8FB4E0` · warn `#C0603A` · ok `#5FB89A` |
| Text | `#BEC0C8` · dim `#7E808A` · faint `#4E505A` |
| Hairlines | `rgba(255,255,255,.07)`, gold `rgba(212,160,74,.24)` |
| Display | Playfair Display 500, italic for claims |
| Body | DM Sans 300/400/500 |
| Labels | DM Sans 700, 9.5–11px, uppercase, 1.8–2.6px tracking |

Family colours, where widgets need them: woodwinds `#6FB7E8`, brass `#D4A04A`,
strings `#CF5F52`, percussion `#9B8FD4`, choir `#7FD1B9`.

Widget chrome is shared: `.w-grid` (stage + 276px side panel), `.w-stage`,
`.w-side`, `.w-lab`, `.w-row`, `.btn`, `.w-read`. A new widget that uses these
classes inherits the look for free.

---

## 6. Audio

### The synthesis core

```js
tone(midi, { dur, gain, bright, partials, when, attack, detune })
```

Additive — ten sine partials with amplitude `1 / k^(2.1 - bright)`. `bright`
from 0 to 1 shifts energy upward and is, for teaching purposes, the whole of
timbre. `partials` is a boolean array that silences individual ones.

```js
chord(notes, opts)               // simultaneous
seq([[midi, startBeat, lenBeats]], bpm, opts)   // a tiny sequencer
```

The `AudioContext` is created lazily on first use, because browsers require a
gesture.

### Upgrading to rendered audio

Synthesis is honest about intervals, spacing and overtone balance, and it is not
honest about what an orchestra sounds like. Where real renders would teach more,
the intended path is:

```
audio/accelerator/<lessonId>/<slug>.aac
```

| Lesson | Files |
|---|---|
| perspective | `melody`, `harmony`, `drone` |
| separation | `mud`, `register`, `full` |
| voice-leading | `block`, `voiced`, `split` |
| tone-colour | `flute`, `oboe`, `clarinet`, `horn`, `trumpet`, `violin` |

15 files. **Same passage, same tempo, same start offset, same length.** AAC
192 kbps, loudness-matched to −18 LUFS integrated with true peak at −1.5 dBTP,
leading silence trimmed to ~10 ms before the attack. These are the same specs as
the Instrument Atlas demos, so the two sound like one product.

Port `AudioCompare` from the Studio for file playback rather than writing a
second implementation — one `AudioContext`, all buffers started at one scheduled
time, switching is a gain ramp so it never restarts.

---

## 7. The widgets

Each is `WIDGETS[id] = function(host, lesson)`. Fill `host`. If the widget
starts a loop or a timer, set `host._cleanup` — the router calls it on
navigation.

**`overtones`** — eight bars showing the harmonic series from C3. Click one to
silence that partial and hear the result. Proves the ebook's point that the
fundamental alone is lifeless.

**`voicing`** ⭐ — four draggable noteheads on a pitch grid. Live checks against
the ebook's two principles: spacing follows the series (wide low, tight high),
doubling follows 4:2:1 (root, fifth, third). **Bad voicing** and **Fix it**
buttons for immediate A/B. *This is the flagship. If you port one thing, port
this.*

**`perspective`** — three layers, three sliders each mapping to one of the
ebook's parameters (loudness, rhythmic activity, unpredictability). A diagram
re-sorts into foreground / middleground / background live, and the loop changes
what it plays to match — activity genuinely swaps sustained notes for moving
ones.

**`separation`** — three-way A/B of the same four bars: everything in one
register and colour, separated by register only, separated by register plus
rhythm plus colour. Built on the generic `abWidget`.

**`voiceleading`** — the ebook's own Am–F–C–G in three versions: block keyboard
voicings, proper voice leading, split across Violin I / II / viola / cello with
the cello doubling the bass in octaves.

**`timbre`** — the same pitch at six overtone balances with the spectrum drawn.
Shows why blending wants similar timbres and separation wants contrasting ones.

**`abWidget(host, opts)`** is a reusable helper for any three-way comparison:

```js
abWidget(host, {
  bpm, bars,
  versions: [{ label, read, lanes: [{ name, col, lo, hi, gain, bright, attack, notes }] }]
});
```

---

## 8. Progress

`localStorage` under `accel-progress`:

```js
{ lessonId: { seen, exerciseDone, quizPassed } }
```

A lesson counts as complete when `exerciseDone && quizPassed`. All reads and
writes go through the `Progress` module in `accel.js` so a server-side store can
replace it by rewriting one object.

No accounts in the MVP. If accounts arrive, the same shape moves to a table
keyed by user.

---

## 9. Remaining modules

The ebook's other four parts, with the demonstration each lesson needs. Build in
this order; do not start until Foundations has been used by real readers.

### Composition
- **motifs** — a 4-bar grid, click to place 3–5 notes, with buttons that
  generate a starting rhythm or interval for the blank-page problem
- **prevade** ⭐ — take the user's motif and build a phrase from it. Four slots:
  Presentation, Repetition, Variation, Destruction, draggable to reorder, each
  offering automatic variations (inverted, displaced, transposed). Marks the top
  point. *This is the ebook's central method and the second flagship.*
- **question-answer** — the same phrase ending on different scale degrees; click
  a degree, hear how resolved it feels
- **harmony** — a melody with a chord slot per bar; choose from I, IV, V, ii, vi
  and the borrowed chords; clashing notes highlight
- **countermelody** — the melody plays, toggle four candidates that variously
  compete, support, mirror the motif, or fill the gaps
- **ostinato** — a 16-step grid over a fixed progression, with scale-based,
  arpeggio-based and octave-and-fifth presets

### Form
- **dynamics-complexity-contrast** — the Valley Sunrise score view with a lane
  count graph beneath, so the waves are visible as shape
- **structures** — place A and B sections on a timeline, set each one's dynamic
  level and instrument count, hear it assembled from section stems

### Orchestration
Links into the **Instrument Atlas**, which already exists. Two new lessons:
doubling for colour (reusing the `with-cello`, `with-oboe`, `with-trombone`
demos already recorded), and the mistakes chapter as a listening quiz.

### Production
Mostly video and text — the ebook is explicit that mixing warrants its own
course. Two worth building: a panning demo showing orchestral seating against a
collapsed stereo image, and a mockup-realism A/B of the same phrase quantised
and flat versus humanised with CC1.

---

## 10. Adding a lesson

1. Add an object to `LESSONS` in `accel-data.js`.
2. If `demo` names a widget that does not exist, the lesson still renders with a
   labelled "not built yet" panel — so content and widgets can land separately.
3. Register `WIDGETS.<demo>` in `accel-widgets.js` when ready.
4. Use `.w-grid` / `.w-side` / `.btn` / `.w-read` and it will match everything else.

## Adding a module

Add to `MODULES`, set `module` on its lessons. Routing, the index page and the
progress meter all follow automatically.

---

## 11. Things that will silently break it

- **Load order.** Data, widgets, app — all `defer`. Do not make one `async`.
- **`host._cleanup`.** A widget that starts a loop without setting it keeps
  playing after the reader navigates away.
- **Quiz `a` is an index**, not the answer text.
- **The `AudioContext` must not be created at load.** Browsers require a gesture;
  creating it early leaves it suspended and silent.
- **`claim` is one sentence.** Two sentences in gold italic stops being a claim
  and becomes a paragraph.

---

## 12. Commercial placement

Three options, genuinely different products:

- **Free companion to the ebook** — maximises reach, feeds the course funnel
- **Paid bonus inside the Suite and Accelerator** — raises the value of what
  already sells
- **Its own product** — only past roughly twenty lessons

Recommendation: ship Foundations free behind an email. These six lessons are
exactly the "I wish I had known this" material that earns enough trust to sell a
course, and the ebook is currently doing that job less well.
