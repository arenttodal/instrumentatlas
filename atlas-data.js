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
   range:  MIDI note numbers (60 = middle C). For unpitched percussion it is
           where the body of the sound sits, not a playable range.
   timbre: 0 = dark … 1 = bright. Nothing reads this since the Timbre tab
           became a frequency map; kept because it is the only single-number
           summary of tone colour in the file.
   harmonics: the top of the useful overtone content, in Hz. The fundamentals
           come from range; this is where the spectrum above them runs out.
           Approximate, as every published instrument frequency chart says of
           its own numbers: a cymbal has no single ceiling, it has a taper.
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
   maximum tier follows Schoenberg's Gurrelieder (20-20-16-16-12 strings, 10 horns),
   except the violins, which are 18 + 18 by editorial decision: the violin page
   reads its "Section size" fact off the first and last entries of this row, and
   it should say 2–36. Change one and you change the other. */
const TIERS = [
  {id:'quartet',  label:'Quartet / Quintet', tick:'Quartet',  players:'4–5',    era:'Chamber music'},
  {id:'chamber',  label:'Chamber orchestra', tick:'Chamber',  players:'25–40',  era:'Sinfonietta, baroque revival'},
  {id:'classical',label:'Classical orchestra',tick:'Classical',players:'35–45', era:'Haydn, Mozart'},
  {id:'romantic', label:'Romantic orchestra',tick:'Romantic', players:'65–80',  era:'Brahms, Tchaikovsky'},
  {id:'symphony', label:'Full symphony',     tick:'Symphony', players:'90–100', era:'Stravinsky, Strauss, film scoring'},
  {id:'maximum',  label:'Maximum forces',    tick:'Maximum',  players:'120+',   era:'Mahler 8, Gurrelieder'}
];

