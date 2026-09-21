/* ============================================================================
   EAR TRAINING · BLEND
   ----------------------------------------------------------------------------
   Loads after atlas-data.js, themes.js, dojo-data.js (for CONFUSIONS),
   audio.js and blend-data.js, all deferred.

   Which instruments do you hear? You answer by lighting up cards in a grid
   grouped by family; what you pick lifts into a band above it. Three levels:
   a handful of candidates, the whole orchestra, or the whole orchestra plus
   where each one sits against the others.

   Two things this mode asks of the shared engine that the others did not:

   The A/B compares two MIXES, not two clips. Every render either mix needs is
   started at one scheduled time and the switch is setGains across the union,
   so an instrument in both simply holds its level and never dips. With a
   multi-select answer that becomes genuinely useful — the comparison is what
   was playing against what you said you heard, and the difference you hear is
   exactly your misses and your false alarms.

   And the pool is bigger than the passage. A level-2 grid offers twenty cards
   over a nine-instrument passage; an instrument you picked that this passage
   cannot play has no audio and is marked as such rather than given an invented
   part.

   Each question draws a theme from BLEND_PASSAGES and takes its MELODY parts —
   the countermelody and chord parts of a theme belong to Layers, because "an
   octave above" only means something between parts playing the same line. Every
   clip id is "<theme>/<file>", so the engine's buffer cache cannot confuse
   theme 3's flute with theme 2's.
   ============================================================================ */

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = id => document.getElementById(id);

const BlendAudio = makeDojoAudio({ srcOf: themeSrc, cacheMax: 12 });

const LEVEL_KEY = 'dojo-blend-level';

const S = {
  level:   2,
  q:       null,     // {passage, sounding:[render], pool:[ids]}
  picked:  {},       // instrument -> tier id, or true at levels 1 and 2
  phase:   'asking', // asking · marked
  heard:   false,
  asked:   0, correct: 0, streak: 0,
  recent:  [],       // the instruments of the last few questions, newest first
  held:    null,     // level 3 only: the card in hand, on the tap path
  ab:      null      // {on:'heard'|'picked', ready}
};

const pick   = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };
const level  = () => BLEND_LEVELS.find(l => l.id === S.level);
const tiered = () => !!level().tiers;

/* ------------------------------------------------------------- questions --- */
/* Two to four instruments of one passage, at most one render each. Two things
   have to hold, and they hold at every level because the level can be changed
   mid-question:

   the set has to SAY something about octaves — at least two renders that state
   one, at two different octaves — or level 3 has nothing to arrange; and it has
   to FIT the three rows, which themes 3 and 4 can break on their own, since
   their flute sits two octaves over the line and their cello one under it. */
function arrangeable(set){
  const g = set.filter(r => !r.free).map(r => r.offset);
  return g.length > 1 && new Set(g).size > 1 &&
         Math.max(...g) - Math.min(...g) <= BLEND_SPAN;
}

/* How far back an instrument still counts as just-asked. */
const RECALL = 2;

/* The theme never repeats twice running, and it is weighted by how much it has
   to offer. Theme 2 can build a question out of nine instruments; theme 5 has
   three melody parts and only one of them sits at a different octave, so every
   question it can possibly ask contains its clarinet. Drawing the four evenly
   would make a quarter of all questions contain that clarinet. */
const PASSAGE_POOL = BLEND_PASSAGES.flatMap(t => {
  const n = new Set(partsOf(t, 'melody').map(p => p.instrument)).size;
  return Array(Math.max(1, Math.round(n / 3))).fill(t);
});
let lastPassage = null;
function nextPassage(){
  const pool = PASSAGE_POOL.filter(t => t !== lastPassage);
  return (lastPassage = pick(pool.length ? pool : PASSAGE_POOL));
}

