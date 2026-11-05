/* ============================================================================
   SCALES & MODES · THE HOOKS THE ENGINE LOOKS FOR
   ----------------------------------------------------------------------------
   Two globals theory-lab/engine/app.js checks for and does without if they are not
   there: LESSON_COPY, which gives the engine the owner's words to lay out, and
   LESSON_PANELS, which adds the Listen step.

   ---------------------------------------------------------------- LISTEN ---
   It turns LISTEN into a step of its own — the last one before Done — on the
   five colour modes' lessons and nothing anywhere else: Ionian and Aeolian are
   the reference points every other mode is defined against, so they have
   nothing to point at, and a tool is a widget with no lesson around it.

   AUTHOR MODE IS ?author=1 ON THE PAGE, not on the hash — the 3D viewer's
   convention, so one habit covers both. It shows every card including the
   unverified ones, loads YouTube's IFrame API so the page can read the
   player's clock, and lets the owner set start and end times by ear.
   ============================================================================ */

const LESSON_PANELS = (() => {
  const author = (() => {
    try { return new URLSearchParams(location.search).get('author') === '1'; }
    catch(_){ return false; }
  })();

  const NOTE = 'Videos play through YouTube’s own player and stay on the rights ' +
    'holders’ channels; nothing is copied or re-uploaded. Each card starts at the ' +
    'passage that makes the point, so the mode is the first thing you hear.';

  return function(lesson){
    if(!lesson || lesson.kind === 'lab') return [];
    if(typeof LISTEN === 'undefined' || typeof EvListen === 'undefined') return [];
    const items = LISTEN[lesson.id];
    if(!items || !items.length) return [];

    /* The badge counts what a reader will actually see. */
    const n = author ? items.length : items.filter(i => i.verified && i.yt).length;

    return [{
      id: 'listen',
      label: 'Listen',
      badge: n || '',
      lead: 'Now that you know what it does, here it is doing it \u2014 each one starts at the passage that shows the mode.',
      mount(host){
        return EvListen.render(host, items, {
          author,
          label: lesson.title,
          group: lesson.id,
          store: LISTEN,
          name: 'LISTEN',
          note: NOTE,
          empty: 'Examples coming soon.',
          /* One thing sounds at a time: a video stops the lesson's transport,
             drone included, the same way pressing Stop would. */
          onPlay(){ try { AccelAudio.stop(); } catch(_){} }
        });
      }
    }];
  };
})();


/* ============================================================================
   LESSON_COPY · the owner's words, where a reader meets the mode first
   ----------------------------------------------------------------------------
   `tagline` takes the italic line under the heading. On a mode that has one it
   REPLACES the lesson's own `claim` rather than joining it: both are a short
   italic line saying what the mode is, and two of those under one heading is
   the kind of duplication nobody reads twice. `claim` is untouched in the data
   and is still what the intro lesson and the three tools show.

   `about` and `useFor` are DATA, not markup: the engine lays them out itself.
   `useFor` becomes the chips beside the tagline on the Try it step, and each
   paragraph of `about` becomes one Why step of its own. That is also why the
   lesson's own `body` is not shown on a mode that has `about` — the body is a
   draft written from the theory layer, and saying both would be the same thing
   twice at twice the length.

   Returning a pre-rendered blob here, as this once did, would put the whole
   mode back on one page: it is the engine that knows how much fits a screen.
   ============================================================================ */
const LESSON_COPY = (() => {
  const esc = s => String(s == null ? '' : s)
    .replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* `about` is escaped here because the engine drops each paragraph in as HTML
     — the lesson bodies it also renders carry <strong> and <em>, so it cannot
     escape at the other end without losing them. */
  return function(lesson){
    if(!lesson || typeof MODE_COPY === 'undefined') return null;
    const c = MODE_COPY[lesson.id];
    if(!c) return null;
    return {
      tagline: c.tagline,
      about: (c.about || []).map(p => esc(p)),
      useFor: (c.useFor || []).slice()
    };
  };
})();
