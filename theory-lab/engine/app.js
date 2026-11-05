/* ============================================================================
   THEORY LAB · LESSON ENGINE
   ----------------------------------------------------------------------------
   A LESSON IS A RUN OF STEPS, NOT A PAGE YOU SCROLL. The activity holds one
   column and stays mounted for the whole lesson; the other column advances one
   step at a time. The page is max(activity, step) and is sized to the
   viewport, so on a desktop there is nothing to scroll — the demonstration is
   in front of you while you read about it and while you answer questions on it.

   This shell is the Accelerator's, which solved the same problem first. What
   is Theory Lab's own is the lesson rail down the left, the owner's mode copy
   as the reading steps, and Listen as the closing step.

   THE VIEWPORT LOCK IS A FLEX CHAIN from html down, not a subtracted bar
   height — see lesson.css. Guessing the chrome's height leaves the page a
   pixel or two scrollable, which is the whole thing it was meant to prevent.
   ============================================================================ */
(() => {
  const esc = AccelWidgets.esc, view = document.getElementById('view');
  let active = null, path = '', params = {}, mounted = [];
  const inFrame = (() => { try { return self !== top; } catch(_){ return true; } })();
  const href = l => '#/' + l.module + '/' + l.id;
  const isLab = l => l.kind === 'lab';
  const COUNTED = () => LESSONS.filter(l => !isLab(l));
  const state = id => Accel.done(id) ? 'Completed'
    : Accel.lesson(id).exerciseDone ? 'Practised'
    : Accel.lesson(id).seen ? 'In progress' : 'Not started';

  /* A deep link carries its preset in the hash: #/lessons/lydian?root=D
     The route is the part before the ?; the rest is handed to the widget. */
  function parseRoute(raw){
    const text = String(raw || '/'), cut = text.indexOf('?');
    if(cut < 0) return { route:text, query:{} };
    const query = {};
    new URLSearchParams(text.slice(cut + 1)).forEach((v, k) => { query[k] = v; });
    return { route:text.slice(0, cut), query };
  }

  /* -------------------------------------------------- the product's hooks -- */
  const copyFor = l => {
    if(typeof LESSON_COPY !== 'function') return {};
    try { return LESSON_COPY(l) || {}; } catch(err){ console.error('[lesson copy]', err); return {}; }
  };
  const panelsFor = l => {
    if(typeof LESSON_PANELS !== 'function') return [];
    try { return LESSON_PANELS(l) || []; } catch(err){ console.error('[lesson panels]', err); return []; }
  };
  const credit = l => (typeof LESSON_CREDIT === 'function') ? LESSON_CREDIT(l, esc) : esc(l.source || '');

  /* Links, never an embed: the videos sit behind the course platform's paywall
     and only it may serve them. They belong on the opening step, which is
     where you decide whether to watch first or play first. */
  function videoRow(l){
    if(!l.videos || !l.videos.length) return '';
    return '<nav class="ac-videos" aria-label="Lesson videos">' + l.videos.map(v =>
      '<a class="ac-video" href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<svg width="9" height="11" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">' +
      '<path d="M0 0l12 7-12 7z"/></svg><b>' + esc(v.title) + '</b>' +
      (v.minutes ? '<span>' + esc(v.minutes) + ' min</span>' : '') + '</a>').join('') + '</nav>';
  }

  /* ======================================================= the step list === */
  /* WHAT A READER ACTUALLY READS. A colour mode has the owner's words in
     MODE_COPY; the lesson's own `body` is a draft written from the theory
     layer and saying both would be the same thing twice at twice the length.
     So: the owner's words where they exist, the body where they do not. */
  const wordsIn = h => String(h).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  function autoBeats(paras){
    const out = []; let cur = [], n = 0;
    paras.forEach((p, i) => { cur.push(i); n += wordsIn(p); if(n >= 90){ out.push({ p:cur }); cur = []; n = 0; } });
    if(cur.length) out.push({ p:cur });
    return out;
  }
  function readingOf(l){
    const c = copyFor(l);
    if(c.about && c.about.length) return { source:c.about, beats:c.about.map((_, i) => ({ p:[i] })) };
    const body = l.body || [];
    return { source:body, beats:(l.beats || autoBeats(body)) };
  }

  function stepsOf(l){
    const steps = [{ type:'try', label:'Try it' }];
    const r = readingOf(l);
    r.beats.forEach(b => steps.push({ type:'read', beat:b, read:r.source, label:'Why' }));
    if(l.ex) steps.push({ type:'do', label:'Practise' });
    (l.quiz || []).forEach((q, qi) => steps.push({ type:'quiz', qi, label:'Check' }));
    panelsFor(l).forEach(pn => steps.push({ type:'panel', panel:pn, label:pn.label }));
    steps.push({ type:'end', label:'Done' });
    return steps;
  }

  /* ========================================================== the chrome === */
  /* THE LESSON RAIL. A course should show where you are in it without a click,
     the way every course platform does. It is built from LESSONS, so a new
     lesson appears here without this function changing. */
  function lessonRail(current){
    const mods = MODULES.filter(m => LESSONS.some(l => l.module === m.id));
    return '<nav class="lrail" aria-label="Lessons">' +
      '<a class="lrail-home" href="#/">' +
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
        '<path d="M7.5 2.5 4 6l3.5 3.5"/></svg>Overview</a>' +
      mods.map(m => '<div class="lrail-group"><p>' + esc(m.title) + '</p>' +
        LESSONS.filter(l => l.module === m.id).map(l => {
          const on = current && l.id === current.id;
          return '<a href="' + href(l) + '"' + (on ? ' aria-current="page"' : '') + '>' +
            (isLab(l) ? '<i class="lrail-dot" data-tool></i>' : '<i class="lrail-dot" data-done="' + Accel.done(l.id) + '"></i>') +
            '<span>' + esc(l.title) + '</span></a>';
        }).join('') + '</div>').join('') +
      '</nav>';
  }

  /* ========================================================== the views === */
  function overview(mod){
    const counted = COUNTED();
    const next = counted.find(l => !Accel.done(l.id)) || counted[0] || LESSONS[0];
    const last = Accel.last();
    const resume = LESSONS.some(l => last === '/' + l.module + '/' + l.id) ? last : '/' + next.module + '/' + next.id;
    return '<div class="owrap">' +
      '<header class="hero"><div class="eyebrow">' + esc((MODULES[0] || {}).title || 'Course') + ' · ' +
        counted.length + ' lessons</div>' +
      '<h1 tabindex="-1">' + (mod ? esc(mod.title) : esc((MODULES[0] || {}).title || 'Course')) + '</h1>' +
      '<p>' + esc((MODULES[0] || {}).lede || '') + '</p>' +
      '<a class="btn gold" href="#' + resume + '">Resume</a></header>' +
      (mod ? [mod] : MODULES).map(m => {
        const mine = LESSONS.filter(l => l.module === m.id);
        if(!mine.length) return '';
        const done = mine.filter(l => !isLab(l) && Accel.done(l.id)).length;
        const n = mine.filter(l => !isLab(l)).length;
        return '<section class="omod"><h2>' + esc(m.title) + '</h2>' +
          '<p>' + (n ? done + ' of ' + n + ' complete' : esc(m.subtitle || '')) + '</p><div class="ocards">' +
          mine.map(l => '<a class="ocard ' + (Accel.done(l.id) ? 'done' : '') + '" href="' + href(l) + '">' +
            '<span class="on">' + (l.n || '·') + '</span><div><h3>' + esc(l.title) + '</h3>' +
            '<p>' + esc(l.short || l.claim || '') + '</p></div>' +
            '<span class="otag">' + (isLab(l) ? 'Open' : state(l.id)) + '</span></a>').join('') +
          '</div></section>';
      }).join('') + '</div>';
  }

  /* A TOOL IS A WIDGET WITH NO LESSON AROUND IT. No steps, no reading column:
     the thing fills the page, which is what you came for. */
  function toolView(l){
    return '<div class="twrap">' +
      '<div class="thead"><div class="eyebrow">Tool</div><h1 tabindex="-1">' + esc(l.title) + '</h1>' +
      (l.claim ? '<p class="claim">' + esc(l.claim) + '</p>' : '') + '</div>' +
      '<div class="demo" id="demo-host"></div>' +
      (l.demoNote ? '<p class="demo-note">' + esc(l.demoNote) + '</p>' : '') + '</div>';
  }

  function lessonView(l){
    const steps = stepsOf(l);
    return '<div class="lwrap">' +
      lessonRail(l) +
      '<div class="lmain">' +
        '<div class="lhead"><div class="eyebrow">' + (l.n ? 'Lesson ' + l.n : 'Lesson') + '</div>' +
          '<h1 tabindex="-1">' + esc(l.title) + '</h1></div>' +
        '<div class="lcols">' +
          '<aside class="lside">' +
            '<div class="rail" id="rail">' + steps.map((st, k) =>
              '<button data-s="' + k + '" aria-label="Step ' + (k + 1) + ': ' + esc(st.label) + '"></button>').join('') +
              '<span class="rail-n" id="rail-n"></span></div>' +
            '<div class="lstep" id="lstep"></div>' +
            '<div class="lnav"><button class="btn" id="st-back">Back</button><span class="sp"></span>' +
              '<span class="hint" id="st-hint"></span>' +
              '<button class="btn next" id="st-next">Next</button></div>' +
          '</aside>' +
          /* no demo note here: the step beside it is the explanation, and
             saying it twice is what this layout exists to stop */
          '<div class="lplay"><div class="demo" id="demo-host"></div>' +
            '<div class="lpanel" id="panel-host" hidden></div></div>' +
        '</div></div></div>';
  }

  /* ============================================================ stepping === */
  let curSteps = [], curStep = 0, curLesson = null;

  function showStep(i){
    const l = curLesson;
    if(!l || i < 0 || i >= curSteps.length) return;
    curStep = i;
    const st = curSteps[i], box = document.getElementById('lstep'), p = Accel.lesson(l.id);
    const c = copyFor(l);

    if(st.type === 'try'){
      box.innerHTML = '<div class="step-try"><div class="eyebrow">Try it first</div>' +
        '<p class="claim">' + esc(c.tagline || l.claim || '') + '</p>' +
        (c.useFor && c.useFor.length
          ? '<div class="ac-usefor"><span class="ac-usefor-lab">Use it for</span>' +
            c.useFor.map(u => '<span class="ac-chip">' + esc(u) + '</span>').join('') + '</div>' : '') +
        videoRow(l) + '</div>';
    }
    else if(st.type === 'read'){
      box.innerHTML = '<div><div class="eyebrow">Why it works</div>' +
        (st.beat.t ? '<h2 class="step-h">' + esc(st.beat.t) + '</h2>' : '') +
        '<div class="prose">' + st.beat.p.map(k => '<p>' + st.read[k] + '</p>').join('') + '</div></div>';
    }
    else if(st.type === 'do'){
      const level = ['beginner','intermediate','advanced'].includes(p.level) ? p.level : 'beginner';
      box.innerHTML = '<div><div class="eyebrow">Practise</div>' +
        (l.challenge ? '<p class="step-lead">' + esc(l.challenge) + '</p>' : '') +
        '<label class="ac-field">Choose your exercise<select data-level>' +
        ['beginner','intermediate','advanced'].map(k => '<option value="' + k + '"' +
          (level === k ? ' selected' : '') + '>' + k[0].toUpperCase() + k.slice(1) + '</option>').join('') +
        '</select></label><p data-exercise>' + esc(l.ex[level]) + '</p>' +
        '<div class="ac-actions"><button class="btn gold" data-challenge>Check my attempt</button>' +
        '<button class="btn" data-exercise-done aria-pressed="' + !!p.exerciseDone + '">' +
        (p.exerciseDone ? '✓ Recorded' : 'Mark practised') + '</button></div>' +
        '<p class="ac-feedback" role="status" data-challenge-feedback></p></div>';
      box.querySelector('[data-level]').onchange = e => {
        Accel.patch(l.id, { level:e.target.value });
        box.querySelector('[data-exercise]').textContent = l.ex[e.target.value];
      };
      box.querySelector('[data-exercise-done]').onclick = e => {
        Accel.patch(l.id, { exerciseDone:true, practisedLevel:box.querySelector('[data-level]').value });
        e.currentTarget.setAttribute('aria-pressed', 'true');
        e.currentTarget.textContent = '✓ Recorded';
        paintRail();
      };
      box.querySelector('[data-challenge]').onclick = () => {
        const r = active.check(), pr = Accel.lesson(l.id);
        Accel.patch(l.id, { challengeAttempts:(pr.challengeAttempts || 0) + 1,
                            challengePassed:!!pr.challengePassed || r.ok });
        box.querySelector('[data-challenge-feedback]').textContent =
          (r.ok ? 'Constraint met. ' : 'Keep exploring. ') + r.text;
      };
    }
    else if(st.type === 'quiz'){ quizStep(l, st.qi, box); }
    else if(st.type === 'panel'){
      /* THE PANEL TAKES THE WIDE COLUMN. Three video cards do not fit a 390px
         reading column and should not have to: this is the step where the
         thing to look at is the recordings, so they get the space the widget
         usually has, and the reading column introduces them. */
      box.innerHTML = '<div><div class="eyebrow">' + esc(st.panel.label) + '</div>' +
        (st.panel.lead ? '<p class="step-lead">' + esc(st.panel.lead) + '</p>' : '') + '</div>';
      const host = document.getElementById('panel-host');
      if(host && !host.dataset.on){
        host.dataset.on = '1';
        try { const live = st.panel.mount(host); if(live && live.destroy) mounted.push(live); }
        catch(err){ console.error('[lesson panels]', err);
          host.innerHTML = '<p class="ac-feedback" role="alert">This could not load.</p>'; }
      }
    }
    else {
      const score = Accel.lesson(l.id).score;
      const counted = COUNTED(), at = counted.indexOf(l), next = counted[at + 1];
      box.innerHTML = '<div class="step-end"><div class="tick">✓</div><h2>' + esc(l.title) + '</h2>' +
        '<p class="src">' + (typeof score === 'number' ? score + ' of ' + (l.quiz || []).length + ' correct'
                                                       : 'Questions not yet answered') +
        (Accel.lesson(l.id).exerciseDone ? ' · exercise recorded' : '') + '</p>' +
        '<a class="btn gold go" href="' + (next ? href(next) : '#/') + '">' +
        (next ? 'Next: ' + esc(next.title) : 'Back to the course') + '</a>' +
        '<p class="src credit">' + credit(l) + '</p></div>';
    }

    /* one occupant of the wide column at a time */
    const demo = document.getElementById('demo-host'), pane = document.getElementById('panel-host');
    if(demo && pane){
      const onPanel = st.type === 'panel';
      demo.hidden = onPanel;
      pane.hidden = !onPanel;
      /* nothing of ours should be sounding under a video */
      if(onPanel) AccelAudio.stop();
    }

    /* the demonstration follows the explanation */
    if(active && active.step) active.step({ index:i, type:st.type, beat:st.beat, label:st.label });

    const seen = Math.max(Accel.lesson(l.id).step || 0, i);
    Accel.patch(l.id, { step:seen });
    paintRail(seen);
    document.getElementById('rail-n').textContent = (i + 1) + ' / ' + curSteps.length + ' · ' + st.label;
    document.getElementById('st-back').disabled = i === 0;
    document.getElementById('st-next').textContent = i === curSteps.length - 1 ? 'Finish' : 'Next';
    document.getElementById('st-hint').textContent = '';
    box.scrollTop = 0;

    /* the step is in the hash, so a link can open one */
    const base = '/' + l.module + '/' + l.id;
    const nextPath = i === 0 ? base : base + '?step=' + (i + 1);
    if(!inFrame) history.replaceState({ path:nextPath }, '', '#' + nextPath);
  }

  function paintRail(seen){
    const l = curLesson; if(!l) return;
    const s = seen == null ? Math.max(Accel.lesson(l.id).step || 0, curStep) : seen;
    const rail = document.getElementById('rail'); if(!rail) return;
    [...rail.querySelectorAll('button')].forEach((b, k) => {
      b.className = k === curStep ? 'on' : k <= s ? 'seen' : '';
    });
  }

  /* One question per step. Answers live in the model, so stepping away and
     back keeps them, and the retry clears the lesson's whole set. */
  function quizStep(l, qi, box){
    const stored = Accel.lesson(l.id).answers;
    let answers = Array.isArray(stored) && stored.length === l.quiz.length
      ? stored.map((v, i) => Number.isInteger(v) && v >= 0 && v < l.quiz[i].o.length ? v : null)
      : l.quiz.map(() => null);
    const q = l.quiz[qi];
    function draw(){
      const a = answers[qi];
      box.innerHTML = '<div><div class="eyebrow">Check yourself · ' + (qi + 1) + ' of ' + l.quiz.length + '</div>' +
        '<fieldset class="q"><legend>' + esc(q.q) + '</legend><div class="opts">' +
        q.o.map((o, j) => '<button class="opt ' + (a === null ? '' : j === q.a ? 'right' : a === j ? 'wrong' : '') +
          '" data-answer="' + j + '"' + (a !== null ? ' disabled' : '') + '>' + esc(o) + '</button>').join('') +
        '</div>' + (a !== null ? '<p class="why on">' + (a === q.a ? 'Correct. ' : 'Compare the highlighted answer. ') +
          esc(q.why) + '</p>' : '') + '</fieldset>' +
        (a !== null ? '<button class="btn" data-retry>Try the questions again</button>' : '') +
        '<p role="status" data-quiz-status></p></div>';
      box.querySelectorAll('[data-answer]').forEach(b => b.onclick = () => {
        answers[qi] = Number(b.dataset.answer);
        Accel.patch(l.id, { answers });
        draw();
        const why = box.querySelector('.why'); if(why){ why.tabIndex = -1; why.focus(); }
      });
      const retry = box.querySelector('[data-retry]');
      if(retry) retry.onclick = () => { answers = l.quiz.map(() => null); Accel.patch(l.id, { answers }); draw(); };
      if(answers.every(x => x !== null)){
        const score = Accel.quiz(l.id, answers, l.quiz);
        box.querySelector('[data-quiz-status]').textContent = score + ' of ' + l.quiz.length + ' correct. ' +
          (score === l.quiz.length ? 'Understanding check passed.' : 'Your previous best result is retained.');
        paintRail();
      }
      document.getElementById('st-hint').textContent = answers[qi] === null ? 'Pick an answer' : '';
    }
    draw();
  }

  /* ================================================================ init === */
  function init(l){
    Accel.patch(l.id, { seen:true });
    Accel.setLast('/' + l.module + '/' + l.id);
    const { step:wantStep, ...widgetParams } = params;
    active = AccelWidgets.mount(document.getElementById('demo-host'), l, widgetParams);
    if(isLab(l)) return;

    curLesson = l; curSteps = stepsOf(l); curStep = 0;
    document.getElementById('rail').onclick = e => {
      const b = e.target.closest('button[data-s]'); if(b) showStep(+b.dataset.s);
    };
    document.getElementById('st-back').onclick = () => showStep(curStep - 1);
    document.getElementById('st-next').onclick = () => {
      if(curStep === curSteps.length - 1){ const a = document.querySelector('.step-end .go'); if(a) a.click(); return; }
      showStep(curStep + 1);
    };
    document.addEventListener('keydown', keys);
    const want = Math.max(0, Math.min(curSteps.length - 1, (Number(wantStep) || 1) - 1));
    showStep(want);
  }

  /* Left and right move through the lesson, which is what a deck does and
     what a reader reaches for. Not while they are typing in something. */
  function keys(e){
    if(!curLesson || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    /* The widget has arrow keys of its own — the scrubber seeks with them, the
       keyboard walks with them — so once focus is inside it, the arrows belong
       to the instrument and not to the lesson's Back and Next. */
    if(t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' ||
             t.isContentEditable || (t.closest && t.closest('#demo-host')))) return;
    if(e.key === 'ArrowRight' && curStep < curSteps.length - 1){ e.preventDefault(); showStep(curStep + 1); }
    if(e.key === 'ArrowLeft'  && curStep > 0){ e.preventDefault(); showStep(curStep - 1); }
  }

  function backups(){
    const ex = view.querySelector('[data-export]'); if(!ex) return;
    ex.onclick = () => {
      const blob = new Blob([Accel.export()], { type:'application/json' });
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'theory-lab-progress.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }

  function progress(){
    const txt = document.getElementById('prog-txt'); if(!txt) return;
    const counted = COUNTED(), n = counted.filter(l => Accel.done(l.id)).length;
    txt.textContent = n + ' of ' + counted.length;
    const fill = document.getElementById('prog-fill');
    if(fill) fill.style.width = (n / (counted.length || 1)) * 100 + '%';
  }

  function route(next, restore = false){
    if(active){ active.capture(); active.destroy(); active = null; }
    mounted.forEach(m => { try { m.destroy(); } catch(_){} }); mounted = [];
    document.removeEventListener('keydown', keys);
    curLesson = null; curSteps = []; curStep = 0;
    AccelAudio.stop();

    const parsed = parseRoute(next || '/');
    path = parsed.route || '/'; params = parsed.query;
    const parts = path.replace(/^\/?/, '').split('/').filter(Boolean);
    const mod = MODULES.find(m => m.id === parts[0]);
    const l = LESSONS.find(x => x.module === parts[0] && x.id === parts[1]);

    view.innerHTML = l ? (isLab(l) ? toolView(l) : lessonView(l)) : overview(mod);
    /* Every route is locked to one screen: a lesson through .lesson-view, a
       tool through .tool-view, the overview through .over-view. Three classes
       rather than one because each has a different thing that stretches — the
       step column, the widget, the card grid. */
    const html = document.documentElement;
    html.classList.toggle('lesson-view', !!(l && !isLab(l)));
    html.classList.toggle('tool-view', !!(l && isLab(l)));
    html.classList.toggle('over-view', !l);
    const where = document.getElementById('nav-where');
    if(where) where.textContent = l ? l.title : mod ? mod.title : 'Course';
    const prog = document.querySelector('.prog');
    if(prog) prog.classList.toggle('is-hidden', !!(l && isLab(l)));

    try { if(l) init(l); else backups(); }
    catch(err){
      const h = document.getElementById('demo-host');
      if(h) h.innerHTML = '<p class="ac-feedback" role="alert">The activity could not start. Your saved progress is retained. Reload to retry.</p>';
      console.error('[Theory Lab]', err);
    }
    progress();
    const heading = view.querySelector('h1');
    if(heading){ heading.tabIndex = -1; heading.focus({ preventScroll:true }); }
    window.scrollTo({ top:0, behavior:'instant' });
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/"]');
    if(!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const next = a.getAttribute('href').slice(1);
    if(!inFrame) history.pushState({ path:next }, '', '#' + next);
    route(next);
  });
  window.addEventListener('popstate', () => route(location.hash.slice(1), true));
  route(location.hash.slice(1) || '/', true);
})();
