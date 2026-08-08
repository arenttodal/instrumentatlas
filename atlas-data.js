/* ============================================================================
   INSTRUMENT ATLAS — CONTENT
   ----------------------------------------------------------------------------
   This is the file to edit. Collections, families, instruments, ensemble sizes,
   plate artwork and the video gallery all live here. Nothing in this file knows
   how anything is drawn — atlas.js handles that.
   ============================================================================ */

/* ============================================================================
   1. DATA — everything you edit lives here.
   ------------------------------------------------------------------------
   status: 'live'  = has a full page
           'plan'  = shows in menus, greyed, no page yet
   range:  MIDI note numbers (60 = middle C). timbre: 0 = dark … 1 = bright
   ============================================================================ */

const COLLECTION = {
  id:'orchestral', name:'Orchestral',
  title:['The instruments of', 'the orchestra'],
  lede:'Every instrument in the orchestra — how it sounds, where it sits, what it blends with, and where it stops. Built as a working reference for composers, not a museum catalogue.'
};

/* Six ensemble tiers, used by every family page.
   Counts are drawn from standard practice and from named scores:
   chamber strings 4-3-3-2-1 … 6-5-4-4-2; symphonic 12-10-8-6-4 … 16-14-12-10-8;
   Classical period = paired winds, 2–4 horns, 2 trumpets, timpani;
   maximum tier follows Schoenberg's Gurrelieder (20-20-16-16-12 strings, 10 horns). */
const TIERS = [
  {id:'quartet',  label:'Quartet / Quintet', tick:'Quartet',  players:'4–5',    era:'Chamber music'},
  {id:'chamber',  label:'Chamber orchestra', tick:'Chamber',  players:'25–40',  era:'Sinfonietta, baroque revival'},
  {id:'classical',label:'Classical orchestra',tick:'Classical',players:'35–45', era:'Haydn, Mozart'},
  {id:'romantic', label:'Romantic orchestra',tick:'Romantic', players:'65–80',  era:'Brahms, Tchaikovsky'},
  {id:'symphony', label:'Full symphony',     tick:'Symphony', players:'90–100', era:'Stravinsky, Strauss, film scoring'},
  {id:'maximum',  label:'Maximum forces',    tick:'Maximum',  players:'120+',   era:'Mahler 8, Gurrelieder'}
];

const FAMILIES = [
  { id:'strings', plate:'Plate I', name:'Strings', tagline:'The bread and butter',
    lede:'The most versatile family in the orchestra — staccato chase scenes, sweeping romantic themes, harmonic beds, rhythmic accents. Usually where a symphonic piece begins.',
    role:[
      '<b>Pitch flexibility.</b> Any pitch in range, including microtones and glissandi.',
      '<b>No breathing.</b> Sustained lines can run indefinitely.',
      '<b>Speed and dexterity.</b> Fast runs, scales and arpeggios sit comfortably.',
      '<b>Multiple notes at once.</b> Double and triple stops, within limits.',
      '<b>Range shapes colour.</b> Dark and warm below, bright and penetrating above.'
    ],
    smallName:'String quartet',
    sizes:{
      violin:       ['1 + 1','6 + 5','8 + 6','12 + 10','16 + 14','20 + 20'],
      viola:        [1, 4, 4, 8, 12, 16],
      cello:        [1, 3, 3, 6, 10, 16],
      'double-bass':[0, 1, 2, 4, 8, 12],
      harp:         [0, 0, 0, 1, 1, 2]
    },
    members:['violin','viola','cello','double-bass','harp'] },

  { id:'woodwinds', plate:'Plate II', name:'Woodwinds', tagline:'The overlooked colours',
    lede:'Beautiful and versatile, and routinely forgotten in modern epic writing. Learn to write for them and you add depth and character that staccato strings and choir cannot reach.',
    role:[
      '<b>Two mechanisms.</b> Edge-tone flutes, and reeds — single (clarinet) or double (oboe, bassoon).',
      '<b>Fast and intricate.</b> Runs and arpeggios are idiomatic, not a stretch.',
      '<b>One note at a time.</b> Monophonic, but arpeggios cover harmonic ground.',
      '<b>Breath is structural.</b> Phrases need rests, or the mockup stops sounding human.'
    ],
    smallName:'Wind quintet (with one horn)',
    sizes:{
      piccolo: [0, 0, 0, 1, 1, 4],
      flute:   [1, 2, 2, 2, 3, 4],
      oboe:    [1, 2, 2, 2, 3, 5],
      clarinet:[1, 2, 2, 2, 3, 7],
      bassoon: [1, 2, 2, 2, 3, 5]
    },
    members:['piccolo','flute','oboe','clarinet','bassoon'] },

  { id:'brass', plate:'Plate III', name:'Brass', tagline:'The powerhouse',
    lede:'Melodies that carry, chords that feel immense, and enough weight to cover the whole orchestra at will. With that power comes the responsibility to balance it.',
    role:[
      '<b>Lips, not reeds.</b> Pitch comes from lip tension and air pressure — higher usually means louder.',
      '<b>Bore shapes tone.</b> Cylindrical (trumpet, trombone) is bright and penetrating; conical (horn) is mellow and round.',
      '<b>Breathing is non-negotiable.</b> Continuous melodies need breaks written in.',
      '<b>Fast runs fight the mechanics.</b> Especially on trombone.'
    ],
    smallName:'Brass quintet',
    sizes:{
      trumpet:  [2, 2, 2, 3, 4, 6],
      horn:     [1, 2, 2, 4, 6, 10],
      trombone: [1, 0, 0, 3, 4, 6],
      tuba:     [1, 0, 0, 1, 1, 2]
    },
    members:['trumpet','horn','trombone','tuba'] },

  { id:'percussion', plate:'Plate IV', name:'Percussion', tagline:'Rhythm and dramatic flair',
    lede:'Struck, shaken or scraped — the family with the widest dynamic range in the orchestra, and the one most easily overused.',
    role:[
      '<b>Pitched or unpitched.</b> Timpani, glockenspiel and celesta carry pitch; snare, bass drum and cymbals do not.',
      '<b>Timing is everything.</b> Ten milliseconds late reads as a mistake in a way a string entry never does.',
      '<b>One player, many instruments.</b> Parts move between instruments constantly.'
    ],
    smallName:'No standard orchestral grouping at this size',
    sizes:{
      timpani:      [0, 1, 1, 1, 1, 2],
      cymbals:      [0, 0, 0, 1, 1, 2],
      'snare-drum': [0, 0, 0, 1, 1, 2],
      'bass-drum':  [0, 0, 0, 1, 1, 2],
      gong:         [0, 0, 0, 0, 1, 1],
      celesta:      [0, 0, 0, 0, 1, 1]
    },
    members:['timpani','cymbals','snare-drum','bass-drum','gong','celesta'] }
];

