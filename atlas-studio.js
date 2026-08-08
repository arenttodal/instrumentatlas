/* ============================================================================
   INSTRUMENT ATLAS · STUDIO
   ----------------------------------------------------------------------------
   The dock at the bottom of every page. Rendered once into #atl-dock, which
   lives outside #atl-view, so a route change never touches it and playback
   survives navigation.

   Reads PASSAGES, AUDIO and STUDIO_FAM from atlas-data.js. Loads after
   atlas.js, both deferred, so the data and the router already exist.
   ============================================================================ */

/* ============================================================================
   1. AUDIO ENGINE
   ----------------------------------------------------------------------------
   Ported unchanged from the standalone studio page.

   One AudioContext. Every track decoded into a buffer and started at the SAME
   scheduled time, each through its own GainNode. Switching is a 15ms gain ramp,
   so it is sample-accurate, click-free, and can happen mid-phrase without
   restarting anything.

   Why not <audio> elements: they drift, they cannot be started sample-locked,
   and encoder padding offsets each file's start by several milliseconds, which
   is precisely the thing you are trying to compare.
   ============================================================================ */

class AudioCompare {
  constructor(tracks, opts = {}){
    this.tracks   = tracks;            // [{id, src}]
    this.buffers  = new Map();
    this.gains    = new Map();
    this.sources  = new Map();
    this.ctx      = null;
    this.playing  = false;
    this.loaded   = false;
    this.startTime = 0;                // ctx time when playback began
    this.offset   = 0;                 // where in the buffer we are
    this.duration = 0;
    this.loop     = opts.loop !== false;
    this.onstate  = opts.onstate || (() => {});
    this.onprogress = opts.onprogress || (() => {});
    this.active   = new Set(opts.initial || []);
  }

  async load(onProgress){
    if(this.loaded) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    let done = 0;
    await Promise.all(this.tracks.map(async t => {
      const res = await fetch(t.src);
      if(!res.ok) throw new Error('Missing audio file: ' + t.src);
      const buf = await this.ctx.decodeAudioData(await res.arrayBuffer());
      this.buffers.set(t.id, buf);
      this.duration = Math.max(this.duration, buf.duration);
      done++;
      if(onProgress) onProgress(done / this.tracks.length);
    }));
    this.loaded = true;
  }

  /* every track plays continuously; only the gains change */
  _spinUp(offset){
    const now = this.ctx.currentTime + 0.06;   // small lead so all starts align
    this.tracks.forEach(t => {
      const src = this.ctx.createBufferSource();
      src.buffer = this.buffers.get(t.id);
      src.loop = this.loop;
      const g = this.ctx.createGain();
      g.gain.value = this.active.has(t.id) ? 1 : 0;
      src.connect(g).connect(this.ctx.destination);
      src.start(now, offset);
      this.sources.set(t.id, src);
      this.gains.set(t.id, g);
    });
    this.startTime = now - offset;
  }

  _tearDown(){
    this.sources.forEach(s => { try { s.stop(); } catch(_){} });
    this.sources.clear();
    this.gains.clear();
  }

  async play(){
    if(!this.loaded) await this.load();
    if(this.ctx.state === 'suspended') await this.ctx.resume();
    if(this.playing) return;
    this._spinUp(this.offset % (this.duration || 1));
    this.playing = true;
    this.onstate(this);
    this._tick();
  }

  pause(){
    if(!this.playing) return;
    this.offset = this.position;
    this._tearDown();
    this.playing = false;
    this.onstate(this);
  }

  toggle(){ this.playing ? this.pause() : this.play(); }

  stop(){
    this._tearDown();
    this.playing = false;
    this.offset = 0;
    this.onstate(this);
  }

  get position(){
    if(!this.playing) return this.offset;
    const p = this.ctx.currentTime - this.startTime;
    return this.loop && this.duration ? p % this.duration : Math.min(p, this.duration);
  }

