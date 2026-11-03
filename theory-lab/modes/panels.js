/* ============================================================================
   SCALES & MODES · THE LISTEN TAB
   ----------------------------------------------------------------------------
   The one function accelerator/app.js looks for. It turns LISTEN into a tab on
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
