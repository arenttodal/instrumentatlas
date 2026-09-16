# Accelerator implementation

Scope: `accelerator.html` and its `accelerator/` assets only. Shared navigation and the other learning tools are unchanged.

`accelerator.html` is a shell: the shared Evenant bar, a `<main>`, and these scripts. Lesson content lives in `data.js`, musical and progress rules in `model.js`, synthesis in `audio.js`, the activities in `widgets.js` and routing in `app.js`. Styles are `base.css` (design system) and `ui.css` (this tool's layout). There is no build step.

## The lesson shell

A lesson is a run of micro levels, not a scroll: try it, one idea at a time, the quest, one question at a time, then a close. The explanation holds the left column and the activity the right. The activity mounts **once** and stays live for the whole lesson, so page height is `max(activity, step)` rather than every section stacked, and a lesson is one viewport on every step. The viewport lock is a flex chain from `html` down rather than a subtracted bar height, because the shared bar is 76px and any hardcoded guess left the page a pixel or two scrollable.

## The step contract

The demonstration follows the explanation. On every step the shell calls

```js
handle.step({ index, type, scene, beat, label })
```

`scene` comes from the lesson's own `beats` in `data.js`, so what the demonstration does at each point is authored beside the words rather than hard-coded against a step number:

```js
beats:[
  {t:'One note is never one note', p:[0], scene:'timbres'},
  {t:'The string vibrates in halves, thirds, quarters', p:[1], scene:'divisions'}
]
```

An activity opts in by returning `{ step(ctx){ ... } }` from its factory. Returning nothing is fine — the activity simply stays put while the reader moves. `AccelWidgets.tip(host, selector, text)` draws a coachmark anchored inside the stage; the shell clears it on every step so a nudge never outlives its moment.

`overtones` is the worked example: four scenes, one per beat — the same note as six instruments, the string dividing in halves and thirds, the series drawn by pitch, and 4:2:1 doubling you can click. Every other lesson currently holds one scene and can gain more without any change to the engine.

## Activities

Each activity synthesises its own audio through `tone()`, `chord()` and `seq()` in `audio.js` — no asset files. Anything that starts a loop sets `host._cleanup`, and `AccelAudio.stop()` cuts the master bus on navigation, which also silences notes already scheduled ahead of the audio clock.

Progress, quiz answers, exercise levels and JSON backups are in `model.js` and persist in this browser.

## Verification

From the repository root:

```sh
node accelerator/tests/model.cjs
python3 -m http.server 8765
```

With Playwright and its Chromium browser installed, in another terminal:

```sh
node accelerator/tests/browser.cjs
```

The browser suite covers all 12 lessons: the activity mounts, it actually schedules audio, the step rail exists with exactly one current step, the page stays one viewport on **every** step, mobile does not overflow, the overtones scenes differ per beat, a coachmark appears on a read step, and leaving a lesson stops scheduling. The model suite covers voicing, transformation, sustained-note overlap, quiz mastery retention and backup validation.

Use headphones for subjective balance and timbre review; an automated playback assertion is not a perceptual audio assessment.
