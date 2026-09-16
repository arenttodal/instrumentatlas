/* ============================================================================
   ACTIVITIES
   ----------------------------------------------------------------------------
   Every activity is a function (host, lesson) that fills `host` with its UI.
   Register it on WIDGETS under the id used by `lesson.demo`.

   Each one synthesises its audio through the helpers in audio.js — no asset
   files — and anything that starts a loop sets host._cleanup so the page can
   tear it down. Nothing here knows about routing or progress.
   ============================================================================ */

const WIDGETS = {};

/* shared transport button markup */
const playBtn = (id, label) =>
  `<button class="btn gold" id="${id}">
     <svg width="10" height="12" viewBox="0 0 12 14" fill="currentColor"><path d="M0 0l12 7-12 7z"/></svg>
     ${label}</button>`;

/* ===========================================================================
   1. OVERTONES — four scenes, one per beat of the explanation
     timbres   the same note as six instruments, partials editable
     divisions the string vibrating in halves, thirds, quarters
     spacing   the series written out, intervals wide low and tight high
     doubling  4:2:1 as a chord you build and hear
   =========================================================================== */
WIDGETS.overtones = function (host) {
  const ROOT = 48;                                   // C3
  const IVL = [0, 12, 19, 24, 28, 31, 34, 36];       // the series, in semitones
  const NAMES = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const INSTR = [
    { n:'Flute',    bright:.72 }, { n:'Oboe',     bright:.86 },
    { n:'Clarinet', bright:.52 }, { n:'Horn',     bright:.40 },
    { n:'Trumpet',  bright:.90 }, { n:'Violin',   bright:.78 }
  ];
  let on = Array(8).fill(true), instr = 0, division = 1, dbl = [4, 2, 1];
  let scene = 'timbres';

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="ot-svg" viewBox="0 0 520 268"></svg></div>
    <div class="w-side" id="ot-side"></div></div>`;
  const svg = host.querySelector('#ot-svg'), side = host.querySelector('#ot-side');

  const txt = (x, y, t, o = {}) =>
    `<text x="${x}" y="${y}" fill="${o.fill || '#4E505A'}" font-size="${o.size || 9}"
      font-weight="${o.w || 400}" font-family="DM Sans" text-anchor="${o.a || 'start'}"
      ${o.ls ? `letter-spacing="${o.ls}"` : ''} ${o.pe === false ? 'pointer-events="none"' : ''}>${t}</text>`;

  /* --------------------------------------------------------- scene: timbres */
  function drawTimbres() {
    let g = txt(20, 14, 'THE SAME NOTE, SIX INSTRUMENTS — CLICK A BAR TO SILENCE THAT PARTIAL',
      { fill:'#4E505A', w:700, ls:1.4 });
    on.forEach((v, k) => {
      const x = 40 + k * 60, amp = 1 / Math.pow(k + 1, 2.1 - INSTR[instr].bright);
      const h = Math.max(amp * 170, 5), m = ROOT + IVL[k];
      g += `<rect class="ot-bar" data-k="${k}" x="${x}" y="${(212 - h).toFixed(1)}"
              width="42" height="${h.toFixed(1)}" rx="4"
              fill="${v ? '#D4A04A' : '#4E505A'}" fill-opacity="${v ? .9 : .22}" style="cursor:pointer"/>`
        + txt(x + 21, 230, NAMES[m % 12], { fill: v ? '#BEC0C8' : '#43454F', size:10.5, a:'middle', pe:false })
        + txt(x + 21, 246, k === 0 ? 'FUND' : '×' + (k + 1), { fill:'#43454F', size:8.5, w:700, a:'middle', pe:false });
    });
    svg.innerHTML = g;
  }
  function sideTimbres() {
    side.innerHTML = `<div><div class="w-lab">Instrument</div>
      <div class="w-col" id="ot-instr">${INSTR.map((x, i) =>
        `<button class="btn wide" data-i="${i}" aria-pressed="${i === instr}">${x.n}</button>`).join('')}</div></div>
      <div><div class="w-lab">Play</div><div class="w-row">
        ${playBtn('ot-play','Play')}
        <button class="btn" id="ot-first">Fundamental only</button>
        <button class="btn" id="ot-all">All partials</button></div></div>
      <div class="w-read" id="ot-read"></div>`;
    side.querySelector('#ot-instr').onclick = e => {
      const b = e.target.closest('button[data-i]'); if (!b) return;
      instr = +b.dataset.i; on = on.map(() => true); render(); play();
    };
    side.querySelector('#ot-play').onclick  = play;
    side.querySelector('#ot-first').onclick = () => { on = on.map((_, i) => i === 0); render(); play(); };
    side.querySelector('#ot-all').onclick   = () => { on = on.map(() => true); render(); play(); };
  }
  const play = () => tone(ROOT, { dur: 2, partials: on, gain: .2, bright: INSTR[instr].bright });

  /* ------------------------------------------------------- scene: divisions */
  const DIVS = [
    { n:1, label:'The whole string',  note:'the fundamental' },
    { n:2, label:'Halves',            note:'an octave above' },
    { n:3, label:'Thirds',            note:'an octave and a fifth' },
    { n:4, label:'Quarters',          note:'two octaves above' }
  ];
  function drawDivisions() {
    const X = 40, W = 440, Y = 60, GAP = 52;
    let g = txt(20, 14, 'ONE STRING, VIBRATING IN PARTS', { w:700, ls:1.4 });
    DIVS.forEach((d, i) => {
      const y = Y + i * GAP, sel = d.n === division, col = sel ? '#D4A04A' : '#4E505A';
      g += `<rect class="ot-div" data-n="${d.n}" x="${X - 14}" y="${y - 22}" width="${W + 28}" height="42"
              rx="7" fill="${sel ? '#D4A04A' : '#ffffff'}" fill-opacity="${sel ? .07 : .02}" style="cursor:pointer"/>`;
      /* one sine hump per division, so 3 means three humps along the string */
      let d3 = '';
      for (let x = 0; x <= W; x += 4) {
        const yy = y - Math.sin((x / W) * Math.PI * d.n) * 15;
        d3 += (x ? 'L' : 'M') + (X + x).toFixed(1) + ' ' + yy.toFixed(1);
      }
      g += `<path d="${d3}" fill="none" stroke="${col}" stroke-opacity="${sel ? .95 : .5}"
              stroke-width="${sel ? 2 : 1.3}" pointer-events="none"/>
            <line x1="${X}" y1="${y}" x2="${X + W}" y2="${y}" stroke="#ffffff" stroke-opacity=".08" pointer-events="none"/>`;
      for (let k = 0; k <= d.n; k++) {
        const nx = X + (W / d.n) * k;
        g += `<circle cx="${nx.toFixed(1)}" cy="${y}" r="2.6" fill="${col}" pointer-events="none"/>`;
      }
      g += txt(X + W + 20, y + 4, '×' + d.n, { fill: col, size:10.5, w:700, pe:false });
    });
    svg.innerHTML = g;
  }
  function sideDivisions() {
    const d = DIVS.find(x => x.n === division);
    side.innerHTML = `<div><div class="w-lab">Divide the string</div>
      <div class="w-col" id="ot-divs">${DIVS.map(x =>
        `<button class="btn wide" data-n="${x.n}" aria-pressed="${x.n === division}">${x.label}</button>`).join('')}</div></div>
      <div><div class="w-lab">Play</div><div class="w-row">
        ${playBtn('ot-dplay','Hear it')}
        <button class="btn" id="ot-stack">All four together</button></div></div>
      <div class="w-read" id="ot-read"></div>`;
    side.querySelector('#ot-divs').onclick = e => {
      const b = e.target.closest('button[data-n]'); if (!b) return;
      division = +b.dataset.n; render(); playDiv();
    };
    side.querySelector('#ot-dplay').onclick = playDiv;
    side.querySelector('#ot-stack').onclick = () =>
      DIVS.forEach((x, i) => tone(ROOT + 12 * Math.log2(x.n), { dur: 2.4, gain: .11, when: i * .5, bright: .5 }));
  }
  const playDiv = () => tone(ROOT + 12 * Math.log2(division), { dur: 2, gain: .2, bright: .5 });

  /* --------------------------------------------------------- scene: spacing */
  function drawSpacing() {
    const X = 46, W = 430, BASE = 232, TOP = 40;
    const lo = ROOT, hi = ROOT + 36;
    const py = m => BASE - ((m - lo) / (hi - lo)) * (BASE - TOP);
    let g = txt(20, 14, 'THE FIRST EIGHT HARMONICS, DRAWN BY PITCH', { w:700, ls:1.4 });
    for (let k = 0; k < 8; k++) {
      const m = ROOT + IVL[k], x = X + (W / 7) * k, y = py(m);
      if (k) {
        const pm = ROOT + IVL[k - 1], px = X + (W / 7) * (k - 1), pyv = py(pm);
        const gap = IVL[k] - IVL[k - 1];
        g += `<line x1="${px}" y1="${pyv.toFixed(1)}" x2="${x}" y2="${y.toFixed(1)}"
                stroke="#D4A04A" stroke-opacity=".3"/>`
          + txt((px + x) / 2, (pyv + y) / 2 - 7, gap + ' st',
              { fill: gap >= 7 ? '#5FB89A' : '#C0603A', size:8.5, w:700, a:'middle', pe:false });
      }
      g += `<circle class="ot-h" data-k="${k}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"
              fill="#D4A04A" fill-opacity=".9" style="cursor:pointer"/>`
        + txt(x, y + 3.5, NAMES[m % 12], { fill:'#080C14', size:9, w:700, a:'middle', pe:false })
        + txt(x, 252, '×' + (k + 1), { fill:'#43454F', size:8.5, w:700, a:'middle', pe:false });
    }
    g += `<line x1="${X - 14}" y1="${BASE + 8}" x2="${X + W + 14}" y2="${BASE + 8}"
            stroke="#ffffff" stroke-opacity=".08"/>`;
    svg.innerHTML = g;
  }
  function sideSpacing() {
    side.innerHTML = `<div><div class="w-lab">Play</div><div class="w-row">
        ${playBtn('ot-sup','Up the series')}
        <button class="btn" id="ot-slow">Bottom four</button>
        <button class="btn" id="ot-shigh">Top four</button></div></div>
      <div class="w-read" id="ot-read"></div>`;
    const run = ks => ks.forEach((k, i) =>
      tone(ROOT + IVL[k], { dur: 1.1, gain: .17, when: i * .42, bright: .55 }));
    side.querySelector('#ot-sup').onclick    = () => run([0,1,2,3,4,5,6,7]);
    side.querySelector('#ot-slow').onclick   = () => run([0,1,2,3]);
    side.querySelector('#ot-shigh').onclick  = () => run([4,5,6,7]);
  }

  /* -------------------------------------------------------- scene: doubling */
  const ROLE = ['root','fifth','third'];
  const OFF  = { root:0, fifth:7, third:4 };
  function voices() {
    const out = [];
    let reg = 0;
    ROLE.forEach((r, ri) => { for (let i = 0; i < dbl[ri]; i++) out.push({ r, m: ROOT + OFF[r] + 12 * (reg++ % 3) }); });
    return out;
  }
  function drawDoubling() {
    let g = txt(20, 14, 'HOW OFTEN EACH NOTE APPEARS — CLICK TO ADD, SHIFT-CLICK TO REMOVE', { w:700, ls:1.4 });
    const COL = { root:'#D4A04A', fifth:'#8FB4E0', third:'#6E8FB8' };
    const SERIES = [4, 2, 1];
    ROLE.forEach((r, ri) => {
      const y = 58 + ri * 62;
      g += txt(24, y + 4, r[0].toUpperCase() + r.slice(1), { fill: COL[r], size:11.5, w:500 })
        + txt(24, y + 20, 'appears ' + SERIES[ri] + '× in the series', { fill:'#43454F', size:8.5 });
      for (let i = 0; i < 6; i++) {
        const on = i < dbl[ri], x = 168 + i * 50;
        g += `<rect class="ot-d" data-r="${ri}" data-i="${i}" x="${x}" y="${y - 14}" width="40" height="32" rx="6"
                fill="${on ? COL[r] : '#ffffff'}" fill-opacity="${on ? .85 : .03}" style="cursor:pointer"/>`;
      }
      const ratio = (dbl[ri] / SERIES[ri]).toFixed(1);
      g += txt(486, y + 4, dbl[ri] + '×', { fill: dbl[ri] === SERIES[ri] ? '#5FB89A' : '#C0603A', size:11, w:700, a:'end', pe:false });
    });
    svg.innerHTML = g;
  }
  function sideDoubling() {
    side.innerHTML = `<div><div class="w-lab">Play</div><div class="w-row">
        ${playBtn('ot-chord','Play the chord')}
        <button class="btn" id="ot-421">Set 4 : 2 : 1</button></div></div>
      <div class="w-read" id="ot-read"></div>`;
    side.querySelector('#ot-chord').onclick = () => chord(voices().map(v => v.m), { gain: .085, bright: .45 });
    side.querySelector('#ot-421').onclick = () => { dbl = [4, 2, 1]; render();
      chord(voices().map(v => v.m), { gain: .085, bright: .45 }); };
  }

  /* -------------------------------------------------------------- readouts */
  function read() {
    const el = side.querySelector('#ot-read'); if (!el) return;
    if (scene === 'timbres') {
      const n = on.filter(Boolean).length;
      el.innerHTML = n === 1
        ? '<b>One partial.</b> A pure sine wave — nothing on earth sounds like this.'
        : `<b>${INSTR[instr].n}, ${n} partials.</b> Same note, same fundamental. Everything that makes it sound like an instrument is the balance above it.`;
    } else if (scene === 'divisions') {
      const d = DIVS.find(x => x.n === division);
      el.innerHTML = `<b>${d.label} — ${d.note}.</b> ` + (division === 1
        ? 'The whole length, vibrating at the rate that sets the pitch.'
        : `The string also vibrates in ${division === 2 ? 'halves' : division === 3 ? 'thirds' : 'quarters'}, ${division}× as fast, and that division sounds ${d.note}. All of it at once, on one string.`);
    } else if (scene === 'spacing') {
      el.innerHTML = '<b>Twelve semitones, then seven, then five, then four, three, three, two.</b> The gaps start wide and close as they rise. Follow that in your own voicings and chords ring; invert it and the low end smears.';
    } else {
      const ok = dbl[0] === 4 && dbl[1] === 2 && dbl[2] === 1;
      el.innerHTML = ok
        ? '<b>4 : 2 : 1.</b> The proportion the series itself uses. A starting point, not a law — adjust for register, instrumentation and function.'
        : `<b>${dbl[0]} : ${dbl[1]} : ${dbl[2]}.</b> The series gives four roots, two fifths and one third. The further you are from that, the more the chord leans.`;
    }
  }

  /* ---------------------------------------------------------------- render */
  function render() {
    if (scene === 'timbres')        { drawTimbres();   sideTimbres(); }
    else if (scene === 'divisions') { drawDivisions(); sideDivisions(); }
    else if (scene === 'spacing')   { drawSpacing();   sideSpacing(); }
    else                            { drawDoubling();  sideDoubling(); }
    read();
    side.querySelectorAll('[data-i]').forEach(b => {
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(+b.dataset.i === instr));
    });
  }

  svg.addEventListener('click', e => {
    const bar = e.target.closest('.ot-bar');
    if (bar) { on[+bar.dataset.k] = !on[+bar.dataset.k]; render(); play(); AccelWidgets.clearTip(host); return; }
    const div = e.target.closest('.ot-div');
    if (div) { division = +div.dataset.n; render(); playDiv(); AccelWidgets.clearTip(host); return; }
    const h = e.target.closest('.ot-h');
    if (h) { tone(ROOT + IVL[+h.dataset.k], { dur: 1.6, gain: .2, bright: .55 }); return; }
    const d = e.target.closest('.ot-d');
    if (d) {
      const ri = +d.dataset.r, i = +d.dataset.i;
      dbl[ri] = e.shiftKey ? Math.max(0, i) : Math.min(6, i + 1);
      render(); chord(voices().map(v => v.m), { gain: .085, bright: .45 });
      AccelWidgets.clearTip(host);
    }
  });

  render();

  /* the demonstration follows the explanation */
  return {
    step(ctx) {
      const want = ['timbres','divisions','spacing','doubling'].includes(ctx.scene) ? ctx.scene : 'timbres';
      if (want !== scene) { scene = want; render(); }
      AccelWidgets.clearTip(host);
      if (ctx.type !== 'read') return;
      if (scene === 'timbres')   AccelWidgets.tip(host, '.ot-bar[data-k="2"]', 'Click a bar to silence that partial, or switch instrument');
      if (scene === 'divisions') AccelWidgets.tip(host, '.ot-div[data-n="3"]', 'Click a row to hear that division on its own');
      if (scene === 'spacing')   AccelWidgets.tip(host, '.ot-h[data-k="1"]', 'Click any harmonic to hear it');
      if (scene === 'doubling')  AccelWidgets.tip(host, '.ot-d[data-r="0"][data-i="3"]', 'Click to change how often the root appears');
    }
  };
};

/* ===========================================================================
   2. VOICING — drag noteheads, hear it, see the rules
   The flagship widget. Rules are checked live against the ebook's two
   principles: spacing follows the series, doubling follows 4:2:1.
   =========================================================================== */
WIDGETS.voicing = function (host) {
  const LO = 36, HI = 79;                 // C2 .. G5
  const START = [48, 55, 64, 67];
  const BAD   = [48, 50, 52, 55];         // crammed low, third doubled
  const GOOD  = [36, 48, 55, 64];         // octave at the bottom, root-heavy
  const NAMES = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  let voices = [...START];

  const nm    = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
  const y     = m => 270 - ((m - LO) / (HI - LO)) * 236;
  const role  = m => ({ 0:'root', 4:'third', 7:'fifth' })[m % 12] || 'outside';

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="vc-svg" viewBox="0 0 520 300"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Play</div>
        <div class="w-row">${playBtn('vc-play','Chord')}<button class="btn" id="vc-arp">Arpeggio</button></div></div>
      <div><div class="w-lab">Checks</div><div class="checks" id="vc-checks"></div></div>
      <div><div class="w-lab">Compare</div>
        <div class="w-row"><button class="btn" id="vc-bad">Bad voicing</button>
          <button class="btn" id="vc-good">Fix it</button></div></div>
      <div class="w-read" id="vc-read"></div>
    </div></div>`;

  const svg = host.querySelector('#vc-svg');

  /* the two ebook principles, expressed as five checks */
  function analyse() {
    const s = [...voices].sort((a, b) => a - b);
    const roles = s.map(role);
    const nRoot  = roles.filter(r => r === 'root').length;
    const nThird = roles.filter(r => r === 'third').length;
    const out    = roles.filter(r => r === 'outside').length;
    const lowGap = s[1] - s[0], topGap = s[3] - s[2];
    return [
      { ok: lowGap >= 7,
        good: 'The bottom two voices are spaced widely',
        bad: `The bottom two voices are ${lowGap} semitones apart — the series spaces the low end by an octave or a fifth` },
      { ok: topGap <= lowGap,
        good: 'Spacing tightens as it rises, as the series does',
        bad: 'The top is spaced wider than the bottom — that is the series upside down' },
      { ok: nThird <= 1,
        good: 'The third appears once',
        bad: `The third is doubled ${nThird} times — it appears once in the series and it changes the chord's balance` },
      { ok: nRoot >= 2 || out > 0,
        good: 'The root is reinforced',
        bad: 'The root appears only once — it is the note the series repeats most' },
      { ok: out === 0,
        good: 'Every voice is a chord tone',
        bad: `${out} voice${out > 1 ? 's are' : ' is'} outside the triad` }
    ];
  }

  function draw() {
    let g = '';
    for (let m = LO; m <= HI; m++) {
      if (m % 12) continue;
      g += `<line x1="60" y1="${y(m).toFixed(1)}" x2="500" y2="${y(m).toFixed(1)}" stroke="#fff" stroke-opacity=".07"/>
            <text x="46" y="${(y(m) + 4).toFixed(1)}" fill="#4E505A" font-size="10"
              font-family="DM Sans" text-anchor="end">${nm(m)}</text>`;
    }
    const sorted = voices.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    sorted.forEach((o, k) => {
      const x = 110 + k * 106, yy = y(o.v), r = role(o.v);
      const col = r === 'third' ? '#6E8FB8' : r === 'fifth' ? '#8FB4E0'
                : r === 'root' ? '#D4A04A' : '#C0603A';
      g += `<line x1="${x}" y1="${yy.toFixed(1)}" x2="${x}" y2="278" stroke="${col}" stroke-opacity=".18"/>
            <circle class="vc-dot" data-i="${o.i}" cx="${x}" cy="${yy.toFixed(1)}" r="13"
              fill="${col}" fill-opacity=".9" stroke="#080C14" stroke-width="2" style="cursor:ns-resize"/>
            <text x="${x}" y="${(yy + 4).toFixed(1)}" fill="#080C14" font-size="9.5" font-weight="700"
              font-family="DM Sans" text-anchor="middle" pointer-events="none">${nm(o.v).replace(/[-\d]/g, '')}</text>
            <text x="${x}" y="294" fill="#4E505A" font-size="9" font-weight="700" letter-spacing="1.2"
              font-family="DM Sans" text-anchor="middle">${['BASS','TENOR','ALTO','SOP'][k]}</text>`;
    });
    svg.innerHTML = g;

    const checks = analyse();
    host.querySelector('#vc-checks').innerHTML = checks.map(c =>
      `<div class="chk ${c.ok ? 'ok' : 'bad'}"><i>${c.ok ? '✓' : '!'}</i><span>${c.ok ? c.good : c.bad}</span></div>`
    ).join('');
    const bad = checks.filter(c => !c.ok).length;
    host.querySelector('#vc-read').innerHTML = bad === 0
      ? '<b>This chord follows the overtone series.</b> Wide at the bottom, tighter at the top, root reinforced.'
      : `<b>${bad} thing${bad > 1 ? 's' : ''} to fix.</b> Drag a notehead, or press Fix it to hear the difference.`;
  }

  let drag = null;
  const toY   = e => { const r = svg.getBoundingClientRect(); return (e.clientY - r.top) / r.height * 300; };
  const toMidi = py => Math.round(LO + ((270 - py) / 236) * (HI - LO));
  svg.addEventListener('pointerdown', e => {
    const d = e.target.closest('.vc-dot'); if (!d) return;
    drag = +d.dataset.i; svg.setPointerCapture(e.pointerId); e.preventDefault();
  });
  svg.addEventListener('pointermove', e => {
    if (drag === null) return;
    const m = Math.max(LO, Math.min(toMidi(toY(e)), HI));
    if (m !== voices[drag]) { voices[drag] = m; draw(); }
  });
  svg.addEventListener('pointerup', () => { if (drag !== null) { chord(voices); drag = null; } });

  host.querySelector('#vc-play').onclick = () => chord(voices);
  host.querySelector('#vc-arp').onclick  = () =>
    [...voices].sort((a, b) => a - b).forEach((m, i) => tone(m, { dur: 1.4, gain: .13, when: i * .28 }));
  host.querySelector('#vc-bad').onclick  = () => { voices = [...BAD];  draw(); chord(voices); };
  host.querySelector('#vc-good').onclick = () => { voices = [...GOOD]; draw(); chord(voices); };
  draw();
};

