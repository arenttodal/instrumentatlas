/* ============================================================================
   EAR TRAINING · BLEND · DATA
   ----------------------------------------------------------------------------
   Loads after atlas-data.js (THUMBS, INSTRUMENTS, FAMILIES, STUDIO_FAM),
   themes.js (THEMES and the rest of the shared material) and dojo-data.js
   (CONFUSIONS), before blend.js.

   Blend asks which instruments are carrying the tune, so it draws on the MELODY
   parts of a theme and leaves the countermelody and chord parts to Layers. That
   is not a limitation of the material but of the question: level 3 asks where
   each instrument sits against the others, which only means something between
   parts playing the same line.
   ============================================================================ */

/* a theme is playable here once it has two melody parts at two octaves */
const BLEND_PASSAGES = THEMES.filter(t => {
  const offs = partsOf(t, 'melody').filter(p => !p.free).map(p => p.offset);
  return new Set(offs).size > 1;
});

const BLEND_LEVELS = [
  { id:1, name:'Level 1', note:'Easier options to choose from',      pool:'few'  },
  { id:2, name:'Level 2', note:'No guidelines — trust your ear',     pool:'all'  },
  { id:3, name:'Level 3', note:'Pick the instrument and its octave', pool:'all', tiers:true }
];

/* Level 3's three rows, named for what they say about each other rather than
   about the score: what is checked is the arrangement, not which row you used,
   so a flute an octave over a horn reads the same in the top two rows as in the
   bottom two. See normalise() in blend.js. */
const BLEND_TIERS = [
  { id:'up',   name:'Higher octave', offset:+1 },
  { id:'mid',  name:'Same octave',   offset: 0 },
  { id:'down', name:'Lower octave',  offset:-1 }
];
/* how far apart two parts may sit and still be arrangeable in three rows */
const BLEND_SPAN = BLEND_TIERS.length - 1;

const blendIcon = id => (typeof THUMBS !== 'undefined' && THUMBS[id]) || '';
const blendName = id => (typeof INSTRUMENTS !== 'undefined' && INSTRUMENTS[id] && INSTRUMENTS[id].name) || id;
