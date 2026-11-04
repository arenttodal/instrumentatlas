/* Spelling, diatonic harmony and degree remapping for evenant-theory.js.
   Runs in Node with no dependencies: node tests/theory.cjs */
const assert = require('node:assert/strict');
const T = require('../evenant-theory.js');

let checks = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); checks++; };
const eq = (a, b, msg) => { assert.deepEqual(a, b, msg + '\n      got ' + JSON.stringify(a) + '\n      want ' + JSON.stringify(b)); checks++; };

/* The fifteen roots a musician actually writes. Not every pitch class twice:
   these are the ones that appear on a page. */
const ROOTS = ['C','G','D','A','E','B','F♯','C♯','F','B♭','E♭','A♭','D♭','G♭','C♭'];
const MODE_IDS = T.MODES.map(m => m.id);

/* ---------------------------------------------------- 1. the brightness axis --- */
/* The claim the whole module rests on: each step down lowers exactly one
   degree, and the degrees lowered are 4, 7, 3, 6, 2, 5 in that order. */
{
  eq(T.MODES.map(m => m.brightness), [1,2,3,4,5,6,7], 'modes are in brightness order');
  const lowered = [];
  for(let i = 1; i < T.MODES.length; i++){
    const d = T.diff(T.MODES[i-1], T.MODES[i]);
    eq(d.length, 1, T.MODES[i-1].name + ' → ' + T.MODES[i].name + ' changes exactly one degree');
    eq(d[0].semitones, -1, T.MODES[i-1].name + ' → ' + T.MODES[i].name + ' LOWERS it');
    lowered.push(d[0].degree);
  }
  eq(lowered, [4,7,3,6,2,5], 'the degrees lowered, in order');
  /* A mode's COLOUR NOTE is where it differs from the scale it is defined
     against, which is not the degree that moved on the axis: Dorian arrives by
     lowering a 3rd but is taught as minor with a raised 6th. */
  for(const m of T.MODES){
    if(!m.from){ eq(m.colour, null, m.name + ' is a reference, so it has no colour note'); continue; }
    const d = T.diff(m.from, m);
    eq(d.length, 1, m.name + ' differs from ' + T.mode(m.from).name + ' in exactly one degree');
    eq(d[0].degree, m.colour, m.name + "'s colour note is its one difference from " + T.mode(m.from).name);
    ok(m.defined.length > 0, m.name + ' says in words what it is');
  }
}

/* ------------------------------------------------- 2. every mode, every root --- */
for(const root of ROOTS) for(const id of MODE_IDS){
  const where = root + ' ' + id;
  const names = T.spell(root, id);
  ok(names && names.length === 7, where + ' spells seven notes');

  const letters = names.map(n => T.parseNote(n).letter);
  eq(new Set(letters).size, 7, where + ' uses each letter once: ' + names.join(' '));
  eq(letters, T.LETTERS.slice(T.LETTERS.indexOf(letters[0])).concat(T.LETTERS.slice(0, T.LETTERS.indexOf(letters[0]))),
     where + ' letters run in order from the root');

  const rootPc = T.pcOf(root), steps = T.mode(id).steps;
  eq(names.map(n => ((T.pcOf(n) - rootPc) % 12 + 12) % 12), steps, where + ' sounds the mode');

  /* the key signature holds exactly the notes the scale alters, and nothing else */
  const sig = T.keySignature(root, id);
  const altered = names.filter(n => T.parseNote(n).alter !== 0);
  eq(sig.count, altered.length, where + ' signature counts every altered note');
  eq(new Set(sig.notes), new Set(altered), where + ' signature names them');
  const dirs = new Set(altered.map(n => Math.sign(T.parseNote(n).alter)));
  eq(sig.type, dirs.size === 0 ? 'natural' : dirs.size > 1 ? 'mixed' : (dirs.has(1) ? 'sharps' : 'flats'),
     where + ' signature type');
}

/* ------------------------------------------------------------ 3. spot checks --- */
eq(T.spell('D','lydian'),    ['D','E','F♯','G♯','A','B','C♯'],   'D Lydian');
eq(T.spell('E♭','dorian'),   ['E♭','F','G♭','A♭','B♭','C','D♭'], 'E♭ Dorian');
eq(T.spell('F♯','phrygian'), ['F♯','G','A','B','C♯','D','E'],    'F♯ Phrygian');
eq(T.spell('B','locrian'),   ['B','C','D','E','F','G','A'],      'B Locrian');
eq(T.keySignature('D','lydian'), { type:'sharps', count:3, notes:['F♯','C♯','G♯'] }, 'D Lydian signature');
eq(T.degreeLabels('lydian'),     ['1','2','3','♯4','5','6','7'],  'Lydian degree labels');
eq(T.degreeLabels('phrygian'),   ['1','♭2','♭3','4','5','♭6','♭7'], 'Phrygian degree labels');

