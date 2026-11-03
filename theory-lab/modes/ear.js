/* ============================================================================
   SCALES & MODES · NAME THE MODE
   ----------------------------------------------------------------------------
   Its own page and its own small engine. The Dojo's three modes are all driven
   by pre-rendered clips — a Belt's question is a function OF A CLIP — and this
   question has no clip: the phrase is generated from a root and a mode. So it
   uses AccelAudio.Transport directly and borrows the Dojo's chrome, which is
   the part that was worth reusing.

   THE PHRASE. A drone, then four bars of melody that land on the colour note
   on a downbeat at least twice, then the mode's signature cadence. The drone
   is not decoration: without a fixed tonic, D Dorian is C major and the
   question has no answer.

   DISTRACTORS ARE NEIGHBOURS. The modes beside the answer on the brightness
   axis come first, which is the Dojo's CONFUSIONS principle — Lydian against
   Ionian teaches, Lydian against Locrian is a free point.

   A WRONG ANSWER PLAYS BOTH, back to back over the same drone, with the
   degree that differs marked on the keyboard. That is the one feature the
   Dojo's modes are built around and the reason any of this works.
   ============================================================================ */
(() => {
const T = EvTheory;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Five levels. Each is a pool and a way of asking. */
const LEVELS = [
  { id:1, name:'Level 1', note:'Major or minor',          pool:['ionian','aeolian'] },
  { id:2, name:'Level 2', note:'The bright side',         pool:['lydian','ionian','mixolydian'] },
  { id:3, name:'Level 3', note:'The dark side',           pool:['dorian','aeolian','phrygian'] },
  { id:4, name:'Level 4', note:'All seven',               pool:T.MODES.map(m => m.id) },
  { id:5, name:'Level 5', note:'Cadence only, no melody', pool:T.MODES.map(m => m.id), cadenceOnly:true }
];
const ROUND = 10, PASS = 8;
const STORE = 'ear';

const S = {
  level:1, q:null, picked:null, phase:'asking', heard:false,
  asked:0, correct:0, best:{}, ab:null
};

const level = () => LEVELS.find(l => l.id === S.level) || LEVELS[0];
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };

/* ---- progress, in the module's own store ---- */
const saved = () => { const w = Accel.lesson(STORE); return (w && typeof w === 'object') ? w : {}; };
const unlocked = n => n === 1 || (saved().passed || []).includes(n - 1);
function recordRound(){
  const p = saved(), passed = Array.isArray(p.passed) ? p.passed.slice() : [];
  if(S.correct >= PASS && !passed.includes(S.level)) passed.push(S.level);
  const bests = Object.assign({}, p.bests);
  bests[S.level] = Math.max(bests[S.level] || 0, S.correct);
  Accel.patch(STORE, { passed, bests, lastLevel:S.level });
}

/* ---- the phrase ---------------------------------------------------------
   Four bars, eight notes, built so the colour note lands on a downbeat twice.
   A mode with no colour note — Ionian, Aeolian — leans on its own third
   instead, which is what tells those two apart. */
function phraseFor(root, modeId){
  const m = T.mode(modeId);
  const lean = m.colour || 3;
  const shapes = [
    [1, 5, lean, 5,  lean, 3, 2, 1],
    [5, lean, 3, 1,  lean, 2, 3, 1],
    [1, 2, 3, lean,  5, lean, 2, 1]
  ];
  const shape = pick(shapes);
  /* beats 0, 4, 8, 12 are downbeats; the shape puts `lean` on two of them */
  return shape.map((deg, i) => ({
    m: T.degreeMidi(root, m, deg, 4), s: i * 2, d: i === shape.length - 1 ? 2 : 1.75,
    layer:'Phrase', voice:true, gain:.16
  }));
}

function questionPhrase(root, modeId, withMelody){
  const m = T.mode(modeId);
  const cad = T.progression(m.cadence, root, m, { octave:3, beats:4, layer:'Cadence' })
    .map(e => ({ ...e, s: e.s + (withMelody ? 16 : 0), gain:.1 }));
  const beats = (withMelody ? 16 : 0) + m.cadence.length * 4;
  const body = withMelody ? phraseFor(root, m).concat(cad) : cad;
  const drone = T.drone(root, { d: beats, octave:2 })
    .map(e => ({ ...e, instrument:'synth', partials:[1,.5,.18,.06] }));
  return { events: EvSound.apply(drone.concat(body), S.instrument || 'splendid'), beats };
}

/* ---- question building --------------------------------------------------
   The root is kept where a drone sits well — G2 to F3 — and the distractors
   are the answer's neighbours on the brightness axis before anything else. */
function buildQuestion(){
  const lv = level(), answer = pick(lv.pool);
  const pc = 7 + ((Math.random() * 11) | 0);                 // G2…F3, by pitch class
  const root = T.bestRoot(pc % 12, answer);
  const others = lv.pool.filter(id => id !== answer)
    .sort((a, b) => Math.abs(T.mode(a).brightness - T.mode(answer).brightness)
                  - Math.abs(T.mode(b).brightness - T.mode(answer).brightness));
  /* As many options as the level has modes, up to four. Level 1 is a two-way
     choice — major or minor — and padding it out to four with modes it does
     not teach would be a free point rather than a harder question. */
  const options = shuffle([answer, ...others.slice(0, 3)]);
  return { root, answer, options, cadenceOnly: !!lv.cadenceOnly };
}

/* ---- audio ---- */
let transport = null;
function ensureTransport(){
  if(!transport){
    transport = new AccelAudio.Transport(paintPlay, (p, d) => {
      const f = d ? p / d : 0;
      $('ear-fill').style.transform = 'scaleX(' + f + ')';
    });
    transport.loop = false;
  }
  return transport;
}

async function playQuestion(which){
  const t = ensureTransport();
  if(t.status === 'playing'){ t.stop(); return; }
  const q = S.q, modeId = which || q.answer;
  const p = questionPhrase(q.root, modeId, !q.cadenceOnly);
  t.configure(p.events, 92, p.beats);
  await t.play(0);
  if(S.q !== q) return;
  S.heard = true;
  render();
}

/* The A/B after a wrong answer: what you said, then what it was, over the same
   drone, with the degree that differs marked. */
async function playBoth(){
  const q = S.q, t = ensureTransport();
  const a = questionPhrase(q.root, S.picked, !q.cadenceOnly);
  const b = questionPhrase(q.root, q.answer, !q.cadenceOnly);
  const gap = 1;
  const events = a.events.concat(b.events.map(e => ({ ...e, s: e.s + a.beats + gap })));
  t.configure(events, 92, a.beats + gap + b.beats);
  await t.play(0);
  render();
}

/* ---- view ---- */
let kb = null;
function keyboard(){
  if(!kb) kb = EvKeyboard.create($('ear-kb'), { lo:48, hi:79, foot:false, input:{ pointer:false } });
  return kb;
}

function paintKeyboard(){
  const q = S.q, board = keyboard();
  if(!q) return;
  const showing = S.phase === 'marked' ? q.answer : null;
  if(!showing){ board.clearOverlays(); board.el.setAttribute('data-dim', '1'); return; }
  board.el.removeAttribute('data-dim');
  board.setKey({ root:q.root, mode:showing });
  const m = T.mode(showing), pc = T.pcOf(q.root), out = {};
  for(let midi = board.range.lo; midi <= board.range.hi; midi++){
    const i = m.steps.indexOf(((midi - pc) % 12 + 12) % 12);
    if(i >= 0) out[midi] = i === 0 ? 'root' : (m.colour === i + 1 ? 'colour' : 'scale');
  }
  /* what the two answers disagree about */
  if(S.picked && S.picked !== q.answer)
    T.diff(S.picked, q.answer).forEach(d => {
      const step = m.steps[d.degree - 1];
      for(let midi = board.range.lo; midi <= board.range.hi; midi++)
        if(((midi - pc) % 12 + 12) % 12 === step) out[midi] = 'changed';
    });
  board.setOverlays(out);
}

function paintPlay(){
  const t = transport, on = t && t.status === 'playing';
  $('ear-play').dataset.state = (t && t.status === 'loading') ? 'loading' : (on ? 'playing' : 'idle');
  $('ear-play-lbl').textContent = (t && t.status === 'loading') ? 'Loading'
    : on ? 'Stop' : (S.heard ? 'Replay' : 'Play');
  $('ear-meter').toggleAttribute('data-idle', S.phase !== 'asking');
}

function render(){
  const q = S.q, lv = level();
  const done = (saved().passed || []).includes(S.level);
  $('ear-eyebrow').textContent = 'Name the mode · ' + lv.name + ' · ' + lv.note + (done ? ' · passed' : '');
  $('ear-level-label').textContent = lv.name;
  $('ear-score').innerHTML = S.asked
    ? '<b>' + S.correct + '</b><span>/' + S.asked + '</span><i>of ' + ROUND + '</i>' : '';

  if(S.phase === 'asking'){
    $('ear-display').textContent = 'Which mode is this?';
    delete $('ear-display').dataset.state;
  } else {
    const right = S.picked === q.answer;
    $('ear-display').innerHTML = '<span class="dj-mark" data-v="' + (right ? 'right' : 'wrong') + '"></span>' +
      esc(right ? T.mode(q.answer).name : T.mode(q.answer).name + ', not ' + T.mode(S.picked).name);
    $('ear-display').dataset.state = right ? 'right' : 'wrong';
  }
  $('ear-count').textContent = S.phase === 'asking' && S.heard
    ? (q.cadenceOnly ? 'The cadence only' : 'A phrase, then the cadence') : '';

  $('ear-opts').innerHTML = q.options.map(id => {
    const m = T.mode(id);
    const mark = S.phase !== 'marked' ? ''
      : id === q.answer ? ' is-right' : (id === S.picked ? ' is-wrong' : '');
    return '<button class="ear-opt' + mark + '" data-mode="' + esc(id) + '"' +
      (S.phase === 'marked' || !S.heard ? ' disabled' : '') + '>' +
      '<b>' + esc(m.name) + '</b><span>' + esc(m.defined) + '</span></button>';
  }).join('');
  $('ear-opts').querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => answer(b.dataset.mode); });

  if(S.phase === 'asking'){
    $('ear-actions').innerHTML = '';
    $('ear-note').innerHTML = '&nbsp;';
    $('ear-note').classList.add('is-ghost');
  } else {
    const right = S.picked === q.answer;
    const roundOver = S.asked >= ROUND;
    $('ear-actions').innerHTML =
      (right ? '' : '<button class="dj-link" id="ear-both">Hear both</button>') +
      '<button class="dj-next" id="ear-next">' + (roundOver ? 'New round' : 'Next') + '</button>';
    const both = $('ear-both'); if(both) both.onclick = playBoth;
    $('ear-next').onclick = roundOver ? newRound : next;
    const m = T.mode(q.answer);
    $('ear-note').textContent = right
      ? m.name + ' in ' + q.root + '. ' + m.defined + '.'
      : m.name + ' is ' + m.defined.charAt(0).toLowerCase() + m.defined.slice(1) +
        '; ' + T.mode(S.picked).name + ' is ' + T.mode(S.picked).defined.charAt(0).toLowerCase() +
        T.mode(S.picked).defined.slice(1) + '.';
    $('ear-note').classList.remove('is-ghost');
  }
  paintKeyboard();
  paintPlay();
}

