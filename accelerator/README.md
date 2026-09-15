# Accelerator implementation

Scope: `accelerator.html` and its `accelerator/` assets only. Shared navigation and the other learning tools are unchanged.

The original monolithic page is separated into lesson content (`data.js`), musical/state rules (`model.js`), playback (`audio.js`), lesson activities (`activities.js`), accessible controls (`widgets.js`), routing (`app.js`) and styles. There is no build step.

All 12 lessons are discoverable from the course overview and lesson outline. Section shortcuts, resumable progress, retryable quizzes, retained best results, exercise levels and JSON backups support the learning flow. Composition activities explicitly save/import a shared sketch through motif, phrase, dialogue, harmony, countermelody and ostinato stages. Activity controls support keyboard input, undo/redo, reset and stored A/B comparisons.

Audio uses an exclusive transport, a short audio-clock scheduling horizon, cancellable sample loading, pause/resume, restart, loop and smooth stop. Navigation and backgrounding stop or pause playback. Instrument examples use bundled MP3 samples; overtones use explicit harmonic synthesis. See [audio credits](AUDIO-CREDITS.md) for provenance and acoustic limitations.

Musical feedback checks exercise constraints rather than declaring a universal composition rule. The C-major voicing check requires all triad tones. Voice-leading uses a complete 16-beat cycle. Harmonic fit weights overlap duration and downbeats, and does not equate non-chord tones with mistakes. PReVaDe has an independently editable ending.

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

The browser suite tests all 12 lesson mounts, actual sample decoding/playback scheduling, stop, routing cleanup and 390px overflow. The model suite covers voicing, transformation, sustained-note overlap, quiz mastery retention and backup validation. Use headphones for subjective balance and timbre review; an automated playback assertion is not a perceptual audio assessment.