const INSTRUMENTS = {
  /* ---------- LIVE ---------- */
  flute:{
    family:'woodwinds', plate:'Plate II · 2', name:'Flute', latin:'Flauto traverso',
    epithet:'Round, warm, and quietly everywhere', status:'live',
    summary:'An edge-tone instrument with a rich, full middle range and a brilliant, penetrating top. Equally effective carrying a solo line and doubling violins — which is where you will hear it most often without noticing it.',
    range:{lo:60, hi:96, note:'C4 – C7', transposition:'Non-transposing'},
    timbre:0.72,
    facts:[['Sounding range','C4 – C7'],['Section size','2–4','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'C4 – G4', text:'Breathy and easily buried. Beautiful exposed and soft, useless under a loud texture.'},
      {label:'Middle register', pitch:'A4 – D6', text:'Rich and full — the workhorse range for melodies and for doubling.'},
      {label:'High register', pitch:'E6 – C7', text:'Brilliant and penetrating. Cuts through a tutti, tiring over long stretches.'}
    ],
    characteristics:[
      'Adds more high-end overtones as air pressure increases, though the dynamic contrast is subtler than brass.',
      'Fast runs and arpeggios are entirely idiomatic — this is what woodwinds are for.',
      'Monophonic. Harmony has to come from arpeggiation or from a second player.',
      'Needs rests to breathe. Phrases written without them read as synthetic immediately.'
    ],
    articulations:['Legato','Staccato','Flutter tongue','Trills','Runs','Harmonics'],
    blends:[
      {id:'violin', label:'Violins in octaves', note:'Very common — adds air to the string line'},
      {id:'oboe', label:'Oboe', note:'Mellows the reed edge'},
      {id:'clarinet', label:'Clarinet', note:'Warmer, fuller combined tone'},
      {id:'piccolo', label:'Piccolo an octave up', note:'Brightens the whole line'}
    ],
    limits:[
      'The low register will not compete. Do not hand it a melody under a full ensemble.',
      'Doubling a soft flute with a trumpet clashes — group by tone colour, not by range.',
      'Long unbroken lines expose the mockup. Write the breath in.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:18'},
      {label:'With violins in octaves', note:'The doubling, isolated then in context', dur:'0:15'}
    ],
    prev:'piccolo', next:'oboe'
  },

  horn:{
    family:'brass', plate:'Plate III · 2', name:'Horn', latin:'Corno / French horn',
    model:'horn',
    epithet:'The brass instrument that behaves like a woodwind', status:'live',
    summary:'Conical bore, which makes it mellow and round where trumpets and trombones are bright and penetrating. The reason it blends with woodwinds and cellos as happily as with its own family — and the reason heroic themes keep landing on it.',
    range:{lo:41, hi:77, note:'F2 – F5 sounding', transposition:'In F — written a fifth higher'},
    timbre:0.40,
    facts:[['Sounding range','F2 – F5'],['Section size','4–8','players'],['Transposition','In F']],
    registers:[
      {label:'Low register', pitch:'F2 – C3', text:'Very mellow. Works beautifully for calm passages, weak under pressure.'},
      {label:'Middle register', pitch:'D3 – C4', text:'Full and singing — the heroic range, and the one to write themes in.'},
      {label:'High register', pitch:'D4 – F5', text:'Intense and bright, but still round compared to any other brass. Hard to play quietly.'}
    ],
    characteristics:[
      'Pitch comes from lip tension and air pressure, so high and loud are physically linked.',
      'Conical bore gives a mellow, warm tone that sits between brass and woodwind.',
      'Sustained lines need written breaks — brass players cannot circular-breathe a phrase.',
      'Complex fast runs fight the mechanics. Write lines, not passagework.'
    ],
    articulations:['Legato','Marcato','Staccato','Stopped','Rips','Flutter tongue'],
    blends:[
      {id:'cello', label:'Cello in unison', note:'The classic warm-melody pairing'},
      {id:'clarinet', label:'Woodwinds', note:'Horn glues the woodwind chord together'},
      {id:'viola', label:'Strings', note:'Adds brass richness without brass edge'},
      {id:'bassoon', label:'Bassoon', note:'Takes the metallic edge off the low brass'}
    ],
    limits:[
      'Quiet playing in the upper register is genuinely difficult. Do not write pp high horn lines casually.',
      'Eight horns in unison will bury the rest of the orchestra. Balance deliberately.',
      'Written a fifth above sounding pitch — irrelevant for mockups, essential the moment you print parts.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Register comparison', note:'Mellow low, singing middle, intense high', dur:'0:18'},
      {label:'With cello in unison', note:'The blend that made the pairing standard', dur:'0:15'}
    ],
    prev:'trumpet', next:'trombone'
  },

  cello:{
    family:'strings', plate:'Plate I · 3', name:'Cello', latin:'Violoncello',
    model:'cello',
    epithet:'Tenor voice, bass foundation, both at once', status:'live',
    summary:'The tenor and bass instrument of the violin family. Full and rich down low, lyrical and singing up high — which is why it doubles basses for weight in one bar and carries the counter-melody in the next.',
    range:{lo:36, hi:81, note:'C2 – A5', transposition:'Non-transposing'},
    timbre:0.35,
    facts:[['Sounding range','C2 – A5'],['Section size','10','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'C2 – G3', text:'Warm and full. Doubling the basses in octaves here is standard practice.'},
      {label:'Middle register', pitch:'A3 – D4', text:'The singing range. Counter-melodies live here without crowding the violins.'},
      {label:'High register', pitch:'E4 – A5', text:'Brighter and lyrical — thin enough to sound like a soloist even in section.'}
    ],
    characteristics:[
      'Any pitch in range, including glissandi and microtones.',
      'Sustains indefinitely — no breathing to write around.',
      'Fast runs, scales and arpeggios all sit well.',
      'Double and triple stops available, within the limits of the hand.'
    ],
    articulations:['Arco','Pizzicato','Legato','Staccato','Marcato','Con sordino','Glissando'],
    blends:[
      {id:'horn', label:'Horn in unison', note:'Warmth plus brass body'},
      {id:'bassoon', label:'Bassoon', note:'Deepens and darkens the line'},
      {id:'clarinet', label:'Clarinet', note:'Adds mellow woodwind roundness'},
      {id:'harp', label:'Pizzicato with harp', note:'Plucked attack, sustained ring'}
    ],
    limits:[
      'Not a keyboard patch. Split the section into real voices or it will sound like a string preset.',
      'Extreme high register is exposed and unforgiving for less experienced players.',
      'Doubling basses at the unison muddies; octaves keep the bottom clear.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Arco vs pizzicato', note:'The same figure, both articulations', dur:'0:14'},
      {label:'With horn in unison', note:'Where the two timbres fuse', dur:'0:15'}
    ],
    prev:'viola', next:'double-bass'
  },

  violin:{
    family:'strings', plate:'Plate I · 1', name:'Violin', latin:'Violino',
    epithet:'The voice the orchestra is built around', status:'live',
    summary:'The smallest and highest of the family, and the most numerous instrument on stage — thirty or more of them in a full orchestra, split into two sections. Almost every symphonic texture is organised around what the violins are doing.',
    range:{lo:55, hi:100, note:'G3 – E7', transposition:'Non-transposing'},
    timbre:0.78,
    facts:[['Sounding range','G3 – E7'],['Section size','16 + 14','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'G3 – D4', text:'The G string — dark, thick and surprisingly weak. Soloists love it; in section it disappears under almost anything.'},
      {label:'Middle register', pitch:'E4 – D5', text:'Warm and even. Where most melodic writing sits, and where a section blends into one voice rather than many.'},
      {label:'High register', pitch:'E5 – E7', text:'Brilliant and soaring, and above roughly B6 increasingly thin and strained. Sixteen violins in unison up here is the loudest sound in the string section.'}
    ],
    characteristics:[
      'Divided into firsts and seconds, which can play in unison for weight or split for harmony.',
      'Four strings tuned in fifths — G, D, A, E — and each has an audibly different character.',
      'Fast passagework, leaps and string crossings are all idiomatic.',
      'Divisi splits a section into further parts, at the cost of thinning each one.'
    ],
    articulations:['Arco','Pizzicato','Legato','Spiccato','Staccato','Tremolo','Sul ponticello','Harmonics','Con sordino'],
    blends:[
      {id:'flute', label:'Flute in octaves', note:'Air and shimmer on top of the line'},
      {id:'viola', label:'Violas in octaves', note:'Thickens without changing colour'},
      {id:'oboe', label:'Oboe in unison', note:'Adds edge and definition'},
      {id:'harp', label:'Harp', note:'Plucked attack under sustained bowing'}
    ],
    limits:[
      'The low G string will not carry a melody through a loud texture — give it to violas or cellos instead.',
      'Sustained writing above B6 tires players and turns shrill; use it for a moment, not a phrase.',
      'Too much divisi and the section stops sounding like a section.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'String by string', note:'The same figure on G, D, A and E', dur:'0:20'},
      {label:'Section vs solo', note:'One player, then sixteen', dur:'0:16'}
    ],
    prev:'', next:'viola'
  },

  viola:{
    family:'strings', plate:'Plate I · 2', name:'Viola', latin:'Viola',
    epithet:'The inner voice, and the one nobody notices working', status:'live',
    summary:'A fifth below the violin, and darker than the size difference suggests — the body is acoustically too small for its tuning, which is exactly where its throaty, slightly veiled character comes from. Most orchestral writing uses it to fill the middle, where nothing else quite reaches.',
    range:{lo:48, hi:88, note:'C3 – E6', transposition:'Non-transposing'},
    timbre:0.52,
    facts:[['Sounding range','C3 – E6'],['Section size','12','players'],['Notation','Alto clef']],
    registers:[
      {label:'Low register', pitch:'C3 – G3', text:'The C string. Dark, reedy and slightly rough — the sound most people mean when they say "viola".'},
      {label:'Middle register', pitch:'A3 – D5', text:'Warm and covered. Perfect for inner harmony, which is where it spends most of its life.'},
      {label:'High register', pitch:'E5 – E6', text:'Intense and a little strained, in a way that reads as expressive rather than weak. Worth using deliberately.'}
    ],
    characteristics:[
      'Tuned C, G, D, A — a fifth below the violin.',
      'Written in alto clef, moving to treble for high passages.',
      'Same techniques as the violin, marginally slower to speak.',
      'Blends with almost everything, which is why it is so often used as glue.'
    ],
    articulations:['Arco','Pizzicato','Legato','Spiccato','Staccato','Tremolo','Harmonics','Con sordino'],
    blends:[
      {id:'clarinet', label:'Clarinet', note:'Two covered timbres that fuse completely'},
      {id:'horn', label:'Horn', note:'Adds body to a mid-register line'},
      {id:'cello', label:'Cellos in octaves', note:'The standard warm middle-and-low pairing'},
      {id:'trumpet', label:'Trumpet', note:'Bright over dark; the viola takes the edge off'}
    ],
    limits:[
      'Twelve violas will not project over full brass. It is a supporting colour, not a competing one.',
      'Exposed high writing is unforgiving — beautiful when it works, painful when it does not.',
      'Do not simply write violin parts a fifth lower; the register changes what sits well.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Against the violin', note:'The same line on both, back to back', dur:'0:16'},
      {label:'With clarinet', note:'Where the two timbres become one', dur:'0:14'}
    ],
    prev:'violin', next:'cello'
  },

  'double-bass':{
    family:'strings', plate:'Plate I · 4', name:'Double Bass', latin:'Contrabasso',
    epithet:'The floor everything else stands on', status:'live',
    summary:'Not actually a member of the violin family — sloped shoulders and fourths tuning give it away as a descendant of the viol. It sounds an octave lower than written, and doubling the cellos in octaves is so standard that most orchestral bass lines assume it.',
    range:{lo:28, hi:67, note:'E1 – G4 sounding', transposition:'Sounds an octave lower than written'},
    timbre:0.18,
    facts:[['Sounding range','E1 – G4'],['Section size','8','players'],['Transposition','Octave below written']],
    registers:[
      {label:'Low register', pitch:'E1 – A1', text:'Felt more than heard. Pitch definition is poor down here, which is why the cello octave above matters so much.'},
      {label:'Middle register', pitch:'B1 – D3', text:'The working range. Dark, woody and clear enough to carry an actual line.'},
      {label:'High register', pitch:'E3 – G4', text:'Thin and strained, and unmistakably expressive — a solo bass up here sounds like nothing else in the orchestra.'}
    ],
    characteristics:[
      'Tuned in fourths — E, A, D, G — unlike the rest of the family.',
      'Many instruments have a low C extension, reaching a fourth below the open E.',
      'Slow to speak: attacks need time, and fast passagework muddies quickly.',
      'Pizzicato is enormous and decays slowly, which is half of its use in film scoring.'
    ],
    articulations:['Arco','Pizzicato','Legato','Staccato','Marcato','Tremolo','Harmonics','Con sordino'],
    blends:[
      {id:'cello', label:'Cello in octaves', note:'The standard bass line; the cello supplies the pitch clarity'},
      {id:'bassoon', label:'Bassoon', note:'Woody reinforcement of the fundamental'},
      {id:'tuba', label:'Tuba', note:'Weight, at the cost of definition'},
      {id:'timpani', label:'Timpani', note:'Attack under sustained bass'}
    ],
    limits:[
      'Fast runs in the bottom octave turn to mud. Simplify the bass line and let the cellos carry the detail.',
      'Doubling cellos in unison rather than octaves wastes both. Octaves keep the bottom clear.',
      'Remember the transposition when you print parts — written E1 sounds E0, below the piano.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Arco vs pizzicato', note:'Sustained, then plucked', dur:'0:14'},
      {label:'With cello in octaves', note:'Why the pairing is standard', dur:'0:16'}
    ],
    prev:'cello', next:'harp'
  },

  harp:{
    family:'strings', plate:'Plate I · 5', name:'Harp', latin:'Arpa',
    epithet:'Diatonic by design, chromatic only with planning', status:'live',
    summary:'Forty-seven strings and seven pedals, each pedal controlling every octave of one note name. That single mechanical fact governs everything you can and cannot write for it — the harp is not a keyboard you pluck, and treating it as one is the most common mistake in orchestral writing.',
    range:{lo:24, hi:103, note:'C1 – G7', transposition:'Non-transposing'},
    timbre:0.60,
    facts:[['Sounding range','C1 – G7'],['Section size','1–2','players'],['Pedals','7 · three positions']],
    registers:[
      {label:'Low register', pitch:'C1 – B2', text:'Wire strings, long decay, considerable weight. Sparse writing here reads as enormous.'},
      {label:'Middle register', pitch:'C3 – B5', text:'Gut strings, warm and singing. Where glissandi and arpeggiated figures live.'},
      {label:'High register', pitch:'C6 – G7', text:'Bright, short and bell-like. Cuts through a full orchestra at surprisingly low dynamics.'}
    ],
    characteristics:[
      'Each of the seven pedals sets one note name to flat, natural or sharp across all octaves.',
      'A glissando is whatever the pedals are currently set to — you choose the scale by setting pedals in advance.',
      'Ten fingers, but only eight usable for chords; the little fingers are not used.',
      'Notes ring until damped, so dense writing turns into a wash very quickly.'
    ],
    articulations:['Glissando','Arpeggio','Harmonics','Près de la table','Bisbigliando','Damped','Pedal slides'],
    blends:[
      {id:'flute', label:'Flute', note:'The classic pairing — air over plucked attack'},
      {id:'cello', label:'Pizzicato strings', note:'Two plucked colours, one sustaining longer'},
      {id:'celesta', label:'Celesta', note:'Doubling makes both sound larger and stranger'},
      {id:'violin', label:'Violins', note:'Harp supplies attack the bowed line lacks'}
    ],
    limits:[
      'Chromatic passages are hard or impossible — pedals take time and the player needs bars, not beats, to reset.',
      'Repeated notes are awkward; the same string cannot be replucked quickly and cleanly.',
      'Write pedal changes into rests, or ask a harpist. This is the section where composers most often write the unplayable.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Glissando, three tunings', note:'The same sweep with different pedal settings', dur:'0:18'},
      {label:'With flute', note:'The pairing that defines the colour', dur:'0:14'}
    ],
    prev:'double-bass', next:''
  },

  /* ---------- PLANNED (menu only) ---------- */
  piccolo:{family:'woodwinds',name:'Piccolo',status:'plan',range:{lo:74,hi:108},timbre:0.95},
  oboe:{family:'woodwinds',name:'Oboe',status:'plan',range:{lo:58,hi:91},timbre:0.80},
  clarinet:{family:'woodwinds',name:'Clarinet',status:'plan',range:{lo:50,hi:91},timbre:0.55},
  bassoon:{family:'woodwinds',name:'Bassoon',status:'plan',range:{lo:34,hi:75},timbre:0.30},
  trumpet:{family:'brass',name:'Trumpet',status:'plan',range:{lo:54,hi:82},timbre:0.88},
  trombone:{family:'brass',name:'Trombone',status:'plan',range:{lo:40,hi:72},timbre:0.66},
  tuba:{family:'brass',name:'Tuba',status:'plan',range:{lo:26,hi:65},timbre:0.20},
  timpani:{family:'percussion',name:'Timpani',status:'plan',range:{lo:29,hi:53},timbre:0.22},
  cymbals:{family:'percussion',name:'Cymbals',status:'plan',range:{lo:60,hi:96},timbre:0.92},
  'snare-drum':{family:'percussion',name:'Snare Drum',status:'plan',range:{lo:58,hi:80},timbre:0.85},
  'bass-drum':{family:'percussion',name:'Bass Drum',status:'plan',range:{lo:24,hi:40},timbre:0.10},
  gong:{family:'percussion',name:'Gong',status:'plan',range:{lo:30,hi:60},timbre:0.45},
  celesta:{family:'percussion',name:'Celesta',status:'plan',range:{lo:60,hi:96},timbre:0.86}
};


