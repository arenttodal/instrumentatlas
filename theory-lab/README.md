# Theory Lab — how to add a module

Theory Lab is a hub of **topic modules**. A module is a subject, not a course:
Scales & Modes is the modes, all of them, whoever is teaching them. A course
sells a path through a module and links its videos into it. One module can be
linked from several courses, or from none.

That distinction decides most of what follows. The gate is per module, not per
course. The lesson list belongs to the module. The videos are links out.

```
theory-lab/
├── README.md       this file
├── index.html      the hub — lists LAB_MODULES, no gate
├── lab.css         hub + module chrome (tokens, cards, page shell)
├── lab.js          paints the hub
├── modules.js      THE REGISTRY: one entry per module
├── engine/         THE LESSON ENGINE, this product's own
│   ├── app.js      router, lesson page, LESSON_* hooks
│   ├── widgets.js  transport, piano roll, control kit
│   ├── audio.js    scheduler, voice hook, fallback banks
│   ├── model.js    the progress store
│   ├── lesson.css  the shell and the lesson's own styles
│   ├── data-stub.js  for a page that wants the store, not the engine
│   └── audio/      the fallback sample banks
└── modes/          a module
    ├── index.html  its home: lessons and tools
    ├── lessons.html  the Accelerator engine, pointed at this module's data
    ├── ear.html    a page of its own, on the transport directly
    ├── data.js     MODULES + LESSONS
    ├── activities.js  the widgets, as ModeActivities
    ├── themes.js   the musical material the widgets play
    ├── home.js     paints index.html from data.js
    ├── boot.js     registers the sound voices before the first widget
    ├── modes.css   only what is specific to this module
    └── tests/      browser.cjs
```

Shared across the suite, one level up: `evenant-theory.js` (pure theory, no
DOM), `evenant-keyboard.js` + `.css` (the Voicing Atlas keyboard as a
component), `evenant-sound.js` (its 71 instruments as transport voices),
`evenant-listen.js` + `.css` (the Instrument Atlas's video grid as a
component), `evenant-gate.js`, `evenant-nav.js` and `evenant-modules.js`.

**The lesson engine is Theory Lab's own**, in `theory-lab/engine/`: `app.js`
(router and lesson page), `widgets.js` (the transport, roll and control kit),
`audio.js`, `model.js` (the progress store), `data-stub.js`, `lesson.css`, and
`audio/` — nine instruments of mp3 that a phrase falls back to when the sample
CDN is out of reach.

It began as the Accelerator's engine and the two have since diverged: the
Accelerator in `accelerator/` is a twelve-lesson course of bespoke activities
run as micro levels, with a `beats` data shape of its own, and it is a
different product from this one. **Changing `accelerator/` does not change
Theory Lab and the reverse is equally true.** If you want something from one
in the other, port it deliberately.

There is no build step. Scripts are classic `<script defer>` in dependency
order and top-level `const` is the module system — nothing exports. Order in
the HTML *is* the dependency graph; get it wrong and you get a
`ReferenceError`, not a warning.

---

## 1. Register the module

Add one entry to `modules.js`:

```js
{
  id:'ostinatos', name:'Ostinatos', path:'ostinatos/', icon:'ostinatos',
  gate:'lab-ostinatos', hash:'…',
  status:'available',                 /* or 'soon' */
  blurb:'One sentence on the card.',
  meta:'5 lessons · 2 tools',
  buy:'https://…'                     /* where to buy it; '' hides the link */
}
```

`gate` follows `lab-<module id>`. Draw the card's diagram by adding an entry to
`LAB_ART` keyed by `icon` — a bare `<svg viewBox>` string, as `modes` does.
A `status:'soon'` entry renders as a dead card with a Coming soon tag, which is
how you put a module on the hub before it exists.

## 2. Make the access code

The gate is **a curtain, not a lock**: djb2, client-side, in a file anyone can
read. It stops an accident, not a person. The paywall that matters is the
course platform's.

Generate the hash in a browser console on any page that loads
`evenant-gate.js`:

```js
evenantGateHash('YOURCODE')   // → 'g1ctlzg'
```

Commit **the hash only**. Never commit the plain code — it goes in the course,
not the repo. Changing the hash re-locks everyone who has already typed the
code, so rotate only if it leaks widely.

