/* ============================================================================
   THE DOJO
   ----------------------------------------------------------------------------
   Loads after atlas-data.js and dojo-data.js, all deferred, so INSTRUMENTS,
   CLIPS, BELTS, CONFUSIONS, LISTEN_FOR and DISTINCTIONS already exist.

   Four parts, in dependency order:
     1. DojoAudio   the playback engine
     2. Progress    the only thing that touches localStorage
     3. Questions   assembly, targets, distractors
     4. The screen
   ============================================================================ */

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = id => document.getElementById(id);
const nameOf = id => (INSTRUMENTS[id] && INSTRUMENTS[id].name) || id;
const atlasHref = id => INSTRUMENTS[id] ? `../#/${INSTRUMENTS[id].family}/${id}` : '../#/';

/* ============================================================================
   1. AUDIO
   ----------------------------------------------------------------------------
   The shared engine from audio.js. Belts runs it at the device rate rather
   than the score view's 32 kHz: this mode is a claim about timbre, and the top
   octave is where a piccolo and a celesta differ. The buffer cache is capped
   instead, at eight clips of twenty-five seconds — roughly 60 MB, against 300
   for the whole belt.
   ============================================================================ */

const DojoAudio = makeDojoAudio({ srcOf: id => clipSrc(CLIPS[id]) });

/* ============================================================================
   2. PROGRESS
   ----------------------------------------------------------------------------
   The ONLY code in the dojo that touches localStorage. Everything above and
   below goes through this API, so replacing the store with a server is a change
   to load() and save() and to nothing else.

   No lives, no punishment, no timer. A wrong answer costs more confidence than
   a right one pays, because that is what makes practice go where it is needed —
   not because being wrong should hurt.
   ============================================================================ */

const Progress = (function(){

  const KEY    = 'dojo-progress';
  const VER    = 1;
  const START  = 0.5;      // every instrument begins here
  const UP     = 0.15;
  const DOWN   = 0.25;     // wrong costs more than right pays
  const DECAY  = 0.02;     // per day since lastSeen
  const WINDOW = 20;       // the last N answers a belt is judged on
  const UNLOCK = 0.8;

  const blank = () => ({ v:VER, belts:{}, confidence:{}, lastSeen:{}, recent:{} });
  const clamp = v => Math.max(0, Math.min(1, v));
  const DAY   = 86400000;

  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if(!raw) return blank();
      const d = JSON.parse(raw);
      /* an older or corrupt shape is discarded rather than migrated: there is
         nothing in here worth rescuing at the cost of a broken session */
      if(!d || d.v !== VER) return blank();
      return Object.assign(blank(), d);
    } catch(_){
      return blank();          // private browsing, quota, or a hand-edited value
    }
  }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(_){} }

  let data = load();

  function belt(id){
    if(!data.belts[id]) data.belts[id] = { attempts:0, correct:0, unlocked:false, bestStreak:0 };
    if(!data.recent[id]) data.recent[id] = [];
    return data.belts[id];
  }

  /* Decay is applied on READ and never written back, so an idle tab cannot
     grind a score down and a reload cannot apply it twice. It subtracts rather
     than pulling toward the 0.5 start: drifting an already-weak instrument
     upward over time would make a forgotten one get asked LESS, which is the
     opposite of resurfacing it. */
  function confidence(id){
    const base = id in data.confidence ? data.confidence[id] : START;
    const seen = data.lastSeen[id];
    if(!seen) return base;
    return clamp(base - DECAY * ((Date.now() - seen) / DAY));
  }

  function record(beltId, answerId, right){
    const b = belt(beltId);
    b.attempts++;
    if(right) b.correct++;
    const r = data.recent[beltId];
    r.push(right ? 1 : 0);
    while(r.length > WINDOW) r.shift();

    data.confidence[answerId] = clamp(confidence(answerId) + (right ? UP : -DOWN));
    data.lastSeen[answerId]   = Date.now();
    save();
  }

  function noteStreak(beltId, streak){
    const b = belt(beltId);
    if(streak > b.bestStreak){ b.bestStreak = streak; save(); }
  }

  /* A belt unlocks at 80% correct over the last 20 questions, and stays
     unlocked once it has: a bad run should not take something away. */
  function rate(beltId){
    const r = data.recent[beltId] || [];
    if(!r.length) return 0;
    return r.reduce((a, x) => a + x, 0) / r.length;
  }
  function cleared(beltId){
    const b = belt(beltId);
    const r = data.recent[beltId] || [];
    if(!b.unlocked && r.length >= WINDOW && rate(beltId) >= UNLOCK){ b.unlocked = true; save(); }
    return b.unlocked;
  }

  function reset(){ data = blank(); save(); }

  return { confidence, record, noteStreak, belt, rate, cleared, reset,
           get window(){ return WINDOW; } };
})();

