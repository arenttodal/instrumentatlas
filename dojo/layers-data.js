/* ============================================================================
   EAR TRAINING · LAYERS · DATA
   ----------------------------------------------------------------------------
   Loads after atlas-data.js (for THUMBS and INSTRUMENTS) and themes.js, before
   layers.js.

   Every exercise is purpose-made material. Themes 4 and 5 were bounced with
   their countermelody and chord parts as well as their melody, so naming the
   parts an exercise uses IS the answer key — the role of each is the part's
   own, in themes.js, and cannot drift out of step with the audio.

   Three roles. A real score has more — texture and rhythm are jobs too — but
   they make a four- or five-column sorting task, and this is the three-layer
   question. A fourth column later is an entry in LAYER_ROLES and parts that
   carry that role.
   ============================================================================ */

/* Role colours are the score view's, from HANDOFF §2: one accent then
   neutrals, a hierarchy rather than three competing hues. */
const LAYER_ROLES = [
  { id:'melody',  name:'Melody',        hint:'The tune',         colour:'#D4A04A' },
  { id:'counter', name:'Countermelody', hint:'Answers the tune', colour:'#C6A97C' },
  { id:'harmony', name:'Harmony',       hint:'Holds the chord up', colour:'#6E8FB8' }
];

/* a whole section has no instrument page, so it borrows the thumbnail of the
   instrument that best stands for it */
const LAYER_SECTION_ICON = { strings:'viola', woodwinds:'flute', brass:'horn', percussion:'timpani' };
const layerPartIcon = p => (typeof THUMBS !== 'undefined' &&
  THUMBS[p.instrument || LAYER_SECTION_ICON[p.section]]) || '';

/* `use` names parts by file. Parts sharing a pair id (theme 5's horn and tuba
   are one gesture) arrive as a single card and are placed together, which is
   the only way they are ever used. Easiest first: three cards, then four, then
   five. */
const LAYER_EXERCISES = [
  { id:'t4-a', theme:'theme-4', section:'Theme 4',
    use:['violin', 'counter-oboe', 'chord-trombone'] },
  { id:'t5-a', theme:'theme-5', section:'Theme 5',
    use:['clarinet', 'counter-violin', 'chord-horn', 'chord-strings'] },
  { id:'t5-b', theme:'theme-5', section:'Theme 5, scored up',
    use:['flute-8va', 'oboe-8va', 'counter-violin', 'chord-strings'] },
  { id:'t4-b', theme:'theme-4', section:'Theme 4, scored up',
    use:['flute-8va', 'violin-8va', 'counter-cello', 'chord-trombone', 'chord-strings'] },
  { id:'t4-c', theme:'theme-4', section:'Theme 4, inner parts',
    use:['oboe-8va', 'viola', 'counter-violin', 'chord-clarinet', 'chord-strings'] }
];