function buildQuestion(){
  const passage = nextPassage();
  const renders = partsOf(passage, 'melody');
  const byInstrument = {};
  renders.forEach(r => (byInstrument[r.instrument] = byInstrument[r.instrument] || []).push(r));
  const names = Object.keys(byInstrument);

  /* Four questions running on the same clarinet, bassoon and flute is not four
     questions. Candidates are scored against what has just been asked and the
     least repetitive one wins. A theme with few melody instruments cannot
     always avoid an overlap, which is the other half of why the theme
     rotates. */
  const recent = new Set(S.recent.flat());
  let sounding = null, best = Infinity;
  for(let tries = 0; tries < 240; tries++){
    const take = shuffle([...names]).slice(0, 2 + ((Math.random() * 3) | 0));
    const set = take.map(n => pick(byInstrument[n]));
    if(!arrangeable(set)) continue;
    const seen = take.filter(n => recent.has(n)).length;
    if(seen < best){ sounding = set; best = seen; if(!seen) break; }
  }
  if(!sounding){            // exhaustive fallback: the first pair an octave apart
    const g = renders.filter(r => !r.free);
    for(const a of g){
      const b = g.find(x => x.instrument !== a.instrument && Math.abs(x.offset - a.offset) === 1);
      if(b){ sounding = [a, b]; break; }
    }
  }
  S.recent = [sounding.map(r => r.instrument), ...S.recent].slice(0, RECALL);
  return { passage, sounding, pool: buildPool(passage, sounding) };
}

/* Level 1 is the sounding instruments plus decoys, and the decoys come from
   CONFUSIONS — the table belts uses — so a flute pulls piccolo and clarinet
   into the grid and never pulls timpani. Levels 2 and 3 are every instrument
   of every family this passage draws on. */
function buildPool(passage, sounding){
  const heard = sounding.map(r => r.instrument);
  if(level().pool === 'all'){
    return FAMILIES.filter(f => passage.families.includes(f.id))
                   .flatMap(f => f.members);
  }
  const out = [...heard];
  const add = id => { if(!out.includes(id) && INSTRUMENTS[id]) out.push(id); };
  const rest = [...new Set(partsOf(passage, 'melody').map(r => r.instrument))];
  shuffle(heard.flatMap(h => (CONFUSIONS[h] || []))).forEach(id => { if(out.length < 6) add(id); });
  shuffle(rest).forEach(id => { if(out.length < 6) add(id); });
  return out;
}

const P         = () => S.q.passage;
const renderFor = id => S.q.sounding.find(r => r.instrument === id) || null;
const heardIds  = () => S.q.sounding.map(r => r.instrument);
/* What an instrument would sound like here, even when it is not in the answer —
   for the B side of the A/B. Of several renders take the one nearest the line as
   written, so a false alarm comes back in a plain register rather than a showy
   one. */
const anyRenderFor = id => partsOf(P(), 'melody')
  .filter(r => r.instrument === id)
  .sort((x, y) => Math.abs(x.offset) - Math.abs(y.offset))[0] || null;
const clipOf    = r => themeClip(P().id, r.file);

/* ------------------------------------------------------------------ tiers --- */
/* Three rows, checked as an arrangement rather than as absolute positions:
   a flute an octave over a horn is the same statement whether you put them in
   the top two rows or the bottom two. Both sides are shifted so their lowest
   used row is zero, then compared. */
function normalise(map){
  const vals = Object.values(map);
  if(!vals.length) return {};
  const lo = Math.min(...vals);
  const out = {};
  for(const k in map) out[k] = map[k] - lo;
  return out;
}
const tierIndex = id => BLEND_TIERS.findIndex(t => t.id === id);

/* ---------------------------------------------------------------- verdict --- */
function verdict(){
  const heard = heardIds();
  const chosen = Object.keys(S.picked);
  const hits = chosen.filter(i => heard.includes(i));
  const missed = heard.filter(i => !chosen.includes(i));
  const extra = chosen.filter(i => !heard.includes(i));

  /* a free render plays its own figure rather than doubling the line, so it
     states no octave against the rest and level 3 takes it in any row */
  let placed = null, graded = [];
  if(tiered()){
    graded = hits.filter(i => !renderFor(i).free);
    const mine = {}, real = {};
    graded.forEach(i => { mine[i] = -tierIndex(S.picked[i]); real[i] = renderFor(i).offset; });
    const a = normalise(mine), b = normalise(real);
    placed = graded.filter(i => a[i] === b[i]);
  }
  const right = !missed.length && !extra.length &&
                (!tiered() || placed.length === graded.length);
  return { heard, hits, missed, extra, placed, graded, right };
}