/* the thing Voicing Atlas gets wrong: an E♯ inside F♯ Lydian, not an F */
eq(T.name(65, { root:'F♯', mode:'lydian' }), 'E♯4', 'MIDI 65 is E♯4 in F♯ Lydian');
eq(T.name(60, { root:'C',  mode:'ionian' }), 'C4',  'middle C');
/* and the octave follows the letter, not the sound */
eq(T.name(60, { root:'C♯', mode:'lydian' }), 'B♯3', 'MIDI 60 is B♯3 in C♯ Lydian');

/* ------------------------------------------------------ 4. bestRoot is clean --- */
for(const id of MODE_IDS) for(let pc = 0; pc < 12; pc++){
  const root = T.bestRoot(pc, id), where = 'bestRoot(' + pc + ", '" + id + "')";
  ok(root, where + ' returns something');
  eq(T.pcOf(root), pc, where + ' is the pitch class asked for');
  const names = T.spell(root, id);
  const doubles = names.filter(n => Math.abs(T.parseNote(n).alter) > 1);
  eq(doubles, [], where + ' = ' + root + ' needs no double accidental: ' + names.join(' '));
}
/* Cheapest wins outright where there is a cheapest: G♭ Lydian carries five
   accidentals against F♯ Lydian's six, so pitch class 6 is G♭ there even
   though Lydian is a bright mode. */
eq(T.bestRoot(6, 'lydian'), 'G♭', 'pitch class 6 is G♭ in Lydian — five flats beat six sharps');
eq(T.bestRoot(11,'locrian'), 'B', 'pitch class 11 is B in Locrian, never C♭');

/* Where the two spellings cost the SAME, the bright modes take the sharp one
   and the dark modes the flat one — unless one of the two roots is itself a
   plain letter, which always wins. These are every genuine tie there is. */
eq(T.bestRoot(6,  'ionian'),     'F♯', 'F♯ against G♭, Ionian is bright');
eq(T.bestRoot(1,  'mixolydian'), 'C♯', 'C♯ against D♭, Mixolydian is bright');
eq(T.bestRoot(8,  'dorian'),     'A♭', 'A♭ against G♯, Dorian is dark');
eq(T.bestRoot(3,  'aeolian'),    'E♭', 'E♭ against D♯, Aeolian is dark');
eq(T.bestRoot(10, 'phrygian'),   'B♭', 'B♭ against A♯, Phrygian is dark');
eq(T.bestRoot(5,  'locrian'),    'F',  'F against E♯: a plain letter beats a direction');
eq(T.bestRoot(11, 'lydian'),     'B',  'B against C♭: likewise');

/* and the rule holds wherever a tie exists, not only in the seven above */
for(const m of T.MODES) for(let pc = 0; pc < 12; pc++){
  const cost = root => { const n = T.spell(root, m);
    return n.reduce((a, x) => a + Math.abs(T.parseNote(x).alter), 0); };
  const cands = T.LETTERS.map(L => {
    const d = ((pc - T.NATURAL[L]) % 12 + 12) % 12, a = d > 6 ? d - 12 : d;
    return Math.abs(a) <= 1 ? { root: T.noteName(L, a), alter: a } : null;
  }).filter(Boolean).map(c => ({ ...c, cost: cost(c.root) })).sort((a, b) => a.cost - b.cost);
  if(cands.length < 2 || cands[0].cost !== cands[1].cost) continue;
  const chosen = cands.find(c => c.root === T.bestRoot(pc, m));
  ok(chosen, m.name + ' pc ' + pc + ': the chosen root is one of the candidates');
  const plain = cands.filter(c => c.alter === 0);
  if(plain.length) eq(chosen.alter, 0, m.name + ' pc ' + pc + ': a plain letter wins a tie');
  else eq(Math.sign(chosen.alter), m.brightness <= 3 ? 1 : -1,
          m.name + ' pc ' + pc + ': a tie goes ' + (m.brightness <= 3 ? 'sharp' : 'flat'));
}

