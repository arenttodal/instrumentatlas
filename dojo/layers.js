/* ============================================================================
   EAR TRAINING · LAYERS
   ----------------------------------------------------------------------------
   Loads after atlas-data.js and layers-data.js, all deferred.

   A real passage plays with four or five instruments at once; you drag each
   one into the job it is doing. The answer key is the piece's own role
   annotations, so being told you are wrong means the annotation disagrees with
   you, not that a quiz was written to.

   Two parts: the audio, then the board.
   ============================================================================ */

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = id => document.getElementById(id);
const roleOf = id => LAYER_ROLES.find(r => r.id === id);

/* ============================================================================
   1. AUDIO
   ----------------------------------------------------------------------------
   The same engine as the belts mode and, behind it, the studio's AudioCompare
   and the score view's node registry: one AudioContext, every stem started at
   ONE scheduled time, and changing what you hear is a gain ramp rather than a
   restart — which is what makes solo instant and keeps the stems locked to
   each other while you audition them one at a time.

   Two things are specific to this mode.

   A 32 kHz context, as the score view uses. Twelve stems of this piece decode
   to 553 MB at 48 kHz, and that is the constraint the whole score view was
   built around.

   And the decoded buffer is SLICED to the exercise's bars and the full one
   dropped. A section is ten to sixteen seconds of a 113-second piece, so a
   five-stem exercise holds about 20 MB instead of 145 MB. The full buffer
   exists only while one stem is being cut, one stem at a time.
   ============================================================================ */

