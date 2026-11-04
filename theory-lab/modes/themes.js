/* ============================================================================
   SCALES & MODES · THEMES
   ----------------------------------------------------------------------------
   The reharmonizer's material. Three eight-bar themes, written in SCALE
   DEGREES rather than notes, which is the whole reason they can be heard in
   any mode on any root: a melody note is "the fourth degree, an octave up",
   and what that sounds like is the target mode's business.

   A melody note is { deg, oct, s, d }:
     deg   1–7, and beyond — 8 is the octave above the tonic, 0 the seventh
           below it. EvTheory.degreeMidi does the wrapping.
     oct   relative to the theme's own melody octave, so 0 is where it sits.
     s, d  beats from the top of the theme, and length in beats.

   A chord is { deg, s, d } and is NEVER remapped note by note. The progression
   is rebuilt with EvTheory.diatonic in the target mode, so a IV that ought to
   become a ♯iv° becomes one instead of being dragged a semitone.

   Between them the three touch every degree, which is what lets one theme show
   any mode's colour note: 4 for Lydian, 7 for Mixolydian, 6 for Dorian, 2 for
   Phrygian, 5 for Locrian.

   `subs` is a theme's own idiomatic substitutions, keyed by mode and then by
   the degree being replaced. Without one, Idiomatic falls back to the general
   rule in activities.js: a diminished chord the remap created is replaced by
   the mode's first signature chord, except in Locrian, whose tonic is
   diminished and is the point.
   ============================================================================ */

const MODE_THEMES = [
  {
    id:'rise', name:'Rise', home:'ionian', bpm:92, bars:8, beats:4,
    note:'A rising eight bars that touches every degree, so whichever note a mode moves, you hear it move.',
    melodyOctave:4, chordOctave:3,
    melody:[
      { deg:1, oct:0, s:0,  d:2 }, { deg:3, oct:0, s:2,  d:2 },
      { deg:5, oct:0, s:4,  d:3 }, { deg:4, oct:0, s:7,  d:1 },
      { deg:4, oct:0, s:8,  d:2 }, { deg:2, oct:0, s:10, d:2 },
      { deg:3, oct:0, s:12, d:4 },
      { deg:5, oct:0, s:16, d:2 }, { deg:6, oct:0, s:18, d:2 },
      { deg:7, oct:0, s:20, d:2 }, { deg:6, oct:0, s:22, d:2 },
      { deg:5, oct:0, s:24, d:2 }, { deg:4, oct:0, s:26, d:2 },
      { deg:1, oct:1, s:28, d:4 }
    ],
    /* I V IV ii I vi V I in major. In Lydian, literally, the IV turns into a
       ♯iv° — which is the first thing the Lydian lesson asks you to listen to. */
    chords:[
      { deg:1, s:0,  d:4 }, { deg:5, s:4,  d:4 }, { deg:4, s:8,  d:4 }, { deg:2, s:12, d:4 },
      { deg:1, s:16, d:4 }, { deg:6, s:20, d:4 }, { deg:5, s:24, d:4 }, { deg:1, s:28, d:4 }
    ],
    subs:{ lydian:{ 4:2 } }        /* the ♯iv° becomes the II that makes Lydian Lydian */
  },

  {
    id:'lament', name:'Lament', home:'aeolian', bpm:66, bars:8, beats:4,
    note:'Slow and falling, and it leans on the second degree — which is where Phrygian lives.',
    melodyOctave:4, chordOctave:3,
    melody:[
      { deg:5, oct:0, s:0,  d:4 },
      { deg:4, oct:0, s:4,  d:2 }, { deg:3, oct:0, s:6,  d:2 },
      { deg:2, oct:0, s:8,  d:3 }, { deg:1, oct:0, s:11, d:1 },
      { deg:0, oct:0, s:12, d:4 },
      { deg:1, oct:0, s:16, d:2 }, { deg:3, oct:0, s:18, d:2 },
      { deg:5, oct:0, s:20, d:2 }, { deg:6, oct:0, s:22, d:2 },
      { deg:5, oct:0, s:24, d:2 }, { deg:2, oct:0, s:26, d:2 },
      { deg:1, oct:0, s:28, d:4 }
    ],
    chords:[
      { deg:1, s:0,  d:4 }, { deg:4, s:4,  d:4 }, { deg:7, s:8,  d:4 }, { deg:6, s:12, d:4 },
      { deg:1, s:16, d:4 }, { deg:4, s:20, d:4 }, { deg:2, s:24, d:4 }, { deg:1, s:28, d:4 }
    ],
    subs:{ phrygian:{}, locrian:{} }   /* both want their own ii; the general rule handles it */
  },

  {
    id:'pulse', name:'Pulse', home:'dorian', bpm:104, bars:8, beats:4,
    note:'An ostinato and a pad, with a melody that arrives late. The pattern sits on the sixth, which is the degree Dorian raises.',
    melodyOctave:5, chordOctave:3,
    /* Four onsets to the bar, and the sixth on every other one. */
    ostinato:Array.from({ length:8 }, (_, bar) => [
      { deg:1, oct:0, s:bar * 4,     d:1 },
      { deg:5, oct:0, s:bar * 4 + 1, d:1 },
      { deg:6, oct:0, s:bar * 4 + 2, d:1 },
      { deg:5, oct:0, s:bar * 4 + 3, d:1 }
    ]).flat(),
    ostinatoOctave:4,
    melody:[
      { deg:1, oct:0, s:8,  d:3 }, { deg:7, oct:-1, s:11, d:1 },
      { deg:1, oct:0, s:12, d:2 }, { deg:3, oct:0, s:14, d:2 },
      { deg:6, oct:0, s:16, d:4 },
      { deg:5, oct:0, s:20, d:2 }, { deg:3, oct:0, s:22, d:2 },
      { deg:2, oct:0, s:24, d:4 },
      { deg:1, oct:0, s:28, d:4 }
    ],
    chords:[
      { deg:1, s:0,  d:8 }, { deg:4, s:8,  d:8 },
      { deg:1, s:16, d:8 }, { deg:7, s:24, d:4 }, { deg:1, s:28, d:4 }
    ]
  }
];

const themeById = id => MODE_THEMES.find(t => t.id === id) || MODE_THEMES[0];

if(typeof module !== 'undefined' && module.exports) module.exports = { MODE_THEMES, themeById };
