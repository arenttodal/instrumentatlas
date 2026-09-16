/* ============================================================================
   EAR TRAINING · BLEND
   ----------------------------------------------------------------------------
   Loads after atlas-data.js, audio.js and blend-data.js, all deferred.

   The horn has the tune. Something is doubling it an octave above, an octave
   below, both, or nothing is. A doubling that is doing its job is not
   separately audible, so this is not a naming question — you are being asked
   what the colour is made of.

   What this mode needed from the shared engine that the other two did not: the
   A/B compares two MIXES rather than two clips. Both mixes are started at one
   scheduled time and the switch is setGains over the union of them — so the
   horn, which is in both, simply stays at 1 and never dips. You hear the
   doubling arrive and leave over a horn that never moves, which is the only
   way to hear what a doubling actually does.
   ============================================================================ */

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = id => document.getElementById(id);

const BlendAudio = makeDojoAudio({ srcOf: blendSrc });

const S = {
  q:       null,     // {answer, sizes:{horn, cello}}
  picked:  null,
  phase:   'asking', // asking · right · wrong
  heard:   false,
  streak:  0,
  asked:   0,
  correct: 0,
  ab:      null      // {answer, picked, on, ready}
};

const RECENT = [];

/* ------------------------------------------------------------- questions --- */
const pick = a => a[Math.floor(Math.random() * a.length)];

function buildQuestion(){
  /* never the same answer twice running — with four of them a repeat reads as
     the app having got stuck rather than as a coincidence */
  let ans;
  do { ans = pick(BLEND_ANSWERS).id; } while(BLEND_ANSWERS.length > 1 && ans === RECENT[RECENT.length - 1]);
  RECENT.push(ans);
  if(RECENT.length > 2) RECENT.shift();
  return { answer: ans, sizes: { horn: pick(BLEND_SIZES.horn), cello: pick(BLEND_SIZES.cello) } };
}

/* the clips a given answer sounds like, under this question's scoring */
function mixFor(answerId, sizes){
  const a = blendAnswer(answerId);
  return [blendClip('horn', sizes.horn)].concat(
    a.adds.map(v => blendClip(v, v === 'cello' ? sizes.cello : '1')));
}

const sizeLabel = sizes => {
  const h = sizes.horn === '1' ? 'Solo horn' : `${sizes.horn} horns`;
  const needsCello = blendAnswer(S.q.answer).adds.includes('cello');
  return needsCello ? `${h} · ${sizes.cello === 'ens' ? 'cello section' : 'solo cello'}` : h;
};

/* ------------------------------------------------------------------ view --- */
const HEAR_ICON = `<span class="dj-hear" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
  <path d="M3 6.4v3.2M6.3 3.8v8.4M9.7 5.6v4.8M13 7.2v1.6"/></svg></span>`;

function display(text, state, mark){
  $('bl-display').innerHTML = (mark ? `<span class="dj-mark" data-v="${mark}"></span>` : '') + esc(text);
  if(state) $('bl-display').dataset.state = state; else delete $('bl-display').dataset.state;
}

function paintScore(){
  $('bl-score').innerHTML = S.asked
    ? `<b>${S.correct}</b><span>/${S.asked}</span><i>${Math.round(100 * S.correct / S.asked)}%</i>`
    : '';
  $('bl-eyebrow').textContent = S.streak > 1
    ? `Blend · Doubling · ${S.streak} in a row`
    : 'Blend · Doubling';
}

/* The three voices, drawn as the atlas draws them. Lit means in the mix you
   are hearing right now, so they follow the A/B rather than the answer. */
function paintScoring(){
  const asking = S.phase === 'asking';
  const live = asking ? null : mixFor(S.ab ? S.ab.on : S.q.answer, S.q.sizes);
  $('bl-scoring').innerHTML = ['flute','horn','cello'].map(v => {
    const on = !asking && live.some(c => c.startsWith(v + ':'));
    return `<span class="bl-voice" data-on="${on}" title="${esc(BLEND_VOICES[v].role)}">
      <span class="bl-voice-art">${blendIcon(v)}</span>
      <b>${esc(BLEND_VOICES[v].label)}</b></span>`;
  }).join('');
  $('bl-scoring').dataset.idle = asking ? '1' : '';
  $('bl-detail').textContent = asking ? '' : sizeLabel(S.q.sizes);
}

function paintOptions(){
  const locked = S.phase !== 'asking';
  const ab = (S.phase === 'wrong' && S.ab) ? S.ab : null;

  $('bl-options').innerHTML = BLEND_ANSWERS.map(a => {
    const state = !locked ? '' :
      a.id === S.q.answer ? ' is-right' :
      a.id === S.picked   ? ' is-wrong' : ' is-off';
    const isAB    = !!ab && (a.id === ab.answer || a.id === ab.picked);
    const hearing = isAB && ab.on === a.id;
    const dead    = locked ? !isAB : !S.heard;
    return `<button class="dj-opt${state}${isAB ? ' is-ab' : ''}${hearing ? ' is-hearing' : ''}"
              data-id="${esc(a.id)}"${dead ? ' disabled' : ''}${
              isAB ? ` aria-pressed="${hearing}" aria-label="Hear ${esc(a.name)}"` : ''
            }>${esc(a.name)}${isAB ? HEAR_ICON : ''}</button>`;
  }).join('');
  $('bl-options').dataset.waiting = (!S.heard && !locked) ? '1' : '';
  $('bl-meter').toggleAttribute('data-idle', locked);
}

/* Every phase renders the same rows, so answering moves nothing below the
   options — the same bargain as the belts mode. */
