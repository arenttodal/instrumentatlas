/* ============================================================================
   SCALES & MODES · LESSONS
   ----------------------------------------------------------------------------
   MODULES and LESSONS on the Accelerator's shape, plus the four fields the
   engine generalisation added: `activity` (which widget), `preset` (its
   starting state), `challenge` (the prompt) and `videos` (links out).

   ORDER IS BRIGHTEST TO DARKEST. Ionian and Aeolian are taught inside the
   intro as the two reference points, and every other mode is defined as one
   note away from one of them — which is why there is no Ionian lesson and no
   Aeolian lesson.

   `source` names the videos a lesson condenses rather than an ebook chapter.
   That keeps the Accelerator's convention — every lesson says where it came
   from — and points it at the course.

   THE PROSE IS A DRAFT. It is written from the facts in evenant-theory.js, so
   nothing here contradicts what the widgets do, but the spec has it written
   from the video transcripts once those exist, in the owner's voice. Treat
   every `body`, `ex` and `quiz` below as a starting point to be replaced, and
   every `url` in `videos` as a placeholder.

   Unlike accelerator/data.js, NOTHING MUTATES THIS ARRAY after the literal.
   What is written here is the whole truth about these lessons.
   ============================================================================ */

const MODULES = [
  { id:'lessons', n:1, title:'Scales & Modes',
    subtitle:'Six lessons, brightest to darkest',
    lede:'A mode is a scale with one note moved. Start at the brightest, walk down, and at every step exactly one degree drops — which is both the theory and the way to hear it.' },
  { id:'lab', n:2, title:'Tools',
    subtitle:'The widgets, without the lessons',
    lede:'The same three tools the lessons use, on their own, for when you know what you are looking for.' }
];

/* placeholder, until the course exists */
const V = (mode, part) => 'https://evenant.circle.so/c/scales-and-modes/' + mode + '-' + part;