  /* seek without losing alignment between tracks */
  seek(seconds){
    const wasPlaying = this.playing;
    if(wasPlaying) this._tearDown();
    this.offset = Math.max(0, Math.min(seconds, this.duration - 0.01));
    if(wasPlaying){ this._spinUp(this.offset); }
    this.onstate(this);
  }

  /* matrix: exactly one audible */
  select(id, ramp = 0.015){
    this.active = new Set([id]);
    this._applyGains(ramp);
  }

  /* stems: any number audible */
  setStem(id, on, ramp = 0.03){
    on ? this.active.add(id) : this.active.delete(id);
    this._applyGains(ramp);
  }

  soloStem(id){
    this.active = new Set([id]);
    this._applyGains(0.03);
  }

  _applyGains(ramp){
    if(!this.playing){ this.onstate(this); return; }
    const now = this.ctx.currentTime;
    this.gains.forEach((g, id) => {
      const target = this.active.has(id) ? 1 : 0;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(target, now + ramp);
    });
    this.onstate(this);
  }

  _tick(){
    if(!this.playing) return;
    this.onprogress(this.position, this.duration);
    requestAnimationFrame(() => this._tick());
  }
}

window.AudioCompare = AudioCompare;

/* ============================================================================
   2. STUDIO
   ============================================================================ */
