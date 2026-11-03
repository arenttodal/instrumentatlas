/* ============================================================================
   THEORY LAB · MODULE REGISTRY
   ----------------------------------------------------------------------------
   One entry per module, the way dojo/modes.js holds one per ear-training mode
   and evenant-modules.js holds one per tool. Adding a module is a folder plus
   an entry here; nothing else in the suite changes.

   A MODULE IS A TOPIC, NOT A COURSE. It can be linked from one course, from
   several, or from none. That is why `buy` is a link rather than a price, and
   why the gate is per module rather than per course: a later course on film
   harmony can link into two modules at once and post both codes.

   `gate` and `hash` are the module's own access code, checked by
   evenant-gate.js on each of the module's pages. The home page reads the same
   localStorage key to decide whether a card shows as unlocked, which is the
   only reason the hash is here as well as on the pages.

   THE HASH IS A CURTAIN. djb2, client-side, in a file anyone can read. What it
   keeps out is an accident, not a person. The paywall that matters is the
   course platform's, and the videos are the paid thing.
   ============================================================================ */

const LAB_ROOT = (() => {
  const s = document.currentScript;
  return s && s.src ? new URL('.', s.src).href : './';
})();

const LAB_MODULES = [
  {
    id:'modes', name:'Scales & Modes', path:'modes/', icon:'modes',
    gate:'lab-modes', hash:'g1ctlzg',           /* placeholder code — rotate before launch */
    status:'available',
    blurb:'The seven modes from brightest to darkest: what changes, what it does to a chord, and how to hear it.',
    meta:'6 lessons · 4 tools',
    buy:''                                       /* the course URL, once it exists */
  }
  /* ostinatos, voice leading and cinematic chord moves follow */
];

/* Each module draws its own diagram, as the ear-training modes do. This one is
   the brightness axis: seven rungs, lit from the top down. */
const LAB_ART = {
  modes:`<svg viewBox="0 0 220 104" fill="none" aria-hidden="true">
    <g stroke-width="6" stroke-linecap="round">
      ${[0,1,2,3,4,5,6].map(i => `<path class="${i < 3 ? 'lit' : ''}" d="M${30 + i * 4} ${14 + i * 13}h${150 - i * 10}"
         stroke="${i < 3 ? '#D4A04A' : '#2A2E3A'}" opacity="${1 - i * 0.07}"/>`).join('')}
    </g>
    <circle class="lit" cx="30" cy="14" r="4" fill="#D4A04A"/>
  </svg>`
};

const labHref = m => LAB_ROOT + m.path;
/* The card's state. 'members' is a module whose code has not been entered on
   this browser: the card is still a link, because the code prompt is on the
   other side of it. */
const labState = m => {
  if(m.status === 'soon') return 'soon';
  try { if(localStorage.getItem('evenant-gate-' + m.gate) === m.hash) return 'open'; } catch(_){}
  return 'members';
};