function verdictFor(id){
  if(S.phase !== 'marked') return '';
  const v = verdict();
  if(v.extra.includes(id)) return 'is-wrong';
  if(v.missed.includes(id)) return 'is-missed';
  if(v.hits.includes(id)) return (tiered() && v.graded.includes(id) && !v.placed.includes(id)) ? 'is-misplaced' : 'is-right';
  return '';
}

/* ------------------------------------------------------------------- view --- */
const HEAR_ICON = `<span class="dj-hear" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
  <path d="M3 6.4v3.2M6.3 3.8v8.4M9.7 5.6v4.8M13 7.2v1.6"/></svg></span>`;

function cardHTML(id, where){
  const v = verdictFor(id);
  const dead = S.phase === 'marked' || (!S.heard && where === 'pool');
  const held = S.held === id && where === 'heard';
  return `<button class="bl-card${v ? ' ' + v : ''}${held ? ' is-held' : ''}" data-id="${esc(id)}" data-where="${where}"
            draggable="${!dead}"
            ${dead ? 'disabled' : ''} aria-pressed="${!!S.picked[id]}" ${held ? 'aria-grabbed="true"' : ''}
            aria-label="${esc(blendName(id))}${S.picked[id] ? ', selected' : ''}">
    <span class="bl-card-art">${blendIcon(id)}</span>
    <b>${esc(blendName(id))}</b>
  </button>`;
}

function paintHeard(){
  const chosen = Object.keys(S.picked);
  if(!tiered()){
    $('bl-heard').innerHTML = `<div class="bl-band" data-drop="mid">${
      chosen.length ? chosen.map(id => cardHTML(id, 'heard')).join('')
                    : `<p class="bl-band-empty">Click what you hear</p>`}</div>`;
    return;
  }
  $('bl-heard').innerHTML = BLEND_TIERS.map(t => {
    const inTier = chosen.filter(id => S.picked[id] === t.id);
    return `<div class="bl-tier${S.held ? ' is-target' : ''}" data-drop="${esc(t.id)}">
      <span class="bl-tier-name">${esc(t.name)}</span>
      <div class="bl-band">${inTier.map(id => cardHTML(id, 'heard')).join('')}</div>
    </div>`;
  }).join('');
}

function paintPool(){
  const chosen = Object.keys(S.picked);
  const fams = FAMILIES.filter(f => P().families.includes(f.id))
                       .filter(f => f.members.some(m => S.q.pool.includes(m)));
  $('bl-pool').innerHTML = fams.map(f => {
    const members = f.members.filter(m => S.q.pool.includes(m) && !chosen.includes(m));
    return `<div class="bl-fam" style="--fam:${STUDIO_FAM[f.id] || '#8FB4E0'}">
      <span class="bl-fam-name">${esc(f.name)}</span>
      <div class="bl-fam-row">${members.map(id => cardHTML(id, 'pool')).join('') ||
        `<span class="bl-fam-empty">all chosen</span>`}</div>
    </div>`;
  }).join('');
}

function paintChrome(){
  const n = S.q.sounding.length;
  $('bl-eyebrow').textContent = S.streak > 1
    ? `Blend · ${P().title} · ${S.streak} in a row`
    : `Blend · ${P().title}`;
  $('bl-score').innerHTML = S.asked
    ? `<b>${S.correct}</b><span>/${S.asked}</span><i>${Math.round(100 * S.correct / S.asked)}%</i>`
    : '';
  $('bl-level-label').textContent = level().name;
  if(S.phase === 'asking'){
    $('bl-display').textContent = 'Which instruments do you hear?';
    delete $('bl-display').dataset.state;
  } else {
    const v = verdict();
    /* naming everything and then stacking it wrong is its own result, and it is
       not "3 of 3" — that reads like a pass */
    const named = !v.missed.length && !v.extra.length;
    $('bl-display').innerHTML =
      `<span class="dj-mark" data-v="${v.right ? 'right' : 'wrong'}"></span>` +
      esc(v.right  ? (tiered() ? 'All of them, in the right order' : 'All of them')
        : named    ? 'The right instruments, out of order'
                   : `${v.hits.length} of ${v.heard.length}`);
    $('bl-display').dataset.state = v.right ? 'right' : 'wrong';
  }
  $('bl-count').textContent = S.phase === 'asking' && S.heard
    ? `${n} instrument${n > 1 ? 's' : ''} playing`
    : '';
}

