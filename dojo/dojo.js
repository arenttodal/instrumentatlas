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
   1. AUDIO ENGINE
   ----------------------------------------------------------------------------
   Built on the two engines that already exist in this repo, because both were
   expensive to get right and both solve exactly this problem:

   From AudioCompare (atlas-studio.js) — one AudioContext, every clip decoded to
   a buffer, every source started at ONE scheduled time, and switching what you
   hear done as a gain ramp of 15–30 ms rather than a restart. That is what
   makes the A/B on a wrong answer switchable mid-note.

   From the Score View (valley-sunrise-app/score.html) — every playing node
   lives in a registry, created only through startNode() and destroyed only
   through killNode()/killAll(). The version before that one keyed nodes in a
   Map and overwrote entries, orphaning sources that kept playing with no
   reference: audible as phasing, as solo failing to isolate, and as sound
   continuing after stop.

   Two things could NOT be reused as they stand, and this is why the code below
   exists at all rather than importing AudioCompare:

   · AudioCompare creates its AudioContext inside load(), one per instance. A
     dojo question is a new set of clips every twenty seconds; an instance per
     question would be a context per question, and browsers cap those at around
     six before throwing. The dojo needs one context for the session and a
     buffer cache that outlives any single question.
   · AudioCompare fetches every track in its set up front. Belt 2 has fifteen
     clips and only ever needs one or two of them, so decoding is lazy and
     per-clip, the way the score view decodes stems.

   One deliberate departure from the score view: it runs its context at 32 kHz
   to survive twelve two-minute stems, and that halves the Nyquist to 16 kHz.
   The dojo runs at the device's own rate, because the whole product is a claim
   about timbre and the top octave is where a piccolo and a celesta differ. The
   memory that buys back is capped by an LRU over the buffer cache instead:
   eight clips of twenty-five seconds is roughly 60 MB, against 300 MB for the
   whole belt.
   ============================================================================ */