const LayerAudio = (function(){

  const CACHE_MAX = 16;
  const LEAD = 0.08;
  const RAMP = 0.03;

  let ctx = null, gen = 0;
  const slices = new Map();          // key -> AudioBuffer, already cut to the bars
  const LIVE   = new Set();          // {id, src, gain} — nothing else holds a node

  let startTime = 0, duration = 0;
  let playing = false, loading = false, failed = null;
  let onstate = () => {};

  /* never at load, only on a gesture */
  function ensureCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate:32000 });
    return ctx;
  }

  function nodeFor(id){ for(const n of LIVE) if(n.id === id) return n; return null; }
  function killNode(n){
    try { n.src.onended = null; n.src.stop(); } catch(_){}
    try { n.src.disconnect(); n.gain.disconnect(); } catch(_){}
    LIVE.delete(n);
  }
  function killId(id){ [...LIVE].forEach(n => { if(n.id === id) killNode(n); }); }
  function killAll(){ [...LIVE].forEach(killNode); LIVE.clear(); }

  function startNode(id, buf, when, gainValue){
    killId(id);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;                 // every slice in an exercise is the same length
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    src.connect(gain).connect(ctx.destination);
    const n = { id, src, gain };
    src.onended = () => { LIVE.delete(n); if(!LIVE.size && playing){ playing = false; onstate(); } };
    src.start(when, 0);
    LIVE.add(n);
    return n;
  }

  /* Decode the stem, copy out the bars we want, let the rest go. A short fade
     at each edge: the cut lands wherever the bar line lands, which is rarely a
     zero crossing, and the loop point would click on every pass. */
  async function slice(id, start, dur){
    const key = `${id}@${start.toFixed(3)}+${dur.toFixed(3)}`;
    if(slices.has(key)){ const b = slices.get(key); slices.delete(key); slices.set(key, b); return b; }

    const url = layerStemSrc(id);
    const res = await fetch(url);
    if(!res.ok) throw new Error('Missing stem: ' + url);
    const full = await ensureCtx().decodeAudioData(await res.arrayBuffer());

    const sr  = full.sampleRate;
    const off = Math.max(0, Math.round(start * sr));
    const n   = Math.max(1, Math.min(Math.round(dur * sr), full.length - off));
    const out = ctx.createBuffer(full.numberOfChannels, n, sr);
    const fade = Math.min(Math.round(0.014 * sr), n >> 1);

    for(let c = 0; c < full.numberOfChannels; c++){
      const dst = out.getChannelData(c);
      dst.set(full.getChannelData(c).subarray(off, off + n));
      for(let i = 0; i < fade; i++){
        const g = i / fade;
        dst[i] *= g;
        dst[n - 1 - i] *= g;
      }
    }
    slices.set(key, out);
    for(const k of [...slices.keys()]){
      if(slices.size <= CACHE_MAX) break;
      if(!nodeFor(k.split('@')[0])) slices.delete(k);
    }
    return out;                      // `full` is unreferenced from here
  }

  /* Every play() takes a generation token, so a play still decoding when the
     learner moves on cannot start its sources afterwards. stop() bumps it too,
     which is what makes stop mean stop including work that has not landed. */
  async function play(ids, start, dur, gains){
    const mine = ++gen;
    failed = null;
    try {
      ensureCtx();
      if(ctx.state === 'suspended') await ctx.resume();
      loading = true; onstate();

      const bufs = [];
      for(const id of ids){
        bufs.push(await slice(id, start, dur));
        if(mine !== gen) return false;
      }
      loading = false;

      killAll();
      duration = Math.min(...bufs.map(b => b.duration));
      const when = ctx.currentTime + LEAD;
      ids.forEach((id, i) => startNode(id, bufs[i], when, gains && id in gains ? gains[id] : 1));
      startTime = when;
      playing = true;
    } catch(e){
      if(mine !== gen) return false;
      loading = false; playing = false; failed = e.message;
      console.error(e);
    } finally {
      if(mine === gen) onstate();
    }
    return playing;
  }

  function stop(){ gen++; killAll(); playing = false; loading = false; onstate(); }

  /* id null means everything back up. A ramp, never a restart, so the stems
     never lose alignment while you audition them. */
  function solo(id, ramp = RAMP){
    if(!ctx) return;
    const now = ctx.currentTime;
    LIVE.forEach(n => {
      const target = (id === null || n.id === id) ? 1 : 0;
      n.gain.gain.cancelScheduledValues(now);
      n.gain.gain.setValueAtTime(n.gain.gain.value, now);
      n.gain.gain.linearRampToValueAtTime(target, now + ramp);
    });
  }

  /* the current gain of every live stem. The registry stays private; this is a
     read-only window onto it, for the solo state and for tests. */
  function levels(){
    const o = {};
    LIVE.forEach(n => { o[n.id] = Math.round(n.gain.gain.value * 1000) / 1000; });
    return o;
  }

  function position(){
    if(!playing || !ctx) return 0;
    const p = Math.max(0, ctx.currentTime - startTime);
    return duration ? (p % duration) : 0;
  }

  return { play, stop, solo, position, levels, ensureCtx,
    get playing(){ return playing; }, get loading(){ return loading; },
    get duration(){ return duration; }, get error(){ return failed; },
    set onstate(fn){ onstate = fn; } };
})();

/* ============================================================================
   2. THE BOARD
   ============================================================================ */

const S = {
  i:        0,        // which exercise
  ex:       null,
  placed:   {},       // stemId -> roleId, or undefined while it is in the tray
  picked:   null,     // the card waiting for a zone, on the click/tap path
  soloed:   null,
  checked:  false,
  heard:    false
};

const stemIds = () => Object.keys(S.ex.answers);
const exStart = () => barTime(S.ex.from);
const exDur   = () => barTime(S.ex.to) - barTime(S.ex.from);
const allPlaced = () => stemIds().every(id => S.placed[id]);

/* ------------------------------------------------------------------ cards --- */
function cardHTML(id){
  const st = LAYER_STEMS[id];
  const verdict = !S.checked ? '' :
    (S.placed[id] === S.ex.answers[id] ? ' is-right' : ' is-wrong');
  const picked = S.picked === id ? ' is-picked' : '';
  const solo   = S.soloed === id ? ' is-solo' : '';
  return `<div class="ly-card${verdict}${picked}${solo}" data-id="${esc(id)}"
       draggable="${!S.checked}" tabindex="0" role="button"
       aria-pressed="${S.picked === id}"
       aria-label="${esc(st.name)}${S.placed[id] ? ', in ' + roleOf(S.placed[id]).name : ''}">
    <div class="ly-card-art">${layerStemIcon(id)}</div>
    <b>${esc(st.name)}</b>
    <button class="ly-solo" data-solo="${esc(id)}" tabindex="-1"
            aria-label="Hear ${esc(st.name)} alone">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"
           stroke-linecap="round" aria-hidden="true">
        <path d="M4 6.2v3.6M7 4v8M10 5.4v5.2M13 7v2"/></svg>
    </button>
  </div>`;
}