Then put it on every page of the module:

```html
<link rel="stylesheet" href="../../evenant-gate.css">
<script>document.documentElement.dataset.gate = 'locked';</script>
```
```html
<script defer src="../../evenant-gate.js" data-gate="lab-ostinatos"
        data-gate-hash="g1ctlzg" data-gate-name="Ostinatos"></script>
```

The inline `dataset.gate` line matters: it runs before anything paints, which
the gate's own deferred script cannot. The router still runs behind the
curtain, so a deep link from a video lands on the right lesson the moment the
code is accepted — hash and query intact.

## 3. Write the lessons

`data.js` declares two globals on the Accelerator's shape, `MODULES` and
`LESSONS`. A lesson:

```js
{
  id:'four-note-loop', module:'lessons', n:2,
  title:'…', short:'…', claim:'…',
  activity:'loop',                    /* which widget */
  preset:{ bars:4, drone:false },     /* its starting state */
  challenge:'…',                      /* the prompt above it */
  videos:[{ part:'theory', title:'…', url:'…', minutes:6 }],
  body:['…'],                         /* HTML-bearing strings */
  ex:{…}, quiz:{…}, source:'…'
}
```

`activity`, `preset`, `challenge` and `videos` are the four fields the lab
added to the Accelerator's lesson shape; everything else is the Accelerator's
own and behaves identically. `activity` defaults to the lesson `id`, so a
one-off widget needs no field.

Two rules:

- **Nothing mutates `LESSONS` after the literal.** The Accelerator's own
  `data.js` patches its array in places; a lab module does not. What is written
  in the file is the whole truth about the lesson.
- **Facts live in `evenant-theory.js`, as data.** Brightness, colour notes,
  signature chords and cadences are read from there by the prose, the widgets
  and the video scripts alike, so they cannot drift apart. Do not retype a fact
  into a `body` string that the theory layer already knows.

`preset` can be overridden per link by query string, which is how a video
description points at one exact state:
`lessons.html#/lessons/four-note-loop?bars=8&drone=false`. Values are coerced
to the type of the preset's default, so `8` arrives as a number and `false` as
a boolean.

## 4. Write the activities

`activities.js` declares `ModeActivities` — or `OstinatoActivities`, named for
the module — and then aliases it:

```js
const AccelActivities = ModeActivities;
```

The engine looks up `AccelActivities[lesson.activity]` and calls it with the
widget's state object and a kit of helpers. It returns the contract the
Accelerator already uses:

```js
activities.loop = (s, u) => {
  u.defaults({ bars:4, drone:false });    /* fill in anything the preset left out */
  return {
    build(){ return { events, bpm:88, beats:16 }; },  /* what the transport plays */
    render(){ /* draw the controls into u.host */ },
    read(){ return 'the read-out under the roll'; },
    check(){ return { ok:true, text:'why' }; },       /* the Check button */
    draw(roll){ /* optional: overlay on the piano roll */ }
  };
};
```

`s` is the state — the lesson's `preset`, overridden by the query string,
persisted per learner. `u` is the kit from `theory-lab/engine/widgets.js`: `host`,
`params`, `button`, `group`, `select`, `range`, `toggle`, `editor`, `pitches`,
`defaults()`, `notes()`, `update()`, `redraw()`, `say()`, `play()`,
`preview()`, `clean()`.

`build` runs on every state change; `render` only on a full repaint. Anything
that must survive a state change — a keyboard, an audio node — hangs off the
kit object and is torn down through `u.clean(fn)`.

## 5. Sound

Sound is one `AudioContext`, created on a gesture, driven by
`AccelAudio.Transport`. The Voicing Atlas instruments arrive as transport
voices: `boot.js` calls `EvSound.register(AccelAudio)` once, after `audio.js`
and before the first widget mounts, and `EvSound.apply(events, id)` points a
phrase at one of them. If the sample CDN cannot be reached the voice falls back
to this repo's own banks and the phrase still sounds.

Every widget that plays anything should offer a tonic drone, **off until it is
asked for**. A mode without a tonic underneath it is not a mode, so the drone
is the first thing to reach for when one refuses to sound like itself — but
starting every widget with a sustained note under it assumes what the reader
wants to hear first, and assumes it loudly.

## 6. Extra steps on a lesson