/* ============================================================================
   GALLERY — shared placeholder set. Swap per instrument later via
   INSTRUMENTS[id].gallery = ['videoId', ...]; these are all official
   orchestra / label channel uploads, embedded through YouTube's own player
   with attribution and a link back to the source.
   ============================================================================ */
const GALLERY = [
  {v:'9aDEq3u5huA', title:'Beethoven — Symphony No. 5', perf:'Berliner Philharmoniker · Herbert von Karajan', why:'The most famous motif in music, developed for four movements', chan:'Berliner Philharmoniker'},
  {v:'a9UApyClFKA', title:'Beethoven — Symphony No. 5 (complete)', perf:'Concertgebouworkest · Iván Fischer', why:'A modern reading, filmed close enough to watch the sections work', chan:'Concertgebouworkest'},
  {v:'P_1N6_O254g', title:'Dvořák — Symphony No. 9, "From the New World"', perf:'Berliner Philharmoniker · Herbert von Karajan', why:'The cor anglais Largo — woodwind as the emotional centre', chan:'Berliner Philharmoniker'},
  {v:'pGdtkUiKaA8', title:'Dvořák — Symphony No. 9, IV. Allegro con fuoco', perf:'Wiener Philharmoniker', why:'Brass fanfare writing, and how the horns carry a hall', chan:'Wiener Philharmoniker'},
  {v:'hvPlV56VtFs', title:'Dvořák — Symphony No. 9 (full performance)', perf:'Cristian Măcelaru, conductor', why:'Full-length, useful for following orchestration across a whole arc', chan:'Official concert upload'},
  {v:'8UfpgT9FMAk', title:'Holst — The Planets: Mars, the Bringer of War', perf:'Berliner Philharmoniker · Herbert von Karajan', why:'The col legno ostinato against sustained brass — two layers, total clarity', chan:'Universal Music Group'},
  {v:'sHsFIv8VA7w', title:'Mahler — Symphony No. 2, "Resurrection"', perf:'Concertgebouworkest · Mariss Jansons', why:'Extremes of dynamic range, from near-silence to full forces', chan:'Concertgebouworkest'},
  {v:'j2Hk2SZGrRY', title:'Mahler — Symphony No. 8, "Symphony of a Thousand"', perf:'Berliner Philharmoniker · Sir Simon Rattle', why:'What the Maximum tier on the ensemble slider actually looks like', chan:'Berliner Philharmoniker'},
  {v:'GrrvAHhWKIw', title:'Mahler — Symphony No. 9', perf:'Berliner Philharmoniker · Kirill Petrenko', why:'Late-Romantic orchestration at its most transparent', chan:'Berliner Philharmoniker'}
];

