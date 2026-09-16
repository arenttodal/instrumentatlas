/* ============================================================================
   THE DOJO · DATA
   ----------------------------------------------------------------------------
   CLIPS, BELTS, CONFUSIONS and the two teaching tables. Loads after
   atlas-data.js and before dojo.js, all deferred, so INSTRUMENTS is already
   defined here and everything below is visible to the renderer. Nothing
   exports; top-level const is the module system, as everywhere else in this
   repo.

   The architectural bet (spec §1): questions are ASSEMBLED from clips at
   runtime, never rendered as files. So this file describes what can be played,
   and BELTS describes how a question is built out of it. Adding an instrument
   adds questions to every belt it qualifies for, without touching dojo.js.
   ============================================================================ */

/* Paths resolve from one base, never hardcoded per entry. The dojo is a
   top-level section in its own folder, so the base climbs out of it — this is
   the only place that knows that. */
const DOJO_AUDIO = { base:'../audio/', ext:'aac' };

const clipSrc = c => `${DOJO_AUDIO.base}${c.file}.${DOJO_AUDIO.ext}`;

/* ----------------------------------------------------------------- CLIPS ---
   The sound library. `role` is what the clip IS, not what a question asks:
   'solo' is one instrument alone with nothing under it, which is the only
   thing belt 2 can use.

   Every entry below points at a file that exists on disk today. Sixteen
   instruments have a signature phrase; five of them are deliberately absent
   from this pool and the reasons are recorded where they are excluded.
   -------------------------------------------------------------------------- */
const CLIPS = {};

/* All but one of these play the same Atlas theme, which is what makes an A/B
   between any two of them a comparison of timbre rather than of material. */
[
  'piccolo','flute','oboe','bassoon',
  'trumpet','horn','trombone','tuba',
  'violin','viola','cello','double-bass',
  'harp','celesta'
].forEach(id => {
  CLIPS[id + '-sig'] = {
    file: `instruments/${id}/signature-phrase`,
    instrument: id,
    family: INSTRUMENTS[id].family,
    role: 'solo'
  };
});

/* Clarinet has no signature phrase rendered yet — only sustained/staccato/
   trills. It is included anyway on `sustained`, because clarinet is the first
   distractor for both oboe and flute, and a belt that cannot offer it as an
   answer cannot offer it in an A/B either. `substitute` marks the compromise:
   this clip is long held tones where every other clip is a melody, so a
   determined learner could identify it by material rather than by colour.
   Rendering audio/instruments/clarinet/signature-phrase.aac retires this
   entry — change the two lines below and nothing else. */
CLIPS['clarinet-sig'] = {
  file: 'instruments/clarinet/sustained',
  instrument: 'clarinet',
  family: 'woodwinds',
  role: 'solo',
  substitute: true
};

/* Deliberately NOT in the pool, and why:
     timpani, snare-drum   their only honest confusions are bass drum, cymbals
                           and gong, none of which has a solo clip. Every
                           distractor would be a free point, which is the exact
                           failure the CONFUSIONS table exists to prevent.
     bass-drum, cymbals,   no signature phrase on disk.
     gong
   All five come back the moment there is percussion to confuse them with. */

/* ----------------------------------------------------------------- BELTS ---
   `pool` decides which clips can be a question, `answer` reads the correct
   response off the clip, `layers` is how many clips sound at once. Belt 2 is
   the only one implemented this session; the rest are declared so the ladder
   is visible and so adding one is a data change plus its audio.
   -------------------------------------------------------------------------- */
const BELTS = [
  {
    id:'families', n:1, title:'Families', built:false,
    lede:'Four families. Learn the difference before anything else.',
    ask:'Which family is this?',
    pool: c => !!c.family && c.role === 'solo',
    answer: c => c.family,
    options:4, layers:1, unlock:0
  },
  {
    id:'instruments', n:2, title:'Instruments', built:true,
    lede:'Fifteen instruments, alone and dry. Get a name on every colour.',
    ask:'Which instrument is this?',
    pool: c => !!c.instrument && c.role === 'solo',
    answer: c => c.instrument,
    options:4, layers:1, unlock:0
  },
  { id:'melody',  n:3, title:'Melody',       built:false, ask:'Which instrument has the melody?',      lede:'A line over a bed. Find the line.',                   options:4, layers:2, unlock:2 },
  { id:'harmony', n:4, title:'Harmony',      built:false, ask:'What is playing the chords?',           lede:'One progression, five scorings.',                     options:4, layers:1, unlock:3 },
  { id:'doubling',n:5, title:'Doubling',     built:false, ask:'Which two instruments are combined?',   lede:'Two colours at once, and which two.',                 options:4, layers:2, unlock:3 },
  { id:'counter', n:6, title:'Inner voices', built:false, ask:'What is playing the countermelody?',    lede:'Not the tune. The other one.',                        options:4, layers:2, unlock:5 },
  { id:'context', n:7, title:'In context',   built:false, ask:'In this passage, what is carrying the line?', lede:'A real piece, twelve stems, no help.',           options:4, layers:12, unlock:6 }
];