function render(){
  const ex = S.ex;
  $('ly-eyebrow').textContent =
    `Layers · ${ex.section} · bars ${ex.from}–${ex.to - 1}`;
  $('ly-display').textContent = S.checked
    ? `${score()} of ${stemIds().length} right`
    : 'What is each one doing?';
  $('ly-score').innerHTML = `<b>${S.i + 1}</b><span>/${LAYER_EXERCISES.length}</span>`;

  const loose = stemIds().filter(id => !S.placed[id]);
  const tray = $('ly-tray');
  tray.innerHTML = loose.length
    ? loose.map(cardHTML).join('')
    : `<p class="ly-tray-empty">All placed — check them, or take one back out.</p>`;
  tray.toggleAttribute('data-empty', !loose.length);

  $('ly-zones').innerHTML = LAYER_ROLES.map(r => {
    const inZone = stemIds().filter(id => S.placed[id] === r.id);
    /* the hint is the accessible name rather than a subtitle on screen: it is
       useful to someone who cannot see the colour, and clutter to everyone
       else once they have read it twice */
    return `<section class="ly-zone" data-role="${esc(r.id)}" style="--role:${r.colour}"
             aria-label="${esc(r.name)} — ${esc(r.hint)}">
      <div class="ly-zone-label">${esc(r.name)}</div>
      <div class="ly-slot"${inZone.length ? '' : ' data-empty'}>${inZone.map(cardHTML).join('') ||
        `<p class="ly-slot-empty">Drop here</p>`}</div>
    </section>`;
  }).join('');

  $('ly-actions').innerHTML = S.checked
    ? `${score() === stemIds().length
          ? ''
          : `<button class="dj-link" id="ly-reveal">Show me</button>`}
       <button class="dj-next" id="ly-next">${
          S.i < LAYER_EXERCISES.length - 1 ? 'Next passage' : 'Start again'}</button>`
    : `<button class="dj-next" id="ly-check" ${allPlaced() ? '' : 'disabled'}>Check</button>`;

  wireActions();
  paintPlay();
}

function score(){ return stemIds().filter(id => S.placed[id] === S.ex.answers[id]).length; }

/* ------------------------------------------------------------------ moves --- */
function place(id, role){
  if(S.checked) return;
  if(role) S.placed[id] = role; else delete S.placed[id];
  S.picked = null;
  render();
}

function pick(id){
  if(S.checked) return;
  S.picked = S.picked === id ? null : id;
  render();
}

function toggleSolo(id){
  if(!LayerAudio.playing){ $('ly-note').textContent = 'Press play first.'; return; }
  S.soloed = S.soloed === id ? null : id;
  LayerAudio.solo(S.soloed);
  $('ly-note').textContent = S.soloed
    ? `${LAYER_STEMS[S.soloed].name} alone — press it again for the full passage.`
    : '';
  render();
}

/* ---------------------------------------------------------------- wiring --- */
function wireActions(){
  const check = $('ly-check');
  if(check) check.onclick = () => { S.checked = true; S.picked = null; render(); };
  const reveal = $('ly-reveal');
  if(reveal) reveal.onclick = () => { S.placed = { ...S.ex.answers }; render(); };
  const next = $('ly-next');
  if(next) next.onclick = () => load((S.i + 1) % LAYER_EXERCISES.length);
}

function cardFrom(e){ const c = e.target.closest('.ly-card'); return c ? c.dataset.id : null; }