function answer(id){
  if(S.phase !== 'asking' || !S.heard) return;
  S.picked = id;
  S.phase = 'marked';
  S.asked++;
  if(id === S.q.answer) S.correct++;
  if(S.asked >= ROUND) recordRound();
  render();
}

function next(){
  if(transport) transport.stop();
  S.phase = 'asking'; S.picked = null; S.heard = false;
  S.q = buildQuestion();
  $('ear-fill').style.transform = 'scaleX(0)';
  render();
}
function newRound(){ S.asked = 0; S.correct = 0; next(); }

function setLevel(n){
  S.level = n;
  Accel.patch(STORE, { lastLevel:n });
  newRound();
}

/* ---- the level menu, the same control the Blend mode uses ---- */
(function wireLevel(){
  const wrap = $('ear-level'), btn = $('ear-level-btn'), menu = $('ear-level-menu');
  const paint = () => {
    menu.innerHTML = LEVELS.map(l => {
      const open = unlocked(l.id), best = (saved().bests || {})[l.id];
      return '<a class="ev-item" role="menuitem" tabindex="-1" href="#" data-level="' + l.id + '"' +
        (open ? '' : ' aria-disabled="true" data-locked="1"') + '>' +
        '<span class="ev-item-name">' + esc(l.name) + '</span>' +
        '<span class="bl-level-note">' + esc(l.note) +
        (open ? (best ? ' · best ' + best + '/' + ROUND : '') : ' · ' + PASS + '/' + ROUND + ' on level ' + (l.id - 1)) +
        '</span></a>';
    }).join('');
    menu.querySelectorAll('.ev-item').forEach(a => a.toggleAttribute('data-active', +a.dataset.level === S.level));
  };
  const items = () => [...menu.querySelectorAll('.ev-item:not([data-locked])')];
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
    if(on){ paint(); place(); if(focusFirst && items()[0]) items()[0].focus();
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
    else if(e.key === 'Escape'){ e.preventDefault(); show(false); btn.focus(); }
    else if(e.key === 'Tab'){ show(false); }
  });
  menu.addEventListener('click', e => {
    const a = e.target.closest('.ev-item');
    if(!a) return;
    e.preventDefault();
    if(a.hasAttribute('data-locked')) return;
    show(false); btn.focus();
    if(+a.dataset.level !== S.level) setLevel(+a.dataset.level);
  });
  document.addEventListener('click', e => { if(open && !wrap.contains(e.target)) show(false); });
})();