function paintActions(){
  const ready = Object.keys(S.picked).length > 0;
  if(S.phase === 'asking'){
    $('bl-actions').innerHTML = `<button class="dj-next" id="bl-check" ${S.heard && ready ? '' : 'disabled'}>Check</button>`;
    $('bl-check').onclick = check;
    $('bl-note').innerHTML = '&nbsp;';
    $('bl-note').classList.add('is-ghost');
    return;
  }
  const v = verdict();
  $('bl-actions').innerHTML = `<button class="dj-next" id="bl-next">Next</button>`;
  $('bl-next').onclick = next;
  /* An instrument this passage cannot play at all is a different miss from one
     that simply was not in it, and saying so belongs on this line rather than
     in the comparison row — that row holds two buttons and a fixed height, and
     a sentence appearing inside it pushed everything below down by a line at
     the exact moment of answering. */
  const bits = [];
  const absent = v.extra.filter(id => !anyRenderFor(id));
  const wrong  = v.extra.filter(id =>  anyRenderFor(id));
  if(v.missed.length) bits.push(`missed ${v.missed.map(blendName).join(', ')}`);
  if(wrong.length)  bits.push(`${wrong.map(blendName).join(', ')} ${wrong.length > 1 ? 'were' : 'was'} not there`);
  if(absent.length) bits.push(`${absent.map(blendName).join(', ')} ${absent.length > 1 ? 'are' : 'is'} not in this passage`);
  if(tiered() && v.placed && v.placed.length < v.graded.length)
    bits.push(`${v.graded.filter(i => !v.placed.includes(i)).map(blendName).join(', ')} in the wrong register`);
  $('bl-note').innerHTML = bits.length ? esc(bits.join(' · ')) : '&nbsp;';
  $('bl-note').classList.toggle('is-ghost', !bits.length);
}

function render(){ paintChrome(); paintHeard(); paintPool(); paintActions(); paintAB(); paintPlay(); }

/* ------------------------------------------------------------- selecting --- */
function choose(id, tier){
  if(S.phase !== 'asking' || !S.heard) return;
  if(S.picked[id] && (!tiered() || S.picked[id] === tier || !tier)) delete S.picked[id];
  else S.picked[id] = tiered() ? (tier || 'mid') : true;
  S.held = null;
  render();
}

/* Level 3 has to be operable by thumb, and HTML5 drag events never fire on
   touch at all — so a tap lifts the card, a tap on a row drops it there, and a
   second tap on the card itself takes it back out of the answer. The same two
   taps at levels 1 and 2 are just select and deselect, because there is nowhere
   to put anything. The Layers tray works this way; so does this. */
let heardClick = null;
$('bl-heard').addEventListener('click', e => {
  heardClick = e;
  const row = e.target.closest('[data-drop]');
  const c = e.target.closest('.bl-card');
  if(S.phase !== 'asking' || !S.heard) return;
  if(!tiered()){ if(c && !c.disabled) choose(c.dataset.id, null); return; }

  if(S.held){
    if(c && c.dataset.id === S.held){ choose(S.held, null); return; }   // out of the answer
    if(row){ S.picked[S.held] = row.dataset.drop; S.held = null; render(); return; }
  }
  if(c && !c.disabled){ S.held = c.dataset.id; render(); }
});
$('bl-pool').addEventListener('click', e => {
  const c = e.target.closest('.bl-card');
  if(!c || c.disabled) return;
  S.held = null;
  choose(c.dataset.id, tiered() ? 'mid' : null);
});
/* Clicking away puts the card back down where it was. It cannot ask the event
   where it landed: the handler above has already re-rendered #bl-heard, so the
   card the click started on is detached and closest() walks to nothing. The
   event itself is the identity that survives that. */
document.addEventListener('click', e => {
  if(e === heardClick) return;
  if(S.held){ S.held = null; render(); }
});

/* ---------------------------------------------------------------- drag ---
   Dragging is a way of ANSWERING, not just of rearranging: a card goes from the
   grid straight into the row it belongs in, at every level. At levels 1 and 2
   there is one row and dropping in it means "I hear this"; at level 3 there are
   three and the row you drop in is your answer about its octave. Dropping back
   on the grid takes it out again.

   Clicking still works and still means the same thing — at level 3 a click puts
   the card in the middle row, which you can then drag off. The tap path in
   #bl-heard covers touch, where none of these events fire at all. */
