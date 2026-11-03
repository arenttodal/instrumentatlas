/* Course navigation, persistent checks and composition backups. */
(() => {
  const esc=AccelWidgets.esc,view=document.getElementById('view');let active=null,path='',params={},observer=null;
  const inFrame=(()=>{try{return self!==top;}catch(_){return true;}})();
  const href=l=>'#/'+l.module+'/'+l.id;
  const state=id=>Accel.done(id)?'Completed':Accel.lesson(id).exerciseDone?'Practised':Accel.lesson(id).seen?'In progress':'Not started';

  /* A LAB ENTRY is a widget with no lesson around it: the Explore section and
     nothing else. It is still a LESSONS row so the router and the widget mount
     reach it unchanged, but it is not a lesson, so it never counts toward
     progress and the pager never walks into one. Everything that asks "how
     many lessons" asks COUNTED, never LESSONS. */
  const isLab=l=>l.kind==='lab';
  const COUNTED=LESSONS.filter(l=>!isLab(l));
  const countedIn=id=>COUNTED.filter(l=>l.module===id);

  /* A deep link carries its preset in the hash: #/lab/reharm?mode=lydian&root=D
     The route is the part before the ?; the rest is handed to the widget. */
  function parseRoute(raw){
    const text=String(raw||'/'), cut=text.indexOf('?');
    if(cut<0) return {route:text, query:{}};
    const query={};
    new URLSearchParams(text.slice(cut+1)).forEach((v,k)=>{ query[k]=v; });
    return {route:text.slice(0,cut), query};
  }
  function progress(){const n=COUNTED.filter(l=>Accel.done(l.id)).length,total=COUNTED.length||1;document.getElementById('prog-txt').textContent=n+' of '+COUNTED.length;document.getElementById('prog-fill').style.width=n/total*100+'%';document.querySelector('.prog').setAttribute('aria-label',n+' of '+COUNTED.length+' lessons completed');view.querySelectorAll('[data-lesson-status]').forEach(e=>e.textContent=state(e.dataset.lessonStatus));}
  function outline(l){return '<details class="ac-outline"><summary>Lessons'+(l?' · '+esc(l.title):'')+'</summary><nav aria-label="Accelerator lessons"><a href="#/">Course overview</a>'+MODULES.map(m=>'<p>'+esc(m.title)+'</p>'+LESSONS.filter(x=>x.module===m.id).map(x=>'<a href="'+href(x)+'" '+(x===l?'aria-current="page"':'')+'>'+(x.n?x.n+'. ':'')+esc(x.title)+(isLab(x)?'':'<span data-lesson-status="'+x.id+'">'+state(x.id)+'</span>')+'</a>').join('')).join('')+'</nav></details>';}
  function overview(mod){const next=COUNTED.find(l=>!Accel.done(l.id))||COUNTED[0]||LESSONS[0],last=Accel.last(),resume=LESSONS.some(l=>last==='/'+l.module+'/'+l.id)?last:'/'+next.module+'/'+next.id;
    return '<div class="wrap ac-course">'+outline()+'<header class="hero"><div class="eyebrow">Interactive learning · 12 lessons</div><h1>'+(mod?esc(mod.title):'The Accelerator')+'<em>Hear it. Shape it. Make it yours.</em></h1><p>Explore a musical idea, apply it in a short challenge, then develop your own sketch. Your progress and musical work stay in this browser.</p><a class="btn gold" href="#'+resume+'">Resume learning</a></header>'+(mod?[mod]:MODULES).map(m=>'<section class="ac-module"><h2>'+esc(m.title)+'</h2><p>'+(countedIn(m.id).length?countedIn(m.id).filter(l=>Accel.done(l.id)).length+' of '+countedIn(m.id).length+' complete':esc(m.subtitle||''))+'</p><div class="lessons">'+LESSONS.filter(l=>l.module===m.id).map(l=>'<a class="lcard '+(Accel.done(l.id)?'done':'')+'" href="'+href(l)+'"><span class="lnum">'+(l.n||'')+'</span><div><h3>'+esc(l.title)+'</h3><p>'+esc(l.short||l.claim||'')+'</p></div><span class="ltag">'+(isLab(l)?'Open':state(l.id))+'</span></a>').join('')+'</div></section>').join('')+
    '<section class="ac-backups"><h2>Your saved work</h2><p>Download a backup to keep progress and sketches or move them to another browser. Import retains completed progress and replaces the shared sketch with the imported version.</p><button class="btn" data-export>Download backup</button><label class="btn">Import backup<input type="file" data-import accept=".json,application/json"></label><p role="status" data-backup-status></p></section></div>';
  }
  /* THE LESSON PAGE. Five sections in a fixed order, which is the shape the
     Accelerator was designed around and the one a second product inherits.

     Two things vary. A LAB ENTRY (kind:'lab') is a widget on its own: Explore
     and nothing else, full width, no pager, no practice, no quiz, not counted.
     And a lesson may carry VIDEOS, which render as a row of links under the
     claim — links, never an embed, because the video lives behind the course
     platform's own paywall and only it may serve them. */
  /* The credit line. The Accelerator's own is the default; a second product
     sets LESSON_CREDIT in its data file, because the samples it plays and the
     thing its lessons condense are not this one's. It is raw HTML by design —
     these are attribution links and they are legally required to work. */
  const credit = l => (typeof LESSON_CREDIT === 'function')
    ? LESSON_CREDIT(l, esc)
    : 'Based on ' + esc(l.source) + ', Cinematic Music Accelerator. Samples: ' +
      '<a href="https://github.com/gleitz/midi-js-soundfonts">FluidR3 GM / MIDI.js Soundfonts</a>, ' +
      '<a href="https://creativecommons.org/licenses/by/3.0/us/">CC BY 3.0</a>. ' +
      'Samples transposed and level-adjusted during playback. ' +
      '<a href="accelerator/AUDIO-CREDITS.md">Audio credits and limitations</a>.';

  const SECTIONS=[['explore','Explore'],['why','Why it works'],['challenge','Challenge'],['practice','Practise'],['check','Check yourself']];

  function videoRow(l){
    if(!Array.isArray(l.videos)||!l.videos.length) return '';
    return '<nav class="ac-videos" aria-label="Videos for this lesson">'+l.videos.map(v=>
      '<a class="ac-video" href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer">'+
      '<svg viewBox="0 0 16 16" aria-hidden="true" width="13" height="13"><path d="M5.5 3.8v8.4l7-4.2z" fill="currentColor"/></svg>'+
      '<b>'+esc(v.title||v.part||'Watch')+'</b>'+(v.minutes?'<span>'+esc(v.minutes)+' min</span>':'')+'</a>').join('')+
      '<span class="ac-videos-note">Watch on Circle</span></nav>';
  }

  function lessonView(l){
    const lab=isLab(l), i=COUNTED.indexOf(l), p=Accel.lesson(l.id),
          level=['beginner','intermediate','advanced'].includes(p.level)?p.level:'beginner',
          mod=MODULES.find(m=>m.id===l.module);
    const head='<div class="wrap">'+outline(l)+'<article class="lesson'+(lab?' is-lab':'')+'">'+
      '<nav class="crumb"><a href="#/">Course</a><span>/</span><a href="#/'+l.module+'">'+esc(mod?mod.title:l.module)+'</a></nav>'+
      (lab?'<div class="eyebrow lesson-n">Tool</div>':'<div class="eyebrow lesson-n">Lesson '+(i+1)+' of '+COUNTED.length+'</div>')+
      '<h1 tabindex="-1">'+esc(l.title)+'</h1>'+
      (l.claim?'<p class="claim">'+esc(l.claim)+'</p>':'')+videoRow(l)+
      (lab?'':'<nav class="ac-sections" aria-label="Lesson sections">'+SECTIONS.map(([id,name])=>'<a href="#'+id+'" data-section="'+id+'">'+name+'</a>').join('')+'</nav>');

    if(lab) return head+
      '<section class="sec" id="explore"><h2 class="sr-only">Explore</h2>'+
      (l.demoNote?'<p class="ac-instruction">'+esc(l.demoNote)+'</p>':'')+
      '<div class="demo" id="demo-host"></div></section>'+
      (l.source?'<p class="source">'+esc(l.source)+'</p>':'')+
      '<nav class="pager"><a href="#/'+l.module+'">Back to '+esc(mod?mod.title:'tools')+'</a></nav></article></div>';

    const prev=COUNTED[i-1], next=COUNTED[i+1];
    return head+
    '<section class="sec" id="explore"><h2>Explore</h2><p class="ac-instruction">'+esc(l.demoNote)+'</p><div class="demo" id="demo-host"></div></section>'+
    '<section class="sec" id="why"><h2>Why it works</h2><div class="prose">'+l.body.map(p=>'<p>'+p+'</p>').join('')+'</div></section>'+
    '<section class="sec" id="challenge"><h2>Try a challenge</h2><p data-challenge-prompt></p><div class="ac-actions"><button class="btn gold" data-challenge>Check my attempt</button><button class="btn" data-hint>Show a hint</button><button class="btn" data-replay>Replay my work</button></div><p class="ac-feedback" role="status" data-challenge-feedback></p></section>'+
    '<section class="sec" id="practice"><h2>Practise</h2><label class="ac-field">Choose your exercise<select data-level>'+['beginner','intermediate','advanced'].map(k=>'<option value="'+k+'" '+(level===k?'selected':'')+'>'+k[0].toUpperCase()+k.slice(1)+'</option>').join('')+'</select></label><p data-exercise>'+esc(l.ex[level])+'</p><button class="btn" data-exercise-done aria-pressed="'+!!p.exerciseDone+'">'+(p.exerciseDone?'✓ Exercise recorded':'Mark this exercise practised')+'</button><p class="ac-caption">Record the exercise you practised. You can try another level at any time.</p></section>'+
    '<section class="sec" id="check"><h2>Check yourself</h2><div data-quiz></div><button class="btn" data-retry>Try the questions again</button><p role="status" data-quiz-status></p></section>'+
    '<p class="source">'+credit(l)+'</p>'+
    '<nav class="pager">'+(prev?'<a href="'+href(prev)+'"><span>Previous</span><b>'+esc(prev.title)+'</b></a>':'<a href="#/">Course overview</a>')+(next?'<a class="r" href="'+href(next)+'"><span>'+(next.module!==l.module?'Next module':'Next lesson')+'</span><b>'+esc(next.title)+'</b></a>':'<a class="r" href="#/"><span>Finish</span><b>Review progress and saved work</b></a>')+'</nav></article></div>';
  }
  function quizzes(l){const host=view.querySelector('[data-quiz]'),old=Accel.lesson(l.id).answers;let answers=Array.isArray(old)&&old.length===l.quiz.length?old.map((v,i)=>Number.isInteger(v)&&v>=0&&v<l.quiz[i].o.length?v:null):l.quiz.map(()=>null);
    function draw(){host.innerHTML=l.quiz.map((q,i)=>'<fieldset class="q"><legend>'+esc(q.q)+'</legend><div class="opts">'+q.o.map((o,j)=>'<button class="opt '+(answers[i]===null?'':j===q.a?'right':answers[i]===j?'wrong':'')+'" data-q="'+i+'" data-answer="'+j+'" '+(answers[i]!==null?'disabled':'')+'>'+esc(o)+'</button>').join('')+'</div>'+(answers[i]!==null?'<p class="why on">'+(answers[i]===q.a?'Correct. ':'Compare the highlighted answer. ')+esc(q.why)+'</p>':'')+'</fieldset>').join('');if(answers.every(a=>a!==null)){const score=Accel.quiz(l.id,answers,l.quiz);view.querySelector('[data-quiz-status]').textContent=score+' of '+l.quiz.length+' correct. '+(score===l.quiz.length?'Understanding check passed.':'Review the explanations and retry. Your previous best result is retained.');progress();}}
    host.onclick=e=>{const b=e.target.closest('[data-answer]');if(!b)return;const qi=Number(b.dataset.q);answers[qi]=Number(b.dataset.answer);Accel.patch(l.id,{answers});draw();const feedback=host.querySelectorAll('.q')[qi].querySelector('.why');feedback.tabIndex=-1;feedback.focus();};
    view.querySelector('[data-retry]').onclick=()=>{answers=l.quiz.map(()=>null);Accel.patch(l.id,{answers});draw();view.querySelector('[data-quiz-status]').textContent='New attempt. Your best result is retained.';host.querySelector('button').focus();};draw();
  }
  const prompts={overtones:'Hear the target, then recreate its harmonic balance.',perspective:'Bring Harmony forward and confirm the result by listening.',separation:'Make the melody easier to follow using exactly one separation tool.','tone-colour':'Play a mystery sample, then select the instrument you hear.',voicing:'Keep a complete C-major triad, reinforce C and try wider low spacing.','voice-leading':'Keep Am, F, C and G complete, moving each voice by no more than two semitones.',motifs:'Write three to five notes that you can sing back.',prevade:'Build a phrase with familiar material, a variation and an independent new ending.','question-answer':'Compare B4 over V followed by C5 over I to hear the leading tone resolve.',harmony:'Include ii or vi, finish on I, then compare the primary chords.',countermelody:'Place at least one response in a rest in the theme.',ostinato:'Use at least four onsets and an accent. Lower the pattern until the melody is clear.'};
  function init(l){Accel.patch(l.id,{seen:true});Accel.setLast('/'+l.module+'/'+l.id);
    /* the widget gets the preset merged with whatever the deep link asked for */
    active=AccelWidgets.mount(document.getElementById('demo-host'),l,params);
    if(isLab(l)) return;                       // a lab entry has no lesson around it
    view.querySelector('[data-challenge-prompt]').textContent=l.challenge||prompts[l.id]||'';const feedback=view.querySelector('[data-challenge-feedback]');
    view.querySelector('[data-challenge]').onclick=()=>{const r=active.check(),p=Accel.lesson(l.id);Accel.patch(l.id,{challengeAttempts:(p.challengeAttempts||0)+1,challengePassed:!!p.challengePassed||r.ok});feedback.textContent=(r.ok?'Exercise constraint met. ':'Keep exploring. ')+r.text;};view.querySelector('[data-hint]').onclick=()=>feedback.textContent=active.check().text;view.querySelector('[data-replay]').onclick=()=>active.play();
    view.querySelector('[data-level]').onchange=e=>{Accel.patch(l.id,{level:e.target.value});view.querySelector('[data-exercise]').textContent=l.ex[e.target.value];};view.querySelector('[data-exercise-done]').onclick=e=>{Accel.patch(l.id,{exerciseDone:true,practisedLevel:view.querySelector('[data-level]').value});e.currentTarget.setAttribute('aria-pressed','true');e.currentTarget.textContent='✓ Exercise recorded';progress();};quizzes(l);
    if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)view.querySelectorAll('[data-section]').forEach(a=>{if(a.dataset.section===e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}),{rootMargin:'-15% 0px -65% 0px'});view.querySelectorAll('section.sec').forEach(s=>observer.observe(s));}
  }
  function backups(){view.querySelector('[data-export]').onclick=()=>{const blob=new Blob([Accel.export()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='accelerator-progress-and-sketches.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};view.querySelector('[data-import]').onchange=async e=>{const f=e.target.files[0],feedback=view.querySelector('[data-backup-status]');if(!f)return;try{if(f.size>2e6)throw Error('Choose an Accelerator backup smaller than 2 MB.');Accel.import(await f.text());feedback.textContent='Backup imported. Completed progress was retained.';progress();}catch(err){feedback.textContent=err.message;}};}
  function route(next,restore=false){
    const old=LESSONS.find(l=>path==='/'+l.module+'/'+l.id);if(old)Accel.patch(old.id,{scroll:window.scrollY});if(active){active.capture();active.destroy();active=null;}AccelAudio.stop();observer?.disconnect();observer=null;
    const parsed=parseRoute(next||'/');path=parsed.route||'/';params=parsed.query;
    const parts=path.replace(/^\/?/,'').split('/').filter(Boolean),mod=MODULES.find(m=>m.id===parts[0]),l=LESSONS.find(l=>l.module===parts[0]&&l.id===parts[1]);view.innerHTML=l?lessonView(l):overview(mod);document.getElementById('nav-where').textContent=l?l.title:mod?mod.title:'Course';
    try{if(l)init(l);else backups();}catch(err){const h=document.getElementById('demo-host');if(h)h.innerHTML='<p class="ac-feedback" role="alert">The activity could not start. Your saved progress is retained. Reload to retry.</p>';console.error('[Accelerator]',err);}
    progress();if(!Accel.writable()){const p=document.createElement('p');p.className='ac-feedback';p.textContent='Browser storage is unavailable. Download a backup before closing this page.';view.prepend(p);}
    const heading=view.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});window.scrollTo({top:l&&restore?Accel.lesson(l.id).scroll||0:0,behavior:'instant'});
  }
  document.addEventListener('click',e=>{const section=e.target.closest('[data-section]');if(section){e.preventDefault();document.getElementById(section.dataset.section)?.scrollIntoView({behavior:'auto',block:'start'});return;}const a=e.target.closest('a[href^="#/"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();const next=a.getAttribute('href').slice(1);if(!inFrame)history.pushState({path:next},'','#'+next);route(next);});
  window.addEventListener('popstate',()=>route(location.hash.slice(1)||'/',true));window.addEventListener('hashchange',()=>{const next=location.hash.slice(1)||'/';if(next!==path)route(next);});window.addEventListener('beforeunload',()=>{active?.capture();const l=LESSONS.find(l=>path==='/'+l.module+'/'+l.id);if(l)Accel.patch(l.id,{scroll:window.scrollY});});
  route(!inFrame&&location.hash.startsWith('#/')?location.hash.slice(1):'/');
})();
