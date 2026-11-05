/* ============================================================================
   SCALES & MODES · LISTEN
   ----------------------------------------------------------------------------
   Real pieces, each starting at the passage that shows the mode. Rendered by
   evenant-listen.js into the Listen step of a mode's lesson page.

   IONIAN AND AEOLIAN HAVE NO ENTRY. They are the two reference points every
   other mode is defined against, so there is nothing to point at.

   `start` and `end` are seconds; null means not set yet. `official` says
   whether the channel is a confirmed official upload. `strength` is how
   strongly the mode is there: throughout, passage or inflection.

   VERIFIED IS A TIMESTAMP THAT HAS BEEN LISTENED TO. Only verified:true cards
   are shown to a reader. Open a mode's Listen step with ?author=1 to see them
   all, set start and end by ear, mark them verified, and copy the result back
   into this file.
   ============================================================================ */

const LISTEN = {
  lydian: [
    { id: 'beethoven-heiliger-dankgesang', title: 'Heiliger Dankgesang', composer: 'Beethoven',
      source: 'String Quartet No. 15, Op. 132, III', year: 1825, kind: 'concert', focus: 'both',
      listen: 'A hymn in F with B♮ instead of B♭. The raised 4th is in Beethoven’s own title: “in the Lydian mode”.',
      strength: 'passage', why: 'https://www.chambermusicsociety.org/about-the-music/compositions/beethoven-op-132',
      yt: 'TcvnuqLFpkU', start: 0, end: null, official: true, verified: true },
    { id: 'bruckner-os-justi', title: 'Os justi', composer: 'Bruckner',
      source: 'Motet, WAB 30', year: 1879, kind: 'concert', focus: 'both',
      listen: 'An a cappella choir in F Lydian with no B♭ anywhere. The purest Lydian here.',
      strength: 'throughout', why: 'https://www.8notes.com/school/lessons/all/pieces_lydian_mode.asp',
      yt: '8IE6f6Awqvk', start: 0, end: null, official: true, verified: true },
    { id: 'williams-yodas-theme', title: 'Yoda’s Theme', composer: 'John Williams',
      source: 'The Empire Strikes Back', year: 1980, kind: 'film', focus: 'melody',
      listen: 'The first four bars lean Lydian, with a raised-4th neighbour note in bar 2, before the theme moves on.',
      strength: 'passage', why: 'https://flypaper.soundfly.com/write/how-john-williams-implies-modality-within-diatonic-harmony-in-yodas-theme/',
      yt: '9C8J-jhMtRA', start: null, end: null, official: true, verified: false },
    { id: 'williams-et-flying', title: 'Flying Theme (concert version)', composer: 'John Williams',
      source: 'E.T. the Extra-Terrestrial', year: 1982, kind: 'film', focus: 'melody',
      listen: 'In the coda, a bright F♯ over C: a Lydian moment rather than a Lydian piece.',
      strength: 'inflection', why: 'https://qualifications.pearson.com/content/dam/pdf/A%20Level/Music/2013/Teaching%20and%20learning%20materials/Unit-6-45-John-Williams-ET-1982-Flying-Theme.pdf',
      yt: 'olHOAnPY1GI', start: null, end: null, official: true, verified: false },
    { id: 'elfman-simpsons', title: 'The Simpsons Main Title', composer: 'Danny Elfman',
      source: 'The Simpsons', year: 1989, kind: 'tv', focus: 'melody',
      listen: 'The opening motif rises through the raised 4th; a lowered 7th comes later, which makes it Lydian dominant.',
      strength: 'throughout', why: 'https://elissamilne.com/2010/01/14/scale-of-the-day-2-the-simpsons-scale/',
      yt: '0u5PEhjyMfo', start: 0, end: null, official: true, verified: true },
    { id: 'kondo-lost-woods', title: 'Lost Woods (Saria’s Song)', composer: 'Koji Kondo',
      source: 'The Legend of Zelda: Ocarina of Time', year: 1998, kind: 'game', focus: 'melody',
      listen: 'The opening figure F–A–B leans on B♮, the raised 4th over F.',
      strength: 'inflection', why: 'https://splice.com/blog/music-modes-lydian',
      yt: 'V9so9y-8Dgk', start: null, end: null, official: false, verified: false }
  ],

  mixolydian: [
    { id: 'silvestri-back-to-the-future', title: 'Back to the Future (Main Theme)', composer: 'Alan Silvestri',
      source: 'Back to the Future', year: 1985, kind: 'film', focus: 'harmony',
      listen: 'The chorus lands with ♭VII7 to I: a major chord a whole step below home, resolving up to it.',
      strength: 'passage', why: 'https://www.hooktheory.com/theorytab/view/alan-silvestri/back-to-the-future-theme',
      yt: 'cgBvhmxun5M', start: null, end: null, official: true, verified: false },
    { id: 'horner-sons-of-scotland', title: 'Sons of Scotland', composer: 'James Horner',
      source: 'Braveheart', year: 1995, kind: 'film', focus: 'both',
      listen: 'It opens in A Mixolydian, close to one long A7 chord: the G♮ is the lowered 7th.',
      strength: 'passage', why: 'https://composerfocus.com/what-james-horners-score-to-braveheart-can-teach-us-about-modulation',
      yt: 'PihxcM_mNQ4', start: null, end: null, official: false, verified: false },
    { id: 'masuda-pokemon-title', title: 'Title Screen', composer: 'Junichi Masuda',
      source: 'Pokémon Red/Blue', year: 1996, kind: 'game', focus: 'both',
      listen: 'The opening rocks between I and ♭VII, and the melody holds the lowered 7th.',
      strength: 'passage', why: 'https://splice.com/blog/pokemon-most-important-chord-progression/',
      yt: 'Aj8k9ajTe2g', start: 0, end: null, official: false, verified: false },
    { id: 'masuda-pokemon-gym', title: 'Pokémon Gym', composer: 'Junichi Masuda',
      source: 'Pokémon Red/Blue', year: 1996, kind: 'game', focus: 'harmony',
      listen: 'The whole cue swaps I and ♭VII, so the lowered 7th is in the bass on every other chord.',
      strength: 'throughout', why: 'https://splice.com/blog/pokemon-most-important-chord-progression/',
      yt: 'La7wKkPk6uw', start: 0, end: null, official: false, verified: false },
    { id: 'grieg-piano-concerto-iii', title: 'Piano Concerto in A minor, III', composer: 'Grieg',
      source: 'Op. 16', year: 1868, kind: 'concert', focus: 'melody',
      listen: 'The Norwegian folk-dance themes use the lowered 7th.',
      strength: 'passage', why: 'https://en.wikipedia.org/wiki/Mixolydian_mode',
      yt: 'TQm3qP2kVz8', start: null, end: null, official: true, verified: false },
    { id: 'debussy-cathedrale', title: 'La cathédrale engloutie', composer: 'Debussy',
      source: 'Préludes, Book 1, No. 10', year: 1910, kind: 'concert', focus: 'both',
      listen: 'Around bars 33–37 an added B♭ turns C major into C Mixolydian for a moment.',
      strength: 'passage', why: 'https://en.wikipedia.org/wiki/La_cath%C3%A9drale_engloutie',
      yt: 'Hei1rIEX2es', start: null, end: null, official: true, verified: false },
    { id: 'howard-treasure-planet', title: 'Treasure Planet (horn theme)', composer: 'James Newton Howard',
      source: 'Treasure Planet', year: 2002, kind: 'film', focus: 'melody',
      listen: 'Owner’s pick, by ear: listen for the lowered 7th in the horn line.',
      strength: 'passage', why: null,
      yt: null, start: null, end: null, official: false, verified: false }
  ],

  dorian: [
    { id: 'morricone-cheyenne', title: 'Cheyenne’s Theme', composer: 'Ennio Morricone',
      source: 'Once Upon a Time in the West', year: 1968, kind: 'film', focus: 'both',
      listen: 'The turn rises to F♯, the raised 6th in A minor, so the Am–D vamp is a Dorian i–IV.',
      strength: 'passage', why: 'https://filmmusicnotes.com/ennio-morricones-score-for-once-upon-a-time-in-the-west-part-2-of-3-cheyennes-theme/',
      yt: 'ijnuWfd5MBs', start: 5, end: null, official: true, verified: false },
    { id: 'zimmer-inception-time', title: 'Time', composer: 'Hans Zimmer',
      source: 'Inception', year: 2010, kind: 'film', focus: 'harmony',
      listen: 'Am–Em–G–D: the D major chord brings in F♯, borrowed from A Dorian.',
      strength: 'inflection', why: 'https://blog.landr.com/cinematic-chord-progressions',
      yt: 'c56t7upa8Bk', start: null, end: null, official: true, verified: false },
    { id: 'kondo-song-of-time', title: 'Song of Time / Serenade of Water', composer: 'Koji Kondo',
      source: 'The Legend of Zelda: Ocarina of Time', year: 1998, kind: 'game', focus: 'melody',
      listen: 'Short ocarina tunes that land on B♮, the raised 6th over D.',
      strength: 'throughout', why: 'https://thinkspace.ac.uk/blog/a-lesson-in-modes-from-the-legend-of-zelda/',
      yt: 'WgSuC4tnBIE', start: null, end: null, official: false, verified: false },
    { id: 'rvw-my-bonny-boy', title: 'English Folk Song Suite, II. “My Bonny Boy”', composer: 'Vaughan Williams',
      source: 'English Folk Song Suite', year: 1923, kind: 'concert', focus: 'melody',
      listen: 'An oboe solo in F Dorian opens the movement: D♮ against an F-minor colour.',
      strength: 'passage', why: 'https://en.wikipedia.org/wiki/English_Folk_Song_Suite',
      yt: 'fbk7BB0Tqa0', start: null, end: null, official: true, verified: false },
    { id: 'sibelius-symphony-6', title: 'Symphony No. 6', composer: 'Sibelius',
      source: 'Op. 104', year: 1923, kind: 'concert', focus: 'both',
      listen: 'D-centred music with B♮ where you expect B♭. Large stretches are Dorian.',
      strength: 'throughout', why: 'https://www.cambridge.org/core/journals/tempo/article/abs/tonality-and-modality-in-sibeliuss-sixth-symphony/7D530E2CD1EDDA9969799C49570B4963',
      yt: 'yZgeqzLOWCw', start: null, end: null, official: true, verified: false }
  ],

  phrygian: [
    { id: 'shore-prologue', title: 'Prologue: One Ring to Rule Them All', composer: 'Howard Shore',
      source: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, kind: 'film', focus: 'both',
      listen: 'The ♭2 semitone above the tonic and the ♭II–i move. Later the 3rd is raised, turning it Phrygian dominant.',
      strength: 'passage', why: 'https://hooktheory.com/theorytab/view/howard-shore/prologue--one-ring-to-rule-them-all',
      yt: 'UJNeiBaEMIE', start: null, end: null, official: false, verified: false },
    { id: 'brahms-4-andante', title: 'Symphony No. 4, II. Andante moderato', composer: 'Brahms',
      source: 'Op. 98', year: 1885, kind: 'concert', focus: 'melody',
      listen: 'The movement opens with an unaccompanied horn theme in E Phrygian: F♮ over E.',
      strength: 'passage', why: 'https://en.wikipedia.org/wiki/Symphony_No._4_(Brahms)',
      yt: 'Mv0XqA5xVNQ', start: 0, end: null, official: false, verified: false },
    { id: 'masuda-trainer-battle', title: 'Battle (Vs. Trainer)', composer: 'Junichi Masuda',
      source: 'Pokémon Red/Blue', year: 1996, kind: 'game', focus: 'harmony',
      listen: 'Heavy ♭II harmony; the chorus is in A Phrygian, B♭ against A.',
      strength: 'passage', why: 'https://splice.com/blog/music-modes-phrygian/',
      yt: null, start: null, end: null, official: false, verified: false },
    { id: 'phillips-knight-rider', title: 'Knight Rider (Main Title)', composer: 'Stu Phillips & Glen A. Larson',
      source: 'Knight Rider', year: 1982, kind: 'tv', focus: 'both',
      listen: 'Phrygian dominant on F♯: a major tonic with G♮ as the ♭2.',
      strength: 'throughout', why: 'https://twochords.substack.com/p/knight-rider-1982',
      yt: 'lxhWxv_5bQ0', start: null, end: null, official: false, verified: false },
    { id: 'barber-adagio', title: 'Adagio for Strings', composer: 'Samuel Barber',
      source: 'Concert work; Platoon, The Elephant Man', year: 1936, kind: 'concert', focus: 'both',
      listen: 'A Phrygian moment from G♭ as the ♭2, inside a piece that is mostly B♭ minor.',
      strength: 'inflection', why: 'https://hellomusictheory.com/learn/phrygian-mode/',
      yt: 'WAoLJ8GbA4Y', start: null, end: null, official: false, verified: false }
  ],

  locrian: [
    { id: 'bjork-army-of-me', title: 'Army of Me', composer: 'Björk',
      source: 'Post', year: 1995, kind: 'song', focus: 'both',
      listen: 'The bass riff in C Locrian steps down to the ♭5 (G♭). The tonic never quite settles, which is the point.',
      strength: 'throughout', why: 'https://www.ethanhein.com/wp/2015/musical-simples-army-of-me/',
      yt: 'PkakXTo26Sg', start: null, end: null, official: true, verified: false },
    { id: 'kirkpatrick-dust-to-dust', title: 'Dust to Dust', composer: 'John Kirkpatrick',
      source: 'Folk song (sung by Jon Boden)', year: 1972, kind: 'song', focus: 'melody',
      listen: 'A sung Locrian folk melody: the ♭5 sits where a stable 5th should be. Locrian that is beautiful, not scary.',
      strength: 'throughout', why: 'https://www.afolksongaday.com/?p=2753',
      yt: '5-lJMalRMew', start: null, end: null, official: false, verified: false },
    { id: 'gordon-at-dooms-gate', title: 'At Doom’s Gate', composer: 'Mick Gordon',
      source: 'DOOM', year: 2016, kind: 'game', focus: 'harmony',
      listen: 'The main guitar riff grinds the ♭5 and ♭2 against a low tonic.',
      strength: 'passage', why: 'https://splice.com/blog/music-modes-locrian/',
      yt: 'Jly9qp40rfw', start: null, end: null, official: false, verified: false },
    { id: 'hindemith-turandot', title: 'Symphonic Metamorphosis, II. Turandot: Scherzo', composer: 'Hindemith',
      source: 'Symphonic Metamorphosis of Themes by Weber', year: 1943, kind: 'concert', focus: 'both',
      listen: 'A theme on F that mixes Mixolydian and Locrian: listen for the lowered 2nd and 5th colouring the F centre.',
      strength: 'inflection', why: 'https://symposium.music.org/volume-36/articles-1752877059/the-triumph-of-timelessness-over-time-in-hindemiths-turandot-scherzo-from-symphonic-metamorphosis-of-themes-by-carl-maria-von-weber',
      yt: 'xrVzbcIA4Mg', start: null, end: null, official: true, verified: false }
  ]
};