/* ============================================================================
   2. PLATE ART — placeholder line engravings.
   Replace each with a cut-out public-domain engraving (Met CC0 / Meyers).
   ============================================================================ */

/* The violin family shares one outline, so the plates are generated from a
   single parametric drawing rather than four hand-drawn copies. Proportions are
   what actually distinguish them: the bass has sloped shoulders and an endpin,
   the violin a chinrest, the viola neither. */
function stringPlate(o){
  const cx = 150, top = o.top, bot = o.bot, upper = o.upper, waist = o.waist, lower = o.lower;
  const mid = top + (bot - top) * 0.42;
  const shoulder = o.sloped
    ? `C ${cx+upper*0.55} ${top+6} ${cx+upper} ${top+40} ${cx+upper-4} ${mid-34}`
    : `C ${cx+upper*0.9} ${top} ${cx+upper} ${top+30} ${cx+upper-2} ${mid-38}`;
  const half = `M${cx} ${top}
    ${shoulder}
    C ${cx+upper-6} ${mid-8} ${cx+waist+2} ${mid-4} ${cx+waist} ${mid+10}
    C ${cx+waist-2} ${mid+26} ${cx+lower-8} ${mid+40} ${cx+lower} ${mid+74}
    C ${cx+lower+8} ${bot-58} ${cx+lower-16} ${bot} ${cx} ${bot}`;
  const neckTop = o.neckTop, bridgeY = mid + 62;
  return `<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <path d="${half}" opacity=".92"/>
      <path d="${half}" opacity=".92" transform="translate(300,0) scale(-1,1)"/>
      <path d="M${cx} ${top}V${neckTop+26}" opacity=".8"/>
      <path d="M${cx-13} ${neckTop+26}c0-22 5-38 13-44 8 6 13 22 13 44" opacity=".8"/>
      <path d="M${cx} ${neckTop-18}c-8-6-12-14-6-19 6-4 12 0 12 7" opacity=".75"/>
      <g opacity=".5">
        <line x1="${cx-9}" y1="${neckTop+2}" x2="${cx-18}" y2="${neckTop}"/>
        <line x1="${cx+9}" y1="${neckTop+2}" x2="${cx+18}" y2="${neckTop}"/>
        <line x1="${cx-9}" y1="${neckTop+14}" x2="${cx-18}" y2="${neckTop+12}"/>
        <line x1="${cx+9}" y1="${neckTop+14}" x2="${cx+18}" y2="${neckTop+12}"/>
      </g>
      <g opacity=".55">
        <line x1="${cx-5}" y1="${neckTop+26}" x2="${cx-5}" y2="${bridgeY}"/>
        <line x1="${cx-1.7}" y1="${neckTop+26}" x2="${cx-1.7}" y2="${bridgeY}"/>
        <line x1="${cx+1.7}" y1="${neckTop+26}" x2="${cx+1.7}" y2="${bridgeY}"/>
        <line x1="${cx+5}" y1="${neckTop+26}" x2="${cx+5}" y2="${bridgeY}"/>
      </g>
      <path d="M${cx-18} ${bridgeY}h36" opacity=".9"/>
      <path d="M${cx-14} ${bridgeY}l-4 10M${cx+14} ${bridgeY}l4 10" opacity=".6"/>
      <path d="M${cx-26} ${bridgeY-38}c-6 4-6 14-1 18 4 3 9 1 10-4" opacity=".85"/>
      <path d="M${cx+26} ${bridgeY-38}c6 4 6 14 1 18-4 3-9 1-10-4" opacity=".85"/>
      <path d="M${cx} ${bridgeY+12}v${o.tail}m-14 0h28l-6 ${Math.round(o.tail*0.6)}h-16z" opacity=".7"/>
      ${o.chinrest ? `<ellipse cx="${cx-24}" cy="${bot-26}" rx="20" ry="12" opacity=".55"/>` : ''}
      ${o.pin ? `<path d="M${cx} ${bot}v${o.pin}" opacity=".8"/><line x1="${cx-18}" y1="${bot+o.pin}" x2="${cx+18}" y2="${bot+o.pin}" opacity=".7"/>` : ''}
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M${cx+lower+30} ${mid+20}c6 26 6 58-4 82"/>
      <path d="M${cx+lower+38} ${mid+14}c8 30 8 66-4 94"/>
    </g>
  </svg>`;
}