document.addEventListener('click', e => {
  const soloBtn = e.target.closest('.ly-solo');
  if(soloBtn){ e.stopPropagation(); toggleSolo(soloBtn.dataset.solo); return; }

  const card = e.target.closest('.ly-card');
  const zone = e.target.closest('.ly-zone');
  const tray = e.target.closest('.ly-tray');

  /* A card in hand changes what a click means, and the zone has to win over
     the cards sitting in it: once a zone has one instrument in it, its cards
     cover most of its area, and clicking there obviously means "put it with
     those" rather than "pick that one up instead". */
  if(S.picked){
    if(card && card.dataset.id === S.picked){ pick(S.picked); return; }   // put it back down
    if(zone){ place(S.picked, zone.dataset.role); return; }
    if(tray && !card){ place(S.picked, null); return; }                   // empty tray space
  }

  if(card){ pick(card.dataset.id); return; }                              // pick up, or swap
});

/* keyboard: pick a card up with Enter, then 1, 2 or 3 to drop it in a zone */
document.addEventListener('keydown', e => {
  const onCard = e.target.closest && e.target.closest('.ly-card');
  if(onCard && (e.key === 'Enter' || e.code === 'Space')){
    e.preventDefault(); pick(onCard.dataset.id); return;
  }
  if(S.picked && /^[1-3]$/.test(e.key)){
    const r = LAYER_ROLES[+e.key - 1];
    if(r){ e.preventDefault(); place(S.picked, r.id); }
    return;
  }
  if(e.key === 'Escape' && S.picked){ S.picked = null; render(); return; }
  if(e.code === 'Space' && !onCard && !(e.target.closest && e.target.closest('button, a'))){
    e.preventDefault(); playPassage();
  }
});

/* native drag and drop for the mouse; the click path above covers touch, where
   HTML5 drag events never fire at all */
document.addEventListener('dragstart', e => {
  const id = cardFrom(e);
  if(!id || S.checked){ e.preventDefault(); return; }
  S.picked = id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', id);
  e.target.closest('.ly-card').classList.add('is-dragging');
});
document.addEventListener('dragend', e => {
  const c = e.target.closest && e.target.closest('.ly-card');
  if(c) c.classList.remove('is-dragging');
  document.querySelectorAll('.is-over').forEach(el => el.classList.remove('is-over'));
});
document.addEventListener('dragover', e => {
  const t = e.target.closest('.ly-zone, .ly-tray');
  if(!t || S.checked) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.is-over').forEach(el => { if(el !== t) el.classList.remove('is-over'); });
  t.classList.add('is-over');
});
document.addEventListener('drop', e => {
  const t = e.target.closest('.ly-zone, .ly-tray');
  if(!t || S.checked) return;
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain') || S.picked;
  if(id) place(id, t.classList.contains('ly-zone') ? t.dataset.role : null);
});

/* -------------------------------------------------------------- transport --- */
function paintPlay(){
  const el = $('ly-play');
  const on = LayerAudio.playing;
  el.dataset.state = LayerAudio.loading ? 'loading' : (on ? 'playing' : 'idle');
  $('ly-play-lbl').textContent = LayerAudio.loading ? 'Loading' : (on ? 'Stop' : (S.heard ? 'Replay' : 'Play'));
  el.setAttribute('aria-label', on ? 'Stop' : 'Play the passage');
  if(LayerAudio.error) $('ly-note').textContent = LayerAudio.error;
}

async function playPassage(){
  if(LayerAudio.playing){ LayerAudio.stop(); S.soloed = null; render(); return; }
  const ex = S.ex;
  $('ly-note').textContent = 'Decoding the passage…';
  const ok = await LayerAudio.play(stemIds(), exStart(), exDur(), null);
  if(S.ex !== ex) return;
  if(!ok){ $('ly-note').textContent = LayerAudio.error || ''; return; }
  S.heard = true;
  S.soloed = null;
  $('ly-note').textContent = 'Loops until you stop it. Tap the bars on a card to hear that one alone.';
  render();
}

/* ------------------------------------------------------------------ load --- */
function load(i){
  LayerAudio.stop();
  S.i = i;
  S.ex = LAYER_EXERCISES[i];
  S.placed = {};
  S.picked = null;
  S.soloed = null;
  S.checked = false;
  S.heard = false;
  $('ly-note').textContent = '';
  render();
}

LayerAudio.onstate = paintPlay;
$('ly-play').onclick = playPassage;
window.addEventListener('scroll', () => {
  $('atl-nav').classList.toggle('is-stuck', window.scrollY > 20);
}, { passive:true });

load(0);