const DojoAudio = (function(){

  const CACHE_MAX = 8;
  const LEAD      = 0.08;          // scheduling lead so every source starts together
  const RAMP      = 0.02;          // 20 ms — inside AudioCompare's 15–30 ms window

  let ctx = null;
  const buffers = new Map();       // clipId -> AudioBuffer. Insertion order is LRU order.
  const LIVE    = new Set();       // {id, src, gain} — the registry. Nothing else holds a node.

  let startTime = 0, duration = 0, gen = 0;
  let playing = false, loading = false, failed = null;
  let onstate = () => {};

  /* Invariant 9 in the handoff: never at load, only on a gesture. */
  function ensureCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  /* ---- the registry. One way in, one way out. ---- */
  function nodeFor(id){ for(const n of LIVE) if(n.id === id) return n; return null; }

  function killNode(n){
    /* onended is nulled BEFORE stop(), or a deliberate kill fires the
       finished-playing path and flips the transport underneath us */
    try { n.src.onended = null; n.src.stop(); } catch(_){}
    try { n.src.disconnect(); n.gain.disconnect(); } catch(_){}
    LIVE.delete(n);
  }
  function killId(id){ [...LIVE].forEach(n => { if(n.id === id) killNode(n); }); }
  function killAll(){ [...LIVE].forEach(killNode); LIVE.clear(); }

  function startNode(id, when, gainValue, loopEnd){
    killId(id);                                  // never two nodes for one clip
    const b = buffers.get(id);
    if(!b) return null;
    const src  = ctx.createBufferSource(); src.buffer = b;
    if(loopEnd){ src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(loopEnd, b.duration); }
    const gain = ctx.createGain(); gain.gain.value = gainValue;
    src.connect(gain).connect(ctx.destination);
    const n = { id, src, gain };
    src.onended = () => {
      LIVE.delete(n);
      if(!LIVE.size && playing){ playing = false; onstate(); }
    };
    src.start(when, 0);
    LIVE.add(n);
    return n;
  }

  /* ---- buffers ---- */
  function touch(id){ const b = buffers.get(id); buffers.delete(id); buffers.set(id, b); }

  function evict(){
    if(buffers.size <= CACHE_MAX) return;
    for(const id of [...buffers.keys()]){
      if(buffers.size <= CACHE_MAX) break;
      if(nodeFor(id)) continue;                  // never drop something that is sounding
      buffers.delete(id);
    }
  }

  async function decode(id){
    if(buffers.has(id)){ touch(id); return buffers.get(id); }
    const clip = CLIPS[id];
    if(!clip) throw new Error('unknown clip: ' + id);
    const url = clipSrc(clip);
    const res = await fetch(url);
    if(!res.ok) throw new Error('Missing audio file: ' + url);
    const buf = await ensureCtx().decodeAudioData(await res.arrayBuffer());
    buffers.set(id, buf);
    return buf;
  }

  /* ---- transport ----
     `ids` all start at one scheduled time, each through its own gain. `gains`
     says which of them is audible; everything not named starts silent and can
     be ramped up later without a restart, which is the whole A/B mechanism.

     `lock` is for a set that sounds SIMULTANEOUSLY: it loops every clip at the
     shortest duration in the set so the layers can never drift apart. A/B
     passes lock:false, because only one of its two clips is ever audible and
     the belt-2 signature phrases are not length-matched (13 s to 26 s), so
     truncating the longer one to the shorter would cut a phrase for nothing. */
  async function play(ids, opts = {}){
    /* Every play() takes a generation token. Decoding is async, so a play still
       fetching when the learner presses Next — or presses play again — must not
       start its sources afterwards: that is exactly how a clip from the
       previous question ends up sounding underneath the next one, with nothing
       on screen to explain it. stop() bumps the generation too, so stop means
       stop, including work that has not landed yet. */
    const mine = ++gen;
    failed = null;
    try {
      ensureCtx();
      if(ctx.state === 'suspended') await ctx.resume();
      loading = true; onstate();
      for(const id of ids) await decode(id);
      if(mine !== gen) return false;           // superseded while decoding
      evict();
      loading = false;

      killAll();
      const durs   = ids.map(id => buffers.get(id).duration);
      duration     = Math.max(...durs);
      const shared = opts.lock ? Math.min(...durs) : 0;
      const when   = ctx.currentTime + LEAD;
      ids.forEach((id, i) => startNode(
        id, when,
        opts.gains && id in opts.gains ? opts.gains[id] : (i === 0 ? 1 : 0),
        opts.loop ? (shared || buffers.get(id).duration) : 0
      ));
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

  function stop(){
    gen++;                                     // abandon anything still decoding
    killAll();
    playing = false;
    loading = false;
    onstate();
  }

  /* Exactly one audible, everything else down. A ramp, never a restart. */
  function select(id, ramp = RAMP){
    if(!ctx) return;
    const now = ctx.currentTime;
    LIVE.forEach(n => {
      const target = n.id === id ? 1 : 0;
      n.gain.gain.cancelScheduledValues(now);
      n.gain.gain.setValueAtTime(n.gain.gain.value, now);
      n.gain.gain.linearRampToValueAtTime(target, now + ramp);
    });
  }

  /* the current gain of every live node. The registry stays private; this is
     a read-only window onto it, for the A/B and for tests. */
  function levels(){
    const o = {};
    LIVE.forEach(n => { o[n.id] = Math.round(n.gain.gain.value * 1000) / 1000; });
    return o;
  }

  function position(){
    if(!playing || !ctx) return 0;
    /* sources are scheduled LEAD seconds ahead, so this is negative until they
       actually start; clamped so the progress bar never gets a negative scale */
    const p = Math.max(0, ctx.currentTime - startTime);
    return duration ? (p % duration) : 0;
  }

  return {
    play, stop, select, position, levels, ensureCtx,
    get playing(){ return playing; },
    get loading(){ return loading; },
    get duration(){ return duration; },
    get error(){ return failed; },
    set onstate(fn){ onstate = fn; }
  };
})();

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
     measures nothing. It belongs to the question, so it goes with it. */
  $('dj-meter').hidden = locked;
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

function showRight(){
  $('dj-result').innerHTML = `<button class="dj-next" id="dj-next">Next</button>`;
  $('dj-next').onclick = next;
  $('dj-next').focus();
}

/* ⭐ The A/B on a wrong answer.
   Both clips start at ONE scheduled time with the answer at gain 1 and the
   picked instrument at gain 0. Switching after that is a 20 ms ramp on two
   gain nodes: no restart, no click, and it works mid-note. */
function showWrong(){
  const a = S.q.answer, p = S.picked;
  S.ab = { answer:a, picked:p, on:a, ready:false, clips:{} };

  /* nothing here but the way forward — the comparison lives in the rows above */
  $('dj-result').innerHTML = `
    <button class="dj-next" id="dj-next">Next</button>
    <a class="dj-link" href="${atlasHref(a)}">Open the ${esc(nameOf(a))} in the atlas</a>`;
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
  $('dj-result').innerHTML = '';
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