/* ------------------------------------- 5. diatonic chords match the course map --- */
const EXPECTED = {
  lydian:     ['I','II','iii','♯iv°','V','vi','vii'],
  ionian:     ['I','ii','iii','IV','V','vi','vii°'],
  mixolydian: ['I','ii','iii°','IV','v','vi','♭VII'],
  dorian:     ['i','ii','♭III','IV','v','vi°','♭VII'],
  aeolian:    ['i','ii°','♭III','iv','v','♭VI','♭VII'],
  phrygian:   ['i','♭II','♭III','iv','v°','♭VI','♭vii'],
  locrian:    ['i°','♭II','♭iii','iv','♭V','♭VI','♭vii']
};
for(const id of MODE_IDS){
  eq(T.diatonic('C', id).map(c => c.numeral), EXPECTED[id], id + ' triad numerals');
  /* numerals are a property of the mode, not of the root */
  for(const root of ROOTS)
    eq(T.diatonic(root, id).map(c => c.numeral), EXPECTED[id], id + ' numerals are the same on ' + root);
  /* and each chord's notes really are the ones the scale spells */
  const names = T.spell('C', id);
  T.diatonic('C', id).forEach((c, i) => {
    eq(c.notes, [names[i], names[(i+2)%7], names[(i+4)%7]], id + ' degree ' + (i+1) + ' stacks thirds');
    eq(c.root, names[i], id + ' degree ' + (i+1) + ' root is spelled from the scale');
  });
  /* the signature degrees named in the data are real degrees */
  for(const d of T.mode(id).signature) ok(d >= 1 && d <= 7, id + ' signature degree ' + d + ' is in range');
  eq(T.diatonic('C', id).filter(c => c.signature).map(c => c.degree).sort(), [...T.mode(id).signature].sort(),
     id + ' marks its signature chords');
}
/* sevenths too, where the course map names one */
eq(T.diatonic('D','lydian',{sevenths:true})[0].symbol, 'Dmaj7', 'Lydian I is a major 7');
eq(T.diatonic('C','mixolydian',{sevenths:true})[0].symbol, 'C7',  'Mixolydian I is a dominant 7');
eq(T.diatonic('C','locrian',{sevenths:true})[0].symbol, 'Cm7♭5', 'Locrian i is half diminished');

/* ------------------------------------------------------------- 6. remapping --- */
{
  /* every diatonic note of every mode survives a round trip through every
     other mode, on every root */
  for(const root of ROOTS) for(const from of MODE_IDS) for(const to of MODE_IDS){
    const scale = T.mode(from).steps.map((s, i) => ({ m: T.pcOf(root) + 48 + s, s:i, d:1 }));
    const there = T.remap(scale, { root, from, to });
    const back  = T.remap(there, { root, from: to, to: from });
    eq(back.map(e => e.m), scale.map(e => e.m),
       root + ' ' + from + ' → ' + to + ' → ' + from + ' round-trips');
    eq(there.filter(e => e.chromatic).length, 0, root + ' ' + from + ' → ' + to + ': the scale is never chromatic');
  }
  /* a note outside the source mode keeps its pitch and says so */
  const outside = T.pcOf('C') + 48 + 1;                     // C♯, not in C Ionian
  const [e] = T.remap([{ m: outside, s:0, d:1 }], { root:'C', from:'ionian', to:'lydian' });
  eq(e.m, outside, 'a chromatic note does not move');
  eq(e.chromatic, true, 'and is flagged');
  eq(e.changed, false, 'and is not reported as changed');
  /* Ionian → Lydian moves the 4th and nothing else */
  const cmaj = T.mode('ionian').steps.map((s, i) => ({ m: 60 + s, s:i, d:1 }));
  const lyd = T.remap(cmaj, { root:'C', from:'ionian', to:'lydian' });
  eq(lyd.filter(x => x.changed).map(x => x.degree), [4], 'only the 4th moves');
  eq(lyd[3].m, 60 + 6, 'F becomes F♯');
}

/* ---------------------------------------------------------- 7. the builders --- */
{
  eq(T.degreeMidi('C','ionian',1,4), 60, 'C4 is the tonic of C in octave 4');
  eq(T.degreeMidi('D','lydian',4,4), 62 + 6, 'the raised 4th of D Lydian');
  eq(T.degreeMidi('C','ionian',8,4), 72, 'degree 8 is the octave');
  const scale = T.scaleEvents('C','ionian');
  eq(scale.length, 15, 'the scale runs up and back down');
  eq(scale[0].m, 60, 'starting on the tonic');
  eq(scale[7].m, 72, 'turning at the octave');
  const prog = T.progression([1,4,5,1], 'C', 'ionian', { octave:3 });
  eq(prog.length, 12, 'four triads');
  eq(prog.filter(e => e.s === 0).map(e => e.m), [48,52,55], 'the first chord is C major');
  eq([...new Set(prog.map(e => e.numeral))], ['I','IV','V'], 'and it is I IV V I');
  const spread = T.progression([1], 'C','ionian', { octave:3, voicing:'spread' });
  eq(spread.map(e => e.m), [36,52,67], 'a spread voicing opens the middle');
  eq(T.drone('C').map(e => e.m), [36,43], 'the drone is a root and a fifth');
}

console.log('PASS theory: ' + checks + ' checks — spelling on ' + ROOTS.length + ' roots × ' +
            MODE_IDS.length + ' modes, diatonic numerals, bestRoot, remap round trips, builders');
