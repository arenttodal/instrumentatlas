/* ============================================================================
   INSTRUMENT ATLAS · CONTENT
   ----------------------------------------------------------------------------
   This is the file to edit. Collections, families, instruments, ensemble sizes,
   plate artwork and the video gallery all live here. Nothing in this file knows
   how anything is drawn. atlas.js handles that.
   ============================================================================ */

/* ============================================================================
   1. DATA. Everything you edit lives here.
   ------------------------------------------------------------------------
   status: 'live'  = has a full page
           'plan'  = shows in menus, greyed, no page yet
   range:  MIDI note numbers (60 = middle C). timbre: 0 = dark … 1 = bright
   ============================================================================ */

const COLLECTION = {
  id:'orchestral', name:'Orchestral',
  title:['The instruments of', 'the orchestra'],
  lede:'Every instrument in the orchestra: how it sounds, where it sits, what it blends with, and where it stops. Built as a working reference for composers, not a museum catalogue.'
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
  { id:'strings', name:'Strings', tagline:'The bread and butter',
    lede:'The most versatile family in the orchestra: staccato chase scenes, sweeping romantic themes, harmonic beds, rhythmic accents. Usually where a symphonic piece begins.',
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

  { id:'woodwinds', name:'Woodwinds', tagline:'The overlooked colours',
    lede:'Beautiful and versatile, and routinely forgotten in modern epic writing. Learn to write for them and you add depth and character that staccato strings and choir cannot reach.',
    role:[
      '<b>Two mechanisms.</b> Edge-tone flutes, and reeds: single (clarinet) or double (oboe, bassoon).',
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

  { id:'brass', name:'Brass', tagline:'The powerhouse',
    lede:'Melodies that carry, chords that feel immense, and enough weight to cover the whole orchestra at will. With that power comes the responsibility to balance it.',
    role:[
      '<b>Lips, not reeds.</b> Pitch comes from lip tension and air pressure, so higher usually means louder.',
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

  { id:'percussion', name:'Percussion', tagline:'Rhythm and dramatic flair',
    lede:'Struck, shaken or scraped. The family with the widest dynamic range in the orchestra, and the one most easily overused.',
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
  piccolo:{
    family:'woodwinds', name:'Piccolo', latin:'Ottavino',
    epithet:'The loudest instrument in the orchestra, by a distance', status:'live',
    summary:'Half the length of a flute and sounding an octave above it, the piccolo occupies the top of the orchestral range alone. One player can cut through a full tutti, which is exactly why it is written sparingly. It has no dynamic hiding place.',
    range:{lo:74, hi:108, note:'D5 – C8', transposition:'Sounds an octave higher than written'},
    timbre:0.95,
    facts:[['Sounding range','D5 – C8'],['Section size','1–2','players'],['Transposition','Octave above written']],
    registers:[
      {label:'Low register', pitch:'D5 – A5', text:'Weak, hollow and easily buried. Rarely worth writing except for colour in a thin texture.'},
      {label:'Middle register', pitch:'B5 – A6', text:'Clear and flute-like, with more bite. The usable range for anything melodic.'},
      {label:'High register', pitch:'B6 – C8', text:'Piercing and unmistakable. Carries over the entire orchestra at full force, and turns shrill and exhausting fast.'}
    ],
    characteristics:[
      'Sounds an octave above written, so the written part looks deceptively modest.',
      'Intonation is unforgiving, and small errors are enormously audible up here.',
      'Excels at fast runs and trills, doubling flutes an octave up.',
      'Almost never plays quietly in its top octave; the mechanism resists it.'
    ],
    articulations:['Legato','Staccato','Double tonguing','Flutter tongue','Trills','Runs'],
    blends:[
      {id:'flute', label:'Flute an octave below', note:'The standard doubling; adds brilliance to the line'},
      {id:'oboe', label:'Oboe', note:'Sharpens the attack of a woodwind chord'},
      {id:'violin', label:'Violins at the octave', note:'Lifts a string melody into the light'},
      {id:'cymbals', label:'Percussion accents', note:'Both cut through a tutti at the same moment'}
    ],
    limits:[
      'Use it sparingly. Sustained high piccolo is genuinely tiring to listen to and will dominate any mix you put it in.',
      'The bottom octave will not project. If you need that range, write for flute.',
      'Doubling a quiet passage with piccolo does not make it prettier, it makes it a piccolo solo.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Against the flute', note:'The same figure, an octave apart', dur:'0:16'},
      {label:'Full force over tutti', note:'Why it is used at climaxes', dur:'0:14'}
    ],
    prev:'', next:'flute'
  },

  flute:{
    family:'woodwinds', name:'Flute', latin:'Flauto traverso',
    epithet:'Round, warm, and quietly everywhere', status:'live',
    summary:'An edge-tone instrument with a rich, full middle range and a brilliant, penetrating top. Equally effective carrying a solo line and doubling violins, which is where you will hear it most often without noticing it.',
    range:{lo:60, hi:96, note:'C4 – C7', transposition:'Non-transposing'},
    timbre:0.72,
    facts:[['Sounding range','C4 – C7'],['Section size','2–4','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'C4 – G4', text:'Breathy and easily buried. Beautiful exposed and soft, useless under a loud texture.'},
      {label:'Middle register', pitch:'A4 – D6', text:'Rich and full: the workhorse range for melodies and for doubling.'},
      {label:'High register', pitch:'E6 – C7', text:'Brilliant and penetrating. Cuts through a tutti, tiring over long stretches.'}
    ],
    characteristics:[
      'Adds more high-end overtones as air pressure increases, though the dynamic contrast is subtler than brass.',
      'Fast runs and arpeggios are entirely idiomatic. This is what woodwinds are for.',
      'Monophonic. Harmony has to come from arpeggiation or from a second player.',
      'Needs rests to breathe. Phrases written without them read as synthetic immediately.'
    ],
    articulations:['Legato','Staccato','Flutter tongue','Trills','Runs','Harmonics'],
    blends:[
      {id:'violin', label:'Violins in octaves', note:'Very common, and adds air to the string line'},
      {id:'oboe', label:'Oboe', note:'Mellows the reed edge'},
      {id:'clarinet', label:'Clarinet', note:'Warmer, fuller combined tone'},
      {id:'piccolo', label:'Piccolo an octave up', note:'Brightens the whole line'}
    ],
    limits:[
      'The low register will not compete. Do not hand it a melody under a full ensemble.',
      'Doubling a soft flute with a trumpet clashes. Group by tone colour, not by range.',
      'Long unbroken lines expose the mockup. Write the breath in.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:18'},
      {label:'With violins in octaves', note:'The doubling, isolated then in context', dur:'0:15'}
    ],
    prev:'piccolo', next:'oboe'
  },

  oboe:{
    family:'woodwinds', name:'Oboe', latin:'Oboe',
    epithet:'The instrument the orchestra tunes to, and the one that sounds most like a voice', status:'live',
    summary:'A double reed with a narrow conical bore, which produces the most penetrating and least blendable tone colour in the woodwind section. That penetration is why it gives the tuning A, and why a single oboe can carry a melody over a full string section without effort.',
    range:{lo:58, hi:91, note:'B♭3 – G6', transposition:'Non-transposing'},
    timbre:0.80,
    facts:[['Sounding range','B♭3 – G6'],['Section size','2–4','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'B♭3 – E4', text:'Thick, heavy and a little coarse. Hard to play softly and difficult to blend.'},
      {label:'Middle register', pitch:'F4 – D5', text:'The expressive core: reedy, singing and instantly recognisable. Almost every famous oboe solo lives here.'},
      {label:'High register', pitch:'E5 – G6', text:'Thin and increasingly strained. Effective for a moment of tension, punishing across a phrase.'}
    ],
    characteristics:[
      'Double reed, narrow conical bore: the combination that makes it cut.',
      'Very low air consumption, so players run out of places to breathe rather than breath.',
      'Extremely agile: fast runs, trills and wide leaps all sit well.',
      'Blends poorly by nature, which makes it a soloist more often than a section instrument.'
    ],
    articulations:['Legato','Staccato','Trills','Runs','Flutter tongue'],
    blends:[
      {id:'bassoon', label:'Bassoon', note:'Two double reeds, an octave or two apart; a distinctly reedy colour'},
      {id:'clarinet', label:'Clarinet', note:'Rounds off the oboe’s edge'},
      {id:'flute', label:'Flute', note:'Mellows the tone without dulling it'},
      {id:'violin', label:'Violins in unison', note:'Adds definition and bite to the string line'}
    ],
    limits:[
      'Soft playing in the low register is very difficult. Do not write a quiet low oboe entrance and expect it to be quiet.',
      'It will not disappear into a chord. If you need blend, use clarinet.',
      'Long unbroken lines are a breathing problem in reverse: players need somewhere to exhale.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:18'},
      {label:'Solo over strings', note:'Why it carries', dur:'0:15'}
    ],
    prev:'flute', next:'clarinet'
  },

  clarinet:{
    family:'woodwinds', name:'Clarinet', latin:'Clarinetto',
    epithet:'The widest dynamic range in the orchestra, and the best blender in it', status:'live',
    summary:'A single reed with a cylindrical bore, which makes it behave unlike everything around it: it overblows at the twelfth rather than the octave, and its registers have genuinely different characters. It can play quieter than any other wind instrument and still be heard.',
    range:{lo:50, hi:91, note:'D3 – G6 sounding', transposition:'In B♭, written a tone higher'},
    timbre:0.55,
    facts:[['Sounding range','D3 – G6'],['Section size','2–4','players'],['Transposition','In B♭ (and A)']],
    registers:[
      {label:'Chalumeau', pitch:'D3 – G4', text:'Dark, hollow and unmistakable. The most distinctive low register in the woodwind section.'},
      {label:'Throat register', pitch:'A4 – B♭4', text:'Weak, slightly stuffy, and the part section players work hardest to disguise. Avoid exposing it.'},
      {label:'Clarion', pitch:'B4 – C6', text:'Bright, singing and even. Where most melodic writing belongs.'},
      {label:'Altissimo', pitch:'C♯6 – G6', text:'Piercing and effortful. Effective in a tutti, unreliable when exposed.'}
    ],
    characteristics:[
      'Cylindrical bore closed at the reed end, so it overblows at the twelfth, not the octave.',
      'Registers differ audibly, which is a colour resource rather than a defect.',
      'The finest diminuendo in the orchestra: it can fade to genuine silence.',
      'Two instruments in common use, B♭ and A, chosen by key to keep fingerings manageable.'
    ],
    articulations:['Legato','Staccato','Glissando','Trills','Flutter tongue','Subtone'],
    blends:[
      {id:'horn', label:'Horn', note:'Two covered timbres; they fuse almost completely'},
      {id:'viola', label:'Viola', note:'Both sit in the middle and neither fights'},
      {id:'flute', label:'Flute', note:'Warmer, fuller combined tone'},
      {id:'bassoon', label:'Bassoon', note:'Depth under the line'}
    ],
    limits:[
      'The throat register is the weak spot. Do not write an exposed sustained A4 or B♭4 and expect it to sing.',
      'Remember the transposition when printing parts: a B♭ instrument, written a tone above sounding.',
      'Rapid register crossings over the break are awkward; give the player somewhere to move.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Chalumeau to clarion', note:'The same figure across the break', dur:'0:18'},
      {label:'Diminuendo to nothing', note:'The fade no other wind instrument can match', dur:'0:12'}
    ],
    prev:'oboe', next:'bassoon'
  },

  bassoon:{
    family:'woodwinds', name:'Bassoon', latin:'Fagotto',
    epithet:'The bass of the woodwind section, and its most characterful tenor', status:'live',
    summary:'A double reed like the oboe but far less penetrating, with registers that differ more sharply than any other woodwind. It plays the bass line of the wind section, doubles the low strings for weight, and, in its middle register, has one of the most distinctive solo voices in the orchestra.',
    range:{lo:34, hi:75, note:'B♭1 – E♭5', transposition:'Non-transposing'},
    timbre:0.30,
    facts:[['Sounding range','B♭1 – E♭5'],['Section size','2–4','players'],['Notation','Bass and tenor clef']],
    registers:[
      {label:'Low register', pitch:'B♭1 – F2', text:'Thick, heavy and slightly rough. A genuine bass foundation, and it takes some effort to play quietly.'},
      {label:'Middle register', pitch:'G2 – F4', text:'The characterful range: mysterious, melancholic, faintly comic depending entirely on context. Most solos live here.'},
      {label:'High register', pitch:'G4 – E♭5', text:'Compressed, lyrical and strained, in a way composers use deliberately. The opening of The Rite of Spring is the famous example.'}
    ],
    characteristics:[
      'Double reed like the oboe, but wider bore and far less projection.',
      'Registers are markedly different in character, an asset rather than a fault.',
      'Agile enough for fast passagework despite its size.',
      'Takes the metallic edge off brass when doubled, which is half of its orchestral use.'
    ],
    articulations:['Legato','Staccato','Trills','Flutter tongue','Runs'],
    blends:[
      {id:'cello', label:'Cello', note:'Woody reinforcement of the low string line'},
      {id:'horn', label:'Horn', note:'Softens the brass attack'},
      {id:'oboe', label:'Oboe', note:'Both double reeds; the family resemblance is audible'},
      {id:'clarinet', label:'Clarinet', note:'Warm, covered woodwind chord'}
    ],
    limits:[
      'Quiet low notes are difficult, because the reed needs air to speak at all.',
      'Very high writing is possible but exposed and effortful; use it for effect, not for range.',
      'It cannot compete with brass on volume. If you need weight there, add players, not dynamics.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:18'},
      {label:'With cello in octaves', note:'The doubling that gives the low line its wood', dur:'0:15'}
    ],
    prev:'clarinet', next:''
  },

  trumpet:{
    family:'brass', name:'Trumpet', latin:'Tromba',
    epithet:'Bright, cylindrical, and built to be heard', status:'live',
    summary:'Cylindrical bore for most of its length, flaring only at the bell. It is the acoustic opposite of the horn, and the reason it reads as brilliant and forward where the horn reads as warm. Three piston valves fill in the chromatic gaps between the natural harmonics.',
    range:{lo:54, hi:84, note:'F♯3 – C6 sounding', transposition:'In B♭, written a tone higher'},
    timbre:0.88,
    facts:[['Sounding range','F♯3 – C6'],['Section size','3–6','players'],['Transposition','In B♭ (and C)']],
    registers:[
      {label:'Low register', pitch:'F♯3 – B♭3', text:'Dark, round and a little unfocused. Rarely used for anything prominent.'},
      {label:'Middle register', pitch:'B3 – G5', text:'Full, brilliant and secure. Fanfares, melodies and everything else.'},
      {label:'High register', pitch:'A5 – C6', text:'Penetrating and physically demanding. Reliable from good players, but it costs them, so do not park a section up here.'}
    ],
    characteristics:[
      'Cylindrical bore emphasises odd harmonics, giving the bright, cutting tone.',
      'Straight mutes, cup mutes and harmon mutes each change the colour completely.',
      'Double and triple tonguing make rapid repeated notes idiomatic.',
      'Valve combinations run progressively sharp, corrected by slide triggers while playing.'
    ],
    articulations:['Legato','Marcato','Staccato','Double tonguing','Flutter tongue','Rips','Straight mute','Harmon mute'],
    blends:[
      {id:'trombone', label:'Trombone', note:'Same bright family; a unified brass choir'},
      {id:'oboe', label:'Oboe', note:'Both penetrating; the pairing is sharper than either alone'},
      {id:'viola', label:'Viola', note:'Strings take the edge off the brass'},
      {id:'horn', label:'Horn', note:'Contrast rather than blend: bright over round'}
    ],
    limits:[
      'Sustained high playing tires players quickly. Write rests or you will not get the last chorus.',
      'Loud trumpets cover everything. Balance by writing less, not by marking everyone else louder.',
      'Remember the transposition: written C sounds B♭.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Open vs muted', note:'The same figure, straight mute and open', dur:'0:16'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:18'}
    ],
    prev:'', next:'horn'
  },

  horn:{
    family:'brass', name:'Horn', latin:'Corno / French horn',
    model:'horn',
    modelCredit:'“French Horn” by Bethanycrandallart · modified: decimated and re-materialled',
    modelSource:'https://skfb.ly/6TxEP',
    epithet:'The brass instrument that behaves like a woodwind', status:'live',
    summary:'Conical bore, which makes it mellow and round where trumpets and trombones are bright and penetrating. The reason it blends with woodwinds and cellos as happily as with its own family, and the reason heroic themes keep landing on it.',
    range:{lo:41, hi:77, note:'F2 – F5 sounding', transposition:'In F, written a fifth higher'},
    timbre:0.40,
    facts:[['Sounding range','F2 – F5'],['Section size','4–8','players'],['Transposition','In F']],
    registers:[
      {label:'Low register', pitch:'F2 – C3', text:'Very mellow. Works beautifully for calm passages, weak under pressure.'},
      {label:'Middle register', pitch:'D3 – C4', text:'Full and singing: the heroic range, and the one to write themes in.'},
      {label:'High register', pitch:'D4 – F5', text:'Intense and bright, but still round compared to any other brass. Hard to play quietly.'}
    ],
    characteristics:[
      'Pitch comes from lip tension and air pressure, so high and loud are physically linked.',
      'Conical bore gives a mellow, warm tone that sits between brass and woodwind.',
      'Sustained lines need written breaks. Brass players cannot circular-breathe a phrase.',
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
      'Written a fifth above sounding pitch: irrelevant for mockups, essential the moment you print parts.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Register comparison', note:'Mellow low, singing middle, intense high', dur:'0:18'},
      {label:'With cello in unison', note:'The blend that made the pairing standard', dur:'0:15'}
    ],
    prev:'trumpet', next:'trombone'
  },

  trombone:{
    family:'brass', name:'Trombone', latin:'Trombone',
    epithet:'The only orchestral brass with no valves, and the only one that can truly glissando', status:'live',
    summary:'A slide instead of valves, which means genuinely continuous pitch and perfect intonation in the player’s hands rather than the instrument’s. Its tone stays remarkably consistent across the whole range, and in the low register at full volume it is the most threatening sound in the orchestra.',
    range:{lo:40, hi:74, note:'E2 – D5', transposition:'Non-transposing'},
    timbre:0.66,
    facts:[['Sounding range','E2 – D5'],['Section size','3–6','players'],['Notation','Bass and tenor clef']],
    registers:[
      {label:'Low register', pitch:'E2 – B♭2', text:'Dark and threatening at volume, mysterious when soft. The warning register.'},
      {label:'Middle register', pitch:'B2 – B♭3', text:'Full, noble and even. The heart of the section’s chordal writing.'},
      {label:'High register', pitch:'B3 – D5', text:'Brilliant and heroic, and increasingly effortful. Bass trombonists live lower; the tenors carry this.'}
    ],
    characteristics:[
      'Seven slide positions, continuously variable. The only brass that can play a true glissando.',
      'Tone is unusually homogeneous across the range, unlike clarinet or bassoon.',
      'Rapid passagework is genuinely difficult, because the slide has to travel.',
      'Sections usually pair two tenors with one bass trombone.'
    ],
    articulations:['Legato','Marcato','Staccato','Glissando','Flutter tongue','Straight mute','Plunger'],
    blends:[
      {id:'trumpet', label:'Trumpet', note:'The core brass choir sound'},
      {id:'tuba', label:'Tuba', note:'Anchors the bottom of the brass chord'},
      {id:'horn', label:'Horn', note:'Round against bright; use deliberately'},
      {id:'double-bass', label:'Double basses', note:'Weight under a low brass line'}
    ],
    limits:[
      'Fast runs fight the slide. Write lines, not passagework.',
      'Legato across positions needs care: a natural slur is only possible between certain notes.',
      'Three trombones at full volume will bury a string section without effort.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Glissando and legato', note:'What the slide can and cannot join', dur:'0:14'},
      {label:'Section chord, soft and loud', note:'The same voicing at both extremes', dur:'0:16'}
    ],
    prev:'horn', next:'tuba'
  },

  tuba:{
    family:'brass', name:'Tuba', latin:'Tuba',
    epithet:'The foundation of the brass, and far more agile than it looks', status:'live',
    summary:'The largest and lowest brass instrument, usually one to a section. Its job is the bottom of the brass chord, but its middle register is soft, full and surprisingly nimble. The comic-lumbering reputation says more about how it is written for than about what it can do.',
    range:{lo:26, hi:65, note:'D1 – F4', transposition:'Non-transposing'},
    timbre:0.20,
    facts:[['Sounding range','D1 – F4'],['Section size','1–2','players'],['Notation','Bass clef, concert pitch']],
    registers:[
      {label:'Low register', pitch:'D1 – G1', text:'Enormous and slow to speak. Playable only softly at the very bottom, but it projects further than it sounds close up.'},
      {label:'Middle register', pitch:'A1 – B♭2', text:'Full, warm and the most used part of the instrument. Genuinely agile here.'},
      {label:'High register', pitch:'B2 – F4', text:'Focused and almost tenor-like. An underused colour, and effective in solo writing.'}
    ],
    characteristics:[
      'Consumes enormous quantities of air, so phrases need more breathing room than any other brass.',
      'One player supports an entire brass section, so balance sits on them alone.',
      'Attacks in the lowest octave take time to speak. Write ahead of the beat if precision matters.',
      'Doubling with double basses and contrabassoon is the standard orchestral bass foundation.'
    ],
    articulations:['Legato','Marcato','Staccato','Flutter tongue','Mute'],
    blends:[
      {id:'trombone', label:'Trombone', note:'Completes the brass chord from the bottom'},
      {id:'double-bass', label:'Double basses', note:'The orchestral floor'},
      {id:'bassoon', label:'Bassoon', note:'Woody definition under the weight'},
      {id:'timpani', label:'Timpani', note:'Attack under sustained low brass'}
    ],
    limits:[
      'Fast repeated articulation in the bottom octave will not speak cleanly. Simplify it.',
      'Give it air. A tuba part with no rests is unplayable regardless of how it looks.',
      'Unison with the double basses muddies. An octave apart keeps both audible.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Low register speaking time', note:'How long the bottom octave takes to arrive', dur:'0:14'},
      {label:'Melodic middle register', note:'The part of the instrument nobody writes for', dur:'0:15'}
    ],
    prev:'trombone', next:''
  },

  cello:{
    family:'strings', name:'Cello', latin:'Violoncello',
    model:'cello',
    modelCredit:'“Cello Sketchfab” by Limpskin · modified: re-centred and normalised',
    modelSource:'https://skfb.ly/pICFS',
    epithet:'Tenor voice, bass foundation, both at once', status:'live',
    summary:'The tenor and bass instrument of the violin family. Full and rich down low, lyrical and singing up high, which is why it doubles basses for weight in one bar and carries the counter-melody in the next.',
    range:{lo:36, hi:81, note:'C2 – A5', transposition:'Non-transposing'},
    timbre:0.35,
    facts:[['Sounding range','C2 – A5'],['Section size','10','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'C2 – G3', text:'Warm and full. Doubling the basses in octaves here is standard practice.'},
      {label:'Middle register', pitch:'A3 – D4', text:'The singing range. Counter-melodies live here without crowding the violins.'},
      {label:'High register', pitch:'E4 – A5', text:'Brighter and lyrical, thin enough to sound like a soloist even in section.'}
    ],
    characteristics:[
      'Any pitch in range, including glissandi and microtones.',
      'Sustains indefinitely, with no breathing to write around.',
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
    family:'strings', name:'Violin', latin:'Violino',
    model:'violin',
    modelCredit:'“Violin Texturing” by ilushandro · modified: decimated and re-materialled',
    modelSource:'https://skfb.ly/oAVFz',
    epithet:'The voice the orchestra is built around', status:'live',
    summary:'The smallest and highest of the family, and the most numerous instrument on stage, with thirty or more of them in a full orchestra, split into two sections. Almost every symphonic texture is organised around what the violins are doing.',
    range:{lo:55, hi:100, note:'G3 – E7', transposition:'Non-transposing'},
    timbre:0.78,
    facts:[['Sounding range','G3 – E7'],['Section size','16 + 14','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'G3 – D4', text:'The G string: dark, thick and surprisingly weak. Soloists love it; in section it disappears under almost anything.'},
      {label:'Middle register', pitch:'E4 – D5', text:'Warm and even. Where most melodic writing sits, and where a section blends into one voice rather than many.'},
      {label:'High register', pitch:'E5 – E7', text:'Brilliant and soaring, and above roughly B6 increasingly thin and strained. Sixteen violins in unison up here is the loudest sound in the string section.'}
    ],
    characteristics:[
      'Divided into firsts and seconds, which can play in unison for weight or split for harmony.',
      'Four strings tuned in fifths, G, D, A and E, each with an audibly different character.',
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
      'The low G string will not carry a melody through a loud texture. Give it to violas or cellos instead.',
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
    family:'strings', name:'Viola', latin:'Viola',
    model:'viola',
    modelCredit:'Attribution pending, do not publish',
    epithet:'The inner voice, and the one nobody notices working', status:'live',
    summary:'A fifth below the violin, and darker than the size difference suggests. The body is acoustically too small for its tuning, which is exactly where its throaty, slightly veiled character comes from. Most orchestral writing uses it to fill the middle, where nothing else quite reaches.',
    range:{lo:48, hi:88, note:'C3 – E6', transposition:'Non-transposing'},
    timbre:0.52,
    facts:[['Sounding range','C3 – E6'],['Section size','12','players'],['Notation','Alto clef']],
    registers:[
      {label:'Low register', pitch:'C3 – G3', text:'The C string. Dark, reedy and slightly rough: the sound most people mean when they say "viola".'},
      {label:'Middle register', pitch:'A3 – D5', text:'Warm and covered. Perfect for inner harmony, which is where it spends most of its life.'},
      {label:'High register', pitch:'E5 – E6', text:'Intense and a little strained, in a way that reads as expressive rather than weak. Worth using deliberately.'}
    ],
    characteristics:[
      'Tuned C, G, D, A, a fifth below the violin.',
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
      'Exposed high writing is unforgiving: beautiful when it works, painful when it does not.',
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
    family:'strings', name:'Double Bass', latin:'Contrabasso',
    epithet:'The floor everything else stands on', status:'live',
    summary:'Not actually a member of the violin family. Sloped shoulders and fourths tuning give it away as a descendant of the viol. It sounds an octave lower than written, and doubling the cellos in octaves is so standard that most orchestral bass lines assume it.',
    range:{lo:28, hi:67, note:'E1 – G4 sounding', transposition:'Sounds an octave lower than written'},
    timbre:0.18,
    facts:[['Sounding range','E1 – G4'],['Section size','8','players'],['Transposition','Octave below written']],
    registers:[
      {label:'Low register', pitch:'E1 – A1', text:'Felt more than heard. Pitch definition is poor down here, which is why the cello octave above matters so much.'},
      {label:'Middle register', pitch:'B1 – D3', text:'The working range. Dark, woody and clear enough to carry an actual line.'},
      {label:'High register', pitch:'E3 – G4', text:'Thin and strained, and unmistakably expressive. A solo bass up here sounds like nothing else in the orchestra.'}
    ],
    characteristics:[
      'Tuned in fourths, E, A, D and G, unlike the rest of the family.',
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
      'Remember the transposition when you print parts: written E1 sounds E0, below the piano.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Arco vs pizzicato', note:'Sustained, then plucked', dur:'0:14'},
      {label:'With cello in octaves', note:'Why the pairing is standard', dur:'0:16'}
    ],
    prev:'cello', next:'harp'
  },

  harp:{
    family:'strings', name:'Harp', latin:'Arpa',
    epithet:'Diatonic by design, chromatic only with planning', status:'live',
    summary:'Forty-seven strings and seven pedals, each pedal controlling every octave of one note name. That single mechanical fact governs everything you can and cannot write for it. The harp is not a keyboard you pluck, and treating it as one is the most common mistake in orchestral writing.',
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
      'A glissando is whatever the pedals are currently set to, so you choose the scale by setting pedals in advance.',
      'Ten fingers, but only eight usable for chords; the little fingers are not used.',
      'Notes ring until damped, so dense writing turns into a wash very quickly.'
    ],
    articulations:['Glissando','Arpeggio','Harmonics','Près de la table','Bisbigliando','Damped','Pedal slides'],
    blends:[
      {id:'flute', label:'Flute', note:'The classic pairing: air over plucked attack'},
      {id:'cello', label:'Pizzicato strings', note:'Two plucked colours, one sustaining longer'},
      {id:'celesta', label:'Celesta', note:'Doubling makes both sound larger and stranger'},
      {id:'violin', label:'Violins', note:'Harp supplies attack the bowed line lacks'}
    ],
    limits:[
      'Chromatic passages are hard or impossible. Pedals take time, and the player needs bars, not beats, to reset.',
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

  /* The unpitched percussion still carry a range, because the timbre chart
     plots every instrument and needs somewhere to put them. Those numbers
     describe roughly where the energy sits spectrally, not pitch, and each
     entry says so in its range note so it cannot be misread. */
  timpani:{
    family:'percussion', name:'Timpani', latin:'Timpani',
    epithet:'The only orchestral drums that play notes, and the oldest member of the section', status:'live',
    summary:'Usually four drums of different sizes, tuned by pedal and played by a specialist. They carry rhythm, harmony and pitch at once, which is why the timpani part is the one percussion line composers write first and cut last.',
    range:{lo:38, hi:57, note:'D2 – A3 across four drums', transposition:'Non-transposing'},
    timbre:0.22,
    facts:[['Range','D2 – A3'],['Drums','4','typical'],['Tuning','Pedal, during play']],
    registers:[
      {label:'Large drums', pitch:'D2 – A2', text:'Deep, booming and slow to decay. Rolls here feel like weather rather than rhythm.'},
      {label:'Medium drums', pitch:'B2 – E3', text:'The working range. Clear pitch, strong attack, unmistakably orchestral.'},
      {label:'Small drum', pitch:'F3 – A3', text:'Tight and articulate, closer to a tuned tom. Good for rhythmic detail.'}
    ],
    characteristics:[
      'Pedal tuning means pitch can change mid-piece, and glissandi are possible.',
      'Mallet choice changes everything: felt for warmth, wood for attack.',
      'Rolls sustain indefinitely and crescendo further than almost anything else in the orchestra.',
      'Reinforces the harmonic bass, so the note choice matters as much as the rhythm.'
    ],
    articulations:['Single strokes','Roll','Muffled','Glissando','Wood mallets','Rim'],
    blends:[
      {id:'double-bass', label:'Double basses', note:'Attack under a sustained bass note'},
      {id:'tuba', label:'Low brass', note:'Timpani supplies the transient the brass lacks'},
      {id:'bass-drum', label:'Bass drum', note:'Weight without pitch, layered under pitch'},
      {id:'cello', label:'Cellos', note:'Reinforces the harmonic root'}
    ],
    limits:[
      'Retuning takes time. Give the player bars, not beats, to change a drum’s pitch.',
      'Notes outside the drum sizes on stage are simply unplayable. Check the pitches you actually need.',
      'A timpani roll under a quiet passage is not quiet. It is the loudest thing in the orchestra at will.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Felt vs wood mallets', note:'The same figure, two sticks', dur:'0:14'},
      {label:'Roll and crescendo', note:'From nothing to the top of the dynamic', dur:'0:16'}
    ],
    prev:'', next:'cymbals'
  },

  cymbals:{
    family:'percussion', name:'Cymbals', latin:'Piatti',
    epithet:'The orchestra’s exclamation mark', status:'live',
    summary:'Two plates crashed together, or one suspended and struck. Unpitched but enormously wide-spectrum, which is why a single crash reads as the loudest moment in a piece regardless of what else is playing. Used once, it lands. Used often, it stops meaning anything.',
    range:{lo:60, hi:96, note:'Unpitched. Broadband, with the energy weighted high', transposition:'Non-transposing'},
    timbre:0.92,
    facts:[['Pitch','Unpitched'],['Types','Crash, suspended, hi-hat'],['Players','1–2']],
    registers:[
      {label:'Crash cymbals', pitch:'Broadband', text:'Two plates struck together. Instant, huge and impossible to take back.'},
      {label:'Suspended cymbal', pitch:'Broadband', text:'Struck or rolled with mallets. A roll from silence to a crash is one of the great orchestral crescendos.'},
      {label:'Choked', pitch:'Short', text:'Damped immediately against the body for a hard stop.'}
    ],
    characteristics:[
      'Unpitched but not neutral: size and alloy change the colour considerably.',
      'A suspended roll can crescendo over many bars and covers an entire orchestra at its peak.',
      'Decay is long and cannot be shortened without choking the instrument.',
      'A single player usually covers crash and suspended, so simultaneous parts need two.'
    ],
    articulations:['Crash','Suspended roll','Struck with mallets','Choked','Scraped','Sizzle'],
    blends:[
      {id:'bass-drum', label:'Bass drum', note:'The classic pairing: weight plus brilliance'},
      {id:'trumpet', label:'Brass', note:'Cymbal supplies the transient the brass attack lacks'},
      {id:'gong', label:'Gong', note:'Layered impact with a much longer tail'},
      {id:'piccolo', label:'Piccolo', note:'Both cut through a tutti at the same instant'}
    ],
    limits:[
      'It is a moment, not a texture. Repeated crashes lose all impact within a few bars.',
      'You cannot make it quiet by writing p. You make it quiet with a smaller pair or a mallet.',
      'Nothing after a crash will be heard for about a second. Plan the bar around it.'
    ],
    demos:[
      {label:'Crash, suspended and choked', note:'The three ways it is played', dur:'0:14'},
      {label:'Roll from silence', note:'The crescendo that covers an orchestra', dur:'0:16'},
      {label:'With bass drum', note:'The pairing, isolated then in context', dur:'0:12'}
    ],
    prev:'timpani', next:'snare-drum'
  },

  'snare-drum':{
    family:'percussion', name:'Snare Drum', latin:'Tamburo militare',
    epithet:'Military ancestry, and the sharpest attack in the orchestra', status:'live',
    summary:'A small cylindrical drum with wire snares stretched across the lower head, which buzz on every stroke and give it its characteristic rattle. Its attack is sharp enough to define rhythm for the entire orchestra, which is why it drives marches, builds tension and cuts through anything.',
    range:{lo:58, hi:80, note:'Unpitched. Bright, with high-mid energy', transposition:'Non-transposing'},
    timbre:0.85,
    facts:[['Pitch','Unpitched'],['Players','1'],['Snares','On or off']],
    registers:[
      {label:'Snares on', pitch:'Bright', text:'The default. Sharp, rattling, and audible at almost any dynamic.'},
      {label:'Snares off', pitch:'Dry', text:'Becomes a tenor drum, darker and more archaic. Worth specifying deliberately.'},
      {label:'Rim and rimshot', pitch:'Sharp', text:'A crack rather than a stroke. Extremely loud relative to effort.'}
    ],
    characteristics:[
      'Wire snares under the bottom head produce the buzz that defines it.',
      'The roll is a controlled buzz, not measured single strokes, and can sustain indefinitely.',
      'Enormous dynamic range, from barely audible to painfully loud.',
      'Ravel’s Boléro is a single snare pattern for fifteen minutes, which tells you how much the instrument can carry.'
    ],
    articulations:['Single strokes','Roll','Flam','Drag','Rimshot','Brushes','Snares off'],
    blends:[
      {id:'bass-drum', label:'Bass drum', note:'The rhythmic spine of a march'},
      {id:'trumpet', label:'Brass', note:'Sharpens every brass attack it doubles'},
      {id:'timpani', label:'Timpani', note:'Detail over weight'},
      {id:'cymbals', label:'Cymbals', note:'Combined percussion accent'}
    ],
    limits:[
      'It is louder than you think at every dynamic. Mark it softer than feels right.',
      'A roll under a quiet string passage will dominate unless carefully controlled.',
      'Specify snares on or off. The difference is large and players will ask.'
    ],
    demos:[
      {label:'Snares on and off', note:'The same pattern, both settings', dur:'0:14'},
      {label:'Roll and crescendo', note:'The buzz sustained and built', dur:'0:14'},
      {label:'March pattern in context', note:'What the instrument was built for', dur:'0:16'}
    ],
    prev:'cymbals', next:'bass-drum'
  },

  'bass-drum':{
    family:'percussion', name:'Bass Drum', latin:'Gran cassa',
    epithet:'Felt more than heard, which is exactly the point', status:'live',
    summary:'The largest drum in the orchestra, usually a single instrument mounted on a stand and struck with a large soft beater. It contributes almost no pitch and an enormous amount of physical weight. At climaxes it is the difference between loud and overwhelming.',
    range:{lo:24, hi:40, note:'Unpitched. Very low, felt as much as heard', transposition:'Non-transposing'},
    timbre:0.10,
    facts:[['Pitch','Unpitched'],['Drums','1','typical'],['Players','1']],
    registers:[
      {label:'Soft strokes', pitch:'Low', text:'Distant thunder. Almost subliminal under a quiet texture, and unnerving.'},
      {label:'Full strokes', pitch:'Low', text:'The weight under a tutti. Adds size without adding anything audible in the mid range.'},
      {label:'Roll', pitch:'Low', text:'Two mallets, sustained. A slow crescendo here reads as approaching catastrophe.'}
    ],
    characteristics:[
      'Enormous low-frequency energy with very little pitch definition.',
      'Decay is long, so a damped stroke and an open one are different instruments in effect.',
      'One instrument covers the entire orchestra, so balance is entirely in the player’s hands.',
      'Struck near the edge for a drier sound, near the centre for maximum depth.'
    ],
    articulations:['Single strokes','Roll','Damped','Two-mallet roll','Struck with timpani mallets'],
    blends:[
      {id:'cymbals', label:'Cymbals', note:'The classic pairing; weight plus brilliance'},
      {id:'tuba', label:'Low brass', note:'Adds physical size beneath the pitch'},
      {id:'timpani', label:'Timpani', note:'Pitch and weight together'},
      {id:'double-bass', label:'Double basses', note:'Reinforces the bottom without muddying it'}
    ],
    limits:[
      'Overuse flattens a piece. If everything is enormous, nothing is.',
      'Long decay means fast rhythms turn into a wash. Write sparse parts and damp where needed.',
      'It will not be heard on small speakers, only felt on large ones. Do not rely on it to carry information.'
    ],
    demos:[
      {label:'Soft, full and damped', note:'Three strokes, three instruments', dur:'0:14'},
      {label:'Roll and crescendo', note:'The slow build', dur:'0:16'},
      {label:'Under a tutti', note:'With and without, same bar', dur:'0:12'}
    ],
    prev:'snare-drum', next:'gong'
  },

  gong:{
    family:'percussion', name:'Gong', latin:'Tam-tam',
    epithet:'One stroke, and the sound keeps arriving for half a minute', status:'live',
    summary:'A large suspended metal disc, struck with a soft beater. Strictly, a tam-tam is unpitched and a gong is tuned, and orchestras almost always mean the former. Its sound blooms slowly after the strike rather than decaying from it, which no other instrument does.',
    range:{lo:30, hi:60, note:'Unpitched. Broadband, and it blooms after the strike', transposition:'Non-transposing'},
    timbre:0.45,
    facts:[['Pitch','Unpitched (tam-tam)'],['Players','1'],['Decay','20–30','seconds']],
    registers:[
      {label:'Soft strokes', pitch:'Broadband', text:'A shimmer that emerges from nothing. Extraordinary under quiet strings.'},
      {label:'Full strokes', pitch:'Broadband', text:'Vast, slow and enveloping. It takes seconds to reach full volume.'},
      {label:'Damped', pitch:'Short', text:'Stopped with the hands, which requires real physical effort on a large instrument.'}
    ],
    characteristics:[
      'The sound blooms after the strike rather than starting at full volume.',
      'Decay runs twenty to thirty seconds and cannot be hurried without damping.',
      'Effective at both extremes of dynamic and slightly awkward in between.',
      'Frequently used for ritual, death and the supernatural, to the point of cliché. Use it knowingly.'
    ],
    articulations:['Struck','Rolled','Damped','Scraped','Water gong'],
    blends:[
      {id:'bass-drum', label:'Bass drum', note:'Impact plus bloom'},
      {id:'cymbals', label:'Cymbals', note:'Brilliance over the tam-tam’s slower spread'},
      {id:'double-bass', label:'Low strings', note:'The gong extends what the basses start'},
      {id:'timpani', label:'Timpani', note:'Defined attack against undefined resonance'}
    ],
    limits:[
      'Nothing quiet survives underneath it for several seconds. Write the silence after it.',
      'It cannot be stopped quickly without an audible damping noise.',
      'Its associations are strong and specific. One stroke reads as significant whether you meant it or not.'
    ],
    demos:[
      {label:'Soft to full stroke', note:'The bloom, at both dynamics', dur:'0:18'},
      {label:'Full decay, unedited', note:'How long it actually takes', dur:'0:30'},
      {label:'Under low strings', note:'Where the two blend into one sound', dur:'0:16'}
    ],
    prev:'bass-drum', next:'celesta'
  },

  celesta:{
    family:'percussion', name:'Celesta', latin:'Celesta',
    epithet:'A piano action striking metal bars, and the sound of everything enchanted', status:'live',
    summary:'Invented in 1886, played from a keyboard, with hammers striking steel plates over wooden resonators. Tchaikovsky used it for the Sugar Plum Fairy before anyone else could get hold of one, and it has meant magic ever since. That specificity of association is both its gift and its trap.',
    range:{lo:60, hi:108, note:'C4 – C8 sounding', transposition:'Sounds an octave higher than written'},
    timbre:0.86,
    facts:[['Sounding range','C4 – C8'],['Players','1'],['Transposition','Octave above written']],
    registers:[
      {label:'Low register', pitch:'C4 – B4', text:'Soft and slightly dull. The least useful part of the instrument.'},
      {label:'Middle register', pitch:'C5 – B6', text:'The characteristic bell-like shimmer. Everything memorable is written here.'},
      {label:'High register', pitch:'C7 – C8', text:'Delicate, glassy and very quiet. Beautiful, and easily lost.'}
    ],
    characteristics:[
      'Keyboard-operated, so chords, runs and two-hand writing are all straightforward.',
      'Very quiet. It needs a thin texture or careful orchestration to be heard at all.',
      'Notated an octave below sounding, like the piccolo in reverse.',
      'Frequently doubled with harp or glockenspiel to give it enough presence to register.'
    ],
    articulations:['Legato','Staccato','Arpeggios','Trills','Damper pedal'],
    blends:[
      {id:'harp', label:'Harp', note:'Both plucked-attack colours; the pairing sounds larger than either'},
      {id:'flute', label:'Flute', note:'Air around the bell tone'},
      {id:'violin', label:'Violin harmonics', note:'Two glassy timbres, barely distinguishable'},
      {id:'snare-drum', label:'Light percussion', note:'Sparkle that reinforces the attack'}
    ],
    limits:[
      'It is very quiet. Write it over almost nothing, or double it, or it will not be heard.',
      'The bottom octave is weak enough to be barely worth using.',
      'Its associations are extremely strong. Any celesta line reads as magical whether or not you want it to.'
    ],
    demos:[
      {label:'Signature phrase', note:'Same eight bars as every instrument in the atlas', dur:'0:12'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:16'},
      {label:'With harp', note:'The doubling that makes it audible', dur:'0:14'}
    ],
    prev:'gong', next:''
  }
};


/* ============================================================================
   GALLERY. Shared placeholder set. Swap per instrument later via
   INSTRUMENTS[id].gallery = ['videoId', ...]; these are all official
   orchestra / label channel uploads, embedded through YouTube's own player
   with attribution and a link back to the source.
   ============================================================================ */
/* ============================================================================
   STUDIO
   ----------------------------------------------------------------------------
   The dock at the bottom of every page. Each passage is the same music rendered
   once per part, and once per section size within a part, so any combination
   stacks in time and can be crossfaded without restarting.

   Adding a theme: drop a folder of renders into audio/<id>/ and add one entry
   to PASSAGES. Nothing else in the codebase needs to change.
   ============================================================================ */

const AUDIO = { base:'audio/', ext:'aac' };

/* One family palette for the whole site. The studio brief proposed a second
   set, but it assigned gold to brass, and gold already means "the thing you
   are currently looking at" everywhere in the atlas, including the audible
   note blocks and the playhead in this very dock. Two meanings for one colour
   in one widget is a real collision, so the timbre chart's palette wins and
   atlas.js reads FAM_COLOR from here. */
const STUDIO_FAM = {
  strings:'#9B8FD4', woodwinds:'#5FB89A', brass:'#6C9BD8', percussion:'#C9834F'
};

const PASSAGES = {

  'theme-1': {
    title:   'Theme 1',
    subtitle:'Horn melody with octave doublings',
    tempo:   73,
    beats:   4,
    bars:    7,
    tracks: [
      { id:'flute', instrument:'flute', family:'woodwinds', role:'Doubling, 8va',
        variants:[ {v:'1', label:'Solo', file:'flute_1'} ],
        notes:[ [0,1.156,72], [0.928,0.906,67], [1.667,4.25,79], [6.407,0.812,72], [7.136,0.875,79],
                [7.938,1.719,80], [9.49,1.146,77], [10.511,2.323,84], [13.115,2.531,79], [15.553,1.76,75],
                [17.073,0.625,74], [17.626,0.469,72], [18.021,2.208,74], [20.49,1.688,67], [22.042,0.938,70],
                [22.876,4.042,72] ] },

      { id:'horn', instrument:'horn', family:'brass', role:'Melody',
        variants:[ {v:'1',  label:'Solo', file:'horn_1'},
                   {v:'4',  label:'4',    file:'horn_4'},
                   {v:'6',  label:'6',    file:'horn_6'},
                   {v:'12', label:'12',   file:'horn_12'} ],
        notes:[ [0,1.156,60], [0.928,0.906,55], [1.667,4.25,67], [6.407,0.812,60], [7.136,0.875,67],
                [7.938,1.719,68], [9.49,1.146,65], [10.511,2.323,72], [13.115,2.531,67], [15.553,1.76,63],
                [17.073,0.625,62], [17.626,0.469,60], [18.021,2.208,62], [20.49,1.688,55], [22.042,0.938,58],
                [22.876,4.042,60] ] },

      { id:'cello', instrument:'cello', family:'strings', role:'Doubling, 8vb',
        variants:[ {v:'1',   label:'Solo',    file:'cello_1'},
                   {v:'ens', label:'Section', file:'cello_ens'} ],
        notes:[ [0,1.156,48], [0.928,0.906,43], [1.667,4.25,55], [6.407,0.812,48], [7.136,0.875,55],
                [7.938,1.719,56], [9.49,1.146,53], [10.511,2.323,60], [13.115,2.531,55], [15.553,1.76,51],
                [17.073,0.625,50], [17.626,0.469,48], [18.021,2.208,50], [20.49,1.688,43], [22.042,0.938,46],
                [22.876,4.042,48] ] }
    ]
  }

};

const GALLERY = [
  {v:'9aDEq3u5huA', title:'Beethoven, Symphony No. 5', perf:'Berliner Philharmoniker · Herbert von Karajan', why:'The most famous motif in music, developed for four movements', chan:'Berliner Philharmoniker'},
  {v:'a9UApyClFKA', title:'Beethoven, Symphony No. 5 (complete)', perf:'Concertgebouworkest · Iván Fischer', why:'A modern reading, filmed close enough to watch the sections work', chan:'Concertgebouworkest'},
  {v:'P_1N6_O254g', title:'Dvořák, Symphony No. 9, "From the New World"', perf:'Berliner Philharmoniker · Herbert von Karajan', why:'The cor anglais Largo: woodwind as the emotional centre', chan:'Berliner Philharmoniker'},
  {v:'pGdtkUiKaA8', title:'Dvořák, Symphony No. 9, IV. Allegro con fuoco', perf:'Wiener Philharmoniker', why:'Brass fanfare writing, and how the horns carry a hall', chan:'Wiener Philharmoniker'},
  {v:'hvPlV56VtFs', title:'Dvořák, Symphony No. 9 (full performance)', perf:'Cristian Măcelaru, conductor', why:'Full-length, useful for following orchestration across a whole arc', chan:'Official concert upload'},
  {v:'8UfpgT9FMAk', title:'Holst, The Planets: Mars, the Bringer of War', perf:'Berliner Philharmoniker · Herbert von Karajan', why:'The col legno ostinato against sustained brass: two layers, total clarity', chan:'Universal Music Group'},
  {v:'sHsFIv8VA7w', title:'Mahler, Symphony No. 2, "Resurrection"', perf:'Concertgebouworkest · Mariss Jansons', why:'Extremes of dynamic range, from near-silence to full forces', chan:'Concertgebouworkest'},
  {v:'j2Hk2SZGrRY', title:'Mahler, Symphony No. 8, "Symphony of a Thousand"', perf:'Berliner Philharmoniker · Sir Simon Rattle', why:'What the Maximum tier on the ensemble slider actually looks like', chan:'Berliner Philharmoniker'},
  {v:'GrrvAHhWKIw', title:'Mahler, Symphony No. 9', perf:'Berliner Philharmoniker · Kirill Petrenko', why:'Late-Romantic orchestration at its most transparent', chan:'Berliner Philharmoniker'}
];

/* ============================================================================
   2. PLATE ART. Placeholder line engravings.
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

  /* Woodwinds. The flute and piccolo lie diagonally because they are played
     across the body; the reeds stand upright. Conical bores (oboe, bassoon)
     have visibly diverging sides, the cylindrical clarinet has parallel ones,
     the same distinction the entries talk about. */
  piccolo:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g transform="rotate(-38 150 260)" stroke-width="1.3">
      <rect x="60" y="244" width="180" height="24" rx="12" opacity=".85"/>
      <line x1="96" y1="244" x2="96" y2="268" opacity=".5"/>
      <line x1="204" y1="244" x2="204" y2="268" opacity=".5"/>
      <ellipse cx="76" cy="256" rx="6.5" ry="4.6" opacity=".9"/>
      <path d="M60 248c-6 2-6 14 0 16" opacity=".6"/>
      <g opacity=".9">
        <ellipse cx="116" cy="256" rx="6.4" ry="6"/><ellipse cx="134" cy="256" rx="6.4" ry="6"/>
        <ellipse cx="152" cy="256" rx="6.4" ry="6"/><ellipse cx="176" cy="256" rx="6.4" ry="6"/>
        <ellipse cx="194" cy="256" rx="6.4" ry="6"/><ellipse cx="216" cy="256" rx="5.4" ry="5"/>
      </g>
      <g opacity=".45" stroke-width="1">
        <line x1="110" y1="244" x2="122" y2="244"/><line x1="146" y1="244" x2="158" y2="244"/>
        <line x1="126" y1="268" x2="142" y2="268"/><line x1="170" y1="268" x2="184" y2="268"/>
      </g>
      <path d="M228 247c7 3 7 15 0 18" opacity=".7"/>
    </g>
    <g opacity=".22" stroke-width=".8">
      <path d="M96 452c34-16 66-44 92-78"/><path d="M108 464c38-18 74-50 102-88"/>
    </g>
  </svg>`,

  oboe:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <path d="M146 94l4-32 4 32" opacity=".9"/>
      <path d="M144 94h12" opacity=".6"/>
      <path d="M143 96L133 384" opacity=".92"/>
      <path d="M157 96L167 384" opacity=".92"/>
      <path d="M141 154h18M138 250h24" opacity=".5"/>
      <g opacity=".85">
        <ellipse cx="150" cy="186" rx="6" ry="5"/><ellipse cx="150" cy="214" rx="6" ry="5"/>
        <ellipse cx="150" cy="286" rx="6.5" ry="5.5"/><ellipse cx="150" cy="318" rx="6.5" ry="5.5"/>
      </g>
      <g opacity=".5" stroke-width="1">
        <path d="M139 172h-8v28h8"/><path d="M161 232h8v26h-8"/><path d="M137 300h-9v34h9"/>
      </g>
      <path d="M133 384c-4 22-10 36-15 46" opacity=".92"/>
      <path d="M167 384c4 22 10 36 15 46" opacity=".92"/>
      <ellipse cx="150" cy="432" rx="32" ry="9" opacity=".95"/>
      <ellipse cx="150" cy="432" rx="22" ry="6" opacity=".35"/>
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M206 300c8 30 8 66-4 94"/><path d="M214 292c8 34 8 74-4 106"/>
    </g>
  </svg>`,

  clarinet:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <path d="M143 104c0-26 3-44 7-50 4 6 7 24 7 50" opacity=".9"/>
      <path d="M143 86h14M143 94h14" opacity=".45"/>
      <rect x="141" y="104" width="18" height="26" rx="4" opacity=".85"/>
      <path d="M143 130v258M157 130v258" opacity=".92"/>
      <path d="M141 256h18" opacity=".5"/>
      <g opacity=".85">
        <ellipse cx="150" cy="164" rx="6" ry="5"/><ellipse cx="150" cy="192" rx="6" ry="5"/>
        <ellipse cx="150" cy="220" rx="6" ry="5"/><ellipse cx="150" cy="292" rx="6" ry="5"/>
        <ellipse cx="150" cy="322" rx="6" ry="5"/>
      </g>
      <g opacity=".5" stroke-width="1">
        <path d="M141 150h-9v26h9"/><path d="M159 206h9v28h-9"/><path d="M141 306h-9v32h9"/>
      </g>
      <path d="M143 388c-6 26-14 42-21 52" opacity=".92"/>
      <path d="M157 388c6 26 14 42 21 52" opacity=".92"/>
      <ellipse cx="150" cy="442" rx="30" ry="9" opacity=".95"/>
      <ellipse cx="150" cy="442" rx="20" ry="6" opacity=".35"/>
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M204 306c8 30 8 64-4 92"/><path d="M212 298c8 34 8 72-4 104"/>
    </g>
  </svg>`,

  bassoon:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <ellipse cx="168" cy="92" rx="17" ry="7" opacity=".95"/>
      <path d="M151 92c1 22 4 36 7 46" opacity=".9"/>
      <path d="M185 92c-1 22-4 36-7 46" opacity=".9"/>
      <path d="M158 138v290M178 138v290" opacity=".92"/>
      <path d="M124 200v228M140 200v228" opacity=".92"/>
      <path d="M124 428v18c0 17 12 27 27 27s27-10 27-27v-18" opacity=".92"/>
      <path d="M140 428v14c0 6 5 9 11 9s11-3 11-9v-14" opacity=".55"/>
      <path d="M132 200c-6-26-22-46-42-54" opacity=".9"/>
      <path d="M90 146l-12-6" opacity=".85"/>
      <path d="M78 140l-11-7M78 140l-9-9" opacity=".8"/>
      <path d="M156 176h24M156 300h24M122 264h20" opacity=".45"/>
      <g opacity=".85">
        <ellipse cx="132" cy="228" rx="5.5" ry="4.5"/><ellipse cx="132" cy="300" rx="5.5" ry="4.5"/>
        <ellipse cx="168" cy="212" rx="5.5" ry="4.5"/><ellipse cx="168" cy="356" rx="5.5" ry="4.5"/>
      </g>
      <g opacity=".5" stroke-width="1">
        <path d="M124 246h-9v34h9"/><path d="M178 236h9v40h-9"/><path d="M140 330h9v30h-9"/>
      </g>
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M212 300c8 30 8 66-4 94"/><path d="M220 292c8 34 8 74-4 106"/>
    </g>
  </svg>`,

  /* Percussion. These are objects rather than tubes, so they are drawn as
     objects: a struck surface, the thing holding it up, and whatever strikes
     it. The stand matters as much as the instrument for recognising them at
     this size. */
  timpani:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <ellipse cx="150" cy="196" rx="96" ry="34" opacity=".95"/>
      <ellipse cx="150" cy="196" rx="80" ry="27" opacity=".35"/>
      <path d="M54 196c2 62 26 112 50 136" opacity=".92"/>
      <path d="M246 196c-2 62-26 112-50 136" opacity=".92"/>
      <path d="M104 332c14 12 28 18 46 18s32-6 46-18" opacity=".92"/>
      <g opacity=".55">
        <path d="M66 216v22M96 228v20M150 232v20M204 228v20M234 216v22"/>
        <circle cx="66" cy="243" r="4"/><circle cx="96" cy="253" r="4"/><circle cx="150" cy="257" r="4"/>
        <circle cx="204" cy="253" r="4"/><circle cx="234" cy="243" r="4"/>
      </g>
      <path d="M150 350v54" opacity=".85"/>
      <path d="M108 424l42-20 42 20" opacity=".8"/>
      <path d="M96 434h108" opacity=".7"/>
      <path d="M150 404v30" opacity=".6"/>
      <g opacity=".75">
        <line x1="214" y1="122" x2="248" y2="176"/><ellipse cx="212" cy="116" rx="9" ry="7" transform="rotate(-58 212 116)"/>
        <line x1="238" y1="108" x2="266" y2="158"/><ellipse cx="236" cy="102" rx="9" ry="7" transform="rotate(-58 236 102)"/>
      </g>
    </g>
    <g opacity=".2" stroke-width=".8"><path d="M262 250c9 30 9 66-4 94"/><path d="M270 242c9 34 9 74-4 106"/></g>
  </svg>`,

  cymbals:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <path d="M40 214c30-26 70-40 110-40s80 14 110 40" opacity=".95"/>
      <path d="M40 214c30 14 70 22 110 22s80-8 110-22" opacity=".92"/>
      <ellipse cx="150" cy="180" rx="24" ry="9" opacity=".8"/>
      <circle cx="150" cy="180" r="3" opacity=".7"/>
      <path d="M150 189v230" opacity=".85"/>
      <path d="M108 440l42-24 42 24" opacity=".8"/>
      <path d="M92 452h116" opacity=".7"/>
      <path d="M150 419v33" opacity=".6"/>
      <g opacity=".4">
        <path d="M74 224c26 10 50 16 76 18M226 224c-26 10-50 16-76 18"/>
      </g>
      <g opacity=".75">
        <line x1="246" y1="288" x2="212" y2="230"/>
        <path d="M250 296c8-4 10-14 4-20-6-5-14-2-16 5" opacity=".9"/>
      </g>
    </g>
    <g opacity=".2" stroke-width=".8"><path d="M52 300c-10 28-12 62-4 92"/><path d="M44 292c-12 32-14 70-4 104"/></g>
  </svg>`,

  'snare-drum':`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <ellipse cx="150" cy="196" rx="86" ry="30" opacity=".95"/>
      <ellipse cx="150" cy="196" rx="72" ry="24" opacity=".35"/>
      <path d="M64 196v66M236 196v66" opacity=".92"/>
      <path d="M64 262c0 17 39 30 86 30s86-13 86-30" opacity=".92"/>
      <g opacity=".5">
        <path d="M78 206v50M112 214v52M150 216v54M188 214v52M222 206v50"/>
        <path d="M74 206h8M108 214h8M146 216h8M184 214h8M218 206h8"/>
      </g>
      <g opacity=".45"><path d="M92 272h116M96 280h108"/></g>
      <path d="M92 292l-24 108M208 292l24 108" opacity=".8"/>
      <path d="M150 292v112" opacity=".8"/>
      <path d="M64 412h172" opacity=".7"/>
      <g opacity=".75">
        <line x1="196" y1="120" x2="228" y2="168"/><circle cx="232" cy="174" r="5"/>
        <line x1="218" y1="110" x2="248" y2="156"/><circle cx="252" cy="162" r="5"/>
      </g>
    </g>
    <g opacity=".2" stroke-width=".8"><path d="M46 300c-10 28-12 62-4 92"/><path d="M38 292c-12 32-14 70-4 104"/></g>
  </svg>`,

  'bass-drum':`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <circle cx="150" cy="242" r="118" opacity=".95"/>
      <circle cx="150" cy="242" r="104" opacity=".4"/>
      <circle cx="150" cy="242" r="96" opacity=".2"/>
      <g opacity=".5">
        <path d="M150 124v-14M150 360v14M32 242h-14M268 242h14"/>
        <path d="M67 159l-10-10M233 159l10-10M67 325l-10 10M233 325l10 10"/>
      </g>
      <path d="M46 316L34 424M254 316l12 108" opacity=".8"/>
      <path d="M28 430h56M216 430h56" opacity=".7"/>
      <path d="M56 350v76M244 350v76" opacity=".5"/>
      <g opacity=".8">
        <line x1="196" y1="196" x2="252" y2="150"/>
        <ellipse cx="190" cy="201" rx="14" ry="11" transform="rotate(-40 190 201)"/>
      </g>
    </g>
    <g opacity=".2" stroke-width=".8"><path d="M28 258c-12 26-16 58-10 88"/></g>
  </svg>`,

  gong:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <circle cx="150" cy="230" r="106" opacity=".95"/>
      <circle cx="150" cy="230" r="92" opacity=".3"/>
      <circle cx="150" cy="230" r="58" opacity=".22"/>
      <circle cx="150" cy="230" r="26" opacity=".35"/>
      <path d="M150 124V96" opacity=".7"/>
      <path d="M52 96h196" opacity=".9"/>
      <path d="M52 96v330M248 96v330" opacity=".9"/>
      <path d="M22 434h60M218 434h60" opacity=".75"/>
      <path d="M52 426l-14 8M248 426l14 8" opacity=".55"/>
      <g opacity=".8">
        <line x1="196" y1="286" x2="248" y2="336"/>
        <ellipse cx="190" cy="280" rx="15" ry="12" transform="rotate(-42 190 280)"/>
      </g>
    </g>
    <g opacity=".2" stroke-width=".8"><path d="M270 200c12 34 12 76-4 110"/></g>
  </svg>`,

  celesta:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <path d="M52 148h196v148H52z" opacity=".95"/>
      <path d="M52 176h196" opacity=".5"/>
      <path d="M64 296h172v34H64z" opacity=".9"/>
      <g opacity=".55">
        <path d="M78 296v34M96 296v34M114 296v34M132 296v34M150 296v34M168 296v34M186 296v34M204 296v34M222 296v34"/>
      </g>
      <g opacity=".85">
        <path d="M72 296v20h10v-20zM104 296v20h10v-20zM122 296v20h10v-20z"/>
        <path d="M158 296v20h10v-20zM190 296v20h10v-20zM208 296v20h10v-20z"/>
      </g>
      <g opacity=".35">
        <path d="M72 196v66M92 196v66M112 196v66M132 196v66M152 196v66M172 196v66M192 196v66M212 196v66M232 196v66"/>
      </g>
      <path d="M70 330v82M230 330v82" opacity=".85"/>
      <path d="M56 412h28M216 412h28" opacity=".7"/>
      <path d="M70 356h160" opacity=".4"/>
      <path d="M116 148v-16h68v16" opacity=".6"/>
    </g>
    <g opacity=".2" stroke-width=".8"><path d="M262 232c10 30 10 66-4 96"/><path d="M270 224c10 34 10 74-4 108"/></g>
  </svg>`,

  /* Brass. Drawn as tubing rather than as objects: the trumpet lies on a
     diagonal so its cylindrical run is visible end to end, the trombone shows
     slide and bell as two separate tube systems, and the tuba stands upright
     because that is the only way its bell reads at this size. */
  trumpet:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g transform="rotate(-30 150 260)" stroke-width="1.3">
      <ellipse cx="30" cy="234" rx="9" ry="6" opacity=".9"/>
      <path d="M39 230h74M39 240h74" opacity=".9"/>
      <g opacity=".92">
        <rect x="113" y="212" width="16" height="56" rx="8"/>
        <rect x="136" y="212" width="16" height="56" rx="8"/>
        <rect x="159" y="212" width="16" height="56" rx="8"/>
        <line x1="121" y1="212" x2="121" y2="198"/><circle cx="121" cy="192" r="5"/>
        <line x1="144" y1="212" x2="144" y2="198"/><circle cx="144" cy="192" r="5"/>
        <line x1="167" y1="212" x2="167" y2="198"/><circle cx="167" cy="192" r="5"/>
      </g>
      <path d="M175 228h38M175 244h38" opacity=".9"/>
      <path d="M121 268v24c0 8 6 12 14 12h22" opacity=".55"/>
      <path d="M167 268v16h30" opacity=".55"/>
      <path d="M213 226C232 222 250 210 262 190" opacity=".92"/>
      <path d="M213 246C232 250 250 262 262 282" opacity=".92"/>
      <ellipse cx="262" cy="236" rx="8" ry="46" opacity=".95"/>
      <ellipse cx="262" cy="236" rx="4.5" ry="31" opacity=".3"/>
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M92 452c36-16 68-46 94-80"/><path d="M104 464c40-18 76-52 104-90"/>
    </g>
  </svg>`,

  trombone:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g transform="rotate(-32 150 260)" stroke-width="1.3">
      <ellipse cx="62" cy="250" rx="8" ry="36" opacity=".95"/>
      <ellipse cx="62" cy="250" rx="5" ry="24" opacity=".3"/>
      <path d="M62 214C84 222 104 232 122 240" opacity=".92"/>
      <path d="M62 286C84 278 104 268 122 260" opacity=".92"/>
      <path d="M122 240h116" opacity=".9"/>
      <path d="M122 260h116" opacity=".9"/>
      <path d="M238 240c15 0 22 5 22 10s-7 10-22 10" opacity=".9"/>
      <path d="M112 286h126" opacity=".85"/>
      <path d="M112 304h126" opacity=".85"/>
      <path d="M238 286c13 0 19 4 19 9s-6 9-19 9" opacity=".85"/>
      <path d="M132 286v18M226 286v18" opacity=".45"/>
      <path d="M112 295H88" opacity=".85"/>
      <ellipse cx="80" cy="295" rx="8" ry="5.5" opacity=".9"/>
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M96 456c36-18 68-48 92-82"/><path d="M108 468c40-20 76-54 102-92"/>
    </g>
  </svg>`,

  tuba:`<svg viewBox="0 0 300 520" fill="none" stroke="#D4A04A" stroke-linecap="round">
    <g stroke-width="1.3">
      <ellipse cx="132" cy="92" rx="52" ry="16" opacity=".95"/>
      <ellipse cx="132" cy="92" rx="36" ry="11" opacity=".3"/>
      <path d="M80 92c6 46 20 76 32 96" opacity=".92"/>
      <path d="M184 92c-6 44-16 70-26 92" opacity=".92"/>
      <path d="M112 188c-6 40-7 108 0 148" opacity=".9"/>
      <path d="M158 184c7 40 8 112 1 152" opacity=".9"/>
      <path d="M112 336c4 30 16 46 24 46s21-16 23-46" opacity=".92"/>
      <path d="M159 208h10M159 258h10" opacity=".55"/>
      <g opacity=".92">
        <rect x="164" y="196" width="16" height="54" rx="8"/>
        <rect x="186" y="192" width="16" height="54" rx="8"/>
        <rect x="208" y="188" width="16" height="54" rx="8"/>
        <line x1="172" y1="196" x2="172" y2="182"/><circle cx="172" cy="176" r="5"/>
        <line x1="194" y1="192" x2="194" y2="178"/><circle cx="194" cy="172" r="5"/>
        <line x1="216" y1="188" x2="216" y2="174"/><circle cx="216" cy="168" r="5"/>
      </g>
      <path d="M224 194c17-3 27-13 31-27" opacity=".85"/>
      <ellipse cx="257" cy="159" rx="8" ry="6" transform="rotate(-34 257 159)" opacity=".9"/>
      <path d="M166 250v22h56v-26" opacity=".5"/>
    </g>
    <g opacity=".2" stroke-width=".8">
      <path d="M244 316c9 30 9 68-4 96"/><path d="M252 308c9 34 9 76-4 108"/>
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
  piccolo:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><g transform="rotate(-38 20 26)"><rect x="8" y="23" width="24" height="6" rx="3"/><circle cx="15" cy="26" r="1.7"/><circle cx="20" cy="26" r="1.7"/><circle cx="25" cy="26" r="1.7"/></g></svg>`,
  oboe:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><path d="M20 4v6"/><path d="M17 10L13 38"/><path d="M23 10l4 28"/><path d="M13 38c-1 5-3 7-4 9M27 38c1 5 3 7 4 9"/><ellipse cx="20" cy="47" rx="11" ry="3"/><g opacity=".5"><circle cx="20" cy="20" r="1.6"/><circle cx="20" cy="30" r="1.6"/></g></svg>`,
  clarinet:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><path d="M17 11c0-5 1-8 3-9 2 1 3 4 3 9"/><path d="M17 11v27M23 11v27"/><path d="M17 38c-2 5-4 7-6 9M23 38c2 5 4 7 6 9"/><ellipse cx="20" cy="47" rx="10" ry="3"/><g opacity=".5"><circle cx="20" cy="19" r="1.6"/><circle cx="20" cy="29" r="1.6"/></g></svg>`,
  bassoon:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><ellipse cx="26" cy="6" rx="4" ry="1.8"/><path d="M22 6v34M30 6v34"/><path d="M11 15v25M18 15v25"/><path d="M11 40c0 5 4 8 9.5 8s9.5-3 9.5-8"/><path d="M13 15c-2-5-5-7-8-8"/></svg>`,
  timpani:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><ellipse cx="20" cy="18" rx="14" ry="5"/><path d="M6 18c0 9 4 16 8 19M34 18c0 9-4 16-8 19"/><path d="M14 37c2 2 4 3 6 3s4-1 6-3"/><path d="M20 40v6"/><path d="M13 50l7-4 7 4"/></svg>`,
  cymbals:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><path d="M5 20c4-4 9-6 15-6s11 2 15 6"/><path d="M5 20c4 2 9 3 15 3s11-1 15-3"/><ellipse cx="20" cy="16" rx="3.5" ry="1.5"/><path d="M20 23v22"/><path d="M14 49l6-4 6 4"/></svg>`,
  'snare-drum':`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><ellipse cx="20" cy="18" rx="13" ry="5"/><path d="M7 18v9M33 18v9"/><path d="M7 27c0 3 6 5 13 5s13-2 13-5"/><path d="M11 33l-4 14M29 33l4 14M20 33v14"/><path d="M6 48h28" opacity=".7"/></svg>`,
  'bass-drum':`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><circle cx="20" cy="23" r="16"/><circle cx="20" cy="23" r="12" opacity=".45"/><path d="M8 34l-2 13M32 34l2 13"/><path d="M3 49h7M30 49h7" opacity=".7"/></svg>`,
  gong:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><circle cx="20" cy="26" r="14"/><circle cx="20" cy="26" r="8" opacity=".4"/><circle cx="20" cy="26" r="3" opacity=".5"/><path d="M20 12V8"/><path d="M6 8h28M6 8v40M34 8v40"/></svg>`,
  celesta:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><path d="M6 12h28v20H6z"/><path d="M8 32h24v7H8z"/><g opacity=".55"><path d="M12 32v7M16 32v7M20 32v7M24 32v7M28 32v7"/></g><path d="M10 39v9M30 39v9"/><path d="M6 48h8M26 48h8" opacity=".7"/></svg>`,
  trumpet:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><g transform="rotate(-30 20 26)"><circle cx="5" cy="23" r="1.8"/><path d="M7 23h6"/><rect x="13" y="19.5" width="3" height="8" rx="1.5"/><rect x="17.5" y="19.5" width="3" height="8" rx="1.5"/><rect x="22" y="19.5" width="3" height="8" rx="1.5"/><path d="M25.5 23h4"/><path d="M29.5 20.5c3-1 5-3 6-5M29.5 25.5c3 1 5 3 6 5"/><ellipse cx="35.5" cy="23" rx="1.6" ry="5.5"/></g></svg>`,
  trombone:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><g transform="rotate(-32 20 26)"><ellipse cx="5" cy="22" rx="1.8" ry="6"/><path d="M5 16c4 2 8 4 11 5M5 28c4-2 8-4 11-5"/><path d="M16 21h17c2.5 0 3.5 1 3.5 2s-1 2-3.5 2H16"/><path d="M14 29h19c2 0 3 .8 3 1.8s-1 1.8-3 1.8H14"/><path d="M14 29v3.6"/></g></svg>`,
  tuba:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><ellipse cx="17" cy="9" rx="9" ry="3"/><path d="M8 9c1 8 3 14 5 19M26 9c-1 8-3 13-4 18"/><path d="M13 28c-2 7-2 14 0 20M22 26c2 7 2 15 0 22"/><path d="M13 48c1 3 3 4 5 4s4-1 4-4"/><g opacity=".8"><rect x="24" y="24" width="3" height="8" rx="1.5"/><rect x="28" y="22" width="3" height="8" rx="1.5"/></g></svg>`,
  horn:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><circle cx="18" cy="23" r="13"/><circle cx="18" cy="23" r="8" opacity=".5"/><ellipse cx="29" cy="41" rx="8" ry="4" transform="rotate(-24 29 41)"/></svg>`,
  violin: stringThumb({t:16, u:5, n:5}),
  viola: stringThumb({t:17, u:6, n:6}),
  'double-bass': stringThumb({t:15, u:7, n:4}),
  harp:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><path d="M11 44V17c0-9 7-14 14-15"/><path d="M25 2c5 0 7 4 8 10l4 32"/><path d="M11 44h26"/><g opacity=".5" stroke-width=".7"><line x1="15" y1="41" x2="26" y2="12"/><line x1="21" y1="41" x2="30" y2="20"/><line x1="27" y1="41" x2="33" y2="28"/></g></svg>`,
  cello:`<svg viewBox="0 0 40 52" fill="none" stroke="#D4A04A" stroke-width="1.1" opacity=".85"><path d="M20 18c6 0 10 5 10 11 0 5-5 7-6 10-2 4 5 6 8 13 3 8 1 22-12 22"/><path d="M20 18c-6 0-10 5-10 11 0 5 5 7 6 10 2 4-5 6-8 13-3 8-1 22 12 22"/><path d="M20 18V6"/></svg>`
};
