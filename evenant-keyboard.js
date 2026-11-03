/* ============================================================================
   EVENANT · KEYBOARD
   ----------------------------------------------------------------------------
   The Voicing Atlas live keyboard as a component. Classic script, one global,
   EvKeyboard. Styles in evenant-keyboard.css.

   EXTRACTION, NOT REDESIGN. The geometry, the proportions, the colours and the
   state names are Voicing Atlas's (index.html: buildPianoKeys at 9375,
   renderLivePiano at 10998, getKeyState at 11003, ceApplyPianoOverlays at
   15066, getOptimalPianoRange at 9321, and the MIDI and musical-typing blocks
   in standalone-keyboard.html at 918–1020). What changed is invisible:

     · no globals — nine renderers in VA read activeNotes, targetNotes,
       ceNoteOverlays and liveKeyboardNotes straight off module scope;
     · no fixed element ids — VA writes into #livePiano, so there can only ever
       be one keyboard on a page;
     · no audio — VA's keys call playNote() directly. Here a key reports that
       it was pressed and the caller decides what that means, which is the only
       way one keyboard can serve a lesson, a quiz and a chord grid;
     · MIDI numbers, not note names — VA passes 'C#4' strings around and then
       needs normalize() to turn Db into C#. A number has no spelling to get
       wrong. Spelling is applied at the label, through EvTheory, which is how
       F♯ Lydian can show an E♯ where VA shows an F.

   Voicing Atlas keeps its own renderers for now; swapping it over is a separate
   job and nothing here depends on it happening.

     const kb = EvKeyboard.create(host, {
       lo:48, hi:84,                      // or call fit() later
       labels:'c',                        // 'c' (the C's, as VA) | 'all' | 'none' | midi => string
       input:{ pointer:true, midi:false, typing:false },
       foot:true,                         // the MIDI/typing strip under it
       onNoteOn(midi, source){}, onNoteOff(midi, source){}
     });
     kb.setStates({60:'active'})          // active | target | correct | wrong
     kb.setOverlays({66:'colour'})        // root scale colour changed chord third fifth seventh ext
     kb.clearOverlays()
     kb.press(m); kb.release(m); kb.releaseAll()     // visual only, for playback
     kb.setRange(lo,hi); kb.fit(midis,{pad,minOctaves}); kb.destroy()
     EvKeyboard.midi.enable()             // on a gesture; resolves true or false
     EvKeyboard.typing(true)
   ============================================================================ */

