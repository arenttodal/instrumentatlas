/* ============================================================================
   SCALES & MODES · ACTIVITIES
   ----------------------------------------------------------------------------
   Three widgets on the Accelerator's activity contract, (state, kit) => spec,
   so each one gets the transport, the piano roll, the read-out, undo and A/B
   compare without asking. Loads after evenant-theory.js, evenant-keyboard.js,
   evenant-sound.js and themes.js.

   EVERY ONE OFFERS A DRONE, off until it is asked for. A mode is only audible
   against a fixed tonic — play D Dorian with nothing under it and you have
   played C major — and that is the single most common reason people say they
   cannot hear modes, so the switch is the first thing to reach for. It is not
   on by default, because starting every widget with a sustained note under it
   assumes what the reader wants to hear first, and assumes it loudly.

   The keyboard goes under the roll rather than in the controls column, which
   is what spec.draw(rollHost) is for. It is built once and then only told what
   to show, so an update never pulls it out from under a finger.
   ============================================================================ */

const ModeActivities = (() => {
  const T = EvTheory;
  const ROOTS = Array.from({ length:12 }, (_, pc) => pc);          // pitch classes

  /* ------------------------------------------------------------- helpers --- */
  const modeOf = id => T.mode(id) || T.mode('ionian');
  const rootName = (pc, mode) => T.bestRoot(((pc % 12) + 12) % 12, mode);

  /* The keyboard, parked under the piano roll. Created on the first draw and
     kept, because rebuilding it on every update would drop a held key and
     flicker the row. */
  function keyboard(kit, rollHost, opts){
    const wrap = rollHost.parentNode;
    let box = wrap.querySelector('.md-kb-host');
    if(!box){
      box = document.createElement('div');
      box.className = 'md-kb-host';
      rollHost.after(box);
    }
    if(!kit._kb){
      kit._kb = EvKeyboard.create(box, Object.assign({ lo:48, hi:84, foot:false }, opts || {}));
      kit.clean(() => { kit._kb.destroy(); kit._kb = null; box.remove(); });
    }
    return kit._kb;
  }

  /* Which keys to colour for a scale: the tonic, the colour note, the rest of
     the scale, and — when something just moved — that degree, loudest. */
  function scaleOverlay(root, mode, range, extra){
    const m = modeOf(mode), pc = T.pcOf(root), out = {};
    for(let midi = range.lo; midi <= range.hi; midi++){
      const i = m.steps.indexOf(((midi - pc) % 12 + 12) % 12);
      if(i < 0) continue;
      out[midi] = i === 0 ? 'root' : (m.colour === i + 1 ? 'colour' : 'scale');
    }
    if(extra) for(const k in extra) out[k] = extra[k];
    return out;
  }

  /* The drone, plus whatever the widget is playing. */
  const withDrone = (events, root, on, bars, beats) => on
    ? T.drone(root, { d: (bars || 8) * (beats || 4) }).map(e => ({ ...e, instrument:'synth', partials:[1,.5,.18,.06] })).concat(events)
    : events;

  const instrumentPicker = (kit, state) =>
    EvSound.picker(kit.host, state.instrument, v => { state.instrument = v; kit.update(); });

  /* An instrument name resolved to a voice, with a word about it if the voice
     could not be fetched and something else is standing in. */
  function voiced(events, id){
    const v = EvSound.voice(id);
    return { events: EvSound.apply(events, id), note: v.note };
  }

  const activities = {};

  /* ========================================================================
     1. BRIGHTNESS — one note changes each time the mode darkens
     ======================================================================== */
  activities.brightness = (s, u) => {
    /* THE DRONE IS OFF UNTIL IT IS ASKED FOR. A mode only exists against a
       tonic, so the drone is the thing to reach for when one refuses to sound
       like itself — but starting every widget with a sustained note under it
       is an assumption about what the reader wants to hear first, and a loud
       one. The toggle is right there. */
    u.defaults({ rootPc:2, mode:'lydian', drone:false, instrument:EvSound.remembered() });
    if(!T.mode(s.mode)) s.mode = 'lydian';
    let moved = null, movedAt = 0;

    const root = () => rootName(s.rootPc, s.mode);
    const at = n => T.MODES[Math.max(0, Math.min(6, Math.round(n) - 1))];

    return {
      build(){
        const m = modeOf(s.mode), r = root();
        const scale = T.scaleEvents(r, m, { octave:4 });
        const v = voiced(withDrone(scale, r, s.drone, 8, 2), s.instrument);
        return { events: v.events, bpm: 88, beats: 16 };
      },
      render(){
        u.select(u.host, 'Root', ROOTS.map(pc => ({ value: pc, label: rootName(pc, s.mode) })), s.rootPc,
          v => { s.rootPc = +v; u.redraw(); });
        /* Seven stops. The slider IS the brightness axis: one step is one
           degree, which is the fact the whole module rests on. */
        u.range(u.host, 'Brightness', modeOf(s.mode).brightness, 1, 7, 1, v => {
          const next = at(v);
          if(next.id === s.mode) return;
          const d = T.diff(s.mode, next.id);
          moved = d.length === 1 ? d[0] : null; movedAt = Date.now();
          s.mode = next.id;
          u.update();                                  /* replace(), so the loop never restarts */
          u.redraw();
        });
        u.toggle(u.host, 'Drone', s.drone, v => { s.drone = v; u.update(); });
        instrumentPicker(u, s);
        u.button(u.host, 'Play the scale', () => u.play());
      },
      draw(rollHost){
        const m = modeOf(s.mode), r = root();
        const kb = keyboard(u, rollHost, { lo:48, hi:84, key:{ root:r, mode:m.id } });
        kb.setKey({ root:r, mode:m.id });
        const extra = {};
        /* the degree that just moved, flashed for as long as it is worth
           looking at and no longer */
        if(moved && Date.now() - movedAt < 1400){
          const pc = T.pcOf(r), step = m.steps[moved.degree - 1];
          for(let o = 48; o <= 84; o++) if(((o - pc) % 12 + 12) % 12 === step) extra[o] = 'changed';
          setTimeout(() => { if(u._kb) u.update(); }, 1450);
        }
        kb.setOverlays(scaleOverlay(r, m.id, kb.range, extra));
      },
      read(){
        const m = modeOf(s.mode), r = root();
        const names = T.spell(r, m).join(' ');
        const rel = m.from
          ? ' ' + m.defined.charAt(0).toLowerCase() + m.defined.slice(1) + '.'
          : ' The reference everything else is measured from.';
        const sig = ' Signature ' + m.signatureText + ', cadence ' + m.cadenceText + '.';
        return r + ' ' + m.name + ':' + rel + sig + '  ' + names;
      },
      check(){
        const m = modeOf(s.mode);
        return { ok: m.id === 'dorian',
          text: m.id === 'dorian'
            ? 'Dorian. Minor with a raised 6th — the one bright note in a minor scale.'
            : 'Walk down from Lydian and listen for the mode that is minor everywhere except one raised note. You are on ' + m.name + '.' };
      }
    };
  };

  /* ========================================================================
     2. CHORDS — the same seven degrees, different qualities
     ======================================================================== */
  activities.chords = (s, u) => {
    u.defaults({ rootPc:0, mode:'dorian', sevenths:false, voicing:'close',
                 against:true, played:[], instrument:EvSound.remembered() });
    if(!T.mode(s.mode)) s.mode = 'dorian';
    if(!Array.isArray(s.played)) s.played = [];
    let pick = null;                                  /* the tile being heard */

    const root = () => rootName(s.rootPc, s.mode);
    const row  = () => T.diatonic(root(), s.mode, { sevenths: s.sevenths });
    const ref  = () => T.diatonic(root(), modeOf(s.mode).ref === 'major' ? 'ionian' : 'aeolian',
                                  { sevenths: s.sevenths });

    return {
      build(){
        const r = root(), m = modeOf(s.mode);
        const chords = pick
          ? T.progression([pick], r, m, { sevenths:s.sevenths, voicing:s.voicing, octave:3, beats:4 })
          : T.progression(m.cadence, r, m, { sevenths:s.sevenths, voicing:s.voicing, octave:3, beats:4 });
        const beats = (pick ? 1 : m.cadence.length) * 4;
        const v = voiced(withDrone(chords, r, false), s.instrument);
        return { events: v.events, bpm: 72, beats };
      },
      render(){
        u.select(u.host, 'Root', ROOTS.map(pc => ({ value: pc, label: rootName(pc, s.mode) })), s.rootPc,
          v => { s.rootPc = +v; u.redraw(); });
        const bar = u.segment(u.host, 'Mode');
        bar.classList.add('md-modebar');
        T.MODES.forEach(m => {
          const b = u.button(bar, m.name, () => { s.mode = m.id; pick = null; u.redraw(); });
          b.classList.add('md-modebtn');
          if(m.id === s.mode) b.setAttribute('aria-current', 'true');
        });
        u.select(u.host, 'Chords', [{ value:'triads', label:'Triads' }, { value:'sevenths', label:'Sevenths' }],
          s.sevenths ? 'sevenths' : 'triads', v => { s.sevenths = v === 'sevenths'; u.redraw(); });
        u.select(u.host, 'Voicing', [{ value:'close', label:'Close' }, { value:'spread', label:'Spread' }],
          s.voicing, v => { s.voicing = v; u.update(); });
        u.toggle(u.host, 'Mark what differs', s.against, v => { s.against = v; u.redraw(); });
        instrumentPicker(u, s);
        u.button(u.host, 'Play the cadence', () => { pick = null; u.update(); u.play(); });
      },
      draw(rollHost){
        const r = root(), m = modeOf(s.mode), chords = row(), base = ref();
        /* the grid of seven */
        const wrap = rollHost.parentNode;
        let grid = wrap.querySelector('.md-grid');
        if(!grid){ grid = document.createElement('div'); grid.className = 'md-grid'; rollHost.after(grid); u.clean(() => grid.remove()); }
        grid.innerHTML = chords.map((c, i) => {
          const differs = s.against && base[i] && base[i].quality !== c.quality;
          return `<button class="md-tile${c.signature ? ' is-sig' : ''}${differs ? ' is-diff' : ''}${pick === c.degree ? ' is-on' : ''}"
            data-degree="${c.degree}" style="--fn:${T.FUNCTION_COLORS[c.fn]}">
            <span class="md-num">${c.numeral}</span>
            <b>${c.symbol}</b>
            <span class="md-fn">${T.FUNCTION_LABELS[c.fn]}</span>
            ${c.signature ? '<span class="md-sig">signature</span>' : ''}
            ${differs ? '<span class="md-vs">vs ' + (m.ref === 'major' ? 'major' : 'minor') + '</span>' : ''}
          </button>`;
        }).join('');
        grid.onclick = e => {
          const t = e.target.closest('[data-degree]');
          if(!t) return;
          pick = +t.dataset.degree;
          if(!s.played.includes(pick)) s.played = s.played.concat(pick).slice(-8);
          u.update(); u.play();
        };

        const kb = keyboard(u, rollHost, { lo:48, hi:84, key:{ root:r, mode:m.id } });
        kb.setKey({ root:r, mode:m.id });
        const chord = pick ? chords.find(c => c.degree === pick) : null;
        const extra = {};
        if(chord) for(let midi = kb.range.lo; midi <= kb.range.hi; midi++)
          if(chord.pcs.includes(((midi % 12) + 12) % 12)) extra[midi] = 'chord';
        kb.setOverlays(scaleOverlay(r, m.id, kb.range, extra));
      },
      read(){
        const m = modeOf(s.mode), chords = row();
        if(pick){
          const c = chords.find(x => x.degree === pick);
          return c.numeral + ' — ' + c.symbol + ', ' + c.label.toLowerCase() + '. ' +
                 T.FUNCTION_LABELS[c.fn] + '. ' + c.notes.join(' ') +
                 (c.signature ? '  This is one of the chords that makes ' + m.name + ' sound like itself.' : '');
        }
        return root() + ' ' + m.name + ': ' + chords.map(c => c.numeral).join('  ') +
               '.  Signature ' + m.signatureText + '. Cadence ' + m.cadenceText + '.';
      },
      check(){
        const m = modeOf(s.mode), want = m.cadence.slice(0, 2);
        const last = s.played.slice(-want.length);
        const ok = last.length === want.length && last.every((d, i) => d === want[i]);
        return { ok, text: ok
          ? 'That is the ' + m.name + ' signature: ' + m.cadenceText + '.'
          : 'Play the first two chords of the ' + m.name + ' cadence, in order: ' + m.cadenceText + '.' };
      }
    };
  };

  /* ========================================================================
     3. REHARMONIZER — the same tune, every mode
     ======================================================================== */
  activities.reharm = (s, u) => {
    u.defaults({ theme:'rise', rootPc:2, mode:'lydian', from:'ionian',
                 idiomatic:false, melody:true, harmony:true, drone:false,
                 instrument:EvSound.remembered() });
    if(!T.mode(s.mode)) s.mode = 'lydian';
    if(!T.mode(s.from)) s.from = 'ionian';
    const theme = () => themeById(s.theme);
    const root = () => rootName(s.rootPc, s.mode);

    /* IDIOMATIC: a diminished chord the remap just created is not what anyone
       plays. It is replaced by the mode's first signature chord — unless the
       theme says otherwise, or the mode is Locrian, whose tonic is diminished
       and is the entire point of it. */
    function degreesFor(mode){
      const t = theme(), m = modeOf(mode);
      const chords = T.diatonic(root(), m, { sevenths:false });
      const sub = (t.subs && t.subs[m.id]) || null;
      return t.chords.map(c => {
        let deg = c.deg;
        if(s.idiomatic){
          if(sub && sub[deg] !== undefined) deg = sub[deg];
          else if(m.id !== 'locrian'){
            const here = chords[(deg - 1) % 7];
            if(here && here.quality === 'dim') deg = m.signature[0];
          }
        }
        return { deg, s:c.s, d:c.d };
      });
    }

    function parts(mode){
      const t = theme(), m = modeOf(mode), r = root();
      const line = kind => (t[kind] || []).map(n => ({
        m: T.degreeMidi(r, m, n.deg, (kind === 'ostinato' ? (t.ostinatoOctave || 4) : t.melodyOctave) + (n.oct || 0)),
        s:n.s, d:n.d, layer: kind === 'ostinato' ? 'Ostinato' : 'Melody',
        voice: kind !== 'ostinato', gain: kind === 'ostinato' ? .09 : .15
      }));
      const melody = s.melody ? line('melody') : [];
      const ost = t.ostinato ? line('ostinato') : [];
      const chords = s.harmony
        ? T.progression(degreesFor(mode), r, m, { octave:t.chordOctave, beats:4, layer:'Chords' }).map(e => ({ ...e, gain:.1 }))
        : [];
      return { melody, ost, chords };
    }

    /* which melody notes moved, and which chords changed quality */
    function changes(){
      const t = theme(), r = root();
      const before = parts(s.from), after = parts(s.mode);
      const movedNotes = after.melody.filter((n, i) => before.melody[i] && before.melody[i].m !== n.m);
      const a = T.diatonic(r, s.from), b = T.diatonic(r, s.mode);
      const movedChords = degreesFor(s.mode).map((c, i) => {
        const was = a[(t.chords[i].deg - 1) % 7], now = b[(c.deg - 1) % 7];
        return (was && now && (was.numeral !== now.numeral)) ? { was, now } : null;
      }).filter(Boolean);
      return { movedNotes, movedChords, before, after };
    }

    return {
      build(){
        const t = theme(), r = root(), p = parts(s.mode), ch = changes();
        const moved = new Set(ch.movedNotes.map(n => n.s));
        const events = p.melody.map(n => ({ ...n, changed: moved.has(n.s) }))
          .concat(p.ost, p.chords);
        const v = voiced(withDrone(events, r, s.drone, t.bars, t.beats), s.instrument);
        return { events: v.events, bpm: t.bpm, beats: t.bars * t.beats };
      },
      render(){
        u.select(u.host, 'Theme', MODE_THEMES.map(t => ({ value:t.id, label:t.name })), s.theme,
          v => { s.theme = v; const t = themeById(v); s.from = t.home; u.redraw(); });
        u.select(u.host, 'Root', ROOTS.map(pc => ({ value: pc, label: rootName(pc, s.mode) })), s.rootPc,
          v => { s.rootPc = +v; u.redraw(); });
        const bar = u.segment(u.host, 'Mode');
        bar.classList.add('md-modebar');
        T.MODES.forEach(m => {
          const b = u.button(bar, m.name, () => { s.mode = m.id; u.update(); u.redraw(); });
          b.classList.add('md-modebtn');
          if(m.id === s.mode) b.setAttribute('aria-current', 'true');
        });
        u.select(u.host, 'Harmony', [{ value:'literal', label:'Literal' }, { value:'idiomatic', label:'Idiomatic' }],
          s.idiomatic ? 'idiomatic' : 'literal', v => { s.idiomatic = v === 'idiomatic'; u.update(); u.redraw(); });
        u.toggle(u.host, 'Remap melody', s.melody, v => { s.melody = v; u.update(); });
        u.toggle(u.host, 'Remap chords', s.harmony, v => { s.harmony = v; u.update(); });
        u.toggle(u.host, 'Drone', s.drone, v => { s.drone = v; u.update(); });
        instrumentPicker(u, s);
      },
      draw(rollHost){
        const r = root(), m = modeOf(s.mode);
        const kb = keyboard(u, rollHost, { lo:45, hi:84, key:{ root:r, mode:m.id } });
        kb.setKey({ root:r, mode:m.id });
        const ch = changes(), extra = {};
        /* every octave of a degree that moved, so the change is visible
           wherever the tune happens to be sitting */
        const pc = T.pcOf(r);
        T.diff(s.from, s.mode).forEach(d => {
          const step = m.steps[d.degree - 1];
          for(let o = kb.range.lo; o <= kb.range.hi; o++)
            if(((o - pc) % 12 + 12) % 12 === step) extra[o] = 'changed';
        });
        kb.setOverlays(scaleOverlay(r, m.id, kb.range, extra));
      },
      read(){
        const from = modeOf(s.from), to = modeOf(s.mode), ch = changes();
        if(from.id === to.id) return themeById(s.theme).note;
        const bits = [from.name + ' to ' + to.name + ':'];
        if(s.melody && ch.movedNotes.length){
          const d = T.diff(s.from, s.mode)[0];
          bits.push(ch.movedNotes.length + ' melody note' + (ch.movedNotes.length === 1 ? '' : 's') +
            (d ? ' ' + (d.semitones > 0 ? 'raised' : 'lowered') + ' (' + d.from + ' to ' + d.to + ')' : '') + ';');
        } else if(s.melody) bits.push('the melody is unchanged;');
        if(s.harmony && ch.movedChords.length){
          const seen = [];
          ch.movedChords.forEach(c => { const k = c.was.numeral + '→' + c.now.numeral; if(!seen.includes(k)) seen.push(k); });
          bits.push(seen.map(k => k.replace('→', ' became ')).join(', ') + '.');
        } else if(s.harmony) bits.push('the chords are unchanged.');
        if(s.idiomatic) bits.push('Idiomatic: a diminished chord the remap made is replaced by the mode\'s signature.');
        return bits.join(' ');
      },
      check(){
        const ok = s.mode === 'mixolydian';
        return { ok, text: ok
          ? 'Mixolydian. The seventh drops, the V turns minor and a ♭VII appears — folk and open, from one lowered note.'
          : 'Lower one note from major and listen for the mode that opens it out rather than darkening it. You are on ' + modeOf(s.mode).name + '.' };
      }
    };
  };

  return activities;
})();

/* The Accelerator engine looks here. One object, the activity names as keys. */
const AccelActivities = ModeActivities;
