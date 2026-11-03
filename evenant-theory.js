/* ============================================================================
   EVENANT · THEORY
   ----------------------------------------------------------------------------
   The shared music theory for Theory Lab. Pure: no DOM, no audio, no browser
   API. One global, EvTheory, and a CommonJS export at the bottom so Node can
   run it in tests.

   Ported from the Voicing Atlas Chord Explorer (index.html, around lines 14450
   and 15761): the mode table, the quality-at-a-degree function, the diatonic
   row and the numeral logic. De-globalised, not redesigned.

   ONE THING IS NOT PORTED, DELIBERATELY. Voicing Atlas spells notes from a
   fixed twelve-entry table with one name per pitch class. That table cannot
   produce E♯, F♭ or any double accidental, so F♯ Lydian comes out with an F in
   it and D♭ Locrian is unspellable. Its own source says so. Here, spelling is
   derived:

     Degree i takes the letter i steps after the root's letter. Its accidental
     is the signed distance from that letter's natural pitch to the pitch the
     mode asks for.

   Each of the seven letters is then used exactly once, which is what makes a
   scale a scale, and a double accidental appears only when the root genuinely
   demands one. Voicing Atlas can adopt this later; nothing here depends on it.
   ============================================================================ */

const EvTheory = (() => {

  /* ---------------------------------------------------------------- notes --- */
  const LETTERS = ['C','D','E','F','G','A','B'];
  const NATURAL = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  /* Doubled glyphs rather than 𝄪 and 𝄫: the suite's body font has these and
     does not have those, and a missing glyph in a scale is worse than a wide
     one. */
  const GLYPH = { '-2':'♭♭', '-1':'♭', '0':'', '1':'♯', '2':'♯♯' };
  /* the orders a key signature is written in */
  const SHARP_ORDER = ['F','C','G','D','A','E','B'];
  const FLAT_ORDER  = ['B','E','A','D','G','C','F'];

  const mod = (n, m) => ((n % m) + m) % m;
  /* the shortest signed distance from `from` to `to` in semitones, -5…6 */
  const near = (from, to) => { const d = mod(to - from, 12); return d > 6 ? d - 12 : d; };

  /* 'E♭' and 'Eb' and 'D#' all parse; '♯' and '#' are the same character to a
     learner typing into a URL. */
  function parseNote(name){
    const m = String(name).trim().match(/^([A-Ga-g])([#♯b♭x𝄪𝄫]*)$/);
    if(!m) return null;
    const letter = m[1].toUpperCase();
    let alter = 0;
    for(const ch of m[2]){
      if(ch === '#' || ch === '♯') alter += 1;
      else if(ch === 'b' || ch === '♭') alter -= 1;
      else if(ch === 'x' || ch === '𝄪') alter += 2;
      else if(ch === '𝄫') alter -= 2;
    }
    return { letter, alter, index: LETTERS.indexOf(letter), pc: mod(NATURAL[letter] + alter, 12) };
  }
  const noteName = (letter, alter) =>
    letter + (GLYPH[String(alter)] ?? (alter > 0 ? '♯'.repeat(alter) : '♭'.repeat(-alter)));
  const pcOf = name => { const n = parseNote(name); return n ? n.pc : null; };

  /* ---------------------------------------------------------------- modes ---
     Brightness order, and every step down it lowers exactly one degree:
     4, then 7, 3, 6, 2, 5. That single fact is what the brightness slider is
     built on, and it is checked in tests/theory.cjs rather than trusted.

     `ref` is the scale this mode is DEFINED AGAINST in the course — major for
     the bright three, minor for the dark four. It decides which harmonic
     function row the diatonic chords get, because a mode one note from major
     behaves like major and one note from minor behaves like minor.

     `from` is the scale the course DEFINES this mode against, and `colour` is
     the single degree where they differ — which is not the same as the degree
     that moved on the brightness axis. Dorian is one step darker than
     Mixolydian (a lowered 3rd) but it is taught as minor with a RAISED 6th,
     and Locrian is taught against Phrygian rather than against minor because
     it differs from minor in two places.

     `signature` and `cadence` are scale degrees, 1-based, so
     they render on any root; `signatureText` is the course's own wording for
     the same thing, including Lydian's Imaj7♯11, which is the tonic with the
     colour note on top and therefore not a plain diatonic seventh the chord
     grid can build. */
  const MODES = [
    { id:'lydian',     name:'Lydian',     brightness:1, steps:[0,2,4,6,7,9,11], ref:'major', from:'ionian',
      defined:'Major with a raised 4th',  colour:4, signature:[2],   cadence:[1,2,1], signatureText:'II (major), Imaj7♯11', cadenceText:'I – II – I'     },
    { id:'ionian',     name:'Ionian',     brightness:2, steps:[0,2,4,5,7,9,11], ref:'major', from:null,
      defined:'Reference: major',         colour:null, signature:[4,5], cadence:[1,4,5,1], signatureText:'IV, V', cadenceText:'I – IV – V – I', alias:'major' },
    { id:'mixolydian', name:'Mixolydian', brightness:3, steps:[0,2,4,5,7,9,10], ref:'major', from:'ionian',
      defined:'Major with a lowered 7th', colour:7, signature:[7,5], cadence:[1,7,1], signatureText:'♭VII, v', cadenceText:'I – ♭VII – I'     },
    { id:'dorian',     name:'Dorian',     brightness:4, steps:[0,2,3,5,7,9,10], ref:'minor', from:'aeolian',
      defined:'Minor with a raised 6th',  colour:6, signature:[4,2], cadence:[1,4,1], signatureText:'IV (major), ii', cadenceText:'i – IV – i'     },
    { id:'aeolian',    name:'Aeolian',    brightness:5, steps:[0,2,3,5,7,8,10], ref:'minor', from:null,
      defined:'Reference: natural minor', colour:null, signature:[6,7], cadence:[1,6,7,1], signatureText:'♭VI, ♭VII', cadenceText:'i – ♭VI – ♭VII – i', alias:'minor' },
    { id:'phrygian',   name:'Phrygian',   brightness:6, steps:[0,1,3,5,7,8,10], ref:'minor', from:'aeolian',
      defined:'Minor with a lowered 2nd', colour:2, signature:[2,7], cadence:[1,2,1], signatureText:'♭II, ♭vii', cadenceText:'i – ♭II – i'     },
    { id:'locrian',    name:'Locrian',    brightness:7, steps:[0,1,3,5,6,8,10], ref:'minor', from:'phrygian',
      defined:'Phrygian with a lowered 5th', colour:5, signature:[1,2,5], cadence:[1,2,1], signatureText:'i°, ♭II, ♭V', cadenceText:'i° – ♭II – i°' }
  ];
  const byId = {}; MODES.forEach(m => { byId[m.id] = m; if(m.alias) byId[m.alias] = m; });
  const mode = id => (typeof id === 'object' && id ? id : byId[String(id).toLowerCase()]) || null;
  const IONIAN = byId.ionian, AEOLIAN = byId.aeolian;

  /* -------------------------------------------------------------- spelling --- */
  /* The whole of it. Letter from the degree, accidental from the distance. */
  function spell(root, modeId){
    const r = parseNote(root), m = mode(modeId);
    if(!r || !m) return null;
    return m.steps.map((step, i) => {
      const letter = LETTERS[(r.index + i) % 7];
      const want = mod(r.pc + step, 12);
      return noteName(letter, near(NATURAL[letter], want));
    });
  }

  /* How many accidentals a given spelling of a root costs, and whether it needs
     a double. bestRoot picks the cheapest. */
  function spellingCost(root, modeId){
    const names = spell(root, modeId);
    if(!names) return null;
    let total = 0, worst = 0;
    for(const n of names){ const a = Math.abs(parseNote(n).alter); total += a; worst = Math.max(worst, a); }
    return { names, total, worst };
  }

  /* Every way of writing this pitch class, cheapest first. On a tie the bright
     modes take sharps and the dark ones flats, which is how the same pitch is
     written F♯ Lydian but G♭ Phrygian. */
  function bestRoot(pc, modeId){
    const m = mode(modeId);
    if(!m) return null;
    const want = mod(pc, 12), prefer = m.brightness <= 3 ? 1 : -1;
    const options = [];
    for(const letter of LETTERS){
      const alter = near(NATURAL[letter], want);
      if(Math.abs(alter) > 2) continue;
      const name = noteName(letter, alter);
      const cost = spellingCost(name, m);
      if(cost) options.push({ name, alter, total: cost.total, worst: cost.worst });
    }
    options.sort((a, b) =>
      (a.worst > 1) - (b.worst > 1) ||          // never a double if anything else will do
      a.total - b.total ||                       // then fewest accidentals
      Math.abs(a.alter) - Math.abs(b.alter) ||   // then the simpler root
      (Math.sign(b.alter) === prefer) - (Math.sign(a.alter) === prefer));
    return options.length ? options[0].name : null;
  }

  /* The accidentals this scale actually carries, written in the order a key
     signature is written in. A mode's signature is its own, not its relative
     major's: D Lydian is three sharps. */
  function keySignature(root, modeId){
    const names = spell(root, modeId);
    if(!names) return null;
    const sharps = [], flats = [];
    for(const n of names){ const p = parseNote(n); if(p.alter > 0) sharps.push(p); else if(p.alter < 0) flats.push(p); }
    const pick = (list, order) => order
      .flatMap(L => list.filter(p => p.letter === L))
      .map(p => noteName(p.letter, p.alter));
    if(sharps.length && flats.length)                       // a root that needs both
      return { type:'mixed', count: sharps.length + flats.length,
               notes: pick(sharps, SHARP_ORDER).concat(pick(flats, FLAT_ORDER)) };
    if(sharps.length) return { type:'sharps', count: sharps.length, notes: pick(sharps, SHARP_ORDER) };
    if(flats.length)  return { type:'flats',  count: flats.length,  notes: pick(flats,  FLAT_ORDER)  };
    return { type:'natural', count:0, notes:[] };
  }

  /* ------------------------------------------------------- degrees and diff --- */
  /* Against the major scale, always: ♭VII in Mixolydian, ♯4 in Lydian. The
     reference for a NUMBER is major even when the reference for a FUNCTION is
     minor, because that is how musicians read them. */
  function degreeLabels(modeId){
    const m = mode(modeId);
    if(!m) return null;
    return m.steps.map((s, i) => {
      const d = s - IONIAN.steps[i];
      return (d === 0 ? '' : d > 0 ? '♯'.repeat(d) : '♭'.repeat(-d)) + (i + 1);
    });
  }

  /* What moves between two modes. One entry per degree that differs. */
  function diff(fromId, toId){
    const a = mode(fromId), b = mode(toId);
    if(!a || !b) return null;
    const la = degreeLabels(a), lb = degreeLabels(b);
    const out = [];
    for(let i = 0; i < 7; i++) if(a.steps[i] !== b.steps[i])
      out.push({ degree: i + 1, from: la[i], to: lb[i], semitones: b.steps[i] - a.steps[i] });
    return out;
  }

  /* ---------------------------------------------------------------- chords --- */
  /* Ported from Voicing Atlas CE_TRIADS / CE_SEVENTHS, trimmed to what a
     diatonic row can produce plus the two the modes never make but a theme
     might ask for. */
  const CHORD_TYPES = {
    major:   { id:'major',   sym:'',      label:'Major',      iv:[0,4,7]      },
    minor:   { id:'minor',   sym:'m',     label:'Minor',      iv:[0,3,7]      },
    dim:     { id:'dim',     sym:'dim',   label:'Diminished', iv:[0,3,6]      },
    aug:     { id:'aug',     sym:'aug',   label:'Augmented',  iv:[0,4,8]      },
    maj7:    { id:'maj7',    sym:'maj7',  label:'Major 7',    iv:[0,4,7,11]   },
    dom7:    { id:'dom7',    sym:'7',     label:'Dominant 7', iv:[0,4,7,10]   },
    min7:    { id:'min7',    sym:'m7',    label:'Minor 7',    iv:[0,3,7,10]   },
    minmaj7: { id:'minmaj7', sym:'mMaj7', label:'Minor Maj7', iv:[0,3,7,11]   },
    hdim:    { id:'hdim',    sym:'m7♭5',  label:'Half Dim',   iv:[0,3,6,10]   },
    dim7:    { id:'dim7',    sym:'dim7',  label:'Dim 7',      iv:[0,3,6,9]    },
    augmaj7: { id:'augmaj7', sym:'maj7♯5',label:'Aug Maj7',   iv:[0,4,8,11]   }
  };

  /* Voicing Atlas's ckQualityAt, unchanged in substance: stack thirds on degree
     i of this scale and name what comes out. */
  function qualityAt(steps, i){
    const iv = n => mod(steps[(i + n) % 7] - steps[i], 12);
    const t = iv(2), f = iv(4), s = iv(6);
    const triad = (t === 4 && f === 7) ? 'major'
                : (t === 3 && f === 7) ? 'minor'
                : (t === 3 && f === 6) ? 'dim'
                : (t === 4 && f === 8) ? 'aug' : null;
    const seventh = (t===4&&f===7&&s===11) ? 'maj7'
                  : (t===4&&f===7&&s===10) ? 'dom7'
                  : (t===3&&f===7&&s===10) ? 'min7'
                  : (t===3&&f===7&&s===11) ? 'minmaj7'
                  : (t===3&&f===6&&s===10) ? 'hdim'
                  : (t===3&&f===6&&s=== 9) ? 'dim7'
                  : (t===4&&f===8&&s===11) ? 'augmaj7' : null;
    return { triad, seventh };
  }

  /* Case follows quality; ° and + follow the triad; the accidental is however
     far this degree sits from the major scale. */
  function numeralFor(degreeIndex, modeSteps, quality){
    const base = ['I','II','III','IV','V','VI','VII'][degreeIndex];
    const d = modeSteps[degreeIndex] - IONIAN.steps[degreeIndex];
    const accidental = d === 0 ? '' : d > 0 ? '♯'.repeat(d) : '♭'.repeat(-d);
    const minorish = quality === 'minor' || quality === 'dim' || quality === 'min7'
                  || quality === 'hdim' || quality === 'dim7' || quality === 'minmaj7';
    const suffix = (quality === 'dim' || quality === 'hdim' || quality === 'dim7') ? '°'
                 : (quality === 'aug' || quality === 'augmaj7') ? '+' : '';
    return accidental + (minorish ? base.toLowerCase() : base) + suffix;
  }

  /* Harmonic function by scale degree, taken from Voicing Atlas's two rows and
     chosen by the mode's reference scale. A mode one note away from major
     behaves like major; one note from minor behaves like minor. */
  const FUNCTIONS = {
    major: ['home','motion','home','motion','tension','home','tension'],
    minor: ['home','tension','home','motion','tension','motion','tension']
  };
  const FUNCTION_COLORS = { home:'#4ADE80', motion:'#4f8fff', tension:'#F87171' };
  const FUNCTION_LABELS = { home:'Home', motion:'Motion', tension:'Tension' };

  /* The seven chords of a mode on a root, spelled. */
  function diatonic(root, modeId, opts){
    const o = opts || {}, m = mode(modeId), r = parseNote(root);
    if(!m || !r) return null;
    const names = spell(root, m), sevenths = !!o.sevenths;
    return m.steps.map((step, i) => {
      const q = qualityAt(m.steps, i);
      const quality = (sevenths ? q.seventh : q.triad) || q.triad || 'major';
      const type = CHORD_TYPES[quality];
      const size = sevenths ? 4 : 3;
      const tones = [];
      for(let k = 0; k < size; k++) tones.push((i + 2 * k) % 7);
      return {
        degree: i + 1,
        root: names[i],
        rootPc: mod(r.pc + step, 12),
        quality, symbol: names[i] + type.sym, label: type.label,
        iv: type.iv,
        notes: tones.map(t => names[t]),
        pcs: tones.map(t => mod(r.pc + m.steps[t], 12)),
        numeral: numeralFor(i, m.steps, quality),
        fn: FUNCTIONS[m.ref][i],
        signature: m.signature.includes(i + 1),
        colour: m.colour === i + 1
      };
    });
  }

  /* --------------------------------------------------------------- naming --- */
  /* A MIDI note named inside a key. In the scale, it takes the scale's own
     spelling, so F♯ Lydian really does show E♯ rather than F. Outside it, the
     key's direction decides: sharps in a sharp key, flats in a flat one.

     The octave follows the LETTER, not the sound. B♯ sounding at middle C is
     B♯3, and C♭ sounding at B3 is C♭4. */
  function name(midi, opts){
    const o = opts || {}, pc = mod(midi, 12);
    let label = null;
    if(o.root && o.mode){
      const r = parseNote(o.root), m = mode(o.mode);
      if(r && m){
        const i = m.steps.indexOf(mod(pc - r.pc, 12));
        if(i >= 0) label = spell(o.root, m)[i];
        else {
          const sig = keySignature(o.root, m);
          const dir = sig.type === 'flats' ? -1 : 1;
          label = chromatic(pc, dir);
        }
      }
    }
    if(!label) label = chromatic(pc, 1);
    const p = parseNote(label);
    let oct = Math.floor(midi / 12) - 1;
    if(NATURAL[p.letter] - pc > 6) oct -= 1;
    else if(pc - NATURAL[p.letter] > 6) oct += 1;
    return label + oct;
  }
  /* a pitch class with no key to belong to */
  function chromatic(pc, dir){
    for(const letter of LETTERS) if(NATURAL[letter] === mod(pc, 12)) return letter;
    for(const letter of LETTERS){
      const a = near(NATURAL[letter], mod(pc, 12));
      if(a === dir) return noteName(letter, a);
    }
    return noteName('C', 0);
  }

  /* -------------------------------------------------------------- remapping ---
     The reharmonizer's one operation. A note keeps its SCALE DEGREE and moves
     to wherever the target mode puts that degree, in the same octave relative
     to the tonic. A note that is not in the source mode has no degree to keep,
     so it stays where it is and says so.

     Chords are never remapped this way. A progression is stored as degrees and
     rebuilt with diatonic() in the target mode, so a IV that should become a
     ♯iv° becomes one instead of being dragged note by note. */
  function remap(events, opts){
    const o = opts || {}, from = mode(o.from), to = mode(o.to), r = parseNote(o.root);
    if(!from || !to || !r || !Array.isArray(events)) return events || [];
    return events.map(e => {
      if(!Number.isFinite(e.m)) return { ...e };
      const rel = mod(e.m - r.pc, 12);
      const i = from.steps.indexOf(rel);
      if(i < 0) return { ...e, chromatic: true, changed: false };
      const delta = to.steps[i] - from.steps[i];
      return { ...e, m: e.m + delta, degree: i + 1, changed: delta !== 0, chromatic: false };
    });
  }

  /* -------------------------------------------------------------- building --- */
  /* MIDI for a degree of a mode, in a given octave. Octave 4 means the tonic
     sits at C4's octave: the tonic of D in octave 4 is D4 = 62. */
  function degreeMidi(root, modeId, degree, octave){
    const m = mode(modeId), r = parseNote(root);
    if(!m || !r) return null;
    const d = Math.round(degree) - 1, step = m.steps[mod(d, 7)], lift = 12 * Math.floor(d / 7);
    return 12 * ((octave === undefined ? 4 : octave) + 1) + r.pc + step + lift;
  }

  /* A chord progression written in scale degrees, built into note events.
     `voicing` is 'close' (a plain stack) or 'spread' (root dropped an octave,
     which is what the overtone series suggests and what stops a low triad
     turning to mud). */
  function progression(degrees, root, modeId, opts){
    const o = opts || {}, chords = diatonic(root, modeId, { sevenths: !!o.sevenths });
    if(!chords) return [];
    const octave = o.octave === undefined ? 3 : o.octave;
    const beats = o.beats === undefined ? 4 : o.beats;
    const out = [];
    degrees.forEach((item, n) => {
      const spec = typeof item === 'number' ? { deg:item, s:n * beats, d:beats } : item;
      const c = chords[mod(Math.round(spec.deg) - 1, 7)];
      if(!c) return;
      const base = degreeMidi(root, modeId, c.degree, octave);
      const tones = c.iv.map((iv, k) => ({ m: base + iv, k }));
      if(o.voicing === 'spread' && tones.length > 2){
        tones[0].m -= 12;                       // root down an octave
        tones[tones.length - 1].m += 12;        // top voice up, opening the middle
      }
      tones.forEach(t => out.push({
        m: t.m, s: spec.s === undefined ? n * beats : spec.s,
        d: spec.d === undefined ? beats : spec.d,
        layer: o.layer || 'Chords', degree: c.degree, numeral: c.numeral
      }));
    });
    return out;
  }

  /* The scale itself, as playable events: up then down, one note per step. */
  function scaleEvents(root, modeId, opts){
    const o = opts || {}, m = mode(modeId);
    if(!m) return [];
    const octave = o.octave === undefined ? 4 : o.octave, d = o.d === undefined ? 0.5 : o.d;
    const up = [...m.steps.map((_, i) => i + 1), 8];
    const line = o.down === false ? up : up.concat(up.slice(0, -1).reverse());
    return line.map((deg, i) => ({
      m: degreeMidi(root, m, deg, octave), s: i * d, d,
      layer: o.layer || 'Scale', degree: mod(deg - 1, 7) + 1
    }));
  }

  /* A root-and-fifth drone. A mode is only audible against a fixed tonic, and
     this is the most common reason people say they cannot hear modes. */
  function drone(root, opts){
    const o = opts || {}, r = parseNote(root);
    if(!r) return [];
    const octave = o.octave === undefined ? 2 : o.octave;
    const base = 12 * (octave + 1) + r.pc, d = o.d === undefined ? 8 : o.d;
    return [{ m: base, s:0, d, layer:'Drone', gain: o.gain === undefined ? 0.1 : o.gain },
            { m: base + 7, s:0, d, layer:'Drone', gain: o.gain === undefined ? 0.08 : o.gain * 0.8 }];
  }

  return {
    MODES, CHORD_TYPES, FUNCTIONS, FUNCTION_COLORS, FUNCTION_LABELS,
    LETTERS, NATURAL,
    mode, parseNote, noteName, pcOf,
    spell, bestRoot, keySignature, degreeLabels, diff,
    qualityAt, numeralFor, diatonic,
    name, remap, degreeMidi, progression, scaleEvents, drone
  };
})();

if(typeof module !== 'undefined' && module.exports) module.exports = EvTheory;
