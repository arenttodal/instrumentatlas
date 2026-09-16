/* ============================================================================
   EAR TRAINING · THEME LIBRARY
   ----------------------------------------------------------------------------
   The shared material. Loads before any mode's own data file, after
   atlas-data.js (INSTRUMENTS, FAMILIES, THUMBS).

   Each theme is one short phrase bounced many times from a single project —
   once per instrument for the melody, and for some themes once per inner part
   as well. 48 kHz, 24-bit, identical frame count across a theme, so the parts
   of a theme are aligned by construction and ANY combination of them can be
   layered: that is the whole reason this material exists in this shape, and it
   is why it is not Blend's alone. Blend asks which of them are playing; Layers
   asks what each one is doing; a future mode can ask something else again.

   tools/blend-encode.sh takes each part to the HANDOFF §3 targets and does NOT
   trim, because trimming per file is exactly what would break the alignment.
   Verified after encoding: every file of a theme decodes to the same number of
   frames.

   ── levels ─────────────────────────────────────────────────────────────────
   Every part is normalised on its own to -18 LUFS, so nothing is inaudible and
   nothing has to be re-encoded to change the balance. That is a level playing
   field, not a mix: the inner parts arrive 8–20 dB under the melody and being
   normalised puts a chord pad level with the tune it is supporting. THEME_GAIN
   puts the balance back at playback, where it can be tuned by ear in one place
   instead of baked into 38 files.

   ── offsets are measured, not read off the file names ──────────────────────
   offset is in octaves against the theme's own melody reference: +1 up, 0 as
   written, -1 down. It is only meaningful WITHIN a role — a countermelody is
   different music, so its f0 against the melody says nothing — and only melody
   parts carry one.

   It was measured by tools/blend-pitch.py, which takes f0 by harmonic product
   spectrum at IDENTICAL sample offsets across a theme (the parts are aligned,
   so the same window is the same note in every file) and votes over sixteen
   windows. It is measured because the names lie often enough to matter:

     theme 2  trumpet   named PC_Trumpet_8va, tracks the rest note for note.
                        Renamed to trumpet.aac; it is level.
     theme 2  celesta   named Celeste_8va, plays its own figure rather than
                        doubling the line — mostly an octave under, sometimes in
                        unison, once a fifth away. It states no octave relation
                        at all, so it carries free:true: it sounds, it has to be
                        named, and level 3 does not grade where you put it.
     theme 3  viola     named PC_Vla_Leg_8vb, measures level.
     theme 4  viola     the same. Both renamed to viola.aac.
     theme 3  bassoon   theme 2's bassoon is an octave down and unmarked, so
     theme 4  bassoon   these were expected to be too. Both measure level.
     theme 3  flute     SO_Flute is the written octave in theme 2 and an octave
     theme 4  flute     over it in themes 3 and 4. The two flute parts of a
                        theme are always one octave apart, which is what their
                        names say; where that pair sits is what offset says.

   theme 2 has no bassoon: the render that arrived is digital silence for eight
   seconds and then a fragment. Re-render it and add one line — nothing else
   needs to change.

   ── file names ─────────────────────────────────────────────────────────────
   audio/blend/<theme>/<file>.aac. A melody part is named for its instrument and
   its octave against the theme's other parts FOR THAT INSTRUMENT (flute and
   flute-8va are one octave apart, wherever the pair sits). An inner part is
   prefixed by its role, because a theme can hold an oboe on the tune and
   another on the countermelody.
   ============================================================================ */

const THEME_AUDIO = { base:'../audio/blend/', ext:'aac' };

/* gain is what puts the mix balance back after per-part normalisation; a mode
   that wants every layer equally forward can ignore it and pass 1 */
const THEME_ROLES = [
  { id:'melody',  name:'Melody',        short:'Tune',   gain:1    },
  { id:'counter', name:'Countermelody', short:'Against', gain:0.72 },
  { id:'harmony', name:'Harmony',       short:'Chords', gain:0.55 }
];
const THEME_GAIN = Object.fromEntries(THEME_ROLES.map(r => [r.id, r.gain]));

/* A part is { role, file } plus:
     instrument  an atlas id, when one instrument plays it
     section     a family id instead, when a whole section does (Ens_Strings)
     offset      octaves against the theme's melody reference — melody only
     free        it does not state an octave against the rest, so nothing may
                 grade where you put it
     pair        parts sharing a pair id are one gesture and are always used
                 together, in the same role */
