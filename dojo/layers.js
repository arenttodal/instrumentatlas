/* ============================================================================
   EAR TRAINING · LAYERS
   ----------------------------------------------------------------------------
   Loads after atlas-data.js, themes.js and layers-data.js, all deferred.

   A real passage plays with four or five parts at once; you drag each one into
   the job it is doing. Being told you are wrong means the material disagrees
   with you, not that a quiz was written to: a theme exercise reads each part's
   role straight out of themes.js, and a Valley Sunrise one reads the piece's
   own annotations.

   A CARD IS NOT ALWAYS A CLIP. Theme 5's horn and tuba are one gesture and are
   never used apart, so they arrive as one card playing two clips — which is
   also why the mix is built with setGains rather than the engine's solo(),
   since solo() raises exactly one clip.

   Two parts: the audio, then the board.
   ============================================================================ */

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = id => document.getElementById(id);
const roleOf = id => LAYER_ROLES.find(r => r.id === id);

/* ============================================================================
   1. AUDIO
   ----------------------------------------------------------------------------
   The shared engine from audio.js, with the two settings this mode needs.

   32 kHz, as the score view uses: twelve stems of this piece decode to 553 MB
   at 48 kHz, and that constraint is what the whole score view was built around.

   And `cut`, which copies the decoded buffer down to the exercise's bars and
   drops the full one — a section is ten to sixteen seconds of a 113-second
   piece, so a five-stem exercise holds about 20 MB instead of 145 MB.
   ============================================================================ */

const LayerAudio = makeDojoAudio({ srcOf: layerSrc, sampleRate:32000, cacheMax:16 });

/* ============================================================================
   2. THE BOARD
   ============================================================================ */

const S = {
  i:        0,        // which exercise
  ex:       null,
  items:    [],       // the cards: {id, name, icon, clips[], role, gain}
  placed:   {},       // card id -> roleId, or undefined while it is in the tray
  picked:   null,     // the card waiting for a zone, on the click/tap path
  soloed:   null,
  checked:  false,
  heard:    false
};

const stemIds  = () => S.items.map(it => it.id);
const itemOf   = id => S.items.find(it => it.id === id);
const answerOf = id => itemOf(id).role;
const exStart  = () => barTime(S.ex.from);
const exDur    = () => barTime(S.ex.to) - barTime(S.ex.from);
const allPlaced = () => stemIds().every(id => S.placed[id]);

/* ------------------------------------------------------------------ cards ---
   One shape for both kinds of exercise. A theme exercise's roles come from the
   parts themselves; a Valley Sunrise one's from its answer key. */
function buildItems(ex){
  if(!ex.theme) return Object.keys(ex.answers).map(id => ({
    id, name:LAYER_STEMS[id].name, icon:layerStemIcon(id),
    clips:[id], role:ex.answers[id], gain:1
  }));
  const t = themeById(ex.theme);
  const seen = new Set(), out = [];
  ex.use.forEach(file => {
    const p = t.parts.find(x => x.file === file);
    if(!p) return;
    const group = p.pair ? t.parts.filter(x => x.pair === p.pair) : [p];
    const key = p.pair ? 'pair-' + p.pair : partId(p);
    if(seen.has(key)) return;
    seen.add(key);
    out.push({
      id:key, name:group.map(partName).join(' & '), icon:layerPartIcon(p),
      clips:group.map(x => themeClip(t.id, x.file)), role:p.role, gain:THEME_GAIN[p.role]
    });
  });
  return out;
}

/* The mix, as a gains map. With nothing soloed every card sits at its role's
   level, which is what puts the balance back after each part was normalised on
   its own; with one soloed it comes up to full and the rest go to zero. */
function mixMap(soloed){
  const m = {};
  S.items.forEach(it => it.clips.forEach(c => {
    m[c] = soloed ? (it.id === soloed ? 1 : 0) : it.gain;
  }));
  return m;
}

/* ------------------------------------------------------------------ cards --- */
function cardHTML(id){
  const st = itemOf(id);
  const verdict = !S.checked ? '' :
    (S.placed[id] === st.role ? ' is-right' : ' is-wrong');
  const picked = S.picked === id ? ' is-picked' : '';
  const solo   = S.soloed === id ? ' is-solo' : '';
  return `<div class="ly-card${verdict}${picked}${solo}" data-id="${esc(id)}"
       draggable="${!S.checked}" tabindex="0" role="button"
       aria-pressed="${S.picked === id}"
       aria-label="${esc(st.name)}${S.placed[id] ? ', in ' + roleOf(S.placed[id]).name : ''}">
    <div class="ly-card-art">${st.icon}</div>
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
  $('ly-eyebrow').textContent = ex.from
    ? `Layers · ${ex.section} · bars ${ex.from}–${ex.to - 1}`
    : `Layers · ${ex.section}`;
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

function score(){ return stemIds().filter(id => S.placed[id] === answerOf(id)).length; }

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
  LayerAudio.setGains(mixMap(S.soloed), 0.03);
  $('ly-note').textContent = S.soloed
    ? `${itemOf(S.soloed).name} alone — press it again for the full passage.`
    : '';
  render();
}

/* ---------------------------------------------------------------- wiring --- */
function wireActions(){
  const check = $('ly-check');
  if(check) check.onclick = () => { S.checked = true; S.picked = null; render(); };
  const reveal = $('ly-reveal');
  if(reveal) reveal.onclick = () => {
    S.placed = {}; S.items.forEach(it => S.placed[it.id] = it.role); render();
  };
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
  const o = { loop:true, gains:mixMap(null) };
  if(ex.from) o.cut = { start:exStart(), dur:exDur() };
  const ok = await LayerAudio.play(S.items.flatMap(it => it.clips), o);
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
  S.items = buildItems(S.ex);
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