let dragging = null;
const clearOver = () => document.querySelectorAll('.is-over').forEach(el => el.classList.remove('is-over'));

function drop(id, target){
  if(S.phase !== 'asking' || !S.heard || !id) return;
  if(target === null) delete S.picked[id];
  else S.picked[id] = tiered() ? target : true;
  S.held = null;
  render();
}

document.addEventListener('dragstart', e => {
  const c = e.target.closest && e.target.closest('.bl-card');
  if(!c || c.disabled || S.phase !== 'asking' || !S.heard){ if(e.preventDefault) e.preventDefault(); return; }
  dragging = c.dataset.id;
  c.classList.add('is-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragging);
});
document.addEventListener('dragover', e => {
  if(!dragging) return;
  const t = e.target.closest && e.target.closest('[data-drop], #bl-pool');
  if(!t) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  clearOver();
  (t.closest('.bl-tier') || t).classList.add('is-over');
});
document.addEventListener('drop', e => {
  const t = e.target.closest && e.target.closest('[data-drop], #bl-pool');
  clearOver();
  if(!t || !dragging) return;
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain') || dragging;
  drop(id, t.id === 'bl-pool' ? null : t.dataset.drop);
  dragging = null;
});
document.addEventListener('dragend', () => {
  dragging = null;
  clearOver();
  document.querySelectorAll('.is-dragging').forEach(el => el.classList.remove('is-dragging'));
});

/* -------------------------------------------------------------- transport --- */
function paintPlay(){
  const el = $('bl-play');
  const on = BlendAudio.playing;
  el.dataset.state = BlendAudio.loading ? 'loading' : (on ? 'playing' : 'idle');
  $('bl-play-lbl').textContent = BlendAudio.loading ? 'Loading' : (on ? 'Stop' : (S.heard ? 'Replay' : 'Play'));
  el.setAttribute('aria-label', on ? 'Stop' : 'Play the passage');
  $('bl-meter').toggleAttribute('data-idle', S.phase !== 'asking');
}

let lastBar = -1;
function frame(){
  const f = BlendAudio.playing && BlendAudio.duration ? BlendAudio.position() / BlendAudio.duration : 0;
  const q = Math.round(f * 400);
  if(q !== lastBar){ lastBar = q; $('bl-fill').style.transform = `scaleX(${f})`; }
  requestAnimationFrame(frame);
}

async function playQuestion(){
  if(BlendAudio.playing){ BlendAudio.stop(); render(); return; }
  const q = S.q;
  /* Once the question is marked this button is the comparison's transport: it
     brings the whole union back on the side you left the toggle, rather than
     replaying the question and leaving the toggle pointing at a mix that no
     longer has any nodes. */
  const ab = S.phase === 'marked' && S.ab && S.ab.mix ? S.ab : null;
  const ids = ab ? [...new Set([...ab.mix.heard, ...ab.mix.picked])]
                 : q.sounding.map(r => themeClip(q.passage.id, r.file));
  const o = { loop:true };
  if(ab){ o.gains = {}; ids.forEach(f => o.gains[f] = ab.mix[ab.on].includes(f) ? 1 : 0); }
  const ok = await BlendAudio.play(ids, o);
  if(S.q !== q || !ok) return;
  S.heard = true;
  render();
}

/* ⭐ the A/B: what was playing against what you said you heard */
function pickedMix(){
  return Object.keys(S.picked).map(id => {
    const r = renderFor(id) || anyRenderFor(id);
    return r ? clipOf(r) : null;
  }).filter(Boolean);
}

async function check(){
  S.phase = 'marked';
  S.asked++;
  const v = verdict();
  if(v.right){ S.correct++; S.streak++; } else S.streak = 0;
  S.ab = { on:'heard', ready:false };
  render();

  const A = S.q.sounding.map(clipOf);
  const B = pickedMix();
  const union = [...new Set([...A, ...B])];
  const gains = {}; union.forEach(f => gains[f] = A.includes(f) ? 1 : 0);
  const ab = S.ab;
  /* The passage does not restart to be marked. Whatever you are hearing keeps
     running and the clips you did not hear are brought in underneath it,
     silent, in phase — so the answer arrives without a seam and the switch
     afterwards is nothing but a gain ramp. */
  const ok = await BlendAudio.extend(union, { loop:true, gains });
  if(S.ab !== ab || !ok) return;
  ab.ready = true;
  ab.mix = { heard:A, picked:B };
  render();
}

function setAB(side){
  if(!abLive() || S.ab.on === side) return;
  S.ab.on = side;
  const gains = {};
  S.ab.mix[side].forEach(f => gains[f] = 1);
  BlendAudio.setGains(gains);
  /* in place, never a rebuild: the button you just pressed keeps focus, so the
     arrow keys keep working and nothing under the pointer is replaced */
  markAB(); syncAB(); paintMix();
}

/* the comparison is usable only while it is ready AND something is sounding */
const abLive = () => !!(S.ab && S.ab.ready && S.ab.mix && BlendAudio.playing);

/* which instruments are audible right now — the cards of the rest go quiet, so
   the difference between the two mixes can be seen as well as heard */
function soundingNow(){
  if(S.phase !== 'marked' || !S.ab || !S.ab.mix) return null;
  const files = new Set(S.ab.mix[S.ab.on]);
  const ids = new Set();
  [...heardIds(), ...Object.keys(S.picked)].forEach(id => {
    const r = renderFor(id) || anyRenderFor(id);
    if(r && files.has(clipOf(r))) ids.add(id);
  });
  return ids;
}
function paintMix(){
  const now = BlendAudio.playing ? soundingNow() : null;
  document.querySelectorAll('.bl-card').forEach(c => {
    c.classList.toggle('is-quiet',
      !!now && /is-(right|wrong|missed|misplaced)/.test(c.className) && !now.has(c.dataset.id));
  });
}
function markAB(){
  $('bl-ab').querySelectorAll('.bl-ab-btn').forEach(b => {
    const on = b.dataset.side === S.ab.on;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}
/* A dead control that still lights up is worse than a disabled one. The
   comparison goes flat while its clips are still decoding, and again the moment
   the transport is stopped — press play and it comes back on the side you left
   it. */
function syncAB(){
  const row = $('bl-ab');
  if(!row.children.length) return;
  const live = abLive();
  row.dataset.state = !S.ab ? '' : !S.ab.ready ? 'loading' : live ? 'live' : 'paused';
  row.querySelectorAll('.bl-ab-btn').forEach(b => {
    b.disabled = !live || (b.dataset.side === 'picked' && !S.ab.mix.picked.length);
  });
}

function paintAB(){
  if(S.phase !== 'marked' || !S.ab){ $('bl-ab').innerHTML = ''; return; }
  $('bl-ab').innerHTML = `
    <button class="bl-ab-btn${S.ab.on === 'heard' ? ' is-on' : ''}" data-side="heard"
      aria-pressed="${S.ab.on === 'heard'}">What was playing${HEAR_ICON}</button>
    <button class="bl-ab-btn${S.ab.on === 'picked' ? ' is-on' : ''}" data-side="picked"
      aria-pressed="${S.ab.on === 'picked'}"
      >What you picked${HEAR_ICON}</button>`;
  $('bl-ab').querySelectorAll('.bl-ab-btn').forEach(b => {
    b.onclick = () => setAB(b.dataset.side);
  });
  syncAB();
  paintMix();
}

/* ------------------------------------------------------------------ level --- */
function setLevel(n, keep){
  S.level = n;
  try { localStorage.setItem(LEVEL_KEY, String(n)); } catch(_){}
  /* The pool changes with the level, so it is rebuilt — but the audio is not
     touched and the selection is not thrown away. Anything you picked that the
     new pool still offers stays picked; at level 3 a selection with no row yet
     lands on "as written". */
  if(S.q){
    S.q.pool = buildPool(P(), S.q.sounding);
    const kept = {};
    Object.keys(keep || S.picked).forEach(id => {
      if(S.q.pool.includes(id)) kept[id] = tiered() ? ((keep || S.picked)[id] === true ? 'mid' : (keep || S.picked)[id]) : true;
    });
    S.picked = kept;
  }
  if(S.phase === 'marked') next();   // it was marked against a different question
  else render();
}

(function wireLevel(){
  const wrap = $('bl-level'), btn = $('bl-level-btn'), menu = $('bl-level-menu');
  menu.innerHTML = BLEND_LEVELS.map(l => `<a class="ev-item" role="menuitem" tabindex="-1"
      href="#" data-level="${l.id}"><span class="ev-item-name">${esc(l.name)}</span>
      <span class="bl-level-note">${esc(l.note)}</span></a>`).join('');
  const items = () => [...menu.querySelectorAll('.ev-item')];
  const mark = () => items().forEach(a => a.toggleAttribute('data-active', +a.dataset.level === S.level));
  let open = false;
  const place = () => {
    const r = btn.getBoundingClientRect();
    menu.style.top = Math.round(r.bottom + 10) + 'px';
    menu.style.left = Math.round(Math.max(8, Math.min(r.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 8))) + 'px';
  };
  const show = (on, focusFirst) => {
    open = on; menu.hidden = !on;
    wrap.dataset.open = on ? '1' : '0';
    btn.setAttribute('aria-expanded', String(on));
    if(on){ mark(); place(); if(focusFirst) items()[0].focus();
            addEventListener('resize', place); addEventListener('scroll', place, true); }
    else { removeEventListener('resize', place); removeEventListener('scroll', place, true); }
  };
  btn.onclick = e => { e.stopPropagation(); show(!open, false); };
  btn.addEventListener('keydown', e => {
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if(!open) show(true, true); }
  });
  menu.addEventListener('keydown', e => {
    const i = items(), at = i.indexOf(document.activeElement);
    if(e.key === 'ArrowDown'){ e.preventDefault(); i[(at + 1) % i.length].focus(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); i[(at - 1 + i.length) % i.length].focus(); }
    else if(e.key === 'Home'){ e.preventDefault(); i[0].focus(); }
    else if(e.key === 'End'){ e.preventDefault(); i[i.length - 1].focus(); }
    else if(e.key === 'Escape'){ e.preventDefault(); show(false); btn.focus(); }
    else if(e.key === 'Tab'){ show(false); }
  });
  menu.addEventListener('click', e => {
    const a = e.target.closest('.ev-item');
    if(!a) return;
    e.preventDefault();
    show(false); btn.focus();
    if(+a.dataset.level !== S.level) setLevel(+a.dataset.level);
  });
  document.addEventListener('click', e => { if(open && !wrap.contains(e.target)) show(false); });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && open && !menu.contains(document.activeElement)){ show(false); btn.focus(); }
  });
})();