/* ------------------------------------------------------------ CONFUSIONS ---
   What a learner is likely to confuse — the actual pedagogy. Distractors come
   from here and never at random: oboe against clarinet teaches, oboe against
   timpani is a free point.

   Two departures from the spec's table, both forced by what the atlas contains:
     · oboe's english-horn is not an instrument in this collection, so its slot
       goes to violin — the oboe/violin unison is the doubling every composer
       has to learn to hear apart.
     · piccolo, harp and celesta are new rows. They are in the pool, so they
       need real confusions of their own rather than borrowing someone else's.
   The family rows are unused until belt 1 and are kept here so that belt
   arrives as audio plus a pool function, nothing more.
   -------------------------------------------------------------------------- */
const CONFUSIONS = {
  piccolo:['flute','violin','celesta'],
  flute:['clarinet','piccolo','violin'],
  oboe:['clarinet','bassoon','violin'],
  clarinet:['oboe','flute','bassoon'],
  bassoon:['cello','horn','clarinet'],
  trumpet:['trombone','oboe','horn'],
  horn:['trombone','cello','bassoon'],
  trombone:['horn','tuba','trumpet'],
  tuba:['trombone','double-bass','bassoon'],
  violin:['flute','viola','oboe'],
  viola:['cello','violin','horn'],
  cello:['viola','bassoon','horn'],
  'double-bass':['cello','tuba','bassoon'],
  harp:['celesta','piccolo','flute'],
  celesta:['harp','piccolo','flute'],

  woodwinds:['strings','brass'],
  brass:['woodwinds','strings'],
  strings:['woodwinds','choir'],
  percussion:['brass','strings']
};

/* ----------------------------------------------------------- LISTEN_FOR ---
   Shown on a right answer. One line, and it must say what to listen FOR next
   time rather than congratulating anyone.
   -------------------------------------------------------------------------- */
const LISTEN_FOR = {
  piccolo:'Nothing else in the orchestra lives that high. If a line feels like it is sitting above the top of the texture, it is the piccolo.',
  flute:'Breath in the tone and no reed edge at all. The front of the note is soft even when the note is short.',
  oboe:'A narrow, nasal buzz that refuses to blend. If one line stands slightly in front of everything else, it is usually the oboe.',
  clarinet:'Hollow and smooth, with nothing on the front of the note. It can go from silence to full without changing colour.',
  bassoon:'Reedy like the oboe but two octaves down, and drier — more woody knock than singing tone.',
  trumpet:'A hard, focused edge on every attack. Brilliance in a narrow beam, pointed at you.',
  horn:'Round, slightly veiled, and the note arrives a fraction late. It sounds further back in the room than it is.',
  trombone:'Brass without the trumpet’s glare: broad and heavy, and the pitch slides into place rather than snapping to it.',
  tuba:'Weight with almost no edge. You feel the bottom of the sound before you can name its pitch.',
  violin:'Bow noise on the attack, vibrato underneath. Bright, but with a grain no wind instrument has.',
  viola:'The violin’s colour with the shine taken off — throatier, and slightly reluctant.',
  cello:'Chest resonance under the tone. It sings in the register a tenor would.',
  'double-bass':'Slow to speak, and so low that you hear its harmonics before its fundamental.',
  harp:'Every note is struck and then decays; nothing sustains. Listen for the rings overlapping.',
  celesta:'Struck metal with a bell inside it, but soft-edged. It glitters where the harp merely rings.'
};

/* --------------------------------------------------------- DISTINCTIONS ---
   Shown beside the A/B on a wrong answer, keyed by the pair sorted
   alphabetically. Every pair CONFUSIONS can produce has an entry; the
   generated fallback in dojo.js only ever runs for a pair that came from the
   timbre-distance backstop.

   These are the most valuable lines in the product. A wrong answer that ends
   in "incorrect" teaches nothing.
   -------------------------------------------------------------------------- */