function resultRows(next, line){
  return (next
      ? `<button class="dj-next" id="bl-next">Next</button>`
      : `<span class="dj-next is-ghost" aria-hidden="true">Next</span>`)
    + `<p class="bl-note${line ? '' : ' is-ghost'}"${line ? '' : ' aria-hidden="true"'}>${
        line ? esc(line) : '&nbsp;'}</p>`;
}

function paintResult(){
  if(S.phase === 'asking'){ $('bl-result').innerHTML = resultRows(false, null); return; }
  const line = S.phase === 'wrong' ? blendNote(S.q.answer, S.picked) : blendAnswer(S.q.answer).note;
  $('bl-result').innerHTML = resultRows(true, line);
  $('bl-next').onclick = next;
  if(S.phase === 'right') $('bl-next').focus({ preventScroll:true });
}

function render(){ paintScore(); paintScoring(); paintOptions(); paintResult(); paintPlay(); }

/* -------------------------------------------------------------- transport --- */
function paintPlay(){
  const el = $('bl-play');
  const on = BlendAudio.playing;
  el.dataset.state = BlendAudio.loading ? 'loading' : (on ? 'playing' : 'idle');
  $('bl-play-lbl').textContent = BlendAudio.loading ? 'Loading' : (on ? 'Stop' : (S.heard ? 'Replay' : 'Play'));
  el.setAttribute('aria-label', on ? 'Stop' : 'Play the passage');
}

let lastBar = -1;
function frame(){
  const f = BlendAudio.playing && BlendAudio.duration
    ? BlendAudio.position() / BlendAudio.duration : 0;
  const q = Math.round(f * 400);
  if(q !== lastBar){ lastBar = q; $('bl-fill').style.transform = `scaleX(${f})`; }
  requestAnimationFrame(frame);
}

async function playQuestion(){
  if(BlendAudio.playing){ BlendAudio.stop(); return; }
  const q = S.q;
  const mix = mixFor(q.answer, q.sizes);
  const ok = await BlendAudio.play(mix, { loop:false });
  if(S.q !== q || !ok) return;          // Next was pressed while this was decoding
  S.heard = true;
  render();
}

/* ---------------------------------------------------------------- answer --- */
function answer(id){
  if(S.phase !== 'asking' || !S.heard) return;
  S.picked = id;
  const right = id === S.q.answer;
  S.phase = right ? 'right' : 'wrong';
  S.asked++;
  if(right){ S.correct++; S.streak++; } else S.streak = 0;

  display(blendAnswer(S.q.answer).name, S.phase, right ? 'right' : 'wrong');
  if(!right) S.ab = { answer:S.q.answer, picked:id, on:S.q.answer, ready:false };
  render();
  if(!right) startAB();
}

/* ⭐ The A/B, over two MIXES. Every clip either mix needs is started at one
   scheduled time; switching is setGains across the union, so the horn both
   mixes share holds its level and only the doubling comes and goes. */
async function startAB(){
  const ab = S.ab;
  const A = mixFor(ab.answer, S.q.sizes);
  const B = mixFor(ab.picked, S.q.sizes);
  const union = [...new Set([...A, ...B])];
  const gains = {}; union.forEach(c => gains[c] = A.includes(c) ? 1 : 0);

  const ok = await BlendAudio.play(union, { loop:true, gains });
  if(S.ab !== ab) return;               // Next was pressed while this was decoding
  if(!ok) return;
  ab.ready = true;
  render();
}

function setAB(id){
  if(!S.ab || !S.ab.ready || S.ab.on === id) return;
  if(id !== S.ab.answer && id !== S.ab.picked) return;
  S.ab.on = id;
  const mix = mixFor(id, S.q.sizes);
  const gains = {}; mix.forEach(c => gains[c] = 1);
  BlendAudio.setGains(gains);
  /* read before the repaint: afterwards focus has already fallen to the body */
  const hadFocus = $('bl-options').contains(document.activeElement);
  render();
  if(hadFocus){
    const el = $('bl-options').querySelector(`.dj-opt[data-id="${CSS.escape(id)}"]`);
    if(el) el.focus();
  }
}

/* ------------------------------------------------------------------ loop --- */
function next(){
  BlendAudio.stop();
  S.phase = 'asking';
  S.picked = null;
  S.heard = false;
  S.ab = null;
  S.q = buildQuestion();
  $('bl-fill').style.transform = 'scaleX(0)';
  display('What is doubling the horn?', null, null);
  render();
}

/* ----------------------------------------------------------------- wire --- */
BlendAudio.onstate = paintPlay;
$('bl-play').onclick = playQuestion;

$('bl-options').addEventListener('click', e => {
  const b = e.target.closest('.dj-opt');
  if(!b || b.disabled) return;
  if(S.phase === 'wrong'){ setAB(b.dataset.id); return; }
  answer(b.dataset.id);
});

document.addEventListener('keydown', e => {
  const onControl = !!(e.target.closest && e.target.closest('button, a'));
  if(e.code === 'Space'){
    if(onControl) return;
    e.preventDefault();
    if(S.phase === 'asking') playQuestion();
    return;
  }
  if(e.key === 'Enter' && S.phase !== 'asking'){
    if(onControl) return;
    e.preventDefault(); next(); return;
  }
  if(S.phase === 'asking' && /^[1-4]$/.test(e.key)){
    const b = $('bl-options').querySelectorAll('.dj-opt')[+e.key - 1];
    if(b && !b.disabled){ e.preventDefault(); answer(b.dataset.id); }
    return;
  }
  if(S.phase === 'wrong' && S.ab && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
    e.preventDefault();
    setAB(e.key === 'ArrowLeft' ? S.ab.answer : S.ab.picked);
  }
});

window.addEventListener('scroll', () => {
  $('atl-nav').classList.toggle('is-stuck', window.scrollY > 20);
}, { passive:true });

next();
requestAnimationFrame(frame);