function stringThumb(o){
  return `<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85">
    <path d="M20 ${o.t}c${o.u} 0 ${o.u+4} 5 ${o.u+4} 11 0 5-5 7-6 10-2 4 5 6 8 13 3 8 1 22-12 22"/>
    <path d="M20 ${o.t}c-${o.u} 0-${o.u+4} 5-${o.u+4} 11 0 5 5 7 6 10 2 4-5 6-8 13-3 8-1 22 12 22"/>
    <path d="M20 ${o.t}V${o.n}"/></svg>`;
}

const PLATES = {
  flute:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g transform="rotate(-38 150 260)" stroke-width="1.3">
      <rect x="40" y="243" width="222" height="26" rx="13" opacity=".85"/>
      <line x1="72" y1="243" x2="72" y2="269" opacity=".5"/>
      <line x1="196" y1="243" x2="196" y2="269" opacity=".5"/>
      <ellipse cx="56" cy="256" rx="7" ry="5" opacity=".9"/>
      <path d="M40 250c-6 3-6 9 0 12" opacity=".6"/>
      <g opacity=".9">
        <ellipse cx="92" cy="256" rx="7.5" ry="7"/><ellipse cx="112" cy="256" rx="7.5" ry="7"/>
        <ellipse cx="132" cy="256" rx="7.5" ry="7"/><ellipse cx="158" cy="256" rx="7.5" ry="7"/>
        <ellipse cx="178" cy="256" rx="7.5" ry="7"/><ellipse cx="214" cy="256" rx="6.5" ry="6"/>
        <ellipse cx="232" cy="256" rx="6.5" ry="6"/>
      </g>
      <g opacity=".45" stroke-width="1">
        <line x1="86" y1="243" x2="98" y2="243"/><line x1="126" y1="243" x2="138" y2="243"/>
        <line x1="172" y1="243" x2="184" y2="243"/>
        <line x1="104" y1="269" x2="120" y2="269"/><line x1="152" y1="269" x2="166" y2="269"/>
      </g>
      <path d="M248 246c8 4 8 20 0 24" opacity=".7"/>
    </g>
    <g opacity=".22" stroke-width=".8">
      <path d="M60 470c40-20 78-52 110-92"/><path d="M74 482c44-22 86-58 120-102"/>
    </g>
  </svg>`,

  horn:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <circle cx="142" cy="250" r="92" opacity=".9"/>
      <circle cx="142" cy="250" r="72" opacity=".55"/>
      <circle cx="142" cy="250" r="54" opacity=".3"/>
      <path d="M60 208c-14-16-30-28-46-32" opacity=".85"/>
      <path d="M14 176c-8-2-12-8-6-13 5-4 12-1 14 5" opacity=".85"/>
      <g opacity=".9">
        <rect x="96" y="146" width="17" height="34" rx="8"/>
        <rect x="120" y="140" width="17" height="34" rx="8"/>
        <rect x="144" y="140" width="17" height="34" rx="8"/>
        <line x1="104" y1="146" x2="104" y2="132"/><line x1="128" y1="140" x2="128" y2="126"/>
        <line x1="152" y1="140" x2="152" y2="126"/>
      </g>
      <path d="M196 306c22 16 44 44 56 78" opacity=".9"/>
      <path d="M166 330c14 22 30 52 36 84" opacity=".9"/>
      <ellipse cx="228" cy="410" rx="42" ry="20" transform="rotate(-24 228 410)" opacity=".95"/>
      <ellipse cx="228" cy="410" rx="30" ry="14" transform="rotate(-24 228 410)" opacity=".35"/>
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M212 384c6 6 10 14 12 22"/><path d="M224 376c6 6 10 14 12 22"/><path d="M236 370c6 6 10 14 12 22"/>
    </g>
  </svg>`,

  violin: stringPlate({top:196, bot:452, upper:58, waist:26, lower:60, neckTop:96, tail:40, chinrest:true}),
  viola:  stringPlate({top:186, bot:462, upper:62, waist:28, lower:64, neckTop:88, tail:44}),
  'double-bass': stringPlate({top:170, bot:470, upper:66, waist:30, lower:70, neckTop:64, tail:50, sloped:true, pin:40}),
  harp:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <path d="M78 470V150c0-42 34-78 76-88" opacity=".92"/>
      <path d="M154 62c26 0 40 18 44 46l30 300" opacity=".92"/>
      <path d="M78 470h170" opacity=".85"/>
      <path d="M92 470l24-8" opacity=".5"/>
      <path d="M150 56c8-6 18-4 20 4 2 7-4 12-11 11" opacity=".7"/>
      <g opacity=".45" stroke-width=".9">
        <line x1="88" y1="446" x2="152" y2="118"/><line x1="100" y1="446" x2="160" y2="132"/>
        <line x1="112" y1="446" x2="168" y2="150"/><line x1="124" y1="446" x2="176" y2="172"/>
        <line x1="136" y1="446" x2="184" y2="198"/><line x1="148" y1="446" x2="191" y2="228"/>
        <line x1="160" y1="446" x2="197" y2="262"/><line x1="172" y1="446" x2="203" y2="300"/>
        <line x1="184" y1="446" x2="209" y2="340"/><line x1="196" y1="446" x2="214" y2="382"/>
      </g>
      <path d="M116 486v22M210 486v22" opacity=".6"/>
      <path d="M104 508h124" opacity=".55"/>
    </g>
    <g opacity=".2" stroke-width=".8"><path d="M244 300c8 30 8 66-4 94"/><path d="M252 292c8 34 8 74-4 106"/></g>
  </svg>`,
  cello:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <path d="M150 168c22 0 40 20 39 44-1 22-19 28-24 40-6 14 20 24 30 52 12 34 4 88-45 88" opacity=".92"/>
      <path d="M150 168c-22 0-40 20-39 44 1 22 19 28 24 40 6 14-20 24-30 52-12 34-4 88 45 88" opacity=".92"/>
      <path d="M150 168V96" opacity=".8"/>
      <path d="M137 96c0-22 5-38 13-44 8 6 13 22 13 44" opacity=".8"/>
      <path d="M150 52c-8-6-12-14-6-19 6-4 12 0 12 7" opacity=".75"/>
      <g opacity=".5"><line x1="141" y1="72" x2="132" y2="70"/><line x1="159" y1="72" x2="168" y2="70"/>
        <line x1="141" y1="84" x2="132" y2="82"/><line x1="159" y1="84" x2="168" y2="82"/></g>
      <g opacity=".55"><line x1="145" y1="96" x2="145" y2="300"/><line x1="149" y1="96" x2="149" y2="300"/>
        <line x1="153" y1="96" x2="153" y2="300"/><line x1="157" y1="96" x2="157" y2="300"/></g>
      <path d="M132 300h36" opacity=".9"/>
      <path d="M136 300l-4 10M164 300l4 10" opacity=".6"/>
      <path d="M124 262c-6 4-6 14-1 18 4 3 9 1 10-4" opacity=".85"/>
      <path d="M176 262c6 4 6 14 1 18-4 3-9 1-10-4" opacity=".85"/>
      <path d="M150 312v46m-14 0h28l-6 34h-16z" opacity=".7"/>
      <path d="M150 392v76" opacity=".8"/>
      <line x1="132" y1="470" x2="168" y2="470" opacity=".7"/>
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M186 250c6 26 6 58-4 82"/><path d="M194 244c8 30 8 66-4 94"/>
    </g>
  </svg>`
};
const THUMBS = {
  flute:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><g transform="rotate(-38 20 26)"><rect x="3" y="22" width="34" height="7" rx="3.5"/><circle cx="12" cy="25.5" r="2"/><circle cx="19" cy="25.5" r="2"/><circle cx="26" cy="25.5" r="2"/></g></svg>`,
  horn:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><circle cx="18" cy="23" r="13"/><circle cx="18" cy="23" r="8" opacity=".5"/><ellipse cx="29" cy="41" rx="8" ry="4" transform="rotate(-24 29 41)"/></svg>`,
  violin: stringThumb({t:16, u:5, n:5}),
  viola: stringThumb({t:17, u:6, n:6}),
  'double-bass': stringThumb({t:15, u:7, n:4}),
  harp:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><path d="M11 44V17c0-9 7-14 14-15"/><path d="M25 2c5 0 7 4 8 10l4 32"/><path d="M11 44h26"/><g opacity=".5" stroke-width=".7"><line x1="15" y1="41" x2="26" y2="12"/><line x1="21" y1="41" x2="30" y2="20"/><line x1="27" y1="41" x2="33" y2="28"/></g></svg>`,
  cello:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><path d="M20 18c6 0 10 5 10 11 0 5-5 7-6 10-2 4 5 6 8 13 3 8 1 22-12 22"/><path d="M20 18c-6 0-10 5-10 11 0 5 5 7 6 10 2 4-5 6-8 13-3 8-1 22 12 22"/><path d="M20 18V6"/></svg>`
};
