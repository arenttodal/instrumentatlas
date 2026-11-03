/* ============================================================================
   SCALES & MODES · THE HOOKS THE ENGINE LOOKS FOR
   ----------------------------------------------------------------------------
   Two globals accelerator/app.js checks for and does without if they are not
   there: LESSON_COPY, which puts the owner's words at the top of a mode, and
   LESSON_PANELS, which adds the Listen tab.

   ---------------------------------------------------------------- LISTEN --- It turns LISTEN into a tab on
   the five colour modes' lessons and nothing anywhere else: Ionian and Aeolian
   are the reference points every other mode is defined against, so they have
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

   `lede` opens the Overview tab, above the jump links and the sections — what
   the mode is, in prose, before anything asks you to do something.
   ============================================================================ */
const LESSON_COPY = (() => {
  const esc = s => String(s == null ? '' : s)
    .replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  return function(lesson){
    if(!lesson || typeof MODE_COPY === 'undefined') return null;
    const c = MODE_COPY[lesson.id];
    if(!c) return null;
    return {
      tagline: c.tagline,
      lede:
        '<div class="ac-lede">' +
          (c.about || []).map(p => '<p>' + esc(p) + '</p>').join('') +
          ((c.useFor || []).length
            ? '<div class="ac-usefor"><span class="ac-usefor-lab">Use it for</span>' +
              c.useFor.map(u => '<span class="ac-chip">' + esc(u) + '</span>').join('') +
              '</div>'
            : '') +
        '</div>'
    };
  };
})();