const THEMES = [
  { id:'theme-2', title:'Theme 2', bars:8, seconds:11.52,
    families:['woodwinds','brass','strings','percussion'],
    parts:[
      { role:'melody', instrument:'flute',    offset:+1, file:'flute-8va'    },
      { role:'melody', instrument:'flute',    offset: 0, file:'flute'        },
      { role:'melody', instrument:'oboe',     offset: 0, file:'oboe'         },
      { role:'melody', instrument:'clarinet', offset:-1, file:'clarinet-8vb' },
      { role:'melody', instrument:'trumpet',  offset: 0, file:'trumpet'      },
      { role:'melody', instrument:'horn',     offset:-1, file:'horn-8vb'     },
      { role:'melody', instrument:'violin',   offset:+1, file:'violin-8va'   },
      { role:'melody', instrument:'violin',   offset: 0, file:'violin'       },
      { role:'melody', instrument:'viola',    offset:-1, file:'viola-8vb'    },
      { role:'melody', instrument:'cello',    offset:-1, file:'cello-8vb'    },
      { role:'melody', instrument:'celesta',  offset:-1, file:'celesta', free:true }
    ] },

  { id:'theme-3', title:'Theme 3', bars:8, seconds:11.52,
    families:['woodwinds','brass','strings'],
    parts:[
      { role:'melody', instrument:'flute',    offset:+2, file:'flute-8va'    },
      { role:'melody', instrument:'flute',    offset:+1, file:'flute'        },
      { role:'melody', instrument:'oboe',     offset:+1, file:'oboe-8va'     },
      { role:'melody', instrument:'clarinet', offset: 0, file:'clarinet'     },
      { role:'melody', instrument:'bassoon',  offset: 0, file:'bassoon'      },
      { role:'melody', instrument:'horn',     offset: 0, file:'horn'         },
      { role:'melody', instrument:'violin',   offset:+1, file:'violin-8va'   },
      { role:'melody', instrument:'violin',   offset: 0, file:'violin'       },
      { role:'melody', instrument:'viola',    offset: 0, file:'viola'        },
      { role:'melody', instrument:'cello',    offset:-1, file:'cello-8vb'    }
    ] },

  { id:'theme-4', title:'Theme 4', bars:8, seconds:9.909,
    families:['woodwinds','brass','strings'],
    parts:[
      { role:'melody',  instrument:'flute',    offset:+2, file:'flute-8va'   },
      { role:'melody',  instrument:'flute',    offset:+1, file:'flute'       },
      { role:'melody',  instrument:'oboe',     offset:+1, file:'oboe-8va'    },
      { role:'melody',  instrument:'clarinet', offset: 0, file:'clarinet'    },
      { role:'melody',  instrument:'bassoon',  offset: 0, file:'bassoon'     },
      { role:'melody',  instrument:'violin',   offset:+1, file:'violin-8va'  },
      { role:'melody',  instrument:'violin',   offset: 0, file:'violin'      },
      { role:'melody',  instrument:'violin',   offset: 0, file:'violin-solo' },
      { role:'melody',  instrument:'viola',    offset: 0, file:'viola'       },
      { role:'melody',  instrument:'cello',    offset:-1, file:'cello-8vb'   },
      { role:'counter', instrument:'oboe',   file:'counter-oboe'   },
      { role:'counter', instrument:'violin', file:'counter-violin' },
      { role:'counter', instrument:'cello',  file:'counter-cello'  },
      { role:'harmony', instrument:'clarinet', file:'chord-clarinet' },
      { role:'harmony', instrument:'trombone', file:'chord-trombone' },
      { role:'harmony', section:'strings',     file:'chord-strings'  }
    ] },

  /* Horn and tuba are one gesture here and are always used together. */
  { id:'theme-5', title:'Theme 5', bars:8, seconds:9.6,
    families:['woodwinds','brass','strings'],
    parts:[
      { role:'melody',  instrument:'flute',    offset:+1, file:'flute-8va' },
      { role:'melody',  instrument:'oboe',     offset:+1, file:'oboe-8va'  },
      { role:'melody',  instrument:'clarinet', offset: 0, file:'clarinet'  },
      { role:'counter', instrument:'violin', file:'counter-violin' },
      { role:'harmony', instrument:'horn', file:'chord-horn', pair:'brass' },
      { role:'harmony', instrument:'tuba', file:'chord-tuba', pair:'brass' },
      { role:'harmony', section:'strings', file:'chord-strings' }
    ] }
];

/* clip ids are "<theme>/<file>", which is both the url and a cache key that
   cannot collide between themes */
const themeClip = (theme, file) => `${theme}/${file}`;
const themeSrc  = clip => `${THEME_AUDIO.base}${clip}.${THEME_AUDIO.ext}`;
const themeById = id => THEMES.find(t => t.id === id);
const partsOf   = (theme, role) => theme.parts.filter(p => p.role === role);

/* what to call a part and what to show for it: an instrument card, or the
   section's own name when a whole section plays it */
const partId   = p => p.instrument || ('section-' + p.section);
const partName = p => p.instrument
  ? ((typeof INSTRUMENTS !== 'undefined' && INSTRUMENTS[p.instrument] && INSTRUMENTS[p.instrument].name) || p.instrument)
  : ((typeof FAMILIES !== 'undefined' && (FAMILIES.find(f => f.id === p.section) || {}).name) || p.section);