A lesson is a **run of numbered steps**, not a page you scroll and not a tab
bar. `stepsOf(lesson)` builds the run: Try it, one step per beat of reading,
Practise if there is an exercise, one step per quiz question, then one step per
declared panel, then Done. The step rail at the top of the reading column is
the progress indicator, Back and Next and the arrow keys move through it, and
`?step=4` opens one directly.

A module that wants a step of its own declares `LESSON_PANELS(lesson)`. Declare
nothing and the lesson is exactly what it was.

```js
const LESSON_PANELS = lesson => {
  if(lesson.kind === 'lab') return [];          // a tool has no lesson around it
  return [{ id:'listen', label:'Listen', badge:6, lead:'…',
            mount(host){ return EvListen.render(host, …); } }];
};
```

`mount` runs the first time its step is reached and never again, so a step
nobody walks to costs nothing. What it returns is destroyed when the reader
leaves the lesson. A panel step fills the **wide** column — the widget is
hidden and `#panel-host` takes its place — and reaching one stops the
transport, because the transport goes off screen with it.

`label` names the step in the rail; `lead` is one line above the panel. Moving
between steps rewrites the hash, so what the reader is looking at is always
what the address bar says.

**The Listen grid.** `EvListen.render(host, items, opts)` returns `{destroy}`
and draws the Instrument Atlas's video card: thumbnail, play disc, metadata.
Nothing reaches YouTube until a click — `i.ytimg.com` serves one image per card
and the player is built on demand, from `youtube-nocookie.com`. Only one plays
at a time, and `opts.onPlay` is where the host stops its own audio first.

Items carry `verified`. **A reader sees only `verified: true` cards**, so a
timestamp nobody has listened to never ships; a mode with none shows
"Examples coming soon" rather than an empty grid. `?author=1` on the page URL
(the 3D viewer's convention) shows every card, loads YouTube's IFrame API so
the page can read the player's clock, and adds per-card Set start / ±1 s / Set
end / Clear end / Mark verified and a field for a different video. Edits are a
draft in `localStorage`; **Copy data** writes the whole object back as source
to paste into the data file, and **Discard draft** clears it. Nothing is
written to the repo and nothing is posted anywhere.

## 7. A page that is not a lesson

`ear.html` is the pattern: its own engine on `AccelAudio.Transport`, its own
CSS, the Dojo's chrome, no Accelerator app. It still loads
`theory-lab/engine/model.js` for the progress store, which needs
`MODULES`/`LESSONS` to exist — hence `engine/data-stub.js`, which declares both
empty.

Progress is keyed by `<html data-store="…">`. Give the module **one** store key
and use it on every page of it, so lessons and tools share a record.

## 8. Tests

```
node tests/theory.cjs                       # pure Node, no browser
node tests/keyboard.cjs                     # needs the site served
node tests/sound.cjs
node theory-lab/modes/tests/browser.cjs
```

The three browser suites need the repo served from its root
(`python3 -m http.server 8765`) and honour `LAB_URL` / `ACCEL_URL`.
`tests/keyboard.cjs` compares the component against the Voicing Atlas
screenshot by screenshot; point `VA_SOURCE` at a checkout of that repo's
`index.html` to run the comparison, or leave it unset and it reports itself
skipped while the behavioural half still runs.

Add `<module>/tests/*.cjs` for a new module — `.github/workflows/theory-lab-checks.yml`
runs every file matching `theory-lab/*/tests/*.cjs`, so a new suite is picked
up by existing CI without touching the workflow.

## 9. Before launch, check

- The gate's plain code is nowhere in the repo.
- After unlocking, the gate continues to the URL the buyer arrived on — hash
  and query included.
- Every page at 390 px has no horizontal page scroll.
- **Nothing scrolls on a desktop.** Every route — the hub, a module, a lesson
  at every step, a tool — fits one screen from 1280x720 up, and nothing is
  clipped behind the lock. `theory-lab/modes/tests/browser.cjs` asserts this
  at 1280x720, 1366x768 and 1440x900; its probe looks for leaves below the
  fold and for a flex box shorter than what it holds, because
  `body{overflow:hidden}` makes `scrollHeight` report a perfect fit either way.
- The Accelerator is untouched: same look, same behaviour, its own CI green.
