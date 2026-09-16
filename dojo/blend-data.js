/* ============================================================================
   EAR TRAINING · BLEND · DATA
   ----------------------------------------------------------------------------
   Loads after atlas-data.js (for THUMBS and INSTRUMENTS) and before blend.js.

   MOCKUP AUDIO — the Studio's own passage, and it fits this question almost
   suspiciously well. PASSAGES['theme-1'] is seven bars at 73 bpm, described in
   atlas-data.js as "Horn melody with octave doublings", and its three tracks
   carry exactly the roles this mode is about:

     horn   role 'Melody'         four section sizes: solo, 4, 6, 12
     flute  role 'Doubling, 8va'  solo
     cello  role 'Doubling, 8vb'  solo, and a section

   All three are renders of the same seven bars from the same project, which is
   the only reason they can be layered: HANDOFF §3 — anything compared or
   layered must be the same passage, same tempo, same length, same start
   offset, or the misalignment reads as a flam and gets blamed on the library.

   THE QUESTION. The horn always has the tune. Something is doubling it an
   octave above, or an octave below, or both, or nothing is — and a doubling
   that is doing its job is not separately audible, which is what makes this a
   blend question rather than a naming one. You are being asked what the colour
   is made of, not what you can pick out of it.

   Four answers, and the scoring underneath them varies: a different horn
   section size and a different cello weight each time, so the same answer is
   never the same clip twice.
   ============================================================================ */

const BLEND_AUDIO = { base:'../audio/theme-1/', ext:'aac' };
const BLEND_PIECE = { title:'Theme 1', bars:7, tempo:73, beats:4 };

/* The three voices. `id` is the voice; `parts` are the renders of it. */
const BLEND_VOICES = {
  horn:  { instrument:'horn',  label:'Horn',  role:'Melody',
           parts:{ '1':'horn_1', '4':'horn_4', '6':'horn_6', '12':'horn_12' } },
  flute: { instrument:'flute', label:'Flute', role:'Doubling, 8va',
           parts:{ '1':'flute_1' } },
  cello: { instrument:'cello', label:'Cello', role:'Doubling, 8vb',
           parts:{ '1':'cello_1', 'ens':'cello_ens' } }
};

/* The four answers. `adds` is what joins the horn — the horn is in every mix,
   because it is the thing being doubled. */
const BLEND_ANSWERS = [
  { id:'none',  adds:[],                 name:'Horn alone',      note:'Nothing doubling it' },
  { id:'flute', adds:['flute'],          name:'Flute above',     note:'Doubled an octave up' },
  { id:'cello', adds:['cello'],          name:'Cello below',     note:'Doubled an octave down' },
  { id:'both',  adds:['flute','cello'],  name:'Flute and cello', note:'Doubled above and below' }
];

/* What the scoring can vary between questions. Both ends of the horn range are
   in here deliberately: a solo horn and twelve horns are different colours
   before anything doubles them, and a learner who has only heard one of them
   has not learned the instrument. */
const BLEND_SIZES = { horn:['1','4','6','12'], cello:['1','ens'], flute:['1'] };

/* A clip id is voice:part — 'horn:4' — which is what the engine's srcOf takes
   and what the node registry keys on, so two mixes sharing the horn share one
   node and it never dips when you switch between them. */
const blendClip  = (voice, part) => `${voice}:${part}`;
const blendSrc   = id => {
  const [voice, part] = id.split(':');
  return `${BLEND_AUDIO.base}${BLEND_VOICES[voice].parts[part]}.${BLEND_AUDIO.ext}`;
};
const blendIcon  = voice => (typeof THUMBS !== 'undefined' && THUMBS[BLEND_VOICES[voice].instrument]) || '';
const blendAnswer = id => BLEND_ANSWERS.find(a => a.id === id) || null;

/* What separates the pair, for the one line under an A/B. One idea each and
   kept short on purpose: this section has been trimmed twice now, and a
   paragraph here would undo that. These are the only six comparisons the four
   answers can produce against each other. */
const BLEND_NOTES = {
  'both|flute':  'The one you missed has the cello underneath as well.',
  'both|cello':  'The other has the flute on top of it as well.',
  'both|none':   'One is bare horn; the other is doubled at both octaves.',
  'cello|flute': 'One brightens the top of the tone, the other weights the bottom.',
  'flute|none':  'Not a second line — the top of the horn getting brighter.',
  'cello|none':  'Not a second line — the bottom of the horn getting heavier.'
};
const blendNote = (a, b) => BLEND_NOTES[[a, b].sort().join('|')] || '';