/* ===========================================================================
   3. PERSPECTIVE — three layers, three dials
   Each dial maps to one of the ebook's three parameters.
   =========================================================================== */
WIDGETS.perspective = function (host) {
  const BPM = 84;
  const LAYERS = [
    { id:'mel',  name:'Melody',   col:'#D4A04A', loud:1.0, active:1, vary:1 },
    { id:'harm', name:'Harmony',  col:'#6E8FB8', loud:0.6, active:0, vary:0 },
    { id:'drone',name:'Drone',    col:'#5C6B7C', loud:0.4, active:0, vary:0 }
  ];
  let running = false, timer = null;

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="pv-svg" viewBox="0 0 520 250"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Play</div><div class="w-row">${playBtn('pv-play','Play loop')}</div></div>
      <div id="pv-ctrls"></div>
      <div class="w-read" id="pv-read"></div>
    </div></div>`;

  const ctrls = host.querySelector('#pv-ctrls');
  ctrls.innerHTML = LAYERS.map((l, i) => `
    <div class="pv-layer">
      <div class="pv-name" style="color:${l.col}">${l.name}</div>
      ${['loud','active','vary'].map(k => `
        <label class="pv-dial">
          <span>${ {loud:'Loudness', active:'Rhythmic activity', vary:'Unpredictability'}[k] }</span>
          <input type="range" min="0" max="1" step="0.01" value="${l[k]}" data-i="${i}" data-k="${k}">
        </label>`).join('')}
    </div>`).join('');

  /* score = the ebook's three parameters, equally weighted */
  const score = l => (l.loud * .4 + l.active * .35 + l.vary * .25);
  const band  = s => s > .62 ? 'Foreground' : s > .34 ? 'Middleground' : 'Background';

  function draw() {
    const sorted = [...LAYERS].sort((a, b) => score(b) - score(a));
    let g = `<text x="20" y="20" fill="#4E505A" font-size="9" font-weight="700"
               font-family="DM Sans" letter-spacing="1.6">FOREGROUND</text>
             <text x="20" y="238" fill="#4E505A" font-size="9" font-weight="700"
               font-family="DM Sans" letter-spacing="1.6">BACKGROUND</text>`;
    LAYERS.forEach(l => {
      const s = score(l), y = 224 - s * 190;
      const w = 110 + l.loud * 230;
      g += `<rect x="140" y="${(y - 13).toFixed(1)}" width="${w.toFixed(1)}" height="26" rx="13"
              fill="${l.col}" fill-opacity="${.22 + s * .55}"/>
            <text x="152" y="${(y + 5).toFixed(1)}" fill="#fff" font-size="12.5"
              font-family="DM Sans" font-weight="500">${l.name}</text>
            <text x="${(140 + w + 12).toFixed(1)}" y="${(y + 4).toFixed(1)}" fill="${l.col}"
              font-size="9" font-weight="700" font-family="DM Sans" letter-spacing="1.3">${band(s).toUpperCase()}</text>`;
    });
    host.querySelector('#pv-svg').innerHTML = g;
    const fg = sorted.filter(l => band(score(l)) === 'Foreground');
    host.querySelector('#pv-read').innerHTML = fg.length === 1
      ? `<b>${fg[0].name} is in focus.</b> One clear foreground is what stops a track becoming chaotic.`
      : fg.length === 0
        ? '<b>Nothing is in the foreground.</b> The listener has nothing to follow.'
        : `<b>${fg.length} layers are competing.</b> They will fight rather than support each other.`;
  }

  /* synthesised loop — activity swaps sustained notes for a moving line */
  function fire() {
    const beats = 8;
    LAYERS.forEach(l => {
      const g = .03 + l.loud * .13;
      if (l.id === 'drone') {
        tone(36, { dur: beats * 60 / BPM, gain: g * .8, bright: .25 });
        if (l.active > .5) for (let i = 0; i < beats; i++)
          tone(43, { when: i * 60 / BPM, dur: .4, gain: g * .5, bright: .3 });
      } else if (l.id === 'harm') {
        const ch = [[48, 52, 55], [45, 48, 52], [50, 53, 57], [43, 47, 50]];
        for (let i = 0; i < 4; i++) {
          const c = ch[l.vary > .5 ? i : 0];
          if (l.active > .5) {
            c.forEach((m, j) => tone(m, { when: (i * 2 + j * .25) * 60 / BPM, dur: .5, gain: g * .7, bright: .45 }));
          } else {
            c.forEach(m => tone(m, { when: i * 2 * 60 / BPM, dur: 2 * 60 / BPM, gain: g * .55, bright: .4 }));
          }
        }
      } else {
        const a = [[67,0,1],[69,1,1],[72,2,2],[71,4,1],[69,5,1],[67,6,2]];
        const b = [[67,0,1],[67,1,1],[67,2,2],[67,4,1],[67,5,1],[67,6,2]];
        seq(l.vary > .5 ? a : b, BPM, { gain: g, bright: .6 });
      }
    });
  }
  function loop() {
    if (!running) return;
    fire();
    timer = setTimeout(loop, 8 * 60 / BPM * 1000);
  }
  host.querySelector('#pv-play').onclick = function () {
    running = !running;
    this.classList.toggle('on', running);
    if (running) loop(); else clearTimeout(timer);
  };
  ctrls.addEventListener('input', e => {
    const i = +e.target.dataset.i, k = e.target.dataset.k;
    LAYERS[i][k] = +e.target.value; draw();
  });
  host._cleanup = () => { running = false; clearTimeout(timer); };
  draw();
};

/* ===========================================================================
   4 & 5. A/B COMPARISONS — separation and voice leading
   Generic three-way switch. Renders from audio files when present, otherwise
   synthesises the three versions so the lesson works with no assets.
   =========================================================================== */
function abWidget(host, opts) {
  let current = 0, running = false, timer = null;
  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="ab-svg" viewBox="0 0 520 230"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Play</div><div class="w-row">${playBtn('ab-play','Play loop')}</div></div>
      <div><div class="w-lab">Version</div>
        <div class="w-col" id="ab-opts">${opts.versions.map((v, i) =>
          `<button class="btn wide" data-v="${i}" aria-pressed="${i === 0}">${v.label}</button>`).join('')}</div></div>
      <div class="w-read" id="ab-read"></div>
    </div></div>`;

  function draw() {
    const v = opts.versions[current];
    let g = '';
    v.lanes.forEach((lane, li) => {
      const y0 = 26 + li * 62;
      g += `<text x="18" y="${y0 + 4}" fill="${lane.col}" font-size="9" font-weight="700"
              font-family="DM Sans" letter-spacing="1.3">${lane.name.toUpperCase()}</text>`;
      lane.notes.forEach(([m, s, l]) => {
        const x = 96 + s * 50, w = Math.max(l * 50 - 4, 6);
        const y = y0 + 26 - ((m - lane.lo) / Math.max(lane.hi - lane.lo, 6)) * 34;
        g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="6" rx="3"
                fill="${lane.col}" fill-opacity=".92"/>`;
      });
    });
    host.querySelector('#ab-svg').innerHTML = g;
    host.querySelector('#ab-read').innerHTML = v.read;
    host.querySelectorAll('#ab-opts button').forEach((b, i) =>
      b.setAttribute('aria-pressed', String(i === current)));
  }
  function fire() {
    const v = opts.versions[current];
    v.lanes.forEach(lane =>
      seq(lane.notes, opts.bpm, { gain: lane.gain || .1, bright: lane.bright ?? .5, attack: lane.attack || .03 }));
  }
  function loop() { if (!running) return; fire(); timer = setTimeout(loop, opts.bars * 4 * 60 / opts.bpm * 1000); }

  host.querySelector('#ab-play').onclick = function () {
    running = !running; this.classList.toggle('on', running);
    if (running) loop(); else clearTimeout(timer);
  };
  host.querySelectorAll('#ab-opts button').forEach(b =>
    b.onclick = () => { current = +b.dataset.v; draw(); if (!running) fire(); });
  host._cleanup = () => { running = false; clearTimeout(timer); };
  draw();
}

WIDGETS.separation = function (host) {
  const MEL = [[72,0,1],[74,1,1],[76,2,2],[74,4,1],[72,5,1],[71,6,2]];
  abWidget(host, { bpm: 80, bars: 2, versions: [
    { label:'Everything in one place',
      read:'<b>Same register, same rhythm, same colour.</b> Three ideas arriving as one muddy idea.',
      lanes:[
        { name:'Melody', col:'#D4A04A', lo:64, hi:78, gain:.1, bright:.5, notes:MEL },
        { name:'Harmony',col:'#6E8FB8', lo:64, hi:78, gain:.09, bright:.5,
          notes:[[71,0,1],[72,1,1],[74,2,2],[72,4,1],[71,5,1],[69,6,2]] },
        { name:'Bass',   col:'#CF5F52', lo:64, hi:78, gain:.09, bright:.5,
          notes:[[69,0,1],[71,1,1],[72,2,2],[71,4,1],[69,5,1],[67,6,2]] }
      ] },
    { label:'Separated by register',
      read:'<b>Pitch alone.</b> Better — but register is the weakest of the four tools, because an arrangement runs out of registers.',
      lanes:[
        { name:'Melody', col:'#D4A04A', lo:64, hi:78, gain:.1, bright:.55, notes:MEL },
        { name:'Harmony',col:'#6E8FB8', lo:52, hi:66, gain:.085, bright:.45,
          notes:[[59,0,1],[60,1,1],[62,2,2],[60,4,1],[59,5,1],[57,6,2]] },
        { name:'Bass',   col:'#CF5F52', lo:36, hi:50, gain:.09, bright:.3,
          notes:[[45,0,1],[47,1,1],[48,2,2],[47,4,1],[45,5,1],[43,6,2]] }
      ] },
    { label:'Register, rhythm and colour',
      read:'<b>Three tools at once.</b> Long sustained harmony under a moving melody, with a slow bass — exactly the Mars principle.',
      lanes:[
        { name:'Melody', col:'#D4A04A', lo:64, hi:78, gain:.11, bright:.68, notes:MEL },
        { name:'Harmony',col:'#6E8FB8', lo:52, hi:66, gain:.07, bright:.35, attack:.35,
          notes:[[59,0,4],[62,0,4],[57,4,4],[60,4,4]] },
        { name:'Bass',   col:'#CF5F52', lo:36, hi:50, gain:.1, bright:.22, attack:.2,
          notes:[[45,0,4],[43,4,4]] }
      ] }
  ]});
};

WIDGETS.voiceleading = function (host) {
  /* Am – F – C – G, the ebook's own example */
  abWidget(host, { bpm: 66, bars: 4, versions: [
    { label:'Block keyboard voicings',
      read:'<b>Every voice moves the same distance in the same direction.</b> This is the string-patch sound — one hand, not four players.',
      lanes:[
        { name:'Voices', col:'#6E8FB8', lo:45, hi:76, gain:.075, bright:.42, attack:.06,
          notes:[[57,0,2],[60,0,2],[64,0,2],[69,0,2],
                 [53,2,2],[57,2,2],[60,2,2],[65,2,2],
                 [48,4,2],[52,4,2],[55,4,2],[60,4,2],
                 [55,6,2],[59,6,2],[62,6,2],[67,6,2]] }
      ] },
    { label:'Proper voice leading',
      read:'<b>Each voice takes the closest route.</b> Some move up, some down, some stay — contrary and oblique motion instead of parallel.',
      lanes:[
        { name:'Voices', col:'#D4A04A', lo:45, hi:76, gain:.075, bright:.45, attack:.06,
          notes:[[57,0,2],[60,0,2],[64,0,2],[69,0,2],
                 [57,2,2],[60,2,2],[65,2,2],[69,2,2],
                 [55,4,2],[60,4,2],[64,4,2],[67,4,2],
                 [55,6,2],[59,6,2],[62,6,2],[67,6,2]] }
      ] },
    { label:'Split across instruments',
      read:'<b>Four individual legato lines.</b> Cello doubling the bass in octaves, tighter spacing as it rises — the overtone series again.',
      lanes:[
        { name:'Violin I', col:'#CF5F52', lo:60, hi:76, gain:.075, bright:.62, attack:.12,
          notes:[[69,0,2],[69,2,2],[67,4,2],[67,6,2]] },
        { name:'Violin II',col:'#CF5F52', lo:55, hi:70, gain:.065, bright:.55, attack:.12,
          notes:[[64,0,2],[65,2,2],[64,4,2],[62,6,2]] },
        { name:'Viola',    col:'#9B8FD4', lo:50, hi:64, gain:.06, bright:.42, attack:.14,
          notes:[[60,0,2],[60,2,2],[60,4,2],[59,6,2]] },
        { name:'Cello/Bass',col:'#5C6B7C',lo:33, hi:58, gain:.085, bright:.26, attack:.16,
          notes:[[45,0,2],[33,0,2],[41,2,2],[29,2,2],[36,4,2],[24,4,2],[43,6,2],[31,6,2]] }
      ] }
  ]});
};

/* ===========================================================================
   6. TIMBRE — same pitch, six overtone balances, live spectrum
   =========================================================================== */
WIDGETS.timbre = function (host) {
  const INSTR = [
    { id:'flute',   name:'Flute',    bright:.72, col:'#6FB7E8' },
    { id:'oboe',    name:'Oboe',     bright:.86, col:'#6FB7E8' },
    { id:'clarinet',name:'Clarinet', bright:.52, col:'#6FB7E8' },
    { id:'horn',    name:'Horn',     bright:.40, col:'#D4A04A' },
    { id:'trumpet', name:'Trumpet',  bright:.90, col:'#D4A04A' },
    { id:'violin',  name:'Violin',   bright:.78, col:'#CF5F52' }
  ];
  const PITCH = 60;
  let sel = 0;

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="tb-svg" viewBox="0 0 520 230"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Same note, six instruments</div>
        <div class="w-col" id="tb-opts">${INSTR.map((x, i) =>
          `<button class="btn wide" data-i="${i}" aria-pressed="${i === 0}"
             style="--c:${x.col}">${x.name}</button>`).join('')}</div></div>
      <div class="w-read" id="tb-read"></div>
    </div></div>`;

  function draw() {
    const x = INSTR[sel];
    let g = '';
    for (let k = 1; k <= 10; k++) {
      const amp = 1 / Math.pow(k, 2.1 - x.bright);
      const h = amp * 168, px = 46 + (k - 1) * 46;
      g += `<rect x="${px}" y="${(190 - h).toFixed(1)}" width="30" height="${h.toFixed(1)}" rx="3"
              fill="${x.col}" fill-opacity=".85"/>
            <text x="${px + 15}" y="208" fill="#43454F" font-size="8.5" font-weight="700"
              font-family="DM Sans" text-anchor="middle">${k === 1 ? 'F' : '×' + k}</text>`;
    }
    g += `<line x1="40" y1="190.5" x2="500" y2="190.5" stroke="#fff" stroke-opacity=".1"/>`;
    host.querySelector('#tb-svg').innerHTML = g;
    host.querySelector('#tb-read').innerHTML =
      `<b>${x.name}.</b> ${x.bright > .75 ? 'Strong upper partials — bright and penetrating, and it will cut through a texture.'
        : x.bright > .55 ? 'A balanced stack — carries a line without dominating.'
        : 'Energy concentrated low in the series — mellow and covered, which is why it blends.'}`;
    host.querySelectorAll('#tb-opts button').forEach((b, i) =>
      b.setAttribute('aria-pressed', String(i === sel)));
  }
  host.querySelectorAll('#tb-opts button').forEach(b => b.onclick = () => {
    sel = +b.dataset.i; draw();
    tone(PITCH, { dur: 2, gain: .18, bright: INSTR[sel].bright });
  });
  draw();
};


/* ===========================================================================
   7. PREVADE — write a motif, then build a phrase out of it
   The ebook's central method. Every version in the four slots is derived from
   the motif the reader wrote, so the phrase has one source however it is
   ordered. Slots are reorderable; the top point of the result is marked.
   =========================================================================== */
WIDGETS.prevade = function (host) {
  const BPM = 96;
  const STEPS = 8;                                   // steps in the motif
  const SLOTN = 4;                                   // slots in the phrase
  const DEG = [57, 59, 60, 62, 64, 65, 67, 69, 71];  // A natural minor, A3..B4
  const DNAME = ['A','B','C','D','E','F','G','A','B'];
  const SEED = { 2:0, 4:1, 6:2 };                     // rest, then A B C —
                                                     // the Heart Of Courage motif
  const SPAN = STEPS * SLOTN * .5 * 60 / BPM;        // one pass, in seconds

  let motif = Array(STEPS).fill(null);
  Object.keys(SEED).forEach(i => motif[+i] = SEED[i]);

  const clampD = d => Math.max(0, Math.min(d, DEG.length - 1));
  const firstOn = m => m.findIndex(v => v !== null);
  const onsets  = m => m.reduce((a, v, i) => v === null ? a : a.concat(i), []);
  const topDeg  = m => m.reduce((a, v) => v === null ? a : Math.max(a, v), 0);

  /* Slide a transformed motif back inside the grid as a block. Clamping note by
     note would flatten an inversion into one repeated pitch; shifting the whole
     shape keeps the intervals the reader wrote. */
  function fit(arr) {
    const vals = arr.filter(v => v !== null);
    if (!vals.length) return arr;
    const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    const shift = lo < 0 ? -lo : hi > DEG.length - 1 ? (DEG.length - 1) - hi : 0;
    return arr.map(v => v === null ? null : clampD(v + shift));
  }

  /* Every transform takes the reader's own motif and returns a new step array.
     Nothing here invents material — it only rewrites what they wrote. */
  const TRANSFORMS = [
    { id:'original',   label:'As written',              short:'As written',
      fn: m => m.slice() },
    { id:'transposed', label:'Transposed up a third',   short:'Up a third',
      fn: m => m.map(v => v === null ? null : v + 2) },
    { id:'inverted',   label:'Inverted',                short:'Inverted',
      fn: m => { const i = firstOn(m); if (i < 0) return m.slice();
                 const a = m[i];
                 return m.map(v => v === null ? null : 2 * a - v); } },
    { id:'displaced',  label:'Rhythmically displaced',  short:'Displaced',
      fn: m => { const o = Array(STEPS).fill(null);
                 m.forEach((v, i) => { if (v !== null) o[(i + 2) % STEPS] = v; });
                 return o; } },
    /* Destruction is not a transformation. The book is explicit that it is
       "something entirely new", unrelated to the motif but still cohesive —
       so these two keep the motif's rhythm and replace its pitches outright. */
    { id:'newclimb',   label:'New ending — climbing to a climax', short:'New: climbing',
      fn: m => { const on = onsets(m); if (!on.length) return m.slice();
                 const o = Array(STEPS).fill(null), hi = topDeg(m);
                 on.forEach((i, k) => o[i] = hi + 1 + k);
                 return o; } },
    { id:'newfall',    label:'New ending — falling back to the tonic', short:'New: falling',
      fn: m => { const on = onsets(m); if (!on.length) return m.slice();
                 const o = Array(STEPS).fill(null), start = topDeg(m) + 2;
                 on.forEach((i, k) => o[i] = start - k);
                 return o; } }
  ];
  const tf = id => TRANSFORMS.find(t => t.id === id) || TRANSFORMS[0];
  const render = s => fit(tf(s.t).fn(motif));

  let slots = [
    { name:'Presentation', t:'original',  col:'#D4A04A' },
    { name:'Repetition',   t:'original',  col:'#B8892F' },
    { name:'Variation',    t:'inverted',  col:'#6E8FB8' },
    { name:'Destruction',  t:'newclimb',  col:'#C0603A' }
  ];

  /* step array -> notes. A note runs to the next onset, capped at two steps so
     the line breathes instead of becoming a wall of sustains. */
  function notesOf(arr, offset) {
    const out = [];
    arr.forEach((v, i) => {
      if (v === null) return;
      let l = 1;
      while (l < 2 && i + l < arr.length && arr[i + l] === null) l++;
      out.push({ m: DEG[v], d: v, s: offset + i, l });
    });
    return out;
  }
  const phrase = () =>
    slots.reduce((a, s, k) => a.concat(notesOf(render(s), k * STEPS)), []);

  function topPoint() {
    const p = phrase();
    if (!p.length) return null;
    const hi = p.reduce((a, n) => Math.max(a, n.d), -1);
    const hits = p.filter(n => n.d === hi);
    return { d: hi, step: hits[0].s, slot: Math.floor(hits[0].s / STEPS), count: hits.length };
  }

  const playNotes = list =>
    seq(list.map(n => [n.m, n.s * .5, n.l * .5]), BPM, { gain: .13, bright: .6 });

  /* --- geometry ------------------------------------------------------- */
  const G = { x:42, y:20,  w:458, h:150 };   // motif editor
  const P = { x:42, y:224, w:458, h:140 };   // assembled phrase
  const colW = G.w / STEPS, rowH = G.h / DEG.length;
  const pW = P.w / (STEPS * SLOTN), pH = P.h / DEG.length;
  const gy = d => G.y + (DEG.length - 1 - d) * rowH;
  const py = d => P.y + (DEG.length - 1 - d) * pH;

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="pd-svg" viewBox="0 0 520 400"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Your motif</div>
        <div class="w-row">
          <button class="btn" id="pd-motif">Play motif</button>
          <button class="btn" id="pd-clear">Clear</button>
          <button class="btn" id="pd-seed">Example</button>
        </div></div>
      <div><div class="w-lab">The phrase</div>
        <div class="w-row">${playBtn('pd-play','Play phrase')}</div></div>
      <div><div class="w-lab">Slots — reorder and vary</div>
        <div id="pd-slots"></div></div>
      <div class="w-read" id="pd-read"></div>
    </div></div>`;

  const svg = host.querySelector('#pd-svg');
  const slotBox = host.querySelector('#pd-slots');

  function draw() {
    const tp = topPoint();
    let g = `<text x="${G.x}" y="12" fill="#4E505A" font-size="9" font-weight="700"
               font-family="DM Sans" letter-spacing="1.6">YOUR MOTIF — CLICK TO WRITE</text>`;

    /* motif editor */
    for (let d = 0; d < DEG.length; d++) {
      const tonic = d % 7 === 0;
      g += `<text x="${G.x - 8}" y="${(gy(d) + rowH / 2 + 3.5).toFixed(1)}"
              fill="${tonic ? '#7E808A' : '#43454F'}" font-size="9"
              font-family="DM Sans" text-anchor="end">${DNAME[d]}</text>`;
      for (let c = 0; c < STEPS; c++) {
        const on = motif[c] === d;
        g += `<rect class="pd-cell" data-c="${c}" data-d="${d}"
                x="${(G.x + c * colW + 1).toFixed(1)}" y="${(gy(d) + 1).toFixed(1)}"
                width="${(colW - 2).toFixed(1)}" height="${(rowH - 2).toFixed(1)}" rx="3"
                fill="${on ? '#D4A04A' : '#ffffff'}"
                fill-opacity="${on ? .9 : tonic ? .05 : .028}" style="cursor:pointer"/>`;
      }
    }

    /* phrase: one tinted band per slot, in playback order */
    for (let k = 0; k < SLOTN; k++) {
      const x0 = P.x + k * STEPS * pW, cx = x0 + STEPS * pW / 2;
      g += `<rect x="${x0.toFixed(1)}" y="${P.y}" width="${(STEPS * pW).toFixed(1)}"
              height="${P.h}" fill="${slots[k].col}" fill-opacity=".05"/>`;
      if (k) g += `<line x1="${x0.toFixed(1)}" y1="${P.y}" x2="${x0.toFixed(1)}"
              y2="${P.y + P.h}" stroke="#ffffff" stroke-opacity=".1"/>`;
      g += `<text x="${cx.toFixed(1)}" y="${P.y + P.h + 17}" fill="${slots[k].col}"
              font-size="9.5" font-weight="700" font-family="DM Sans"
              text-anchor="middle">${k + 1}. ${slots[k].name}</text>
            <text x="${cx.toFixed(1)}" y="${P.y + P.h + 30}" fill="#4E505A" font-size="8.5"
              font-family="DM Sans" text-anchor="middle">${tf(slots[k].t).short}</text>`;
    }
    phrase().forEach(n => {
      const x = P.x + n.s * pW, w = Math.max(n.l * pW - 2, 5);
      g += `<rect x="${x.toFixed(1)}" y="${(py(n.d) + 2).toFixed(1)}" width="${w.toFixed(1)}"
              height="${(pH - 4).toFixed(1)}" rx="3"
              fill="${slots[Math.floor(n.s / STEPS)].col}" fill-opacity=".92"/>`;
    });

    /* the top point */
    if (tp) {
      const x = P.x + tp.step * pW + pW / 2;
      const anchor = x < 80 ? 'start' : x > 440 ? 'end' : 'middle';
      const tx = anchor === 'start' ? x - 5 : anchor === 'end' ? x + 5 : x;
      g += `<line x1="${x.toFixed(1)}" y1="${P.y - 5}" x2="${x.toFixed(1)}"
              y2="${(py(tp.d) + 2).toFixed(1)}" stroke="#D4A04A" stroke-opacity=".45"
              stroke-dasharray="2 3"/>
            <path d="M${(x - 4).toFixed(1)} ${P.y - 11} L${(x + 4).toFixed(1)} ${P.y - 11}
              L${x.toFixed(1)} ${P.y - 4} Z" fill="#D4A04A"/>
            <text x="${tx.toFixed(1)}" y="${P.y - 15}" fill="#D4A04A" font-size="8.5"
              font-weight="700" font-family="DM Sans" letter-spacing="1.3"
              text-anchor="${anchor}">TOP POINT</text>`;
    }

    g += `<line id="pd-ph" x1="${P.x}" y1="${P.y}" x2="${P.x}" y2="${P.y + P.h}"
            stroke="#ffffff" stroke-opacity=".55" stroke-width="1.5" opacity="0"/>`;
    svg.innerHTML = g;
  }

  function drawSlots() {
    slotBox.innerHTML = slots.map((s, i) => `
      <div class="pd-slot">
        <div class="pd-row">
          <span class="pd-key" style="color:${s.col};background:${s.col}22">${i + 1}</span>
          <span class="pd-name">${s.name}</span>
          <button class="pd-arrow" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}
            aria-label="Move ${s.name} earlier">&#8593;</button>
          <button class="pd-arrow" data-i="${i}" data-dir="1"
            ${i === slots.length - 1 ? 'disabled' : ''}
            aria-label="Move ${s.name} later">&#8595;</button>
        </div>
        <select class="pd-sel" data-i="${i}" aria-label="Variation for ${s.name}">
          ${TRANSFORMS.map(t =>
            `<option value="${t.id}"${t.id === s.t ? ' selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>`).join('');
  }

  function readout() {
    const tp = topPoint(), el = host.querySelector('#pd-read');
    if (!tp) {
      el.innerHTML = '<b>No motif yet.</b> Click cells in the grid to write one. Presentation, Repetition and Variation fill themselves from it; the destruction writes its own ending.';
      return;
    }
    const pos = Math.round(((tp.step + 1) / (STEPS * SLOTN)) * 100);
    const last = tp.slot === SLOTN - 1;
    el.innerHTML = `<b>Top point: ${DNAME[tp.d]}, in ${slots[tp.slot].name} — slot ${tp.slot + 1} of ${SLOTN}, ${pos}% of the way through.</b> `
      + (tp.count > 1
        ? `The phrase hits that note ${tp.count} times, so it is a ceiling rather than a peak — and a ceiling is what makes a melody sound flat.`
        : last
          ? 'Late, and on the destruction — which is where the book puts the climax.'
          : 'Reached early. Move the destruction around and see where you would rather it landed.');
  }

  /* --- transport ------------------------------------------------------ */
  let running = false, timer = null, raf = null, t0 = 0;

  function tick() {
    if (!running) return;
    const ph = svg.querySelector('#pd-ph');
    if (ph) {
      const t = (AC().currentTime - t0) / SPAN;
      const x = P.x + Math.max(0, Math.min(t, 1)) * P.w;
      ph.setAttribute('x1', x.toFixed(1));
      ph.setAttribute('x2', x.toFixed(1));
      ph.setAttribute('opacity', t >= 0 && t <= 1 ? '1' : '0');
    }
    raf = requestAnimationFrame(tick);
  }
  function fire() { playNotes(phrase()); t0 = AC().currentTime; }
  function loop() { if (!running) return; fire(); timer = setTimeout(loop, SPAN * 1000); }

  /* --- events --------------------------------------------------------- */
  svg.addEventListener('click', e => {
    const cell = e.target.closest('.pd-cell'); if (!cell) return;
    const c = +cell.dataset.c, d = +cell.dataset.d;
    motif[c] = motif[c] === d ? null : d;
    draw(); readout();
    if (motif[c] !== null) tone(DEG[d], { dur: .55, gain: .16, bright: .6 });
  });
  slotBox.addEventListener('click', e => {
    const b = e.target.closest('.pd-arrow'); if (!b || b.disabled) return;
    const i = +b.dataset.i, j = i + +b.dataset.dir;
    if (j < 0 || j >= slots.length) return;
    const tmp = slots[i]; slots[i] = slots[j]; slots[j] = tmp;
    drawSlots(); draw(); readout();
  });
  slotBox.addEventListener('change', e => {
    const s = e.target.closest('.pd-sel'); if (!s) return;
    slots[+s.dataset.i].t = s.value;
    draw(); readout();
  });
  host.querySelector('#pd-motif').onclick = () => playNotes(notesOf(motif, 0));
  host.querySelector('#pd-clear').onclick = () => {
    motif = Array(STEPS).fill(null); draw(); readout();
  };
  host.querySelector('#pd-seed').onclick = () => {
    motif = Array(STEPS).fill(null);
    Object.keys(SEED).forEach(i => motif[+i] = SEED[i]);
    draw(); readout(); playNotes(notesOf(motif, 0));
  };
  host.querySelector('#pd-play').onclick = function () {
    running = !running;
    this.classList.toggle('on', running);
    if (running) { fire(); timer = setTimeout(loop, SPAN * 1000); tick(); }
    else {
      clearTimeout(timer); cancelAnimationFrame(raf);
      const ph = svg.querySelector('#pd-ph'); if (ph) ph.setAttribute('opacity', '0');
    }
  };

  host._cleanup = () => {
    running = false; clearTimeout(timer); cancelAnimationFrame(raf);
  };

  drawSlots(); draw(); readout();
};


/* ===========================================================================
   8. MOTIFS — the book's interval table, made audible
   Two of the book's three starting points, on separate controls: pick the
   interval that carries the motif, then the rhythm that places it. Only the
   three intervals the book characterises carry an emotional note.
   =========================================================================== */
WIDGETS.motif = function (host) {
  const BPM = 92, STEPS = 8, ROOT = 60;              // C4

  const IVS = [
    { n:'Minor second',   ab:'m2', s:1,  con:false },
    { n:'Major second',   ab:'M2', s:2,  con:false },
    { n:'Minor third',    ab:'m3', s:3,  con:true  },
    { n:'Major third',    ab:'M3', s:4,  con:true  },
    { n:'Perfect fourth', ab:'P4', s:5,  con:true  },
    { n:'Tritone',        ab:'TT', s:6,  con:false,
      emo:'The book\'s augmented fourth — tension and intrigue.' },
    { n:'Perfect fifth',  ab:'P5', s:7,  con:true,
      emo:'Heroism and grandeur. The first example motif opens on this leap.' },
    { n:'Minor sixth',    ab:'m6', s:8,  con:true  },
    { n:'Major sixth',    ab:'M6', s:9,  con:true  },
    { n:'Minor seventh',  ab:'m7', s:10, con:false,
      emo:'Introspective and mysterious.' },
    { n:'Major seventh',  ab:'M7', s:11, con:false },
    { n:'Octave',         ab:'P8', s:12, con:true  }
  ];

  /* [startStep, lengthSteps] per note, and which note carries the interval */
  const RHYTHMS = [
    { id:'even',   name:'Even',
      on:[[0,2],[2,2],[4,2],[6,2]], leap:1,
      note:'Four equal notes. Plain, and easy to hum.' },
    { id:'fate',   name:'Three and a drop',
      on:[[0,1],[1,1],[2,1],[3,5]], leap:3,
      note:'Three shorts and a long — the rhythm of Beethoven\'s motif of fate.' },
    { id:'dotted', name:'Long, then short',
      on:[[0,3],[3,1],[4,2],[6,2]], leap:1,
      note:'A mix of longer and shorter notes, which is what the book suggests trying.' },
    { id:'synco',  name:'Syncopated',
      on:[[0,2],[3,2],[5,1],[6,2]], leap:1,
      note:'Off the beat. The book\'s second example motif is built on a syncopated rhythm.' }
  ];

  let iv = 6, rh = 0, dir = 1;                       // perfect fifth, even, upward

  /* Non-leap notes sit on the root; the leap note carries the interval, and
     anything after it steps back toward the root a tone at a time. */
  function notes() {
    const r = RHYTHMS[rh], iS = IVS[iv].s;
    return r.on.map(([s, l], k) => {
      let off = 0;
      if (k === r.leap) off = iS;
      else if (k > r.leap) off = Math.max(iS - (k - r.leap) * 2, 0);
      return { m: ROOT + dir * off, s, l };
    });
  }
  const playMotif = () =>
    seq(notes().map(n => [n.m, n.s * .5, n.l * .5]), BPM, { gain: .14, bright: .6 });
  const playIv = () => {
    const a = ROOT, b = ROOT + dir * IVS[iv].s;
    tone(a, { dur: .8, gain: .16, bright: .55 });
    tone(b, { when: .5, dur: .8, gain: .16, bright: .55 });
    tone(a, { when: 1.3, dur: 1.6, gain: .13, bright: .5 });
    tone(b, { when: 1.3, dur: 1.6, gain: .13, bright: .5 });
  };

  const L = { x:14, y:18, rowH:22 };                 // interval ladder
  const R = { x:42, y:302, w:458, h:104 };           // motif roll

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="mo-svg" viewBox="0 0 520 420"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Play</div>
        <div class="w-row">
          ${playBtn('mo-motif','Play motif')}
          <button class="btn" id="mo-iv">Interval only</button>
        </div></div>
      <div><div class="w-lab">Direction</div>
        <div class="w-row">
          <button class="btn" id="mo-up"   aria-pressed="true">Up</button>
          <button class="btn" id="mo-down" aria-pressed="false">Down</button>
        </div></div>
      <div><div class="w-lab">Rhythm</div>
        <div class="w-col" id="mo-rh">${RHYTHMS.map((r, i) =>
          `<button class="btn wide" data-r="${i}" aria-pressed="${i === 0}">${r.name}</button>`).join('')}</div></div>
      <div><div class="w-lab">The famous one</div>
        <div class="w-row"><button class="btn" id="mo-fate">Motif of fate</button></div></div>
      <div class="w-read" id="mo-read"></div>
    </div></div>`;

  const svg = host.querySelector('#mo-svg');

  function draw() {
    let g = `<text x="${L.x}" y="10" fill="#4E505A" font-size="9" font-weight="700"
               font-family="DM Sans" letter-spacing="1.6">THE INTERVAL THE MOTIF IS BUILT ON</text>`;
    IVS.forEach((v, i) => {
      const y = L.y + i * L.rowH, on = i === iv;
      const col = on ? '#D4A04A' : v.con ? '#5FB89A' : '#C0603A';
      g += `<rect class="mo-row" data-i="${i}" x="${L.x - 4}" y="${y}" width="500"
              height="${L.rowH - 3}" rx="5" fill="${on ? '#D4A04A' : '#ffffff'}"
              fill-opacity="${on ? .1 : .022}" style="cursor:pointer"/>
            <text x="${L.x + 6}" y="${y + 13.5}" fill="${on ? '#fff' : '#7E808A'}" font-size="10.5"
              font-family="DM Sans" pointer-events="none">${v.n}</text>
            <rect x="128" y="${y + 6}" width="${(v.s * 14).toFixed(0)}" height="6" rx="3"
              fill="${col}" fill-opacity="${on ? .95 : .5}" pointer-events="none"/>
            <text x="316" y="${y + 13.5}" fill="${on ? '#D4A04A' : '#4E505A'}" font-size="10"
              font-weight="700" font-family="DM Sans" pointer-events="none">${v.ab}</text>
            <text x="352" y="${y + 13.5}" fill="${v.con ? '#5FB89A' : '#C0603A'}"
              fill-opacity="${on ? 1 : .55}" font-size="9" font-family="DM Sans"
              pointer-events="none">${v.con ? 'consonance' : 'dissonance'}</text>`;
    });

    /* the motif itself */
    /* Fixed range, deliberately. Scaling the roll to each motif would draw a
       minor second and an octave identically — the leap size is the lesson. */
    const ns = notes(), lo = ROOT - 13, hi = ROOT + 13;
    const py = m => R.y + R.h - ((m - lo) / (hi - lo)) * R.h;
    g += `<text x="${R.x}" y="${R.y - 8}" fill="#4E505A" font-size="9" font-weight="700"
            font-family="DM Sans" letter-spacing="1.6">THE MOTIF</text>
          <rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" rx="6"
            fill="#ffffff" fill-opacity=".022"/>
          <line x1="${R.x}" y1="${(R.y + R.h / 2).toFixed(1)}" x2="${R.x + R.w}"
            y2="${(R.y + R.h / 2).toFixed(1)}" stroke="#ffffff" stroke-opacity=".09"
            stroke-dasharray="3 4"/>
          <text x="${R.x - 6}" y="${(R.y + R.h / 2 + 3.5).toFixed(1)}" fill="#4E505A"
            font-size="8.5" font-family="DM Sans" text-anchor="end">root</text>`;
    const stepW = R.w / STEPS;
    ns.forEach((n, k) => {
      const isLeap = k === RHYTHMS[rh].leap;
      g += `<rect x="${(R.x + n.s * stepW + 2).toFixed(1)}" y="${(py(n.m) - 4).toFixed(1)}"
              width="${(n.l * stepW - 4).toFixed(1)}" height="8" rx="4"
              fill="${isLeap ? '#D4A04A' : '#6E8FB8'}" fill-opacity=".92"/>`;
    });
    svg.innerHTML = g;

    const v = IVS[iv], r = RHYTHMS[rh];
    host.querySelector('#mo-read').innerHTML =
      `<b>${v.n} ${dir > 0 ? 'up' : 'down'} — ${v.con ? 'a consonance' : 'a dissonance'}.</b> `
      + (v.emo ? v.emo + ' ' : '') + r.note;
    host.querySelectorAll('#mo-rh button').forEach((b, i) =>
      b.setAttribute('aria-pressed', String(i === rh)));
    host.querySelector('#mo-up').setAttribute('aria-pressed', String(dir > 0));
    host.querySelector('#mo-down').setAttribute('aria-pressed', String(dir < 0));
  }

  svg.addEventListener('click', e => {
    const row = e.target.closest('.mo-row'); if (!row) return;
    iv = +row.dataset.i; draw(); playMotif();
  });
  host.querySelector('#mo-rh').addEventListener('click', e => {
    const b = e.target.closest('button[data-r]'); if (!b) return;
    rh = +b.dataset.r; draw(); playMotif();
  });
  host.querySelector('#mo-up').onclick    = () => { dir =  1; draw(); playMotif(); };
  host.querySelector('#mo-down').onclick  = () => { dir = -1; draw(); playMotif(); };
  host.querySelector('#mo-motif').onclick = playMotif;
  host.querySelector('#mo-iv').onclick    = playIv;
  host.querySelector('#mo-fate').onclick  = () => {
    iv = 3; rh = 1; dir = -1;                        // G G G E♭ — a major third down
    draw(); playMotif();
  };
  draw();
};


/* ===========================================================================
   9. QUESTION & ANSWER — one theme twice, and the note it lands on
   The chapter's own example: the same phrase given a questioning function by
   landing on a dominant tone, then an answering one by resolving to a tonic
   tone. Both landing notes are the reader's to choose.
   =========================================================================== */
WIDGETS.qanda = function (host) {
  const BPM = 88, STEPS = 8;

  /* C major. I = C E G, IV = F A C, V = G B D — the book's three main chords. */
  const SCALE = [
    { n:'C', m:60, I:true,  IV:true,  V:false },
    { n:'D', m:62, I:false, IV:false, V:true  },
    { n:'E', m:64, I:true,  IV:false, V:false },
    { n:'F', m:65, I:false, IV:true,  V:false },
    { n:'G', m:67, I:true,  IV:false, V:true  },
    { n:'A', m:69, I:false, IV:true,  V:false },
    { n:'B', m:71, I:false, IV:false, V:true  }
  ];
  /* the theme, identical in both halves until the note it lands on */
  const HEAD = [[60,0,1],[64,1,1],[67,2,2],[65,4,1],[64,5,1]];
  const CHORDS = { V:[55,59,62], I:[48,52,55] };     // G major, C major

  let q = 1, a = 0, chords = true;                   // lands on D, then C
  let running = false, timer = null;

  const phrase = (land, off) => HEAD.map(([m, s, l]) => [m, s + off, l])
    .concat([[SCALE[land].m, off + 6, 2]]);
  const section = () => phrase(q, 0).concat(phrase(a, STEPS));
  const SPAN = STEPS * 2 * .5 * 60 / BPM;

  function fire() {
    seq(section().map(([m, s, l]) => [m, s * .5, l * .5]), BPM, { gain: .13, bright: .6 });
    if (!chords) return;
    [['V', 0], ['I', STEPS]].forEach(([k, off]) =>
      seq(CHORDS[k].map(m => [m, off, STEPS]).map(([m, s, l]) => [m, s * .5, l * .5]),
          BPM, { gain: .055, bright: .3, attack: .25 }));
  }
  function loop() { if (!running) return; fire(); timer = setTimeout(loop, SPAN * 1000); }

  const G = { x:42, y:22, w:458, h:128 };
  const S1 = { y:206 }, S2 = { y:272 }, cellW = 458 / 7;

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="qa-svg" viewBox="0 0 520 330"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Play</div>
        <div class="w-row">
          ${playBtn('qa-play','Play section')}
          <button class="btn" id="qa-once">Once</button>
        </div></div>
      <div><div class="w-lab">Harmony</div>
        <div class="w-row">
          <button class="btn" id="qa-ch" aria-pressed="true">Chords: V then I</button>
        </div></div>
      <div><div class="w-lab">The book's example</div>
        <div class="w-row"><button class="btn" id="qa-book">D, then C</button></div></div>
      <div class="w-read" id="qa-read"></div>
    </div></div>`;

  const svg = host.querySelector('#qa-svg');

  function draw() {
    const notes = section();
    const lo = 58, hi = 73;
    const py = m => G.y + G.h - ((m - lo) / (hi - lo)) * G.h;
    let g = `<text x="${G.x}" y="12" fill="#4E505A" font-size="9" font-weight="700"
               font-family="DM Sans" letter-spacing="1.6">THE SAME THEME, TWICE</text>`;

    [['Question', 0, '#6E8FB8', 'over G major — the dominant (V)'],
     ['Answer',   1, '#5FB89A', 'over C major — the tonic (I)']].forEach(([nm, h, col, sub]) => {
      const x0 = G.x + h * G.w / 2;
      g += `<rect x="${x0}" y="${G.y}" width="${(G.w / 2).toFixed(1)}" height="${G.h}"
              fill="${col}" fill-opacity=".05"/>
            <text x="${(x0 + G.w / 4).toFixed(1)}" y="${G.y + G.h + 17}" fill="${col}"
              font-size="10" font-weight="700" font-family="DM Sans"
              text-anchor="middle">${nm}</text>
            <text x="${(x0 + G.w / 4).toFixed(1)}" y="${G.y + G.h + 30}" fill="#4E505A"
              font-size="8.5" font-family="DM Sans" text-anchor="middle">${chords ? sub : 'melody alone'}</text>`;
    });
    g += `<line x1="${G.x + G.w / 2}" y1="${G.y}" x2="${G.x + G.w / 2}" y2="${G.y + G.h}"
            stroke="#ffffff" stroke-opacity=".12"/>`;

    const stepW = G.w / (STEPS * 2);
    notes.forEach(([m, s, l], i) => {
      const land = i === HEAD.length || i === notes.length - 1;
      const half = s < STEPS ? 0 : 1;
      g += `<rect x="${(G.x + s * stepW + 2).toFixed(1)}" y="${(py(m) - 4).toFixed(1)}"
              width="${(l * stepW - 4).toFixed(1)}" height="8" rx="4"
              fill="${land ? (half ? '#5FB89A' : '#6E8FB8') : '#D4A04A'}"
              fill-opacity="${land ? 1 : .62}"/>`;
    });

    /* the two landing-note pickers; each lights the notes its role is aiming at */
    [[S1, q, 'V', 'QUESTION LANDS ON — aim for a note of G major', '#6E8FB8'],
     [S2, a, 'I', 'ANSWER LANDS ON — resolve to a note of C major', '#5FB89A']
    ].forEach(([S, sel, want, lab, col]) => {
      g += `<text x="${G.x}" y="${S.y - 8}" fill="#4E505A" font-size="9" font-weight="700"
              font-family="DM Sans" letter-spacing="1.4">${lab}</text>`;
      SCALE.forEach((d, i) => {
        const on = i === sel, target = d[want];
        const x = G.x + i * cellW;
        g += `<rect class="qa-cell" data-s="${want}" data-i="${i}" x="${(x + 2).toFixed(1)}"
                y="${S.y}" width="${(cellW - 4).toFixed(1)}" height="40" rx="6"
                fill="${on ? col : '#ffffff'}" fill-opacity="${on ? .9 : target ? .07 : .022}"
                stroke="${target && !on ? col : 'none'}" stroke-opacity=".45"
                style="cursor:pointer"/>
              <text x="${(x + cellW / 2).toFixed(1)}" y="${S.y + 21}"
                fill="${on ? '#080C14' : target ? '#fff' : '#5A5C66'}" font-size="13"
                font-weight="${on ? 700 : 400}" font-family="DM Sans" text-anchor="middle"
                pointer-events="none">${d.n}</text>
              <text x="${(x + cellW / 2).toFixed(1)}" y="${S.y + 33}"
                fill="${on ? '#080C14' : '#4E505A'}" font-size="8" font-weight="700"
                font-family="DM Sans" text-anchor="middle" pointer-events="none"
                >${[d.I ? 'I' : '', d.IV ? 'IV' : '', d.V ? 'V' : ''].filter(Boolean).join(' · ')}</text>`;
      });
    });
    svg.innerHTML = g;
    read();
  }

  function read() {
    const qd = SCALE[q], ad = SCALE[a];
    let t = `<b>Question lands on ${qd.n}; answer lands on ${ad.n}.</b> `;
    if (qd.V && ad.I) {
      t += 'Tension, then resolution — the shape the chapter describes. ';
      if (qd.n === 'B') t += 'B is the leading tone, the 7th step that pulls hardest back to the tonic.';
      else if (qd.n === 'G' || ad.n === 'G') t += 'G sits in both chords, so it pulls less hard either way.';
    } else if (!qd.V && ad.I) {
      t += `${qd.n} is not in G major, so the question has little to resolve. The answer still lands.`;
    } else if (qd.V && !ad.I) {
      t += `The question sets up the tension, but ${ad.n} is not in C major — nothing closes.`;
    } else {
      t += 'Neither phrase is doing its job: no tension raised, and nothing resolved.';
    }
    host.querySelector('#qa-read').innerHTML = t;
  }

  svg.addEventListener('click', e => {
    const c = e.target.closest('.qa-cell'); if (!c) return;
    if (c.dataset.s === 'V') q = +c.dataset.i; else a = +c.dataset.i;
    draw();
    if (!running) fire();
  });
  host.querySelector('#qa-once').onclick = fire;
  host.querySelector('#qa-book').onclick = () => { q = 1; a = 0; draw(); fire(); };
  host.querySelector('#qa-ch').onclick = function () {
    chords = !chords;
    this.setAttribute('aria-pressed', String(chords));
    this.textContent = chords ? 'Chords: V then I' : 'Melody alone';
    draw();
  };
  host.querySelector('#qa-play').onclick = function () {
    running = !running;
    this.classList.toggle('on', running);
    if (running) { fire(); timer = setTimeout(loop, SPAN * 1000); }
    else clearTimeout(timer);
  };
  host._cleanup = () => { running = false; clearTimeout(timer); };
  draw();
};


/* ===========================================================================
   10. HARMONY — the chapter's own method, as a grid
   "Look at the notes in your melody. Identify which ones align with the notes
   in each chord." Every cell shows exactly that count, so the reader picks
   chords the way the chapter says to rather than by guessing.
   =========================================================================== */
WIDGETS.harmony = function (host) {
  const BPM = 76, BARS = 4, SPB = 4;                 // steps per bar

  const MEL = [[60,0,1],[64,1,1],[67,2,2],
               [65,4,1],[67,5,1],[69,6,2],
               [67,8,1],[71,9,1],[74,10,2],
               [64,12,1],[62,13,1],[60,14,2]];

  const CH = [
    { id:'C',  name:'C major', rn:'I',   pcs:[0,4,7],  v:[36,40,43], maj:true  },
    { id:'F',  name:'F major', rn:'IV',  pcs:[5,9,0],  v:[41,45,48], maj:true  },
    { id:'G',  name:'G major', rn:'V',   pcs:[7,11,2], v:[43,47,50], maj:true  },
    { id:'Dm', name:'D minor', rn:'ii',  pcs:[2,5,9],  v:[38,41,45], maj:false, sub:'F major' },
    { id:'Am', name:'A minor', rn:'vi',  pcs:[9,0,4],  v:[33,36,40], maj:false, sub:'C major' },
    { id:'Em', name:'E minor', rn:'iii', pcs:[4,7,11], v:[40,43,47], maj:false, sub:'G major' }
  ];

  let pick = [0, 1, 2, 0];                           // C F G C — the primary chords
  let running = false, timer = null;

  const barNotes = b => MEL.filter(([, s]) => Math.floor(s / SPB) === b);
  const fit = (b, c) => barNotes(b).filter(([m]) => CH[c].pcs.indexOf(m % 12) >= 0).length;
  const SPAN = BARS * SPB * .5 * 60 / BPM;

  function fire() {
    seq(MEL.map(([m, s, l]) => [m, s * .5, l * .5]), BPM, { gain: .13, bright: .6 });
    pick.forEach((c, b) => seq(CH[c].v.map(m => [m, b * SPB * .5, SPB * .5]),
      BPM, { gain: .06, bright: .3, attack: .22 }));
  }
  function loop() { if (!running) return; fire(); timer = setTimeout(loop, SPAN * 1000); }

  const M = { x:100, y:22, w:400, h:108 };
  const T = { y:194, rowH:30 };

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="hm-svg" viewBox="0 0 520 388"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Play</div>
        <div class="w-row">${playBtn('hm-play','Play')}<button class="btn" id="hm-once">Once</button></div></div>
      <div><div class="w-lab">Progressions</div>
        <div class="w-col">
          <button class="btn wide" id="hm-prim">Primary chords — C F G C</button>
          <button class="btn wide" id="hm-sub">Swap in the substitutes</button>
        </div></div>
      <div class="w-read" id="hm-read"></div>
    </div></div>`;

  const svg = host.querySelector('#hm-svg');

  function draw() {
    const lo = 58, hi = 76, stepW = M.w / (BARS * SPB);
    const py = m => M.y + M.h - ((m - lo) / (hi - lo)) * M.h;
    let g = `<text x="${M.x}" y="12" fill="#4E505A" font-size="9" font-weight="700"
               font-family="DM Sans" letter-spacing="1.6">YOUR MELODY</text>`;

    for (let b = 0; b < BARS; b++) {
      const x0 = M.x + b * M.w / BARS;
      g += `<rect x="${x0.toFixed(1)}" y="${M.y}" width="${(M.w / BARS).toFixed(1)}"
              height="${M.h}" fill="#ffffff" fill-opacity="${b % 2 ? .03 : .015}"/>
            <text x="${(x0 + M.w / BARS / 2).toFixed(1)}" y="${M.y + M.h + 17}"
              fill="#D4A04A" font-size="10.5" font-weight="700" font-family="DM Sans"
              text-anchor="middle">${CH[pick[b]].name}</text>
            <text x="${(x0 + M.w / BARS / 2).toFixed(1)}" y="${M.y + M.h + 30}"
              fill="#4E505A" font-size="8.5" font-family="DM Sans" text-anchor="middle"
              >${CH[pick[b]].rn} · ${fit(b, pick[b])} of ${barNotes(b).length} notes</text>`;
    }
    MEL.forEach(([m, s, l]) => {
      const b = Math.floor(s / SPB), inCh = CH[pick[b]].pcs.indexOf(m % 12) >= 0;
      g += `<rect x="${(M.x + s * stepW + 2).toFixed(1)}" y="${(py(m) - 4).toFixed(1)}"
              width="${(l * stepW - 4).toFixed(1)}" height="8" rx="4"
              fill="${inCh ? '#D4A04A' : '#5A5C66'}" fill-opacity="${inCh ? .95 : .8}"/>`;
    });

    g += `<text x="14" y="${T.y - 10}" fill="#4E505A" font-size="9" font-weight="700"
            font-family="DM Sans" letter-spacing="1.4">HOW MANY OF THE BAR'S NOTES EACH CHORD CONTAINS</text>`;
    CH.forEach((c, ci) => {
      const y = T.y + ci * T.rowH;
      g += `<text x="14" y="${y + 17}" fill="${c.maj ? '#BEC0C8' : '#9B8FD4'}" font-size="10.5"
              font-family="DM Sans">${c.name}</text>
            <text x="84" y="${y + 17}" fill="#4E505A" font-size="9" font-weight="700"
              font-family="DM Sans" text-anchor="end">${c.rn}</text>`;
      for (let b = 0; b < BARS; b++) {
        const on = pick[b] === ci, f = fit(b, ci), n = barNotes(b).length;
        const x = M.x + b * M.w / BARS;
        g += `<rect class="hm-cell" data-b="${b}" data-c="${ci}" x="${(x + 3).toFixed(1)}"
                y="${y + 2}" width="${(M.w / BARS - 6).toFixed(1)}" height="${T.rowH - 6}" rx="6"
                fill="${on ? '#D4A04A' : '#ffffff'}"
                fill-opacity="${on ? .85 : .02 + (f / n) * .09}" style="cursor:pointer"/>
              <text x="${(x + M.w / BARS / 2).toFixed(1)}" y="${y + 18}"
                fill="${on ? '#080C14' : f === n ? '#5FB89A' : f === 0 ? '#4E505A' : '#BEC0C8'}"
                font-size="11" font-weight="${on || f === n ? 700 : 400}" font-family="DM Sans"
                text-anchor="middle" pointer-events="none">${f}/${n}</text>`;
      }
    });
    svg.innerHTML = g;
    read();
  }

  function read() {
    const names = pick.map(c => CH[c].name.replace(' major', '').replace(' minor', 'm'));
    const tot = pick.reduce((a, c, b) => a + fit(b, c), 0);
    const subs = pick.map((c, b) => CH[c].sub ? CH[c] : null).filter(Boolean);
    let t = `<b>${names.join(' – ')}. ${tot} of ${MEL.length} melody notes are chord tones.</b> `;
    if (subs.length) {
      const s = subs[0];
      t += `${s.name} is the substitute for ${s.sub}, sharing two of its three notes — the swap adds depth without changing the function.`;
    } else if (tot === MEL.length) {
      t += 'Every note is covered. Safe, and a little plain — the substitutes are where the colour is.';
    } else {
      t += 'Notes outside the chord are not mistakes; passing notes are normal. But a bar where almost nothing fits will sound like a wrong chord.';
    }
    host.querySelector('#hm-read').innerHTML = t;
  }

  svg.addEventListener('click', e => {
    const c = e.target.closest('.hm-cell'); if (!c) return;
    pick[+c.dataset.b] = +c.dataset.c;
    draw();
    if (!running) chord(CH[pick[+c.dataset.b]].v, { dur: 1.4, gain: .09, bright: .35 });
  });
  host.querySelector('#hm-once').onclick = fire;
  host.querySelector('#hm-prim').onclick = () => { pick = [0, 1, 2, 0]; draw(); fire(); };
  host.querySelector('#hm-sub').onclick  = () => { pick = [4, 3, 5, 0]; draw(); fire(); };
  host.querySelector('#hm-play').onclick = function () {
    running = !running;
    this.classList.toggle('on', running);
    if (running) { fire(); timer = setTimeout(loop, SPAN * 1000); } else clearTimeout(timer);
  };
  host._cleanup = () => { running = false; clearTimeout(timer); };
  draw();
};

/* ===========================================================================
   11. COUNTERMELODY — the same two lines, separated three ways
   The chapter's two tools in order: rhythm and range first, then tone colour.
   =========================================================================== */
WIDGETS.countermelody = function (host) {
  /* the theme leaps a perfect fifth, rests in the middle, then closes */
  const THEME = [[60,0,1],[67,1,1],[65,2,1],[64,3,1],[62,6,1],[60,7,1]];
  abWidget(host, { bpm: 84, bars: 2, versions: [
    { label:'Competing',
      read:'<b>Same range, same rhythm, moving whenever the theme moves.</b> This is a second melody fighting for attention, not a countermelody — and the listener cannot follow either line.',
      lanes:[
        { name:'Theme', col:'#D4A04A', lo:58, hi:74, gain:.11, bright:.6, notes:THEME },
        { name:'Counter', col:'#CF5F52', lo:58, hi:74, gain:.11, bright:.6,
          notes:[[64,0,1],[71,1,1],[69,2,1],[67,3,1],[66,6,1],[64,7,1]] }
      ] },
    { label:'Rhythm and range',
      read:'<b>The counter rests while the theme moves, and takes over in the gap.</b> An octave down, so the two never share a register. This is the chapter\'s first tool, and it does most of the work on its own.',
      lanes:[
        { name:'Theme', col:'#D4A04A', lo:58, hi:74, gain:.11, bright:.6, notes:THEME },
        { name:'Counter', col:'#6E8FB8', lo:44, hi:60, gain:.1, bright:.5,
          notes:[[48,4,1],[50,5,1]] }
      ] },
    { label:'Rhythm, range and colour',
      read:'<b>Plus a darker tone colour, and the counter now echoes the theme\'s rising fifth in a simpler form.</b> Reusing part of the motif keeps the two lines related while the separation keeps them distinct.',
      lanes:[
        { name:'Theme', col:'#D4A04A', lo:58, hi:74, gain:.11, bright:.68, notes:THEME },
        { name:'Counter', col:'#5FB89A', lo:44, hi:60, gain:.1, bright:.24, attack:.14,
          notes:[[48,4,1],[55,5,2]] }
      ] }
  ]});
};

/* ===========================================================================
   12. OSTINATO — a repeating pattern that has to stay out of the way
   Source and rhythm are separate controls, because the chapter treats them
   separately: what the pattern is made of, then how much it moves.
   =========================================================================== */
WIDGETS.ostinato = function (host) {
  const BPM = 104, STEPS = 8;
  const MEL = [[72,0,2],[76,2,2],[74,4,1],[72,5,1],[71,6,2]];

  const SRC = [
    { id:'scale', name:'Scale fragment', deg:[48,50,52,53],
      note:'The first notes of the C major scale, repeated — the simplest source there is.' },
    { id:'arp',   name:'Tonic arpeggio', deg:[48,52,55,60],
      note:'The tonic chord one note at a time. A safe bet, and the third makes it clearly major.' },
    { id:'fifth', name:'Octaves and fifths', deg:[48,55,60,55],
      note:'The tonic with the third left out. Neutral by design — it commits to neither major nor minor, so it sits under anything.' }
  ];
  const RHY = [
    { id:'even',  name:'Straight',   on:[[0,1],[2,1],[4,1],[6,1]],
      note:'Even and predictable, which is what keeps it in the background.' },
    { id:'drive', name:'Driving',    on:[[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1]],
      note:'Twice the movement. More drive, and it starts pulling focus off the melody.' },
    { id:'synco', name:'Syncopated', on:[[0,1],[3,1],[5,1],[6,1]],
      note:'Shaken up, as the chapter suggests — but the busier and less predictable it gets, the harder it competes.' }
  ];

  let src = 2, rhy = 0, mel = true, running = false, timer = null;
  const SPAN = STEPS * .5 * 60 / BPM;

  const pattern = () => RHY[rhy].on.map(([s, l], k) => [SRC[src].deg[k % 4], s, l]);
  function fire() {
    seq(pattern().map(([m, s, l]) => [m, s * .5, l * .5]), BPM, { gain: .1, bright: .45 });
    if (mel) seq(MEL.map(([m, s, l]) => [m, s * .5, l * .5]), BPM, { gain: .13, bright: .62 });
  }
  function loop() { if (!running) return; fire(); timer = setTimeout(loop, SPAN * 1000); }

  host.innerHTML = `<div class="w-grid">
    <div class="w-stage"><svg id="os-svg" viewBox="0 0 520 296"></svg></div>
    <div class="w-side">
      <div><div class="w-lab">Play</div>
        <div class="w-row">${playBtn('os-play','Play loop')}
          <button class="btn" id="os-mel" aria-pressed="true">Melody on</button></div></div>
      <div><div class="w-lab">What it is made of</div>
        <div class="w-row" id="os-src">${SRC.map((s, i) =>
          `<button class="btn" data-i="${i}" aria-pressed="${i === 2}">${s.name}</button>`).join('')}</div></div>
      <div><div class="w-lab">Rhythm</div>
        <div class="w-row" id="os-rhy">${RHY.map((r, i) =>
          `<button class="btn" data-i="${i}" aria-pressed="${i === 0}">${r.name}</button>`).join('')}</div></div>
      <div class="w-read" id="os-read"></div>
    </div></div>`;

  const svg = host.querySelector('#os-svg');

  function draw() {
    const lo = 44, hi = 78, X = 42, W = 458, Y = 24, H = 224;
    const stepW = W / STEPS, py = m => Y + H - ((m - lo) / (hi - lo)) * H;
    let g = `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="6" fill="#ffffff" fill-opacity=".018"/>`;
    for (let s = 1; s < STEPS; s++)
      g += `<line x1="${(X + s * stepW).toFixed(1)}" y1="${Y}" x2="${(X + s * stepW).toFixed(1)}"
              y2="${Y + H}" stroke="#ffffff" stroke-opacity="${s % 2 ? .03 : .07}"/>`;
    if (mel) MEL.forEach(([m, s, l]) =>
      g += `<rect x="${(X + s * stepW + 2).toFixed(1)}" y="${(py(m) - 4).toFixed(1)}"
              width="${(l * stepW - 4).toFixed(1)}" height="8" rx="4" fill="#D4A04A" fill-opacity=".9"/>`);
    pattern().forEach(([m, s, l]) =>
      g += `<rect x="${(X + s * stepW + 2).toFixed(1)}" y="${(py(m) - 4).toFixed(1)}"
              width="${(l * stepW - 4).toFixed(1)}" height="8" rx="4" fill="#6E8FB8" fill-opacity=".9"/>`);
    g += `<text x="${X}" y="14" fill="#D4A04A" font-size="9" font-weight="700"
            font-family="DM Sans" letter-spacing="1.5">${mel ? 'MELODY' : ''}</text>
          <text x="${X + 70}" y="14" fill="#6E8FB8" font-size="9" font-weight="700"
            font-family="DM Sans" letter-spacing="1.5">OSTINATO</text>
          <text x="${X}" y="${Y + H + 20}" fill="#4E505A" font-size="9"
            font-family="DM Sans">${RHY[rhy].on.length} notes per bar, repeating</text>`;
    svg.innerHTML = g;
    host.querySelector('#os-read').innerHTML =
      `<b>${SRC[src].name}, ${RHY[rhy].name.toLowerCase()}.</b> ${SRC[src].note} ${RHY[rhy].note}`;
    host.querySelectorAll('#os-src button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === src)));
    host.querySelectorAll('#os-rhy button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === rhy)));
  }

  host.querySelector('#os-src').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    src = +b.dataset.i; draw(); if (!running) fire();
  });
  host.querySelector('#os-rhy').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    rhy = +b.dataset.i; draw(); if (!running) fire();
  });
  host.querySelector('#os-mel').onclick = function () {
    mel = !mel;
    this.setAttribute('aria-pressed', String(mel));
    this.textContent = mel ? 'Melody on' : 'Melody off';
    draw();
  };
  host.querySelector('#os-play').onclick = function () {
    running = !running;
    this.classList.toggle('on', running);
    if (running) { fire(); timer = setTimeout(loop, SPAN * 1000); } else clearTimeout(timer);
  };
  host._cleanup = () => { running = false; clearTimeout(timer); };
  draw();
};

/* ----------------------------------------------------------------- mount --- */
function missing(host, type) {
  host.innerHTML = '<div class="w-missing">' +
    '<div class="w-lab">' + type + '</div>' +
    '<p>This demonstration has not been built yet.</p>' +
    '<p class="hint">Register a function on <code>WIDGETS.' + type + '</code>.</p></div>';
}

/* ============================================================================
   THE STEP CONTRACT
   ----------------------------------------------------------------------------
   The demonstration follows the explanation. On every step the lesson shell
   calls handle.step(ctx), where ctx is

     { index, type, scene, beat, label }

   `scene` comes from the lesson's own `beats` in data.js, so what the
   demonstration does at each point is authored with the words rather than
   hard-coded against a step number. An activity opts in by returning

     return { step(ctx){ ... } }

   from its factory. Returning nothing is fine: the activity simply stays put
   while the reader moves, which is what every activity did before scenes
   existed. That is the whole contract — one method, one object — so the same
   engine carries a scale diagram, a mixer or a piano roll.
   ============================================================================ */

/* A coachmark: one pointer bubble anchored under a target inside the stage.
   Shared here rather than per activity so every lesson's nudges look alike. */
function tip(host, targetSel, text) {
  clearTip(host);
  const stage = host.querySelector('.w-stage') || host;
  const target = typeof targetSel === 'string' ? host.querySelector(targetSel) : targetSel;
  if (!target) return;
  const el = document.createElement('div');
  el.className = 'w-tip';
  el.innerHTML = '<i></i><span>' + AccelWidgets.esc(text) + '</span>';
  stage.appendChild(el);
  const sb = stage.getBoundingClientRect(), tb = target.getBoundingClientRect();
  el.style.left = Math.max(6, Math.min(tb.left - sb.left + tb.width / 2 - el.offsetWidth / 2,
                                       sb.width - el.offsetWidth - 6)) + 'px';
  el.style.top = (tb.bottom - sb.top + 9) + 'px';
  host._tip = el;
}
function clearTip(host) { if (host._tip) { host._tip.remove(); host._tip = null; } }

const AccelWidgets = {
  esc: s => String(s).replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c])),
  tip, clearTip,
  /* Returns the handle app.js drives. `step` is forwarded to the activity when
     it declared one; destroy runs whatever loop teardown it registered. */
  mount(host, lesson) {
    let api = null;
    if (WIDGETS[lesson.demo]) {
      try { api = WIDGETS[lesson.demo](host, lesson) || null; }
      catch (err) { console.error('[Accelerator] activity failed:', lesson.demo, err); missing(host, lesson.demo); }
    } else missing(host, lesson.demo);
    return {
      capture() {},
      step(ctx) {
        if (!api || typeof api.step !== 'function') return;
        try { api.step(ctx); }
        catch (err) { console.error('[Accelerator] step failed:', lesson.demo, ctx && ctx.scene, err); }
      },
      destroy() {
        clearTip(host);
        if (host._cleanup) { try { host._cleanup(); } catch (_) {} }
        host._cleanup = null;
        host.innerHTML = '';
      }
    };
  }
};