const DISTINCTIONS = {
  'celesta|flute':'The flute sustains and the celesta cannot. If the note holds steady it is the flute; if it decays from the instant it starts, celesta.',
  'celesta|harp':'The harp is plucked string — you hear the pluck and the body behind it. The celesta is struck metal through a keyboard: a purer, bell-like ring with nothing on the front of the note.',
  'celesta|piccolo':'Both sparkle at the top of the orchestra. The piccolo is blown and can swell; the celesta is struck and can only fade.',
  'flute|harp':'The flute holds a note and the harp cannot. If it rings and fades, it is the harp.',
  'harp|piccolo':'Nothing in common but register. The piccolo sustains and can crescendo; the harp decays from the first instant and never grows.',
  'clarinet|flute':'The flute is breathy and open, the clarinet hollow and covered. Listen to the start of the note: the flute’s is soft air, the clarinet’s is a clean edge with no air behind it.',
  'flute|piccolo':'The same mechanism an octave apart. The piccolo is shriller and harder to control at the bottom; the flute has a breathy middle register the piccolo simply does not have.',
  'flute|violin':'Both can be sweet and high. The violin has bow grain and vibrato in the tone; the flute has breath and a clean, grainless sustain.',
  'clarinet|oboe':'The oboe buzzes and stands in front; the clarinet is smooth and sits inside the chord. If there is a reedy bite on the front of the note, it is the oboe.',
  'bassoon|oboe':'Two double reeds with the same nasal grain, roughly two octaves apart. Reedy and high is the oboe; reedy and low is the bassoon.',
  'oboe|violin':'At the same pitch both are bright and both cut through. The violin’s tone carries bow noise and vibrato; the oboe’s is steadier and narrower, with a buzz that never leaves it.',
  'bassoon|clarinet':'Both are low woodwinds. The clarinet is round and hollow; the bassoon is drier and reedier, with a woody knock on each note.',
  'bassoon|cello':'The same tenor register, and the most common mix-up in the orchestra. The cello has bow grain and continuous vibrato; the bassoon is drier and each note has a distinct reedy attack.',
  'bassoon|horn':'The horn is round and seamless, the bassoon reedy and articulated. If the line moves with no joints between the notes, it is the horn.',
  'trombone|trumpet':'Same family, different weight. The trumpet’s attack is hard and narrow; the trombone’s is broader, with more body arriving behind it.',
  'oboe|trumpet':'A loud oboe and a soft trumpet meet in the middle, both bright and penetrating. The trumpet’s note starts with a metallic edge, the oboe’s with a reed.',
  'horn|trumpet':'The trumpet points at you; the horn points away. The horn’s attack is softer, its tone rounder, and it sits further back in the room.',
  'horn|trombone':'Both are round and mid-weight. The trombone is heavier and more direct; the horn is veiled, sits behind it, and its notes arrive a fraction late.',
  'cello|horn':'A famous pairing because they are so close — the atlas has a demo of exactly this. The cello has bow grain on the attack; the horn arrives with no grain at all, slightly late and slightly veiled.',
  'horn|viola':'Both are middle voices with the shine taken off. The viola has bow noise and vibrato; the horn is smooth and breath-driven, with nothing on the front of the note.',
  'trombone|tuba':'The tuba is lower and much rounder. If you can still hear an edge on the note, it is the trombone.',
  'double-bass|tuba':'The orchestra’s two basses. The tuba is round, blown and continuous; the double bass has bow grain, and its pitch takes a moment to settle.',
  'bassoon|tuba':'Both are low and both are blown. The bassoon is reedy and articulate; the tuba is broad and almost edgeless.',
  'viola|violin':'The viola is a fifth lower and noticeably throatier. If the top of the line sounds bright and easy it is the violin; darker and slightly strained is the viola.',
  'cello|viola':'Adjacent registers in the same family. The cello has chest resonance under the tone that the viola never has; the viola is more nasal and more constrained.',
  'cello|double-bass':'An octave apart when they double each other. The double bass speaks more slowly and you hear its harmonics before its fundamental; the cello’s note arrives complete.',
  'bassoon|double-bass':'The bassoon’s notes each start with a reed; the double bass’s start with bow, and take longer to settle into pitch.',
  'piccolo|violin':'A high violin and a piccolo both sit above the staff. The violin has bow grain and vibrato; the piccolo is pure air, and gets shriller the louder it is played.'
};
