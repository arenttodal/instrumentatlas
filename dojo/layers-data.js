/* ============================================================================
   EAR TRAINING · LAYERS · DATA
   ----------------------------------------------------------------------------
   Loads after atlas-data.js (for THUMBS and INSTRUMENTS) and before layers.js.

   MOCKUP AUDIO. Every exercise below is a real passage from Valley Sunrise,
   played from the stems the score viewer already ships, and the answer key is
   lifted from valley-sunrise-app/annotations.json — the role annotations
   written for that piece. Nothing here is invented: if the answer key says the
   horn is playing counter-melody in bars 8–17, that is because the annotation
   says so and you can hear it in the score viewer.

   Three roles rather than the five the annotations use. `texture` and `rhythm`
   are real jobs, but they make a four- or five-column sorting task, and the
   question being mocked up is the three-layer one. So exercises are chosen
   from the sections whose stems fall into exactly melody / counter / harmony,
   and the stems doing something else simply are not in the mix. Adding a
   fourth column later is an entry in LAYER_ROLES and a wider exercise.
   ============================================================================ */

const LAYER_AUDIO = { base:'../valley-sunrise-app/audio/scores/valley-sunrise/', ext:'aac' };

/* Valley Sunrise, from score.json. Bars are 1-indexed and `to` is exclusive,
   the same convention the score viewer uses. */
const LAYER_PIECE = { title:'Valley Sunrise', composer:'Arn Andersson', tempo:136.089, beats:4 };
const secPerBar = () => LAYER_PIECE.beats * 60 / LAYER_PIECE.tempo;
const barTime   = bar => (bar - 1) * secPerBar();

/* Role colours are the score view's, from HANDOFF §2: one accent then
   neutrals, a hierarchy rather than three competing hues. */
const LAYER_ROLES = [
  { id:'melody',  name:'Melody',        hint:'The tune',               colour:'#D4A04A' },
  { id:'counter', name:'Countermelody', hint:'Answers the tune',       colour:'#C6A97C' },
  { id:'harmony', name:'Harmony',       hint:'Holds the chord up',     colour:'#6E8FB8' }
];

/* A stem is a group, not always a single instrument, so `icon` names the atlas
   thumbnail that best stands for it. Choir has no instrument page and so no
   thumbnail; it gets the one drawn below. */
const CHOIR_ICON = `<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85">
  <circle cx="20" cy="14" r="5"/><path d="M11 33c0-5 4-9 9-9s9 4 9 9"/>
  <circle cx="8" cy="22" r="3.6"/><path d="M2 37c0-4 2.7-7 6-7"/>
  <circle cx="32" cy="22" r="3.6"/><path d="M38 37c0-4-2.7-7-6-7"/>
  <path d="M11 33v8M29 33v8M2 37v5M38 37v5" opacity=".5"/></svg>`;

const LAYER_STEMS = {
  'violin-1': { name:'Violin I',          family:'strings',    icon:'violin' },
  'violin-2': { name:'Violin II',         family:'strings',    icon:'violin' },
  'strings':  { name:'String beds',       family:'strings',    icon:'viola' },
  'cello':    { name:'Cello',             family:'strings',    icon:'cello' },
  'bass':     { name:'Double Bass',       family:'strings',    icon:'double-bass' },
  'flute':    { name:'Flutes',            family:'woodwinds',  icon:'flute' },
  'reeds':    { name:'Oboe & Clarinet',   family:'woodwinds',  icon:'oboe' },
  'horn':     { name:'Horns',             family:'brass',      icon:'horn' },
  'lowbrass': { name:'Trombones & Tuba',  family:'brass',      icon:'trombone' },
  'trumpet':  { name:'Trumpet',           family:'brass',      icon:'trumpet' },
  'choir':    { name:'Choir',             family:'choir',      svg:CHOIR_ICON }
};

/* Straight out of annotations.json. `from`/`to` are the annotation's own bar
   numbers, so an exercise can be checked against the score viewer by ear. */
const LAYER_EXERCISES = [
  {
    id:'first-theme', section:'First theme', from:8, to:17,
    answers:{ reeds:'melody', horn:'counter', strings:'harmony', cello:'harmony', bass:'harmony' }
  },
  {
    id:'first-wave', section:'First wave', from:25, to:31,
    answers:{ 'violin-1':'melody', 'violin-2':'melody', flute:'counter', choir:'harmony', horn:'harmony' }
  },
  {
    id:'second-build', section:'Second build', from:47, to:56,
    answers:{ 'violin-1':'melody', horn:'counter', lowbrass:'harmony', choir:'harmony' }
  }
];

const layerStemSrc = id => `${LAYER_AUDIO.base}${id}.${LAYER_AUDIO.ext}`;
const layerStemIcon = id => {
  const s = LAYER_STEMS[id];
  if(!s) return '';
  return s.svg || (typeof THUMBS !== 'undefined' && THUMBS[s.icon]) || '';
};