/* ------------------------------------------------------------------- loop --- */
function next(){
  BlendAudio.stop();
  S.phase = 'asking';
  S.picked = {};
  S.heard = false;
  S.held = null;
  S.ab = null;
  S.q = buildQuestion();
  $('bl-fill').style.transform = 'scaleX(0)';
  render();
}

BlendAudio.onstate = () => { paintPlay(); syncAB(); paintMix(); };
$('bl-play').onclick = playQuestion;

document.addEventListener('keydown', e => {
  const onControl = !!(e.target.closest && e.target.closest('button, a'));
  if(e.code === 'Space'){
    if(onControl) return;
    e.preventDefault();
    if(S.phase === 'asking') playQuestion();
    return;
  }
  if(e.key === 'Enter' && S.phase === 'marked'){ if(onControl) return; e.preventDefault(); next(); return; }
  if(S.phase === 'marked' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
    e.preventDefault(); setAB(e.key === 'ArrowLeft' ? 'heard' : 'picked');
  }
  if(e.key === 'Escape' && S.held){ e.preventDefault(); S.held = null; render(); return; }
  /* at level 3, 1/2/3 move the card in hand, or the focused one */
  if(tiered() && S.phase === 'asking' && /^[1-3]$/.test(e.key)){
    const c = e.target.closest && e.target.closest('.bl-card');
    const id = S.held || (c && S.picked[c.dataset.id] ? c.dataset.id : null);
    if(id){ e.preventDefault(); S.picked[id] = BLEND_TIERS[+e.key - 1].id; S.held = null; render(); }
  }
});

window.addEventListener('scroll', () => {
  $('atl-nav').classList.toggle('is-stuck', window.scrollY > 20);
}, { passive:true });

try { const v = +localStorage.getItem(LEVEL_KEY); if(BLEND_LEVELS.some(l => l.id === v)) S.level = v; } catch(_){}
next();
requestAnimationFrame(frame);