const LESSONS = [

/* ---------------------------------------------------------------- 0 ------ */
{
  id:'how-modes-work', module:'lessons', n:1,
  title:'How modes work',
  short:'One note at a time, from the brightest to the darkest.',
  claim:'Every mode is one note away from the one beside it. Line them up brightest to darkest and each step lowers exactly one degree.',
  activity:'brightness',
  preset:{ rootPc:2, mode:'lydian', drone:true },
  challenge:'Walk the slider down from Lydian and stop at the mode that is minor everywhere except one raised note.',
  videos:[
    { part:'theory',  title:'The colour-note idea',    url:V('intro','theory'),  minutes:5 },
    { part:'hearing', title:'Drone and brightness',    url:V('intro','hearing'), minutes:5 }
  ],
  body:[
    'Seven notes, seven places to start. Begin a major scale on its second degree and the same seven notes make a different scale, because the gaps have moved. That is all a mode is — and it is a poor way to learn them, because it tells you nothing about what they sound like.',
    'Here is the useful order instead. Put the seven modes in a line from brightest to darkest: <strong>Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian</strong>. Now walk down it. At every single step, exactly one degree drops by a semitone, and the degrees drop in this order: the 4th, then the 7th, the 3rd, the 6th, the 2nd and the 5th.',
    'So the difference between any two neighbours is one note. Lydian is major with a raised 4th. Mixolydian is major with a lowered 7th. Dorian is minor with a raised 6th. Phrygian is minor with a lowered 2nd. Each one has a <em>colour note</em>, and that note is the whole mode.',
    'The second thing matters as much as the first: <strong>a mode only exists against a tonic</strong>. Play D Dorian with nothing underneath and you have played C major starting on D. Put a D underneath it and you have played Dorian. That is why the drone is on by default here, and why it is the first thing to reach for when a mode refuses to sound like itself.'
  ],
  ex:{
    beginner:'Put on a D drone. Play D Lydian up and down, then D Ionian. Find the one note that changed and sing it.',
    intermediate:'Over the same drone, play all seven modes in brightness order. Say the colour note out loud each time before you play it.',
    advanced:'Pick a mode at random, play four bars over a drone without naming it, come back a day later and identify it from the recording.'
  },
  quiz:[
    { q:'Walking from Lydian down to Locrian, what happens at each step?',
      o:['Exactly one degree is lowered','The key changes','Two degrees swap','The tonic moves up'], a:0,
      why:'Lydian to Ionian lowers the 4th, Ionian to Mixolydian the 7th, then the 3rd, 6th, 2nd and 5th. One note, every time.' },
    { q:'Why does a mode need a drone to be heard as that mode?',
      o:['Without a fixed tonic the ear hears the relative major','Drones are louder','It changes the notes','It fixes the tempo'], a:0,
      why:'The notes of D Dorian are the notes of C major. What makes it Dorian is that D is home, and a drone is the cheapest way to say so.' }
  ],
  source:'Scales & Modes, lesson 1 · videos: The colour-note idea, Drone and brightness'
},

/* ---------------------------------------------------------------- 1 ------ */
{
  id:'lydian', module:'lessons', n:2,
  title:'Lydian',
  short:'Major with a raised 4th.',
  claim:'Lydian is major with a raised 4th. One note turns home into somewhere slightly unreal.',
  activity:'reharm',
  preset:{ theme:'rise', rootPc:2, mode:'lydian', from:'ionian' },
  challenge:'Switch Rise from major to Lydian and find the one melody note that moved. Then turn on Idiomatic and listen to what replaces the IV chord.',
  videos:[
    { part:'melody',  title:'Lydian · Melody',  url:V('lydian','melody'),  minutes:5 },
    { part:'harmony', title:'Lydian · Harmony', url:V('lydian','harmony'), minutes:5 },
    { part:'texture', title:'Lydian · Texture', url:V('lydian','texture'), minutes:5 }
  ],
  body:[
    'Take a major scale and raise its 4th by a semitone. In D, the G becomes G♯ and nothing else changes. That is the whole of <strong>Lydian</strong>.',
    'In major, the 4th rubs against the 3rd of the tonic chord, so melodies pass through it rather than rest on it. Raised, it stops rubbing. <em>G♯ can sit over a D chord</em> as a colour rather than a problem, which is why Dmaj7♯11 is the sound of the mode.',
    'The raised 4th is also the third of the chord on the second degree, so <strong>II is major</strong>. Rocking between I and II — D to E — is the quickest way to make a listener hear Lydian rather than major, and it is why so much of the wonder-and-flight repertoire is built on exactly that pair.',
    'There is a catch worth hearing rather than being told. Raising the 4th turns the IV chord into a diminished chord on the raised degree — a ♯iv° — so a progression written in major does not simply transfer. That is what the Idiomatic switch in the tool is for: it puts the II back where the ♯iv° landed.'
  ],
  ex:{
    beginner:'Over a D drone, write four bars in D Lydian that land on G♯ on a strong beat at least twice.',
    intermediate:'Loop D to E for eight bars. Voice the E chord with G♯ on top, then write a melody over it that leans on that note.',
    advanced:'Build a thirty-second cue: an eighth-note ostinato on D, E and A, a pad on Dmaj7♯11, and a melody entering at bar five.'
  },
  quiz:[
    { q:'Which note separates D Lydian from D major?',
      o:['G♯','C♮','F♮','B♭'], a:0,
      why:'D major has G. Lydian raises the 4th to G♯, and every other note is shared.' },
    { q:'Why is the chord on the second degree major in Lydian?',
      o:['Its third is the raised 4th','It borrows from the parallel minor','The tonic moved','Sevenths are added'], a:0,
      why:'In D, the chord on E is E–G–B in major and E–G♯–B in Lydian. The raised 4th is that third.' }
  ],
  source:'Scales & Modes, lesson 2 · Lydian videos: Melody, Harmony, Texture'
},

/* ---------------------------------------------------------------- 2 ------ */
{
  id:'mixolydian', module:'lessons', n:3,
  title:'Mixolydian',
  short:'Major with a lowered 7th.',
  claim:'Mixolydian is major with a lowered 7th. Take away the leading tone and the music stops needing to resolve.',
  activity:'reharm',
  preset:{ theme:'rise', rootPc:7, mode:'mixolydian', from:'ionian' },
  challenge:'Take Rise from major to Mixolydian and listen to what happens to the chord on the fifth degree.',
  videos:[
    { part:'melody',  title:'Mixolydian · Melody',  url:V('mixolydian','melody'),  minutes:5 },
    { part:'harmony', title:'Mixolydian · Harmony', url:V('mixolydian','harmony'), minutes:5 },
    { part:'texture', title:'Mixolydian · Texture', url:V('mixolydian','texture'), minutes:5 }
  ],
  body:[
    'Lower the 7th of a major scale and you remove its leading tone. In G, the F♯ becomes F. The scale is still major in every other respect — the 3rd is still major, the tonic chord is still bright — but the pull home has gone.',
    'That one change does two things to the harmony. The chord on the <strong>seventh degree becomes a major chord a tone below the tonic</strong>, the ♭VII, and the chord on the fifth turns <strong>minor</strong>. A progression that rocks between I and ♭VII — G to F — has no dominant in it at all, and so it can sit still indefinitely.',
    'This is why Mixolydian reads as folk, as open country, as the modal rock vocabulary. Nothing is unresolved, because nothing was demanding resolution. It is also why it is so useful under a long scene: it holds a key without implying a destination.',
    'Melodically the lowered 7th wants to fall to the 6th rather than rise to the tonic. Write the line that way round and the mode states itself without any chord having to help.'
  ],
  ex:{
    beginner:'Over a G drone, play G major and then G Mixolydian. Stop on the 7th each time and hear the difference in what it wants to do.',
    intermediate:'Loop G to F for eight bars and write a melody that touches the F every time the chord changes.',
    advanced:'Take a cue you have written in major and lower every 7th. Decide, bar by bar, where it improves it and where it takes away something you needed.'
  },
  quiz:[
    { q:'What happens to the chord on the fifth degree in Mixolydian?',
      o:['It becomes minor','It becomes diminished','It stays dominant','It disappears'], a:0,
      why:'Its third is the seventh degree of the scale. Lower that and the chord turns minor — which is why the mode has no dominant pull.' },
    { q:'Which chord is the Mixolydian signature?',
      o:['♭VII','ii','V7','vii°'], a:0,
      why:'The lowered 7th makes a major chord a tone below the tonic. Rocking I to ♭VII is the sound of the mode.' }
  ],
  source:'Scales & Modes, lesson 3 · Mixolydian videos: Melody, Harmony, Texture'
},

/* ---------------------------------------------------------------- 3 ------ */
{
  id:'dorian', module:'lessons', n:4,
  title:'Dorian',
  short:'Minor with a raised 6th.',
  claim:'Dorian is minor with a raised 6th. One bright note inside a minor scale, and it changes everything above it.',
  activity:'reharm',
  preset:{ theme:'pulse', rootPc:2, mode:'dorian', from:'aeolian' },
  challenge:'Take Pulse from natural minor to Dorian. The ostinato sits on the sixth degree — find the moment it lifts.',
  videos:[
    { part:'melody',  title:'Dorian · Melody',  url:V('dorian','melody'),  minutes:5 },
    { part:'harmony', title:'Dorian · Harmony', url:V('dorian','harmony'), minutes:5 },
    { part:'texture', title:'Dorian · Texture', url:V('dorian','texture'), minutes:5 }
  ],
  body:[
    'Raise the 6th of a natural minor scale. In D, the B♭ becomes B♮. Everything else — the minor third, the lowered 7th — stays where it was.',
    'The result is a minor scale with one note of daylight in it. That is exactly how it reads: not sad in the way Aeolian is sad, but something cooler and more level. It is the most used mode in film and game scoring after major and minor, and the raised 6th is the only reason.',
    'In the harmony the raised 6th is the third of the chord on the fourth degree, so <strong>IV is major</strong> inside a minor key. Rocking i to IV — Dm to G — is the Dorian signature, and the chord on the second degree becomes a plain minor ii rather than the diminished chord minor usually gives you.',
    'Melodically, the place to put the raised 6th is somewhere it can be heard against the minor third. A line that rises from the 5th through the 6th to the 7th states the mode in three notes; one that avoids the 6th states nothing at all.'
  ],
  ex:{
    beginner:'Over a D drone, play D natural minor then D Dorian, stopping on the 6th both times.',
    intermediate:'Loop Dm to G for eight bars. Write an ostinato that touches B♮ on every bar.',
    advanced:'Write a sixteen-bar cue in D Dorian that never uses the raised 6th in the melody, only in the harmony. Then write one that does the opposite, and compare.'
  },
  quiz:[
    { q:'Which chord is the Dorian signature?',
      o:['A major IV inside a minor key','A diminished ii','A major V','A ♭II'], a:0,
      why:'The raised 6th is the third of the chord on the fourth degree, so IV comes out major. i to IV is the sound.' },
    { q:'What is Dorian, in one sentence?',
      o:['Minor with a raised 6th','Major with a lowered 7th','Minor with a lowered 2nd','Major with a raised 4th'], a:0,
      why:'One note brighter than natural minor. The third stays minor, which is why it is still a minor mode.' }
  ],
  source:'Scales & Modes, lesson 4 · Dorian videos: Melody, Harmony, Texture'
},

/* ---------------------------------------------------------------- 4 ------ */
{
  id:'phrygian', module:'lessons', n:5,
  title:'Phrygian',
  short:'Minor with a lowered 2nd.',
  claim:'Phrygian is minor with a lowered 2nd. The note next to the tonic, a semitone away, pressing on it.',
  activity:'reharm',
  preset:{ theme:'lament', rootPc:4, mode:'phrygian', from:'aeolian' },
  challenge:'Take Lament from natural minor to Phrygian and listen to the second bar of the melody, where the line passes through the second degree.',
  videos:[
    { part:'melody',  title:'Phrygian · Melody',  url:V('phrygian','melody'),  minutes:5 },
    { part:'harmony', title:'Phrygian · Harmony', url:V('phrygian','harmony'), minutes:5 },
    { part:'texture', title:'Phrygian · Texture', url:V('phrygian','texture'), minutes:5 }
  ],
  body:[
    'Lower the 2nd of a natural minor scale. In E, the F♯ becomes F. One semitone, sitting directly above the tonic.',
    'That interval is the mode. A half step next to home is the most unstable thing in a scale, and because it is above the tonic rather than below it, it presses down rather than pulling up. Everything the mode is used for — menace, ritual, the Spanish and Middle-Eastern vocabularies, the sound of something ancient and not friendly — comes from that one semitone.',
    'In the harmony the lowered 2nd makes a <strong>major chord a semitone above the tonic</strong>, the ♭II. Moving i to ♭II and back — Em to F — is the Phrygian cadence, and it is one of the few two-chord patterns that cannot be mistaken for anything else.',
    'The melodic rule is simple: let the ♭2 fall to the tonic. Approach it from above, land on it, drop a semitone. Used the other way round, as a step up out of the tonic, it loses almost all of its force.'
  ],
  ex:{
    beginner:'Over an E drone, play E natural minor then E Phrygian. Stop on the second degree each time.',
    intermediate:'Loop Em to F for eight bars. Write a melody that falls from F to E at every chord change.',
    advanced:'Write a thirty-second cue in E Phrygian using only i and ♭II, and make it build without ever adding a third chord.'
  },
  quiz:[
    { q:'What makes Phrygian unmistakable?',
      o:['A semitone directly above the tonic','A raised 4th','A major 7th','A lowered 5th'], a:0,
      why:'The ♭2 presses down onto the tonic from a semitone away. No other mode has that interval in that place.' },
    { q:'Which chord is the Phrygian signature?',
      o:['♭II','IV','♭VII','V'], a:0,
      why:'The lowered 2nd is the root of a major chord a semitone above the tonic. i to ♭II is the cadence.' }
  ],
  source:'Scales & Modes, lesson 5 · Phrygian videos: Melody, Harmony, Texture'
},

/* ---------------------------------------------------------------- 5 ------ */
{
  id:'locrian', module:'lessons', n:6,
  title:'Locrian',
  short:'Phrygian with a lowered 5th, and no stable home.',
  claim:'Locrian lowers the fifth, so the tonic chord is diminished. It is the one mode that cannot sit still — which is exactly what it is for.',
  activity:'chords',
  preset:{ rootPc:11, mode:'locrian', sevenths:false, against:true },
  challenge:'Play the first two chords of the Locrian cadence, in order.',
  videos:[
    { part:'unstable', title:'Why Locrian is unstable', url:V('locrian','unstable'), minutes:5 },
    { part:'uses',     title:'Where it still works',    url:V('locrian','uses'),     minutes:5 }
  ],
  body:[
    'Take Phrygian and lower the fifth as well. In B, the F♯ becomes F. That is one change from Phrygian and two from natural minor, and it does something none of the other changes do: <strong>it breaks the tonic chord</strong>.',
    'Every other mode has a stable triad on its first degree — major or minor, something you can rest on. Locrian has a diminished one. B–D–F is not a home; it is a chord that wants to go somewhere. So a mode whose tonic cannot be rested on has no gravity, and that is why it is often described as unusable.',
    'It is not unusable, it is <em>specific</em>. Use it where instability is the point and where nothing has to resolve: a passage of suspended dread, a texture rather than a key, a few bars before something arrives. It works best when the bass stays on the tonic and the harmony above it refuses to settle, so the ear hears the tension without being asked to accept it as home.',
    'The one thing not to do is treat it as a key to write a tune in. Locrian is a colour you pass through. The chord grid is the honest way to meet it: look at the row of seven and see that the first tile is the diminished one, which is the fact everything else follows from.'
  ],
  ex:{
    beginner:'Play the seven chords of B Locrian in the grid and find the one you cannot end on.',
    intermediate:'Write four bars over a held B in the bass, using only chords from B Locrian, that never resolve.',
    advanced:'Write a passage that passes through Locrian for two bars on its way from one stable key to another, and make the two bars feel inevitable rather than arbitrary.'
  },
  quiz:[
    { q:'What is different about the tonic chord in Locrian?',
      o:['It is diminished','It is augmented','It is major','It has no third'], a:0,
      why:'The lowered fifth makes the chord on the first degree a diminished triad, which is why the mode has no stable home.' },
    { q:'Where does Locrian actually work?',
      o:['Where instability is the point and nothing must resolve','As a key for a melody','Over a dominant pedal','In place of major'], a:0,
      why:'It is a colour to pass through rather than a key to sit in. Used for tension over a held tonic, it does something no other mode does.' }
  ],
  source:'Scales & Modes, lesson 6 · Locrian videos: Why Locrian is unstable, Where it still works'
},

/* ---------------------------------------------------- the tools, on their own --- */
{ id:'brightness-lab', module:'lab', kind:'lab', activity:'brightness',
  title:'Brightness', claim:'Seven modes in a line, one note apart. Move the slider and hear which degree drops.',
  demoNote:'Pick a root, then walk the slider from Lydian down to Locrian. The key that just moved flashes.',
  source:'Scales & Modes · the tool from lesson 1' },

{ id:'chords-lab', module:'lab', kind:'lab', activity:'chords',
  title:'Chord grid', claim:'The seven chords of any mode on any root, with the signature ones marked.',
  demoNote:'Tap a tile to hear it. "Mark what differs" shows which chords are not the ones major or minor would give you.',
  source:'Scales & Modes · the tool from lessons 2 to 6' },

{ id:'reharm-lab', module:'lab', kind:'lab', activity:'reharm',
  title:'Reharmonizer', claim:'One tune, every mode. The notes that move are marked as they move.',
  demoNote:'Pick a theme and change mode. Literal keeps every degree as written, even when that makes a chord nobody would play; Idiomatic puts the mode\'s own signature chord there instead.',
  source:'Scales & Modes · the tool from lessons 2 to 5' }
];

/* The credit line under each lesson. Read by the shared engine, which shows
   the Accelerator's own when a product does not set one. These samples and
   these videos are not that product's, so this one says what they are. */
const LESSON_CREDIT = (l, esc) =>
  'From ' + esc(l.source) + '. Instrument samples: ' +
  '<a href="https://github.com/danigb/smplr" target="_blank" rel="noopener">smplr</a> and ' +
  '<a href="https://github.com/gleitz/midi-js-soundfonts" target="_blank" rel="noopener">FluidR3 GM / MIDI.js Soundfonts</a>, ' +
  '<a href="https://creativecommons.org/licenses/by/3.0/us/" target="_blank" rel="noopener">CC BY 3.0</a>, ' +
  'transposed and level-adjusted during playback. Offline, the site\'s own banks stand in.';