const FAMILIES = [
  { id:'strings', name:'Strings', tagline:'The bread and butter', video:'video/strings.mp4',
    lede:'The most versatile family in the orchestra: staccato chase scenes, sweeping romantic themes, harmonic beds, rhythmic accents. The bread and butter of orchestral writing.',
    role:[
      '<b>Pitch flexibility.</b> Any pitch in range, including microtones and glissandi.',
      '<b>No breathing.</b> Sustained lines can run indefinitely.',
      '<b>Speed and dexterity.</b> Fast runs, scales and arpeggios sit comfortably.',
      '<b>Multiple notes at once.</b> Double and triple stops, within limits.',
      '<b>Range shapes colour.</b> Dark and warm below, bright and penetrating above.'
    ],
    demos:[
      {label:'Mozart 40', note:'High violins carrying a fast, urgent melody', file:'mozart-40'},
      {label:'Beethoven 5', note:'The full string section playing the opening theme in perfect unison', file:'beethoven-5'},
      {label:'Tchaikovsky 4', note:'The entire string section pizzicato, plucked rather than bowed', file:'tchaikovsky-4'}
    ],
    smallName:'String quartet',
    sizes:{
      violin:       ['1 + 1','6 + 5','8 + 6','12 + 10','16 + 14','18 + 18'],
      viola:        [1, 4, 4, 8, 12, 16],
      cello:        [1, 3, 3, 6, 10, 16],
      'double-bass':[0, 1, 2, 4, 8, 12],
      harp:         [0, 0, 0, 1, 1, 2]
    },
    members:['violin','viola','cello','double-bass','harp'] },

  { id:'woodwinds', name:'Woodwinds', tagline:'The overlooked colours', video:'video/woodwinds.mp4',
    lede:'Beautiful and versatile, able to play everything from lyrical melodies, to quick runs and arpeggios, and ultra soft airy textures. Often overlooked in modern epic writing, but adds colors and textures that breathe a ton of life into orchestrations.',
    role:[
      '<b>Two mechanisms.</b> Edge-tone flutes, and reeds: single (clarinet) or double (oboe, bassoon).',
      '<b>Fast and intricate.</b> Runs and arpeggios are idiomatic, not a stretch.',
      '<b>One note at a time.</b> Monophonic, but arpeggios cover harmonic ground.',
      '<b>Breath is structural.</b> Phrases need rests, or the mockup stops sounding human.'
    ],
    demos:[
      {label:'Beethoven 6', note:'Flute, oboe and clarinet as a trio, imitating birdsong', file:'beethoven-6'},
      {label:'Tchaikovsky 4', note:'A fast, playful melody played by the woodwinds alone', file:'tchaikovsky-4'},
      {label:'Beethoven 5', note:'A single exposed oboe, slow and completely alone', file:'beethoven-5'}
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

  { id:'brass', name:'Brass', tagline:'The powerhouse', video:'video/brass.mp4',
    lede:'Heroic melodies, intense stabs and rips, and massive chords and tutti statements that can overpower all the other orchestral tonal instruments. Dynamic, rich, and surprisingly versatile.',
    role:[
      '<b>Lips, not reeds.</b> Pitch comes from lip tension and air pressure, so higher usually means louder.',
      '<b>Bore shapes tone.</b> Cylindrical (trumpet, trombone) is bright and penetrating; conical (horn) is mellow and round.',
      '<b>Breathing is non-negotiable.</b> Continuous melodies need breaks written in.',
      '<b>Fast runs fight the mechanics.</b> Especially on trombone.'
    ],
    demos:[
      {label:'Beethoven 5', note:'Four horns blasting a powerful thematic transition', file:'beethoven-5'},
      {label:'The Moldau', note:'Horns and trumpets playing a loud hunting fanfare', file:'smetana-moldau'},
      {label:'Dvořák 9', note:'Trumpets and trombones blasting a heavy, dark melody', file:'dvorak-9'}
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
    lede:'The percussion family has the widest dynamic range in the orchestra, from tonal percussion such as the marimba and xylophone, all the way to the big grand cassa and timpani, cymbals and snares - this is the heartbeat of the orchestra.',
    role:[
      '<b>Pitched or unpitched.</b> Timpani, glockenspiel and celesta are tonal instruments; snare, bass drum and cymbals are atonal.',
      '<b>Timing is everything.</b> Ten milliseconds delay in violins might be forgiven, but for percussion it can throw everything off balance.',
      '<b>One player, many instruments.</b> Parts move between instruments constantly.'
    ],
    demos:[
      {label:'The Moldau', note:'A high metal triangle keeping time on the off-beats', file:'smetana-moldau'},
      {label:'Dvořák 9, I', note:'Deep, rumbling timpani rolls driving the orchestral rhythm', file:'dvorak-9-i'},
      {label:'Dvořák 9, IV', note:'Sharp cymbal crashes and heavy bass drum thuds', file:'dvorak-9-iv'}
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
    epithet:'Shrill when played loud, sweet when played softly', status:'live',
    summary:'The highest pitched instrument in the woodwind family, and in the entire orchestra. Good for huge tutti statements, but should be used sparingly, as it is very tiresome to listen to.',
    range:{lo:74, hi:108, note:'D5 – C8', transposition:'Sounds an octave higher than written'},
    timbre:0.95,
    harmonics:15000,
    facts:[['Sounding range','D5 – C8'],['Section size','1–2','players'],['Transposition','Octave above written']],
    registers:[
      {label:'Low register', pitch:'D5 – A5', text:'Weak, hollow and easily buried. Rarely worth writing except for colour in a thin texture.'},
      {label:'Middle register', pitch:'B5 – A6', text:'Clear and flute-like, with more bite. The usable range for anything melodic.'},
      {label:'High register', pitch:'B6 – C8', text:'Piercing and unmistakable. Carries over the entire orchestra at full force, and turns shrill and exhausting fast.'}
    ],
    characteristics:[
      'Sounds an octave above written.',
      'Intonation is unforgiving, and small errors are enormously audible up here.',
      'Excels at fast runs and trills, doubling flutes an octave up.',
      'Almost never plays quietly in its top octave; due to the nature of the instrument and the breath required to reach the highest notes.'
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
    gallery:['5Eqj9G5j1ss','8UfpgT9FMAk','HP5xhyPn58U','j2Hk2SZGrRY','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:12'},
      {label:'Against the flute', note:'The same figure, an octave apart', dur:'0:16'},
      {label:'Full force over tutti', note:'Why it is used at climaxes', dur:'0:14'}
    ],
    prev:'', next:'flute'
  },

  flute:{
    family:'woodwinds', name:'Flute', latin:'Flauto traverso',
    epithet:'Rich and full in the middle, brilliant and penetrating on top', status:'live',
    summary:'An edge-tone instrument. Can be used effectively as a solo instrument, as well as for doubling other instruments of the orchestra.',
    range:{lo:60, hi:96, note:'C4 – C7', transposition:'Non-transposing'},
    timbre:0.72,
    harmonics:12000,
    facts:[['Sounding range','C4 – C7'],['Section size','2–4','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'C4 – G4', text:'Breathy, warm and easily buried. Beautiful when exposed, but disappears quickly in context.'},
      {label:'Middle register', pitch:'A4 – D6', text:'Rich and full: the workhorse range for melodies and for doubling.'},
      {label:'High register', pitch:'E6 – C7', text:'Brilliant and penetrating. Cuts through a tutti, but tiring over long stretches.'}
    ],
    characteristics:[
      'Adds more high-end overtones as air pressure increases, though the dynamic contrast is subtler than brass.',
      'Fast runs and arpeggios are entirely idiomatic. This is what woodwinds excel at.',
      'Monophonic. Cannot play multiple notes at once.',
      'Needs rests to breathe. Phrases written for libraries without rests feel synthetic and unrealistic.'
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
    gallery:['no6vSquaeIQ','8NVnPEsT__Y','ki0xu6Gl9Nc','5Eqj9G5j1ss','P_1N6_O254g','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:25', file:'signature-phrase'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:12', file:'register-comparison'},
      {label:'With violins in octaves', note:'The doubling, isolated then in context', dur:'0:14', file:'with-violins'}
    ],
    prev:'piccolo', next:'oboe'
  },

  oboe:{
    family:'woodwinds', name:'Oboe', latin:'Oboe',
    epithet:'A reedy and bright tone colour', status:'live',
    summary:'A double reed woodwind instrument. The expressive middle register is often used both for sad, melancholic themes as well as joyful melodies. It has a very characteristic quality, both good for solo melodies and for doubling other orchestral instruments.',
    range:{lo:58, hi:91, note:'B♭3 – G6', transposition:'Non-transposing'},
    timbre:0.80,
    harmonics:12000,
    facts:[['Sounding range','B♭3 – G6'],['Section size','2–4','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'B♭3 – E4', text:'Thick, heavy and a little coarse. Can be difficult to blend well.'},
      {label:'Middle register', pitch:'F4 – D5', text:'The expressive heart: reedy, singing and instantly recognisable. Most famous oboe themes live around here.'},
      {label:'High register', pitch:'E5 – G6', text:'Thin and increasingly strained. Effective for a moment of tension, but not the best for longer melodic phrases.'}
    ],
    characteristics:[
      'Double reed, narrow conical bore: a combination that gives it a distinct tone.',
      'Very low air consumption, so players can play for fairly long stretches compared to brass instruments.',
      'Extremely agile: fast runs, trills and wide leaps all work well.',
      'Tends to stick out, making it very well suited as a solo instrument.'
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
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    gallery:['r87w1RFT4hg','ki0xu6Gl9Nc','P_1N6_O254g','9aDEq3u5huA','5Eqj9G5j1ss','waP1N446Zb0'],
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:23', file:'signature-phrase'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:14', file:'register-comparison'},
      {label:'Solo over strings', note:'An example of its lyrical quality', dur:'0:11', file:'over-strings'}
    ],
    prev:'flute', next:'clarinet'
  },

  clarinet:{
    family:'woodwinds', name:'Clarinet', latin:'Clarinetto',
    epithet:'Quite similar to the human voice', status:'live',
    summary:'A single reed instrument with a mellow, warm and expressive tone colour. Very effective for playing smooth and expressive legato passages. It can effectively express desperation, love, joy and mourning.',
    range:{lo:50, hi:91, note:'D3 – G6 sounding', transposition:'In B♭, written a tone higher'},
    timbre:0.55,
    harmonics:12000,
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
    gallery:['VGvuUOtHGkk','6exoB7IW8qw','ki0xu6Gl9Nc','b4rfWegZi_M','5Eqj9G5j1ss','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Sustained', note:'Long held tones', dur:'0:06', file:'sustained'},
      {label:'Staccato', note:'Short, separated notes', dur:'0:05', file:'staccato'},
      {label:'Trills', note:'Trilled figures', dur:'0:04', file:'trills'}
    ],
    prev:'oboe', next:'bassoon'
  },

  bassoon:{
    family:'woodwinds', name:'Bassoon', latin:'Fagotto',
    epithet:'Not as penetrating and sharp as its little brother', status:'live',
    summary:'A tenor and bass instrument, with a double reed mouthpiece like the oboe. The differences between its registers are very clear and pronounced, one of the true characteristics of the bassoon.',
    range:{lo:34, hi:75, note:'B♭1 – E♭5', transposition:'Non-transposing'},
    timbre:0.30,
    harmonics:11000,
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
    gallery:['ghkljW0ZmJU','ki0xu6Gl9Nc','6exoB7IW8qw','b4rfWegZi_M','5Eqj9G5j1ss','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:25', file:'signature-phrase'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:11', file:'register-comparison'},
      {label:'With oboe', note:'Two double reeds fusing into a colour neither makes alone', dur:'0:10', file:'with-oboe'}
    ],
    prev:'clarinet', next:''
  },

  trumpet:{
    family:'brass', name:'Trumpet', latin:'Tromba',
    epithet:'Perfect for heroic and powerful themes', status:'live',
    summary:'Has a bright, powerful and brilliant sound quality. It is the smallest member of the brass family. Usually tuned in C or B♭.',
    range:{lo:54, hi:84, note:'F♯3 – C6 sounding', transposition:'In B♭, written a tone higher'},
    timbre:0.88,
    harmonics:9000,
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
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    gallery:['bwQumQpug_E','fEGNNuEM3Fc','pGdtkUiKaA8','8UfpgT9FMAk','5Eqj9G5j1ss','waP1N446Zb0'],
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:25', file:'signature-phrase'},
      {label:'Register comparison', note:'Low, middle and high on the same figure', dur:'0:08', file:'register-comparison'},
      {label:'With trombone', note:'Both cylindrical bore, so it thickens without changing the colour', dur:'0:09', file:'with-trombone'}
    ],
    prev:'', next:'horn'
  },

  horn:{
    family:'brass', name:'Horn', latin:'Corno / French horn',
    model:'horn',
    modelCredit:'“French Horn” by Bethanycrandallart · modified: decimated and re-materialled',
    modelSource:'https://skfb.ly/6TxEP',
    epithet:'A full, clear and round quality', status:'live',
    summary:'Where the trumpet and trombone are cylindrical bored and bright, the horn is conical, which gives it a more mellow and full tone colour, and lets it blend with woodwinds and cellos as easily as with its own family.',
    range:{lo:41, hi:77, note:'F2 – F5 sounding', transposition:'In F, written a fifth higher'},
    timbre:0.40,
    harmonics:8000,
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
    gallery:['n5gUu65Pmrk','b4rfWegZi_M','fEGNNuEM3Fc','pGdtkUiKaA8','8UfpgT9FMAk','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:25', file:'signature-phrase'},
      {label:'Register comparison', note:'Mellow low, singing middle, intense high', dur:'0:27', file:'register-comparison'},
      {label:'With cello in unison', note:'The blend that made the pairing standard', dur:'0:08', file:'with-cello'}
    ],
    prev:'trumpet', next:'trombone'
  },

  trombone:{
    family:'brass', name:'Trombone', latin:'Trombone',
    epithet:'Dark and threatening, with a warning feeling to it', status:'live',
    summary:'Has a sound that remains homogenous for the entire range, unlike instruments like the clarinet and bassoon. At middle and higher dynamic levels it is heroic, brilliant and mighty, and has the characteristic brass sound.',
    range:{lo:40, hi:74, note:'E2 – D5', transposition:'Non-transposing'},
    timbre:0.66,
    harmonics:8000,
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
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    gallery:['6wRKpdM9ra8','6exoB7IW8qw','5Eqj9G5j1ss','pGdtkUiKaA8','8UfpgT9FMAk','waP1N446Zb0'],
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:26', file:'signature-phrase'},
      {label:'Rips', note:'Quick explanation of an octave rip', dur:'0:05', file:'glissando-and-legato'},
      {label:'Section chord, soft and loud', note:'Showcasing the dynamics of the trombone', dur:'0:11', file:'section-soft-and-loud'}
    ],
    prev:'horn', next:'tuba'
  },

  tuba:{
    family:'brass', name:'Tuba', latin:'Tuba',
    epithet:'The biggest and lowest pitched brass instrument', status:'live',
    summary:'The lowest notes can only be played very softly, but project very well. The middle register is very full and soft sounding, and also the most used.',
    range:{lo:26, hi:65, note:'D1 – F4', transposition:'Non-transposing'},
    timbre:0.20,
    harmonics:7000,
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
    gallery:['HP5xhyPn58U','JEi23_uSGNE','8UfpgT9FMAk','j2Hk2SZGrRY','ghkljW0ZmJU','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after an 1855 instrument in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:26', file:'signature-phrase'},
      {label:'Low register speaking time', note:'How long the bottom octave takes to arrive', dur:'0:11', file:'low-register-speaking-time'},
      {label:'Melodic middle register', note:'The part of the instrument nobody writes for', dur:'0:09', file:'melodic-middle-register'}
    ],
    prev:'trombone', next:''
  },

  cello:{
    family:'strings', name:'Cello', latin:'Violoncello',
    model:'cello',
    modelCredit:'“Cello Sketchfab” by Limpskin · modified: re-centred and normalised',
    modelSource:'https://skfb.ly/pICFS',
    epithet:'The tenor and bass instrument of the violin family', status:'live',
    summary:'The biggest brother in the violin family. Has an even lower range than the viola, able to produce a full and rich sound.',
    range:{lo:36, hi:81, note:'C2 – A5', transposition:'Non-transposing'},
    timbre:0.35,
    harmonics:10000,
    facts:[['Sounding range','C2 – A5'],['Section size','10','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'C2 – G3', text:'Warm and full, often doubling the basses in octaves.'},
      {label:'Middle register', pitch:'A3 – D4', text:'The singing range, similar to a human voice, often used for counter melodies.'},
      {label:'High register', pitch:'E4 – A5', text:'Bright and lyrical, and surprisingly powerful and expressive.'}
    ],
    characteristics:[
      'Can play any pitch in range, including microtones and glissandi between notes.',
      'Plays upright, vs the viola and violin which is played placed on the shoulder.',
      'Fast runs, scales and arpeggios possible - but slightly more complicated than on the smaller violin.',
      'Double and triple stops possible (multiple strings played at once).'
    ],
    articulations:['Arco','Pizzicato','Legato','Staccato','Marcato','Con sordino','Glissando'],
    blends:[
      {id:'horn', label:'Horn in unison', note:'Two timbres giving a heroic result'},
      {id:'bassoon', label:'Bassoon', note:'Deepens and darkens the line'},
      {id:'clarinet', label:'Clarinet', note:'Adds mellow woodwind roundness'},
      {id:'harp', label:'Pizzicato with harp', note:'Plucked attack, sustained ring'}
    ],
    limits:[
      'Not a keyboard patch. Split the section into real voices or it will sound like a string preset.',
      'Extreme high register is exposed and unforgiving for less experienced players.',
      'Doubling basses at the unison muddies; octaves keep the bottom clear.'
    ],
    gallery:['clK9rM9JoIs','P_1N6_O254g','GrrvAHhWKIw','sHsFIv8VA7w','a9UApyClFKA','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:23', file:'signature-phrase'},
      {label:'Pizzicato vs Arco', note:'The same figure, both articulations', dur:'0:20', file:'arco-vs-pizzicato'},
      {label:'With horn in unison', note:'Where the two timbres fuse', dur:'0:23', file:'with-horn'}
    ],
    prev:'viola', next:'double-bass'
  },

  violin:{
    family:'strings', name:'Violin', latin:'Violino',
    model:'violin',
    modelCredit:'“Violin Texturing” by ilushandro · modified: decimated and re-materialled',
    modelSource:'https://skfb.ly/oAVFz',
    epithet:'The most numerous instrument in the ensemble', status:'live',
    summary:'The smallest and highest pitched instrument in the string family, with up to over 30 violins in an orchestra. Four strings tuned in GDAE.',
    range:{lo:55, hi:100, note:'G3 – E7', transposition:'Non-transposing'},
    timbre:0.78,
    harmonics:13000,
    facts:[['Sounding range','G3 – E7'],['Section size','16 + 14','players'],['Transposition','Concert pitch']],
    registers:[
      {label:'Low register', pitch:'G3 – D4', text:'Dark and thick tone, not a lot of penetrative energy compared to the other registers.'},
      {label:'Middle register', pitch:'E4 – D5', text:'Warm and even, and where most melodic writing sits.'},
      {label:'High register', pitch:'E5 – E7', text:'Brilliant and soaring - getting increasingly thin and strained above B6. Tougher to play the higher you go due to the closeness of the notes on the fingerboard.'}
    ],
    characteristics:[
      'Divided into firsts and seconds, which can play in unison - octaves, or separate voices entirely.',
      'Four strings, tuned GDAE.',
      'Can play anything from fast runs to soaring lines.',
      'Cannot play conventional chords, except double and triple stops (playing multiple strings at once).',
      'Divisi splits a section into further parts, causing more fragmented, thinner ensembles.'
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
    gallery:['6exoB7IW8qw','9aDEq3u5huA','a9UApyClFKA','GrrvAHhWKIw','sHsFIv8VA7w','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:25', file:'signature-phrase'},
      {label:'The range', note:'A melody line showing the vibrant range of the instrument', dur:'0:15', file:'string-by-string'},
      {label:'Solo vs Section', note:'One player, then the full section', dur:'0:09', file:'section-vs-solo'}
    ],
    prev:'', next:'viola'
  },

  viola:{
    family:'strings', name:'Viola', latin:'Viola',
    model:'viola',
    modelCredit:'Attribution pending, do not publish',
    epithet:'The bigger brother of the violin', status:'live',
    summary:'Has a darker timbre compared to the violin’s brighter quality. Tuned in CGDA, a fifth lower than his little brother.',
    range:{lo:48, hi:88, note:'C3 – E6', transposition:'Non-transposing'},
    timbre:0.52,
    harmonics:11000,
    facts:[['Sounding range','C3 – E6'],['Section size','12','players'],['Notation','Alto clef']],
    registers:[
      {label:'Low register', pitch:'C3 – G3', text:'The C string - dark, reedy and slightly rough. Adds a deeper register than the violin.'},
      {label:'Middle register', pitch:'A3 – D5', text:'Warm and rich, perfect for inner harmonies gluing chords together.'},
      {label:'High register', pitch:'E5 – E6', text:'Intense and expressive. Rounder and warmer tone than the violin.'}
    ],
    characteristics:[
      'Tuned C, G, D, A, a fifth below the violin.',
      'Written in alto clef, moving to treble for higher passages.',
      'Blends well with almost anything, and is often used as a glue.',
      'Often the recipient of countless jokes from violinists.'
    ],
    articulations:['Arco','Pizzicato','Legato','Spiccato','Staccato','Tremolo','Harmonics','Con sordino'],
    blends:[
      {id:'clarinet', label:'Clarinet', note:'The two timbres match really well'},
      {id:'horn', label:'Horn', note:'Adds body to a mid-register line'},
      {id:'cello', label:'Cellos in octaves', note:'The standard warm middle-and-low pairing'},
      {id:'trumpet', label:'Trumpet', note:'Bright over dark; the viola takes the edge off'}
    ],
    limits:[
      'Twelve violas will not project over full brass. It is a supporting colour, not a competing one.',
      'Exposed high writing is unforgiving: beautiful when it works, painful when it does not.',
      'Do not simply write violin parts a fifth lower; the register changes what sits well.'
    ],
    gallery:['zWn_7R4B-aI','6exoB7IW8qw','GrrvAHhWKIw','9aDEq3u5huA','sHsFIv8VA7w','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:26', file:'signature-phrase'},
      {label:'Against the violin', note:'The same line on both, back to back', dur:'0:10', file:'against-the-violin'},
      {label:'With clarinet', note:'Where the two timbres become one', dur:'0:10', file:'with-clarinet'}
    ],
    prev:'violin', next:'cello'
  },

  'double-bass':{
    family:'strings', name:'Double Bass', latin:'Contrabasso',
    epithet:'The bass role of the orchestra', status:'live',
    summary:'Actually not a part of the violin family, which is violin, viola and cello. Its timbre is dark, powerful, broad and dull, and it is able to play in a very low register due to its huge size.',
    range:{lo:28, hi:67, note:'E1 – G4 sounding', transposition:'Sounds an octave lower than written'},
    timbre:0.18,
    harmonics:7000,
    facts:[['Sounding range','E1 – G4'],['Section size','8','players'],['Transposition','Octave below written']],
    registers:[
      {label:'Low register', pitch:'E1 – A1', text:'Felt more than heard. Pitch definition poorer in the lowest register, but carries tremendous weight and “oomph”. The cello an octave above often reinforces the pitch and gives a big result.'},
      {label:'Middle register', pitch:'B1 – D3', text:'The working range. Dark, woody and clear enough to carry melodic lines.'},
      {label:'High register', pitch:'E3 – G4', text:'Thin and strained, but unmistakably expressive. Not as common, but sounds like nothing else in the orchestra when pulled off.'}
    ],
    characteristics:[
      'Tuned in fourths. E, A, D and G.',
      'Many instruments have a low C extension, reaching below the open E.',
      'Slower and bigger, moves like a giant, so ultra fast passageworks quickly gets muddy.',
      'Pizzicato is large and decays slowly, a common usage.'
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
    gallery:['clK9rM9JoIs','a9UApyClFKA','ghkljW0ZmJU','sHsFIv8VA7w','hvPlV56VtFs','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:25', file:'signature-phrase'},
      {label:'Pizzicato vs Arco', note:'Sustained, then plucked', dur:'0:11', file:'arco-vs-pizzicato'},
      {label:'With cello in octaves', note:'A very common and effective pairing', dur:'0:10', file:'with-cello-octaves'}
    ],
    prev:'cello', next:'harp'
  },

  harp:{
    family:'strings', name:'Harp', latin:'Arpa',
    epithet:'Gentle, clear, mellow and flowing', status:'live',
    summary:'One of the oldest and most widespread instruments in the world, played by plucking strings that are attached to a wooden frame and soundbox. A harp player is able to play both melodic lines and chords. It is a diatonic instrument, and uses foot pedals to alter pitches, making a C a C♯ or a C♭ for instance, so a chromatic scale is very hard to play on the harp.',
    range:{lo:24, hi:103, note:'C1 – G7', transposition:'Non-transposing'},
    timbre:0.60,
    harmonics:14000,
    facts:[['Sounding range','C1 – G7'],['Section size','1–2','players'],['Pedals','7 · three positions']],
    registers:[
      {label:'Low register', pitch:'C1 – B2', text:'Wire strings, long decay, with considerable weight. Effective for sparse writing.'},
      {label:'Middle register', pitch:'C3 – B5', text:'Gut strings, warm and lyrical. Where glissandi and arpeggiated figures usually live.'},
      {label:'High register', pitch:'C6 – G7', text:'Bright, short and bell-like with a quick decay. Cuts through a full orchestra at surprisingly low dynamics, but does not have a lot of sustain or weight.'}
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
    gallery:['HP5xhyPn58U','6exoB7IW8qw','fEGNNuEM3Fc','sHsFIv8VA7w','GrrvAHhWKIw','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:15', file:'signature-phrase'},
      {label:'Glissando', note:'A sweep across the strings', dur:'0:08', file:'glissando'},
      {label:'Range', note:'Low to high across the instrument', dur:'0:08', file:'range'}
    ],
    prev:'double-bass', next:''
  },

  /* The unpitched percussion still carry a range, because the timbre chart
     plots every instrument and needs somewhere to put them. Those numbers
     describe roughly where the energy sits spectrally, not pitch, and each
     entry says so in its range note so it cannot be misread. */
  timpani:{
    family:'percussion', name:'Timpani', latin:'Timpani',
    epithet:'The loudest instrument in the entire orchestra', status:'live',
    summary:'A big bowl-looking drum. It is a pitched instrument, and the player changes the notes by stretching and loosening the drum heads with a foot pedal. Usually four different timpani of different sizes are used. It is very central to the orchestral percussion, since it can play rhythm, melody and harmony.',
    range:{lo:38, hi:57, note:'D2 – A3 across four drums', transposition:'Non-transposing'},
    timbre:0.22,
    harmonics:6000,
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
    gallery:['HP5xhyPn58U','ki0xu6Gl9Nc','8UfpgT9FMAk','pGdtkUiKaA8','ghkljW0ZmJU','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:14', file:'signature-phrase'},
      {label:'Phrase', note:'A short rhythmic figure', dur:'0:07', file:'phrase'},
      {label:'Roll', note:'A sustained roll', dur:'0:04', file:'roll'}
    ],
    prev:'', next:'cymbals'
  },

  cymbals:{
    family:'percussion', name:'Cymbals', latin:'Piatti',
    epithet:'Very effective when used sparingly', status:'live',
    summary:'Can be played by either striking one plate against the other, or being struck with a stick or mallet. The loud sound is usually used to accentuate musical climaxes, and can rise above the entire orchestra.',
    range:{lo:60, hi:96, note:'Unpitched. Broadband, with the energy weighted high', transposition:'Non-transposing'},
    timbre:0.92,
    harmonics:18000,
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
    gallery:['JEi23_uSGNE','8UfpgT9FMAk','pGdtkUiKaA8','j2Hk2SZGrRY','ghkljW0ZmJU','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Strike', note:'A single crash', dur:'0:08', file:'strike'}
    ],
    prev:'timpani', next:'snare-drum'
  },

  'snare-drum':{
    family:'percussion', name:'Snare Drum', latin:'Tamburo militare',
    epithet:'The smallest of the cylindrical drums', status:'live',
    summary:'Extremely common in all western music styles, and a very important part of the orchestral percussion family. Due to its small size, the sound is very bright, sharp and penetrating.',
    range:{lo:58, hi:80, note:'Unpitched. Bright, with high-mid energy', transposition:'Non-transposing'},
    timbre:0.85,
    harmonics:15000,
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
    gallery:['5Eqj9G5j1ss','JEi23_uSGNE','8UfpgT9FMAk','ghkljW0ZmJU','HP5xhyPn58U','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Snare phrase', note:'A short well known rhythmic motif', dur:'0:06', file:'signature-phrase'},
      {label:'Roll', note:'A sustained roll', dur:'0:04', file:'roll'}
    ],
    prev:'cymbals', next:'bass-drum'
  },

  'bass-drum':{
    family:'percussion', name:'Bass Drum', latin:'Gran cassa',
    epithet:'Dark, full, mighty and thunderous', status:'live',
    summary:'An important instrument in both western popular music and orchestral works. It is very effective for marking the rhythm, and covers the bass register of the percussion section. It has a huge range, from subtle to super loud, and most often only one bass drum is required.',
    range:{lo:24, hi:40, note:'Unpitched. Very low, felt as much as heard', transposition:'Non-transposing'},
    timbre:0.10,
    harmonics:8000,
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
    gallery:['ghkljW0ZmJU','8UfpgT9FMAk','JEi23_uSGNE','j2Hk2SZGrRY','HP5xhyPn58U','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Strokes', note:'Struck notes', dur:'0:10', file:'strokes'},
      {label:'Roll', note:'A sustained roll', dur:'0:05', file:'roll'}
    ],
    prev:'snare-drum', next:'gong'
  },

  gong:{
    family:'percussion', name:'Gong', latin:'Tam-tam',
    epithet:'Adds an exotic flavour to the music', status:'live',
    summary:'A huge round metal plate hanging with a knob in the centre. It has a definite pitch, a very full sounding and round tone, and gongs of different sizes can be used to play entire melodies.',
    range:{lo:30, hi:60, note:'Unpitched. Broadband, and it blooms after the strike', transposition:'Non-transposing'},
    timbre:0.45,
    harmonics:16000,
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
    gallery:['HP5xhyPn58U','JEi23_uSGNE','j2Hk2SZGrRY','sHsFIv8VA7w','ghkljW0ZmJU','waP1N446Zb0'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Strike', note:'A single stroke', dur:'0:10', file:'strike'}
    ],
    prev:'bass-drum', next:'celesta'
  },

  celesta:{
    family:'percussion', name:'Celesta', latin:'Celesta',
    epithet:'Percussive, yet heavenly', status:'live',
    summary:'Invented during the 19th century. It is played as a piano. A famous usage of this instrument is the Prologue and Hedwig’s Theme from the Harry Potter series. The celesta parts are usually very quick and lively and require a very skilled player.',
    range:{lo:60, hi:108, note:'C4 – C8 sounding', transposition:'Sounds an octave higher than written'},
    timbre:0.86,
    harmonics:12000,
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
    gallery:['gumy04TFPBk','qsCZP3wdF4w','2EsNGS9vYe8','YB_PTA4dGws','clK9rM9JoIs','j2Hk2SZGrRY'],
    plateCredit:'Engraved for this atlas after instrument photographs in The Met collection (CC0)',
    demos:[
      {label:'Signature phrase', note:'The Atlas theme for comparison', dur:'0:15', file:'signature-phrase'},
      {label:'Phrase', note:'A short melodic line', dur:'0:13', file:'phrase'},
      {label:'Run', note:'A fast run', dur:'0:06', file:'run'}
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

/* Family colours for the dock. Deliberately not FAM_COLOR: the timbre chart
   plots all twenty instruments at once and needs four well-separated hues,
   while the dock colours three or four tracks and is read at a glance against
   a dark strip. Gold reads as brass here rather than as "selected", which is
   why the pressed variant chip and the solo button take the family colour too
   and do not fall back to gold. The playhead stays gold: it is the one thing
   in the dock that is not a track. */
const STUDIO_FAM = {
  woodwinds:'#6FB7E8',   // light blue
  brass:    '#D4A04A',   // amber
  strings:  '#CF5F52',   // red
  percussion:'#9B8FD4'   // violet
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
  {v:'GrrvAHhWKIw', title:'Mahler, Symphony No. 9', perf:'Berliner Philharmoniker · Kirill Petrenko', why:'Late-Romantic orchestration at its most transparent', chan:'Berliner Philharmoniker'},
  {v:'waP1N446Zb0', title:'Britten, The Young Person’s Guide to the Orchestra', perf:'Berliner Philharmoniker · Sir Simon Rattle', why:'Every family and most of these instruments, introduced one at a time and then fugued together', chan:'Berliner Philharmoniker'},
  {v:'5Eqj9G5j1ss', title:'Ravel, Boléro', perf:'Berliner Philharmoniker · Waldbühne 2024', why:'One melody handed round the orchestra: the clearest listening exercise in orchestral colour there is', chan:'Berliner Philharmoniker'},
  {v:'ki0xu6Gl9Nc', title:'Prokofiev, Peter and the Wolf (with score)', perf:'Vancouver Symphony Orchestra · Bramwell Tovey', why:'Every solo instrument given a character, with the score on screen as it plays', chan:'Concert upload'},
  {v:'6exoB7IW8qw', title:'Rimsky-Korsakov, Scheherazade', perf:'hr-Sinfonieorchester · Alain Altinoglu', why:'The concertmaster returns as a character, and almost every principal gets a solo', chan:'hr-Sinfonieorchester'},
  {v:'ghkljW0ZmJU', title:'Stravinsky, The Rite of Spring', perf:'London Symphony Orchestra · Sir Simon Rattle', why:'Opens on a bassoon at the very top of its range, and never stops rethinking the orchestra', chan:'London Symphony Orchestra'},
  {v:'clK9rM9JoIs', title:'Saint-Saëns, The Carnival of the Animals', perf:'Omaha Symphony · Ankush Kumar Bahl', why:'Written as instrument portraits: the swan is a cello, the elephant a double bass', chan:'Omaha Symphony'},
  {v:'fEGNNuEM3Fc', title:'Mahler, Symphony No. 5', perf:'hr-Sinfonieorchester · Andrés Orozco-Estrada', why:'Opens on a solo trumpet, and hands the third movement to an obbligato horn', chan:'hr-Sinfonieorchester'},
  {v:'b4rfWegZi_M', title:'Tchaikovsky, Symphony No. 5', perf:'hr-Sinfonieorchester · Roderick Cox', why:'The slow movement carries the most famous horn solo in the repertoire', chan:'hr-Sinfonieorchester'},
  {v:'HP5xhyPn58U', title:'Holst, The Planets', perf:'hr-Sinfonieorchester · Hugh Wolff', why:'The full percussion battery, organ, two harps, and a tuba that has to carry Uranus', chan:'hr-Sinfonieorchester'},
  {v:'6wRKpdM9ra8', title:'Mahler, Symphony No. 3', perf:'Berliner Philharmoniker · Sir Simon Rattle', why:'The first movement gives the trombone the longest solo in the symphonic repertoire', chan:'Berliner Philharmoniker'},
  {v:'no6vSquaeIQ', title:'Debussy, Prélude à l’après-midi d’un faune', perf:'Minnesota Orchestra · Thomas Søndergård', why:'The flute solo that begins modern orchestration', chan:'Minnesota Orchestra'},
  {v:'8NVnPEsT__Y', title:'Ibert, Flute Concerto', perf:'hr-Sinfonieorchester · Clara Andrada de la Calle · Jaime Martín', why:'The flute as a soloist rather than a colour, at full stretch', chan:'hr-Sinfonieorchester'},
  {v:'r87w1RFT4hg', title:'Bacri, Notturno for oboe and string orchestra', perf:'hr-Sinfonieorchester · François Leleux', why:'An oboe carrying a whole movement over strings, filmed close', chan:'hr-Sinfonieorchester'},
  {v:'zWn_7R4B-aI', title:'Berlioz, Harold en Italie', perf:'Wolfram Christ, viola · Berliner Philharmoniker · Lorin Maazel', why:'A symphony with a solo viola running through it, which almost nothing else does', chan:'Concert upload'},
  {v:'bwQumQpug_E', title:'Mahler, Symphony No. 5, the opening trumpet solo', perf:'Gábor Tarkövi · Berliner Philharmoniker', why:'One player alone, setting up seventy minutes of music', chan:'Concert upload'},
  {v:'n5gUu65Pmrk', title:'Tchaikovsky, Symphony No. 5, the horn solo', perf:'Marc Gruber · Frankfurt Radio Symphony', why:'Filmed on the player: what the horn’s middle register is for', chan:'hr-Sinfonieorchester'},
  {v:'gumy04TFPBk', title:'Tchaikovsky, Dance of the Sugar Plum Fairy', perf:'Berliner Philharmoniker · Sir Simon Rattle', why:'The celesta’s debut, and still the sound everyone reaches for', chan:'Berliner Philharmoniker'},
  {v:'VGvuUOtHGkk', title:'Gershwin, Rhapsody in Blue (1924 recording)', perf:'Paul Whiteman Orchestra · George Gershwin, piano', why:'The clarinet glissando as first recorded, a year after it was written', chan:'Concert upload'},
  {v:'JEi23_uSGNE', title:'Holst, The Planets', perf:'Singapore Symphony Orchestra · Andrew Litton', why:'A second reading, filmed close enough to watch the percussion section work', chan:'Singapore Symphony Orchestra'},
  {v:'qsCZP3wdF4w', title:'John Williams, Hedwig’s Theme', perf:'Wiener Philharmoniker · John Williams · Anne-Sophie Mutter', why:'The celesta melody the whole world knows, played by the orchestra it was written for', chan:'Deutsche Grammophon'},
  {v:'2EsNGS9vYe8', title:'Bartók, Music for Strings, Percussion and Celesta', perf:'Oslo Philharmonic · Vasily Petrenko', why:'The celesta is in the title, and Bartók treats it as a third section rather than a colour', chan:'Oslo Philharmonic'},
  {v:'YB_PTA4dGws', title:'Bartók, Music for Strings, Percussion and Celesta', perf:'Berliner Philharmoniker · Pierre Boulez', why:'A second reading of the piece that made the celesta a structural instrument', chan:'Berliner Philharmoniker'}
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
  flute:{img:'plates/flute.png'},
  piccolo:{img:'plates/piccolo.png'},
  oboe:{img:'plates/oboe.png'},

  clarinet:{img:'plates/clarinet.png'},
  bassoon:{img:'plates/bassoon.png'},
  timpani:{img:'plates/timpani.png'},
  cymbals:{img:'plates/cymbals.png'},
  'snare-drum':{img:'plates/snare-drum.png'},
  'bass-drum':{img:'plates/bass-drum.png'},
  gong:{img:'plates/gong.png'},
  celesta:{img:'plates/celesta.png'},
  trumpet:{img:'plates/trumpet.png'},

  trombone:{img:'plates/trombone.png'},

  tuba:{img:'plates/tuba.png'},
  horn:{img:'plates/horn.png'},
  violin:{img:'plates/violin.png'},
  viola:{img:'plates/viola.png'},
  'double-bass':{img:'plates/double-bass.png'},
  harp:{img:'plates/harp.png'},
  cello:{img:'plates/cello.png'},
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
