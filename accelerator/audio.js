/* ============================================================================
   AUDIO CORE
   ----------------------------------------------------------------------------
   Every activity synthesises its own sound. One context, created on first use
   because browsers require a gesture, and everything routed through one bus so
   navigating away can silence notes that are already scheduled ahead of the
   clock — stopping a loop's timer does not unschedule what it already queued.
   ============================================================================ */

let actx = null, bus = null;

const AC = () => {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    bus = actx.createGain();
    bus.connect(actx.destination);
  }
  return actx;
};
const busOut = () => { AC(); return bus; };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

/* Additive tone. `bright` shifts energy into the upper partials, which is the
   whole of timbre for our purposes. `partials` can silence individual ones. */
function tone(midi, o = {}) {
  const { dur = 1.6, gain = .16, partials = null, bright = .55, when = 0, detune = 0 } = o;
  const c = AC(), t0 = c.currentTime + when;
  const out = c.createGain();
  out.connect(busOut());
  out.gain.setValueAtTime(0, t0);
  out.gain.linearRampToValueAtTime(gain, t0 + (o.attack || .03));
  out.gain.setTargetAtTime(0, t0 + dur * .55, dur * .22);
  for (let k = 1; k <= 10; k++) {
    if (partials && !partials[k - 1]) continue;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz(midi) * k * (1 + detune / 1200);
    g.gain.value = (1 / Math.pow(k, 2.1 - bright)) / 1.6;
    osc.connect(g).connect(out);
    osc.start(t0); osc.stop(t0 + dur + .4);
  }
  return out;
}

const chord = (notes, o = {}) =>
  notes.forEach(m => tone(m, Object.assign({ dur: 2.2, gain: .1 }, o)));

/* a tiny sequencer: [[midi, startBeat, lenBeats], ...] */
function seq(notes, bpm, o = {}) {
  const spb = 60 / bpm;
  notes.forEach(([m, s, l]) =>
    tone(m, Object.assign({ when: s * spb, dur: l * spb }, o)));
  return notes.reduce((a, [, s, l]) => Math.max(a, (s + l) * spb), 0);
}

const AccelAudio = (() => {
  /* Cutting the bus kills notes already queued on the audio clock, which a
     cleared timeout cannot do. A fresh bus takes its place for the next page. */
  function stop() {
    if (!actx) return;
    try { bus.disconnect(); } catch (_) {}
    bus = actx.createGain();
    bus.connect(actx.destination);
  }
  return { stop, context: () => actx, inspect: () => ({ state: actx ? actx.state : 'none' }) };
})();