$('ear-play').onclick = () => playQuestion();
document.addEventListener('keydown', e => {
  if(e.target.closest && e.target.closest('button, a, input, select')) return;
  if(e.code === 'Space'){ e.preventDefault(); playQuestion(); }
  else if(e.key === 'Enter' && S.phase === 'marked'){ e.preventDefault(); $('ear-next').click(); }
});
window.addEventListener('scroll', () => {
  $('atl-nav').classList.toggle('is-stuck', window.scrollY > 20);
}, { passive:true });

/* Deep link: ear.html#level=2, which is how a course lesson sends someone
   straight to the right level. Read at load AND on hashchange, because a
   second link on the same page would otherwise change the address bar and
   nothing else. A level that has not been earned falls back to the first. */
function levelFromHash(){
  const m = location.hash.match(/level=(\d)/);
  return m ? +m[1] : null;
}
function applyHash(){
  const want = levelFromHash() ?? (saved().lastLevel || 1);
  const next = unlocked(want) ? want : 1;
  if(next !== S.level){ S.level = next; newRound(); }
  else S.level = next;
}
addEventListener('hashchange', applyHash);
applyHash();
if(typeof EvSound !== 'undefined' && typeof AccelAudio !== 'undefined') EvSound.register(AccelAudio);
S.instrument = EvSound.remembered();
newRound();
})();