const EvKeyboard = (() => {

  const BLACK = new Set([1,3,6,8,10]);
  const WHITE = new Set([0,2,4,5,7,9,11]);
  const PLAIN = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const isBlack = m => BLACK.has(((m % 12) + 12) % 12);
  /* a fallback for when EvTheory is not on the page; the component does not
     require it, it only reads better with it */
  const plainName = m => PLAIN[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

  const boards = new Set();

  /* ---------------------------------------------------------------- range ---
     Voicing Atlas's getOptimalPianoRange, kept: three semitones of padding,
     start snapped down to a C and end up to a B, widened — never narrowed — to
     a minimum number of octaves. VA's comment is worth keeping too: if a
     voicing spans four octaves, show four octaves. Every note must be visible. */
  function fitRange(midis, opts){
    const o = opts || {}, pad = o.pad === undefined ? 3 : o.pad,
          minOct = o.minOctaves === undefined ? 2 : o.minOctaves;
    const list = (midis || []).filter(Number.isFinite);
    if(!list.length) return { lo:48, hi:71 };
    let lo = Math.max(0, Math.floor((Math.min(...list) - pad) / 12) * 12);
    let hi = Math.min(127, Math.ceil((Math.max(...list) + pad + 1) / 12) * 12 - 1);
    const whites = (a, b) => { let n = 0; for(let m = a; m <= b; m++) if(WHITE.has(m % 12)) n++; return n; };
    while(whites(lo, hi) < 7 * minOct){
      if(lo >= 12) lo -= 12;
      else if(hi <= 115) hi += 12;
      else break;
    }
    return { lo, hi };
  }

  /* ----------------------------------------------------------------- MIDI ---
     One access object for the page, shared by every board that asked for MIDI.
     enable() must be called from a gesture: Chrome prompts for permission and
     a prompt with no click behind it is a prompt nobody expects. */
  const midi = (() => {
    let access = null, state = 'idle', device = '';
    const listeners = new Set();
    function onMessage(e){
      const [status, note, velocity] = e.data;
      const kind = status & 0xf0;
      if(kind === 0x90 && velocity > 0) listeners.forEach(f => f(note, true, velocity));
      else if(kind === 0x80 || (kind === 0x90 && velocity === 0)) listeners.forEach(f => f(note, false, 0));
    }
    function wire(){
      let found = false;
      access.inputs.forEach(input => { input.onmidimessage = onMessage; found = true; device = device || input.name; });
      state = found ? 'connected' : 'none';
      boards.forEach(b => b.foot && b.foot());
    }
    return {
      get state(){ return state; },
      get device(){ return device; },
      async enable(){
        if(access) return state === 'connected';
        if(!navigator.requestMIDIAccess){ state = 'unsupported'; boards.forEach(b => b.foot && b.foot()); return false; }
        try {
          state = 'asking'; boards.forEach(b => b.foot && b.foot());
          access = await navigator.requestMIDIAccess();
          access.onstatechange = wire;
          wire();
          return state === 'connected';
        } catch(_){
          state = 'denied'; boards.forEach(b => b.foot && b.foot());
          return false;
        }
      },
      listen(fn){ listeners.add(fn); return () => listeners.delete(fn); }
    };
  })();

  /* --------------------------------------------------------- musical typing ---
     Voicing Atlas's map, which is Logic's: the home row is the white keys and
     the row above holds the blacks. One page-wide listener; boards that asked
     for typing receive it. */
  const TYPING = { a:0, w:1, s:2, e:3, d:4, f:5, t:6, g:7, y:8, h:9, u:10, j:11,
                   k:12, o:13, l:14, p:15, ';':16, "'":17 };
  const typing = (() => {
    let on = false, octave = 4;
    const down = new Map();
    const each = fn => boards.forEach(b => { if(b.wantsTyping) fn(b); });
    function keydown(e){
      if(!on || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target;
      if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if(e.key === 'z' || e.key === 'x'){
        octave = Math.min(7, Math.max(1, octave + (e.key === 'z' ? -1 : 1)));
        e.preventDefault(); each(b => b.foot && b.foot()); return;
      }
      const off = TYPING[e.key];
      if(off === undefined || down.has(e.key)) return;
      e.preventDefault();
      const m = 12 * (octave + 1) + off;
      down.set(e.key, m);
      each(b => b.fromTyping(m, true));
    }
    function keyup(e){
      const m = down.get(e.key);
      if(m === undefined) return;
      down.delete(e.key);
      each(b => b.fromTyping(m, false));
    }
    /* Attached only where there is a window to attach to, so that the pure
       parts of this file — fitRange, isBlack — can be required in Node and
       tested without a DOM. */
    if(typeof window !== 'undefined'){
      window.addEventListener('keydown', keydown);
      window.addEventListener('keyup', keyup);
      window.addEventListener('blur', () => { down.forEach((m) => each(b => b.fromTyping(m, false))); down.clear(); });
    }
    const api = set => { on = set === undefined ? !on : !!set;
      if(!on){ down.forEach(m => each(b => b.fromTyping(m, false))); down.clear(); }
      boards.forEach(b => b.foot && b.foot()); return on; };
    api.get = () => on;
    api.octave = () => octave;
    return api;
  })();

  /* ---------------------------------------------------------------- create --- */
  function create(host, options){
    const o = options || {};
    const input = Object.assign({ pointer:true, midi:false, typing:false }, o.input || {});
    const on = typeof o.onNoteOn === 'function' ? o.onNoteOn : () => {};
    const off = typeof o.onNoteOff === 'function' ? o.onNoteOff : () => {};
    let lo = o.lo === undefined ? 48 : o.lo, hi = o.hi === undefined ? 84 : o.hi;
    let labels = o.labels === undefined ? 'c' : o.labels;
    const states = new Map(), roles = new Map(), held = new Set();
    const els = new Map();                      // midi -> key element
    let dead = false, unlistenMidi = null;

    const root = document.createElement('div');
    root.className = 'va-kb';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', o.ariaLabel || 'Piano keyboard');
    const board = document.createElement('div');
    board.className = 'va-kb-piano';
    root.appendChild(board);
    const footEl = o.foot === false ? null : document.createElement('div');
    if(footEl){ footEl.className = 'va-kb-foot'; root.appendChild(footEl); }
    host.appendChild(root);

    function labelFor(m){
      if(labels === 'none') return '';
      if(typeof labels === 'function') return labels(m) || '';
      if(labels === 'all') return nameOf(m);
      return (m % 12 === 0) ? nameOf(m) : '';   // VA's live piano labels the C's and nothing else
    }
    const nameOf = m => (typeof EvTheory !== 'undefined' && o.key)
      ? EvTheory.name(m, o.key) : plainName(m);

    /* The board is rebuilt only when the range changes. Everything else —
       states, roles, held keys — is an attribute on a key that already exists,
       so nothing is recreated under a finger that is holding it down. */
    function build(){
      els.clear();
      const whites = [], blacks = [];
      for(let m = lo; m <= hi; m++) (isBlack(m) ? blacks : whites).push(m);
      board.replaceChildren();

      const whiteRow = document.createElement('div');
      whiteRow.className = 'va-kb-whites';
      const blackRow = document.createElement('div');
      blackRow.className = 'va-kb-blacks';

      whites.forEach((m, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'va-kb-key va-kb-white';
        b.dataset.midi = m;
        b.setAttribute('aria-label', nameOf(m));
        b.tabIndex = -1;                    /* the board is one control, not 36 tab stops */
        const text = labelFor(m);
        if(text){ const s = document.createElement('span'); s.className = 'va-kb-label'; s.textContent = text; b.appendChild(s); }
        whiteRow.appendChild(b);
        els.set(m, b);

        /* VA hangs each black key off the right edge of the white key before
           it, one slot per white key, so the two rows stay in step however
           many keys there are. */
        const slot = document.createElement('div');
        slot.className = 'va-kb-slot';
        const next = whites[i + 1];
        const bk = blacks.find(x => x > m && (next === undefined || x < next));
        const kb2 = document.createElement('button');
        kb2.type = 'button';
        kb2.className = 'va-kb-key va-kb-black';
        kb2.tabIndex = -1;
        if(bk === undefined) kb2.hidden = true;
        else { kb2.dataset.midi = bk; kb2.setAttribute('aria-label', nameOf(bk)); els.set(bk, kb2); }
        slot.appendChild(kb2);
        blackRow.appendChild(slot);
      });

      board.appendChild(whiteRow);
      board.appendChild(blackRow);
      paint();
    }

    /* A key shows what it IS (its role) unless it is doing something (its
       state). Voicing Atlas's one extra rule is kept: a key you are holding
       that was being pointed at reads as correct, not merely as held. */
    function paint(){
      els.forEach((el, m) => {
        let state = states.get(m) || '';
        if(held.has(m)) state = (roles.has(m) || states.get(m) === 'target') ? 'correct' : 'active';
        if(state) el.dataset.state = state; else delete el.dataset.state;
        const role = roles.get(m);
        if(role) el.dataset.role = role; else delete el.dataset.role;
      });
    }

    function foot(){
      if(!footEl) return;
      const bits = [];
      if(input.midi){
        const s = midi.state;
        const text = s === 'connected' ? 'MIDI · ' + (midi.device || 'connected')
                   : s === 'asking'    ? 'MIDI · asking…'
                   : s === 'denied'    ? 'MIDI · not allowed'
                   : s === 'unsupported' ? 'MIDI · not in this browser'
                   : s === 'none'      ? 'MIDI · no device'
                   : 'MIDI · off';
        bits.push('<span class="' + (s === 'connected' ? 'is-on' : '') + '">' + text + '</span>');
      }
      if(input.typing) bits.push('<span>Typing ' + (typing.get()
        ? '<b class="is-on">on</b> · A–L and W–P, z/x for octave ' + typing.octave()
        : '<b>off</b>') + '</span>');
      footEl.innerHTML =
        '<div>' + bits.join(' &nbsp;·&nbsp; ') + '</div>' +
        (input.midi && midi.state === 'idle' ? '<button type="button" data-kb-midi>Connect MIDI</button>' : '') +
        (input.typing ? '<button type="button" data-kb-typing aria-pressed="' + typing.get() + '">' +
          (typing.get() ? 'Stop typing' : 'Play by typing') + '</button>' : '');
      const mb = footEl.querySelector('[data-kb-midi]');
      if(mb) mb.onclick = () => midi.enable();
      const tb = footEl.querySelector('[data-kb-typing]');
      if(tb) tb.onclick = () => typing();
    }

    /* ---- input ---- */
    function sound(m, isOn, source){
      if(dead || !Number.isFinite(m) || m < 0 || m > 127) return;
      if(isOn){ if(held.has(m)) return; held.add(m); paint(); on(m, source); }
      else { if(!held.delete(m)) return; paint(); off(m, source); }
    }

    function pointerdown(e){
      const key = e.target.closest('[data-midi]');
      if(!key) return;
      e.preventDefault();
      /* capture so a finger that slides off the key still gets its note-off */
      try { key.setPointerCapture(e.pointerId); } catch(_){}
      sound(+key.dataset.midi, true, 'pointer');
    }
    function pointerup(e){
      const key = e.target.closest('[data-midi]');
      if(!key) return;
      sound(+key.dataset.midi, false, 'pointer');
    }
    if(input.pointer){
      board.addEventListener('pointerdown', pointerdown);
      board.addEventListener('pointerup', pointerup);
      board.addEventListener('pointercancel', pointerup);
    }
    if(input.midi) unlistenMidi = midi.listen((note, isOn) => sound(note, isOn, 'midi'));

    const api = {
      el: root,
      get range(){ return { lo, hi }; },
      get held(){ return [...held]; },
      wantsTyping: !!input.typing,
      fromTyping(m, isOn){ sound(m, isOn, 'typing'); },
      foot,

      setStates(map){
        states.clear();
        if(map) for(const k in map) if(map[k]) states.set(+k, map[k]);
        paint(); return api;
      },
      setOverlays(map){
        roles.clear();
        if(map) for(const k in map) if(map[k]) roles.set(+k, map[k]);
        paint(); return api;
      },
      clearOverlays(){ roles.clear(); paint(); return api; },

      /* visual only: what playback is sounding, not what the user is holding */
      press(m){ if(!held.has(m)){ held.add(m); paint(); } return api; },
      release(m){ if(held.delete(m)) paint(); return api; },
      releaseAll(){ if(held.size){ held.clear(); paint(); } return api; },

      setRange(a, b){
        const nlo = Math.max(0, Math.min(127, a)), nhi = Math.max(nlo, Math.min(127, b));
        if(nlo === lo && nhi === hi) return api;
        lo = nlo; hi = nhi; build(); return api;
      },
      fit(midis, opts){ const r = fitRange(midis, opts); return api.setRange(r.lo, r.hi); },
      setLabels(next){ labels = next; build(); return api; },
      setKey(key){ o.key = key; build(); return api; },

      destroy(){
        dead = true;
        if(unlistenMidi) unlistenMidi();
        if(input.pointer){
          board.removeEventListener('pointerdown', pointerdown);
          board.removeEventListener('pointerup', pointerup);
          board.removeEventListener('pointercancel', pointerup);
        }
        boards.delete(api);
        root.remove();
      }
    };

    boards.add(api);
    build();
    foot();
    return api;
  }

  return { create, fitRange, midi, typing, isBlack, plainName,
           ROLES:['root','third','fifth','seventh','ext','scale','chord','colour','changed'],
           STATES:['active','target','correct','wrong'] };
})();

if(typeof module !== 'undefined' && module.exports) module.exports = EvKeyboard;