(function(){

const dockEl = document.getElementById('atl-dock');
if(!dockEl || typeof PASSAGES !== 'object' || !Object.keys(PASSAGES).length) return;

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LANE_H = 58, RULER_H = 26;

/* the source of truth for a track's audio, used nowhere else */
const srcOf = (passageId, file) => `${AUDIO.base}${passageId}/${file}.${AUDIO.ext}`;

const S = {
  id:      null,   // current passage id
  passage: null,
  engine:  null,
  playing: false,
  pos:     0,      // seconds
  dur:     0,
  muted:   new Set(),
  solo:    null,
  variant: {},     // trackId -> variant v
  chosen:  false,  // has the user picked a theme this session?
  shown:   false,  // is the dock on screen at all?
  open:    false,  // is the arrangement expanded below the strip?
  loading: false
};

/* ---------------------------------------------------------------- shell ---
   The markup is built once now, but the dock stays hidden until the Studio
   button in the nav is switched on. Building it up front costs nothing: no
   audio is fetched until play is pressed either way. */
dockEl.innerHTML = `
  <div class="atl-dock-strip">
    <button class="atl-dock-play" id="atl-dk-play" aria-label="Play">
      <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg>
    </button>
    <div class="atl-dock-id">
      <b id="atl-dk-title"></b>
      <span id="atl-dk-sub"></span>
    </div>
    <div class="atl-dock-bar" id="atl-dk-scrub" role="slider" tabindex="0"
         aria-label="Playback position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="atl-dk-fill"></i></div>
    <div class="atl-dock-clock" id="atl-dk-clock">1.1.0 · 0:00</div>
    <button class="atl-dock-expand" id="atl-dk-expand" aria-expanded="false">Studio
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 5l4-4 4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
    </button>
  </div>

  <div class="atl-dock-body" id="atl-dk-body">
    <div class="atl-dock-inner">
      <div class="atl-dock-toolbar">
        <div class="atl-select atl-dock-select" id="atl-dk-sel" data-open="0">
          <button class="atl-select-btn" id="atl-dk-sel-btn" aria-haspopup="true" aria-expanded="false">
            <span id="atl-dk-sel-label">Theme</span>
            <svg class="chev" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
          <div class="atl-dock-menu" id="atl-dk-sel-menu" role="menu"></div>
        </div>
        <div class="atl-dock-legend" id="atl-dk-legend"></div>
        <div class="atl-dock-spacer"></div>
        <div class="atl-dock-meta" id="atl-dk-meta"></div>
      </div>

      <div class="atl-arr">
        <div class="atl-dock-heads" id="atl-dk-heads"></div>
        <div class="atl-dock-lanes" id="atl-dk-lanes">
          <svg id="atl-dk-grid" xmlns="http://www.w3.org/2000/svg"></svg>
          <div class="atl-dock-playhead" id="atl-dk-playhead" style="left:0"></div>
        </div>
      </div>
    </div>
  </div>`;

const $ = id => document.getElementById(id);
const elPlay  = $('atl-dk-play'),  elBody   = $('atl-dk-body'), elHeads = $('atl-dk-heads');
const elGrid  = $('atl-dk-grid'),  elLanes  = $('atl-dk-lanes'), elMeta = $('atl-dk-meta');
const elFill  = $('atl-dk-fill'),  elClock  = $('atl-dk-clock'), elHead = $('atl-dk-playhead');
const elTitle = $('atl-dk-title'), elSub    = $('atl-dk-sub');
const elSel   = $('atl-dk-sel'),   elSelBtn = $('atl-dk-sel-btn'), elSelMenu = $('atl-dk-sel-menu');

/* --------------------------------------------------------------- helpers --- */
const totalBeats = p => p.bars * p.beats;
const secPerBeat = p => 60 / p.tempo;
const passageDur = p => totalBeats(p) * secPerBeat(p);

function variantOf(track){
  return S.variant[track.id] ||
    (track.default || track.variants[track.variants.length - 1].v);
}
function audible(trackId){
  return S.solo ? trackId === S.solo : !S.muted.has(trackId);
}
function activeIds(){
  return S.passage.tracks.filter(t => audible(t.id)).map(t => t.id + '_' + variantOf(t));
}
function applyGains(){
  if(!S.engine) return;
  S.engine.active = new Set(activeIds());
  S.engine._applyGains(0.02);
}

/* --------------------------------------------------------- dock height ---
   height:auto cannot be transitioned, so the open height is measured from the
   content and written in px. Re-measured whenever the content can change. */
function measure(){
  if(!S.open){ elBody.style.height = '0px'; return; }
  const inner = elBody.firstElementChild;
  elBody.style.height = inner.scrollHeight + 'px';
}
const ro = new ResizeObserver(() => { if(S.open) measure(); });

/* ------------------------------------------------------------ piano roll --- */
function draw(){
  const p = S.passage; if(!p) return;
  const TOTAL = totalBeats(p);
  const W = Math.max(elLanes.clientWidth, 640);
  const H = RULER_H + p.tracks.length * LANE_H;
  const px = b => (b / TOTAL) * W;
  let s = '';

  for(let bar = 0; bar < p.bars; bar++){
    const x = px(bar * p.beats);
    s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#fff" stroke-opacity="${bar%4===0?'.14':'.07'}" stroke-width="1"/>`;
    s += `<text x="${x+6}" y="17" fill="#4E505A" font-size="9.5" font-family="DM Sans,sans-serif" font-weight="700" letter-spacing=".8">${bar+1}</text>`;
    for(let b = 1; b < p.beats; b++){
      const bx = px(bar*p.beats + b);
      s += `<line x1="${bx}" y1="${RULER_H}" x2="${bx}" y2="${H}" stroke="#fff" stroke-opacity=".03" stroke-width="1"/>`;
    }
  }
  s += `<line x1="0" y1="${RULER_H}" x2="${W}" y2="${RULER_H}" stroke="#fff" stroke-opacity=".08"/>`;

  p.tracks.forEach((t, i) => {
    const y0 = RULER_H + i * LANE_H;
    s += `<line x1="0" y1="${y0 + LANE_H}" x2="${W}" y2="${y0 + LANE_H}" stroke="#fff" stroke-opacity=".04"/>`;
    const on = audible(t.id);
    const col = STUDIO_FAM[t.family] || '#8FB4E0';
    const pitches = t.notes.map(n => n[2]);
    const lo = Math.min(...pitches), hi = Math.max(...pitches);
    const span = Math.max(hi - lo, 6);
    t.notes.forEach(([st, du, pit]) => {
      const x = px(st), w = Math.max(px(du) - 2, 3);
      const rel = (pit - lo) / span;
      const y = y0 + LANE_H - 9 - rel * (LANE_H - 20);
      s += `<rect x="${x+1}" y="${y}" width="${w}" height="6" rx="2.5"
        fill="${col}" fill-opacity="${on ? .95 : .14}"/>`;
    });
  });

  elGrid.setAttribute('width', W);
  elGrid.setAttribute('height', H);
  elGrid.setAttribute('viewBox', `0 0 ${W} ${H}`);
  elGrid.innerHTML = s;
  meta();
}

function meta(){
  const p = S.passage;
  if(S.loading) return;
  const on = p.tracks.filter(t => audible(t.id));
  const desc = on.map(t => {
    const v = t.variants.find(x => x.v === variantOf(t));
    return t.instrument ? (INSTRUMENTS[t.instrument] ? INSTRUMENTS[t.instrument].name : t.id) : t.id;
  }).join(' + ') || 'nothing audible';
  elMeta.textContent = `${desc} · ${p.bars} bars · ♩ = ${p.tempo} · levels matched`;
}

/* ---------------------------------------------------------- track heads --- */
function buildHeads(){
  const p = S.passage;
  elHeads.innerHTML = `<div class="atl-dock-rulerpad"><span>Tracks</span></div>` +
    p.tracks.map(t => {
      const inst = INSTRUMENTS[t.instrument];
      const name = inst ? inst.name : t.id;
      const href = inst ? `#/${inst.family}/${t.instrument}` : null;
      const vsel = variantOf(t);
      return `
      <div class="atl-dock-head" data-track="${esc(t.id)}" data-muted="0" data-solo="0"
           style="--fam:${STUDIO_FAM[t.family] || '#8FB4E0'}">
        <div class="atl-dock-head-name">
          ${href ? `<a href="${href}">${esc(name)}</a>` : `<b>${esc(name)}</b>`}
          <div class="atl-dock-role">${esc(t.role || '')}</div>
          ${t.variants.length > 1 ? `<div class="atl-dock-vars">${t.variants.map(v =>
            `<button class="atl-dock-var" data-v="${esc(v.v)}" aria-pressed="${v.v === vsel}">${esc(v.label)}</button>`).join('')}</div>` : ''}
        </div>
        <div class="atl-dock-ms">
          <button class="m" title="Mute" aria-label="Mute ${esc(name)}">M</button>
          <button class="s" title="Solo" aria-label="Solo ${esc(name)}">S</button>
        </div>
      </div>`;
    }).join('');

  const fams = [...new Set(p.tracks.map(t => t.family))];
  $('atl-dk-legend').innerHTML = `<span class="atl-dock-tlabel">Family</span>` + fams.map(f =>
    `<span class="atl-dock-key"><i style="background:${STUDIO_FAM[f] || '#8FB4E0'}"></i>${esc(f[0].toUpperCase() + f.slice(1))}</span>`).join('');

  elHeads.querySelectorAll('.atl-dock-head').forEach(row => {
    const id = row.dataset.track;
    row.querySelector('.m').onclick = () => {
      S.muted.has(id) ? S.muted.delete(id) : S.muted.add(id);
      row.dataset.muted = S.muted.has(id) ? '1' : '0';
      applyGains(); draw();
    };
    row.querySelector('.s').onclick = () => {
      S.solo = S.solo === id ? null : id;
      elHeads.querySelectorAll('.atl-dock-head').forEach(h =>
        h.dataset.solo = (h.dataset.track === S.solo) ? '1' : '0');
      applyGains(); draw();
    };
    row.querySelectorAll('.atl-dock-var').forEach(b => {
      b.onclick = () => {
        S.variant[id] = b.dataset.v;
        row.querySelectorAll('.atl-dock-var').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        applyGains(); meta();
      };
    });
  });
  ro.disconnect();
  ro.observe(elHeads);
  ro.observe(elLanes);
}

/* ------------------------------------------------------------- transport --- */
function fmt(sec){
  const p = S.passage;
  const beat = sec / secPerBeat(p);
  const bar  = Math.floor(beat / p.beats) + 1;
  const bt   = Math.floor(beat % p.beats) + 1;
  const tk   = Math.floor((beat % 1) * 10);
  return `${bar}.${bt}.${tk} · ${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;
}

/* The playhead is driven by musical position, not by percentage of the file.
   A render that carries a tail past the last bar would otherwise drag the
   playhead out of sync with the grid it is drawn over. */
function render(){
  const p = S.passage;
  const beats = S.pos / secPerBeat(p);
  const frac  = Math.min(beats / totalBeats(p), 1);
  elFill.style.width = (frac * 100) + '%';
  elClock.textContent = fmt(S.pos);
  elHead.style.left = (frac * (elGrid.clientWidth || 0)) + 'px';
  $('atl-dk-scrub').setAttribute('aria-valuenow', Math.round(frac * 100));
}

function frame(){
  if(S.playing && S.engine) { S.pos = S.engine.position; render(); }
  requestAnimationFrame(frame);
}

async function ensureEngine(){
  if(S.engine) return true;
  const p = S.passage, list = [];
  p.tracks.forEach(t => t.variants.forEach(v =>
    list.push({ id: t.id + '_' + v.v, src: srcOf(S.id, v.file) })));
  S.engine = new AudioCompare(list, { initial: activeIds(), loop:true });
  S.loading = true;
  elMeta.textContent = `Loading ${list.length} renders…`;
  try {
    await S.engine.load(f => { elMeta.textContent = 'Loading ' + Math.round(f*100) + '%'; });
  } catch(e){
    S.loading = false;
    elMeta.textContent = e.message;
    S.engine = null;
    return false;
  }
  S.loading = false;
  S.dur = S.engine.duration || passageDur(p);
  meta();
  return true;
}

function setPlayIcon(){
  elPlay.classList.toggle('is-on', S.playing);
  elPlay.innerHTML = S.playing
    ? '<svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><rect x="0" y="0" width="4" height="14" rx="1"/><rect x="8" y="0" width="4" height="14" rx="1"/></svg>'
    : '<svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg>';
  elPlay.setAttribute('aria-label', S.playing ? 'Pause' : 'Play');
}

elPlay.onclick = async () => {
  if(!S.playing){
    /* the dock and a demo clip are separate audio paths and would otherwise
       play over each other, which is worst on the very pages where both have
       something to say */
    if(typeof stopDemo === 'function') stopDemo();
    if(!await ensureEngine()) return;      /* nothing is fetched until here */
    S.engine.seek(S.pos);
    await S.engine.play();
    S.playing = true;
  } else {
    S.engine.pause();
    S.playing = false;
  }
  setPlayIcon();
};

$('atl-dk-scrub').onclick = e => {
  const r = e.currentTarget.getBoundingClientRect();
  const frac = Math.max(0, Math.min((e.clientX - r.left) / r.width, 1));
  S.pos = frac * (S.dur || passageDur(S.passage));
  if(S.engine) S.engine.seek(S.pos);
  render();
};

/* --------------------------------------------------------------- expand --- */
$('atl-dk-expand').onclick = () => {
  setOpen(!S.open);
  if(S.open) requestAnimationFrame(() => { draw(); render(); measure(); });
};

/* ------------------------------------------------------ theme dropdown --- */
function buildMenu(){
  elSelMenu.innerHTML = Object.keys(PASSAGES).map(id => {
    const p = PASSAGES[id];
    return `<button class="atl-dock-opt" role="menuitem" data-p="${esc(id)}" aria-current="${id === S.id}">
      <b>${esc(p.title)}</b><span>${esc(p.subtitle || '')}</span></button>`;
  }).join('');
  elSelMenu.querySelectorAll('.atl-dock-opt').forEach(b => {
    b.onclick = () => { closeMenu(); if(b.dataset.p !== S.id){ S.chosen = true; loadPassage(b.dataset.p); } };
  });
}
function openMenu(){ elSel.dataset.open = '1'; elSelBtn.setAttribute('aria-expanded','true'); }
function closeMenu(){ elSel.dataset.open = '0'; elSelBtn.setAttribute('aria-expanded','false'); }
elSelBtn.onclick = e => { e.stopPropagation(); elSel.dataset.open === '1' ? closeMenu() : openMenu(); };
document.addEventListener('click', e => { if(!elSel.contains(e.target)) closeMenu(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });

/* ----------------------------------------------------------- load a set --- */
function loadPassage(id){
  if(S.engine){ S.engine.stop(); S.engine._tearDown(); }
  S.engine = null;
  S.playing = false;
  S.pos = 0;
  S.id = id;
  S.passage = PASSAGES[id];
  S.muted = new Set();
  S.solo = null;
  S.variant = {};
  S.dur = passageDur(S.passage);

  elTitle.textContent = `${S.passage.title} · ${S.passage.bars} bars`;
  elSub.textContent = S.passage.subtitle || '';
  $('atl-dk-sel-label').textContent = S.passage.title;
  setPlayIcon();
  buildMenu();
  buildHeads();
  draw();
  render();
  if(S.open) requestAnimationFrame(measure);
}

/* ------------------------------------------------ per-page default theme ---
   Opening an instrument page preselects a passage containing that instrument,
   and highlights its track. It never overrides a theme the user chose. */
function passageFor(instrumentId){
  return Object.keys(PASSAGES).find(id =>
    PASSAGES[id].tracks.some(t => t.instrument === instrumentId));
}
function syncToRoute(){
  const m = (location.hash || '').match(/^#\/[a-z-]+\/([a-z0-9-]+)/i);
  const inst = m ? m[1] : null;
  if(inst && !S.chosen){
    const want = passageFor(inst);
    if(want && want !== S.id) loadPassage(want);
  }
  elHeads.querySelectorAll('.atl-dock-head').forEach(h => {
    const t = S.passage.tracks.find(x => x.id === h.dataset.track);
    h.classList.toggle('is-here', !!(t && inst && t.instrument === inst));
  });
}
addEventListener('hashchange', syncToRoute);

/* ------------------------------------------------- show and hide the dock ---
   Off by default. Switching it off pauses playback rather than leaving audio
   running behind a dock with no visible controls, and keeps the position, so
   switching it back on resumes exactly where you left it. */
const btn = document.getElementById('atl-studio-btn');
const atl = document.getElementById('atl');

function setDock(on){
  S.shown = on;
  dockEl.hidden = !on;
  if(atl) atl.classList.toggle('has-dock', on);
  if(btn) btn.setAttribute('aria-pressed', String(on));
  if(!on){
    if(S.playing && S.engine){ S.engine.pause(); S.playing = false; setPlayIcon(); }
    closeMenu();
  } else {
    /* it arrives expanded: someone who asked for the studio wants the tracks,
       not a strip they have to open a second time */
    setOpen(true);
    /* laid out only now, so the roll has to be drawn against real widths */
    requestAnimationFrame(() => { draw(); render(); measure(); });
  }
}

function setOpen(on){
  S.open = on;
  dockEl.classList.toggle('is-open', on);
  $('atl-dk-expand').setAttribute('aria-expanded', String(on));
  measure();
}

if(btn) btn.addEventListener('click', () => setDock(!S.shown));

/* let the demo players on instrument pages pause the dock before they start */
window.atlasStudioPause = () => {
  if(S.playing && S.engine){ S.engine.pause(); S.playing = false; setPlayIcon(); }
};

/* ------------------------------------------------------------------ go --- */
addEventListener('resize', () => { if(S.shown){ draw(); render(); measure(); } });
addEventListener('keydown', e => {
  if(S.shown && e.code === 'Space' && e.target === document.body){ e.preventDefault(); elPlay.click(); }
});

loadPassage(Object.keys(PASSAGES)[0]);
syncToRoute();
setDock(false);
requestAnimationFrame(frame);

})();