/* ============================================================================
   3. QUESTIONS
   ----------------------------------------------------------------------------
   Generated, never stored. A belt's `pool` says which clips qualify, `answer`
   reads the correct response off the chosen clip, and the distractors come from
   CONFUSIONS. Nothing here is random except the shuffle and the weighted draw.
   ============================================================================ */

const BELT = BELTS.find(b => b.id === 'instruments');

const RECENT = [];                       // answers just asked, to stop repeats

function poolFor(belt){
  return Object.keys(CLIPS).filter(id => belt.pool(CLIPS[id]));
}

function shuffle(a){
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Practice goes where it is needed: probability weighted by 1 - confidence,
   with a floor so a mastered instrument still comes round occasionally. */
function pickClip(belt, clipIds){
  const cands = clipIds.map(id => ({ id, answer: belt.answer(CLIPS[id]) }));
  /* what was just asked is off the table, unless excluding it would leave
     almost nothing to draw from */
  const fresh = cands.filter(a => !RECENT.includes(a.answer));
  const from  = fresh.length >= 2 ? fresh : cands;

  const weights = from.map(a => 0.1 + (1 - Progress.confidence(a.answer)));
  const total   = weights.reduce((x, y) => x + y, 0);
  let r = Math.random() * total;
  for(let i = 0; i < from.length; i++){
    r -= weights[i];
    if(r <= 0) return from[i];
  }
  return from[from.length - 1];
}

/* Distractors, in three graded passes. The CONFUSIONS table is the point; the
   two fallbacks exist only so a thin pool cannot produce a question with fewer
   options than it promised, and neither of them is random either. */
function distractorsFor(answer, answers, n){
  const out = [];
  const add = id => {
    if(id !== answer && answers.includes(id) && !out.includes(id) && out.length < n) out.push(id);
  };
  (CONFUSIONS[answer] || []).forEach(add);

  if(out.length < n){
    const byTimbre = answers
      .filter(id => INSTRUMENTS[id] && INSTRUMENTS[answer] &&
                    INSTRUMENTS[id].family === INSTRUMENTS[answer].family)
      .sort((a, b) => Math.abs(INSTRUMENTS[a].timbre - INSTRUMENTS[answer].timbre) -
                      Math.abs(INSTRUMENTS[b].timbre - INSTRUMENTS[answer].timbre));
    byTimbre.forEach(add);
  }
  if(out.length < n){
    const byTimbre = answers
      .filter(id => INSTRUMENTS[id] && INSTRUMENTS[answer])
      .sort((a, b) => Math.abs(INSTRUMENTS[a].timbre - INSTRUMENTS[answer].timbre) -
                      Math.abs(INSTRUMENTS[b].timbre - INSTRUMENTS[answer].timbre));
    byTimbre.forEach(add);
  }
  return out;
}

function buildQuestion(belt){
  const clipIds = poolFor(belt);
  const answers = [...new Set(clipIds.map(id => belt.answer(CLIPS[id])))];
  const pick    = pickClip(belt, clipIds);

  RECENT.push(pick.answer);
  while(RECENT.length > Math.min(4, Math.max(1, answers.length - 2))) RECENT.shift();

  return {
    clips:   [pick.id],                       // belt 2 is one layer; the engine takes many
    answer:  pick.answer,
    options: shuffle([pick.answer, ...distractorsFor(pick.answer, answers, belt.options - 1)])
  };
}

/* The line under an A/B. Hand-written for every pair CONFUSIONS can produce;
   the generated sentence only ever appears for a pair the timbre backstop
   invented, and says the one true thing that can be derived. */
function distinction(a, b){
  const hit = DISTINCTIONS[[a, b].sort().join('|')];
  if(hit) return hit;
  const A = INSTRUMENTS[a], B = INSTRUMENTS[b];
  if(!A || !B) return '';
  const [bright, dark] = A.timbre >= B.timbre ? [a, b] : [b, a];
  const same = A.family === B.family;
  return `${nameOf(bright)} is the brighter of the two; ${nameOf(dark)} is darker and rounder. ` +
         (same ? 'Same family, so the difference is weight and register rather than mechanism.'
               : `Different families too — ${A.family} against ${B.family}.`);
}

/* ============================================================================
   4. THE SCREEN
   ----------------------------------------------------------------------------
   One centred column and nothing else. The belt, the question, the play
   control, four answers stacked, and — when you are wrong — the two clips to
   switch between. No prose: the display line asks the question and then names
   the answer in the same place, so there is nothing to read and nowhere else
   to look. LISTEN_FOR and DISTINCTIONS stay in dojo-data.js, unused, for when
   the explanations come back.
   ============================================================================ */

const S = {
  phase:  'asking',        // asking · right · wrong
  q:      null,
  picked: null,
  heard:  false,           // has the clip been played at least once?
  streak: 0,
  ab:     null             // {answer, picked, on, ready, clips}
};

/* ---------------------------------------------------------------- chrome --- */
function paintScore(){
  const b = Progress.belt(BELT.id);
  const pct = b.attempts ? Math.round(100 * b.correct / b.attempts) : 0;
  $('dj-score').innerHTML = b.attempts
    ? `<b>${b.correct}</b><span>/${b.attempts}</span><i>${pct}%</i>`
    : '';
  $('dj-belt').textContent = S.streak > 1
    ? `Belt ${BELT.n} · ${BELT.title} · ${S.streak} in a row`
    : `Belt ${BELT.n} · ${BELT.title}`;
}

/* -------------------------------------------------------------- transport --- */
function paintPlay(){
  const el = $('dj-play');
  const on = DojoAudio.playing;
  el.dataset.state = DojoAudio.loading ? 'loading' : (on ? 'playing' : 'idle');
  $('dj-play-lbl').textContent = DojoAudio.loading ? 'Loading' : (on ? 'Stop' : (S.heard ? 'Replay' : 'Play'));
  el.setAttribute('aria-label', on ? 'Stop' : 'Play the clip');
  if(DojoAudio.error) $('dj-note').textContent = DojoAudio.error;
}

let lastBar = -1;
function frame(){
  const f = DojoAudio.playing && DojoAudio.duration
    ? DojoAudio.position() / DojoAudio.duration : 0;
  const q = Math.round(f * 400);                    // only write when it moves
  if(q !== lastBar){ lastBar = q; $('dj-bar-fill').style.transform = `scaleX(${f})`; }
  requestAnimationFrame(frame);
}

async function playQuestion(){
  if(DojoAudio.playing){ DojoAudio.stop(); return; }
  const q  = S.q;
  const ok = await DojoAudio.play(q.clips, { loop:false, lock:q.clips.length > 1 });
  if(S.q !== q || !ok) return;     // Next was pressed while this was decoding
  S.heard = true;
  $('dj-note').textContent = '';
  paintOptions();
}

/* --------------------------------------------------------------- options --- */
/* ⭐ On a wrong answer the correct row and the one you picked BECOME the A/B.
   Both clips are already running, so clicking either is a gain ramp on a node
   that is already going — the same switch as before, with no second pair of
   buttons under the list and no page growing by the height of them. The lit
   bars on the right say which one you are hearing. */
const HEAR_ICON = `<span class="dj-hear" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none"
  stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
  <path d="M3 6.4v3.2M6.3 3.8v8.4M9.7 5.6v4.8M13 7.2v1.6"/></svg></span>`;

function paintOptions(){
  const locked = S.phase !== 'asking';
  const ab = (S.phase === 'wrong' && S.ab) ? S.ab : null;

  $('dj-options').innerHTML = S.q.options.map(id => {
    const state = !locked ? '' :
      id === S.q.answer ? ' is-right' :
      id === S.picked   ? ' is-wrong' : ' is-off';
    const isAB    = !!ab && (id === ab.answer || id === ab.picked);
    const hearing = isAB && ab.on === id;
    const dead    = locked ? !isAB : !S.heard;
    return `<button class="dj-opt${state}${isAB ? ' is-ab' : ''}${hearing ? ' is-hearing' : ''}"
              data-id="${esc(id)}"${dead ? ' disabled' : ''}${
              isAB ? ` aria-pressed="${hearing}" aria-label="Hear the ${esc(nameOf(id))}"` : ''
            }>${esc(nameOf(id))}${isAB ? HEAR_ICON : ''}</button>`;
  }).join('');

  if(!S.heard && !locked) $('dj-options').dataset.waiting = '1';
  else delete $('dj-options').dataset.waiting;

  /* Once an answer is in, the clip loops for the comparison and the progress
     fill just resets over and over — a dash flickering under the button that
     measures nothing. Hidden with visibility, NOT with hidden/display:none:
     collapsing it took its 16px out of the flow and pulled every option up by
     that much the instant you answered. */
  $('dj-meter').toggleAttribute('data-idle', locked);
}

/* ---------------------------------------------------------------- answer --- */
function display(text, state, mark){
  $('dj-display').innerHTML = (mark ? `<span class="dj-mark" data-v="${mark}"></span>` : '') + esc(text);
  if(state) $('dj-display').dataset.state = state; else delete $('dj-display').dataset.state;
}

function answer(id){
  if(S.phase !== 'asking' || !S.heard) return;
  S.picked = id;
  const right = id === S.q.answer;
  S.phase = right ? 'right' : 'wrong';
  S.streak = right ? S.streak + 1 : 0;

  Progress.record(BELT.id, S.q.answer, right);
  Progress.noteStreak(BELT.id, S.streak);
  Progress.cleared(BELT.id);

  display(nameOf(S.q.answer), S.phase, right ? 'right' : 'wrong');
  paintOptions();
  paintScore();
  right ? showRight() : showWrong();
}

/* Every phase renders the same two rows, so the block is always exactly the
   same height and answering moves nothing below the options. A row with no job
   in this phase is still drawn — invisible, unfocusable, and carrying no
   answer text. That is why there is no reserved height to keep in step with
   the padding and line-heights: the reserve IS the content. */
function resultRows(next, link){
  return (next
      ? `<button class="dj-next" id="dj-next">Next</button>`
      : `<span class="dj-next is-ghost" aria-hidden="true">Next</span>`)
    + (link
      ? `<a class="dj-link" href="${esc(link.href)}">${esc(link.text)}</a>`
      : `<span class="dj-link is-ghost" aria-hidden="true">&nbsp;</span>`);
}

function showRight(){
  $('dj-result').innerHTML = resultRows(true, null);
  $('dj-next').onclick = next;
  /* preventScroll: focusing a button the browser thinks is out of view scrolls
     the page to it, which is the whole screen sliding under the reader at the
     exact moment they are reading the answer */
  $('dj-next').focus({ preventScroll:true });
}

/* ⭐ The A/B on a wrong answer.
   Both clips start at ONE scheduled time with the answer at gain 1 and the
   picked instrument at gain 0. Switching after that is a 20 ms ramp on two
   gain nodes: no restart, no click, and it works mid-note. */
function showWrong(){
  const a = S.q.answer, p = S.picked;
  S.ab = { answer:a, picked:p, on:a, ready:false, clips:{} };

  /* nothing here but the way forward — the comparison lives in the rows above */
  $('dj-result').innerHTML = resultRows(true,
    { href: atlasHref(a), text: `Open the ${nameOf(a)} in the atlas` });
  $('dj-next').onclick = next;

  startAB();
}

async function startAB(){
  const ab = S.ab;                 // the comparison this call belongs to
  const ans = poolClipFor(ab.answer), pick = poolClipFor(ab.picked);
  if(!ans || !pick){ $('dj-note').textContent = 'No clip to compare against yet.'; return; }
  /* one scheduled start for both; only the gains differ */
  const ok = await DojoAudio.play([ans, pick], { loop:true, lock:false, gains:{ [ans]:1, [pick]:0 } });
  if(S.ab !== ab) return;          // Next was pressed while this was decoding
  if(!ok){ $('dj-note').textContent = DojoAudio.error || 'Comparison unavailable.'; return; }
  ab.clips = { [ab.answer]:ans, [ab.picked]:pick };
  ab.ready = true;
  paintOptions();                  // the two rows can light up now
  paintPlay();
}

/* keyed by instrument, because the switch IS the two option rows now */
function setAB(id){
  if(!S.ab || !S.ab.ready || S.ab.on === id) return;
  if(id !== S.ab.answer && id !== S.ab.picked) return;
  S.ab.on = id;
  DojoAudio.select(S.ab.clips[id]);
  /* paintOptions rebuilds the row being switched to, so whether focus was in
     the list has to be read BEFORE the repaint — afterwards it has already
     fallen to the body and there is nothing left to tell */
  const hadFocus = $('dj-options').contains(document.activeElement);
  paintOptions();
  if(hadFocus){
    const el = $('dj-options').querySelector(`.dj-opt[data-id="${CSS.escape(id)}"]`);
    if(el) el.focus();
  }
}

/* the clip that represents an answer — for belt 2 the answer IS an instrument
   id, so this is the reverse of BELT.answer() over the pool */
function poolClipFor(answerId){
  return poolFor(BELT).find(id => BELT.answer(CLIPS[id]) === answerId) || null;
}

/* ------------------------------------------------------------------ loop --- */
function next(){
  DojoAudio.stop();
  S.phase  = 'asking';
  S.picked = null;
  S.heard  = false;
  S.ab     = null;
  S.q      = buildQuestion(BELT);
  $('dj-result').innerHTML = resultRows(false, null);
  $('dj-note').textContent = '';
  $('dj-bar-fill').style.transform = 'scaleX(0)';
  display(BELT.ask, null, null);
  paintOptions();
  paintPlay();
  paintScore();
  /* deliberately not focusing anything: a programmatic focus paints a ring on
     the play button that reads as a selected state, and the keyboard path does
     not need it — Space plays, 1-4 answer and Enter advances, all from the
     document. */
}

/* ----------------------------------------------------------------- wire --- */
DojoAudio.onstate = paintPlay;

$('dj-play').onclick = playQuestion;

$('dj-reset').onclick = () => {
  Progress.reset();
  S.streak = 0;
  paintScore();
  next();
};

$('dj-options').addEventListener('click', e => {
  const b = e.target.closest('.dj-opt');
  if(!b || b.disabled) return;
  if(S.phase === 'wrong'){ setAB(b.dataset.id); return; }
  answer(b.dataset.id);
});

document.addEventListener('keydown', e => {
  /* a focused button or link is activated by Space and Enter natively; without
     this the shortcut fires a second time and play immediately stops again */
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
    const b = $('dj-options').querySelectorAll('.dj-opt')[+e.key - 1];
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

paintScore();
next();
requestAnimationFrame(frame);
