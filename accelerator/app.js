/* Course navigation, persistent checks and composition backups. */
(() => {
  const esc=AccelWidgets.esc,view=document.getElementById('view');let active=null,path='';
  const inFrame=(()=>{try{return self!==top;}catch(_){return true;}})();
  const href=l=>'#/'+l.module+'/'+l.id;
  const state=id=>Accel.done(id)?'Completed':Accel.lesson(id).exerciseDone?'Practised':Accel.lesson(id).seen?'In progress':'Not started';
  function progress(){view.querySelectorAll('[data-lesson-status]').forEach(e=>e.textContent=state(e.dataset.lessonStatus));}
  function outline(l){return '<details class="ac-outline"><summary>Lessons'+(l?' · '+esc(l.title):'')+'</summary><nav aria-label="Accelerator lessons"><a href="#/">Course overview</a>'+MODULES.map(m=>'<p>'+esc(m.title)+'</p>'+LESSONS.filter(x=>x.module===m.id).map(x=>'<a href="'+href(x)+'" '+(x===l?'aria-current="page"':'')+'>'+x.n+'. '+esc(x.title)+'<span data-lesson-status="'+x.id+'">'+state(x.id)+'</span></a>').join('')).join('')+'</nav></details>';}
  function overview(mod){const next=LESSONS.find(l=>!Accel.done(l.id))||LESSONS[0],last=Accel.last(),resume=LESSONS.some(l=>last==='/'+l.module+'/'+l.id)?last:'/'+next.module+'/'+next.id;
    return '<div class="wrap ac-course">'+outline()+'<header class="hero"><div class="eyebrow">Interactive learning · 12 lessons</div><h1>'+(mod?esc(mod.title):'The Accelerator')+'<em>Hear it. Shape it. Make it yours.</em></h1><p>Explore a musical idea, apply it in a short challenge, then develop your own sketch. Your progress and musical work stay in this browser.</p><a class="btn gold" href="#'+resume+'">Resume learning</a></header>'+(mod?[mod]:MODULES).map(m=>'<section class="ac-module"><h2>'+esc(m.title)+'</h2><p>'+LESSONS.filter(l=>l.module===m.id&&Accel.done(l.id)).length+' of 6 complete</p><div class="lessons">'+LESSONS.filter(l=>l.module===m.id).map(l=>'<a class="lcard '+(Accel.done(l.id)?'done':'')+'" href="'+href(l)+'"><span class="lnum">'+l.n+'</span><div><h3>'+esc(l.title)+'</h3><p>'+esc(l.short)+'</p></div><span class="ltag">'+state(l.id)+'</span></a>').join('')+'</div></section>').join('')+
    '<section class="ac-backups"><h2>Your saved work</h2><p>Download a backup to keep progress and sketches or move them to another browser. Import retains completed progress and replaces the shared sketch with the imported version.</p><button class="btn" data-export>Download backup</button><label class="btn">Import backup<input type="file" data-import accept=".json,application/json"></label><p role="status" data-backup-status></p></section></div>';
  }
  /* A lesson is a run of micro levels. The activity holds one column and stays
     mounted for the whole lesson; the other column advances one step at a time,
     so the page is max(activity, step) rather than five sections stacked and is
     sized to the viewport. `beats` on a lesson names and groups the body
     paragraphs; without one they are grouped by length. */
  const wordsIn=h=>h.replace(/<[^>]+>/g,' ').trim().split(/\s+/).length;
  function autoBeats(l){const out=[];let cur=[],n=0;l.body.forEach((p,i)=>{cur.push(i);n+=wordsIn(p);
    if(n>=80){out.push({p:cur});cur=[];n=0;}});if(cur.length)out.push({p:cur});return out;}
  function stepsOf(l){const steps=[{type:'try',label:'Try it'}];
    (l.beats||autoBeats(l)).forEach(b=>steps.push({type:'read',beat:b,label:'Why'}));
    steps.push({type:'challenge',label:'Challenge'});
    steps.push({type:'do',label:'Practise'});
    l.quiz.forEach((q,qi)=>steps.push({type:'quiz',qi,label:'Check'}));
    steps.push({type:'end',label:'Done'});return steps;}

  function lessonView(l){const i=LESSONS.indexOf(l),steps=stepsOf(l);
    return '<div class="lwrap">'+
      '<div class="lhead">'+outline(l)+'<h1 tabindex="-1">'+esc(l.title)+'</h1></div>'+
      '<div class="lcols">'+
        '<aside class="lside">'+
          '<div class="rail" id="rail">'+steps.map((st,k)=>'<button data-s="'+k+'" aria-label="Step '+(k+1)+': '+st.label+'"></button>').join('')+
            '<span class="rail-n" id="rail-n"></span></div>'+
          '<div class="lstep" id="lstep"></div>'+
          '<div class="lnav"><button class="btn" id="st-back">Back</button><span class="sp"></span>'+
            '<span class="hint" id="st-hint"></span><button class="btn next" id="st-next">Next</button></div>'+
        '</aside>'+
        '<div class="lplay"><div class="demo" id="demo-host"></div>'+
          '<p class="demo-note">'+esc(l.demoNote)+'</p></div>'+
      '</div></div>';
  }

  /* ------------------------------------------------------------------ steps */
  let curSteps=[],curStep=0,curLesson=null;

  function showStep(i){const l=curLesson;if(!l||i<0||i>=curSteps.length)return;
    curStep=i;const st=curSteps[i],box=document.getElementById('lstep'),p=Accel.lesson(l.id);

    if(st.type==='try'){
      box.innerHTML='<div class="step-try"><div class="eyebrow">Try it first</div>'+
        '<p class="claim">'+esc(l.claim)+'</p></div>';
    } else if(st.type==='read'){
      box.innerHTML='<div><div class="eyebrow">Why it works</div>'+
        (st.beat.t?'<h2 class="step-h">'+esc(st.beat.t)+'</h2>':'<div style="height:8px"></div>')+
        '<div class="prose">'+st.beat.p.map(k=>'<p>'+l.body[k]+'</p>').join('')+'</div></div>';
    } else if(st.type==='challenge'){
      box.innerHTML='<div><div class="eyebrow">Challenge</div><h2 class="step-h">Try it yourself</h2>'+
        '<p data-challenge-prompt></p>'+
        '<div class="ac-actions"><button class="btn gold" data-challenge>Check my attempt</button>'+
        '<button class="btn" data-hint>Show a hint</button>'+
        '<button class="btn" data-replay>Replay my work</button></div>'+
        '<p class="ac-feedback" role="status" data-challenge-feedback></p></div>';
      box.querySelector('[data-challenge-prompt]').textContent=prompts[l.id];
      const fb=box.querySelector('[data-challenge-feedback]');
      box.querySelector('[data-challenge]').onclick=()=>{const r=active.check(),q=Accel.lesson(l.id);
        Accel.patch(l.id,{challengeAttempts:(q.challengeAttempts||0)+1,challengePassed:!!q.challengePassed||r.ok});
        fb.textContent=(r.ok?'Exercise constraint met. ':'Keep exploring. ')+r.text;};
      box.querySelector('[data-hint]').onclick=()=>fb.textContent=active.check().text;
      box.querySelector('[data-replay]').onclick=()=>active.play();
    } else if(st.type==='do'){
      const level=['beginner','intermediate','advanced'].includes(p.level)?p.level:'beginner';
      box.innerHTML='<div><div class="eyebrow">Practise</div><h2 class="step-h">Take it to your own work</h2>'+
        '<label class="ac-field">Choose your exercise<select data-level>'+
        ['beginner','intermediate','advanced'].map(k=>'<option value="'+k+'"'+(level===k?' selected':'')+'>'+k[0].toUpperCase()+k.slice(1)+'</option>').join('')+
        '</select></label><p data-exercise>'+esc(l.ex[level])+'</p>'+
        '<button class="btn" data-exercise-done aria-pressed="'+!!p.exerciseDone+'">'+
        (p.exerciseDone?'✓ Exercise recorded':'Mark this exercise practised')+'</button></div>';
      box.querySelector('[data-level]').onchange=e=>{Accel.patch(l.id,{level:e.target.value});
        box.querySelector('[data-exercise]').textContent=l.ex[e.target.value];};
      box.querySelector('[data-exercise-done]').onclick=e=>{
        Accel.patch(l.id,{exerciseDone:true,practisedLevel:box.querySelector('[data-level]').value});
        e.currentTarget.setAttribute('aria-pressed','true');e.currentTarget.textContent='✓ Exercise recorded';};
    } else if(st.type==='quiz'){
      quizStep(l,st.qi,box);
    } else {
      const score=Accel.lesson(l.id).score,next=LESSONS[i>=0?LESSONS.indexOf(l)+1:0];
      box.innerHTML='<div class="step-end"><div class="tick">✓</div><h2>'+esc(l.title)+'</h2>'+
        '<p class="src">'+(typeof score==='number'?score+' of '+l.quiz.length+' correct':'Questions not yet answered')+
        (Accel.lesson(l.id).exerciseDone?' · exercise recorded':'')+'<br>Based on '+esc(l.source)+', Cinematic Music Accelerator.</p>'+
        '<a class="btn gold go" href="'+(next?href(next):'#/')+'">'+(next?'Next: '+esc(next.title):'Review progress and saved work')+'</a></div>';
    }

    const seen=Math.max(Accel.lesson(l.id).step||0,i);Accel.patch(l.id,{step:seen});
    const rail=document.getElementById('rail');
    [...rail.querySelectorAll('button')].forEach((b,k)=>{b.className=k===i?'on':k<=seen?'seen':'';});
    document.getElementById('rail-n').textContent=(i+1)+' / '+curSteps.length+' · '+st.label;
    document.getElementById('st-back').disabled=i===0;
    document.getElementById('st-next').textContent=i===curSteps.length-1?'Finish':'Next';
    document.getElementById('st-hint').textContent='';
    box.scrollTop=0;
  }

  /* One question per step. Answers live in the model, so stepping away and back
     keeps them, and the retry clears the lesson's whole set as before. */
  function quizStep(l,qi,box){
    const stored=Accel.lesson(l.id).answers;
    let answers=Array.isArray(stored)&&stored.length===l.quiz.length
      ? stored.map((v,i)=>Number.isInteger(v)&&v>=0&&v<l.quiz[i].o.length?v:null)
      : l.quiz.map(()=>null);
    const q=l.quiz[qi];
    function draw(){
      const a=answers[qi];
      box.innerHTML='<div><div class="eyebrow">Check yourself · '+(qi+1)+' of '+l.quiz.length+'</div>'+
        '<fieldset class="q"><legend>'+esc(q.q)+'</legend><div class="opts">'+
        q.o.map((o,j)=>'<button class="opt '+(a===null?'':j===q.a?'right':a===j?'wrong':'')+
          '" data-answer="'+j+'"'+(a!==null?' disabled':'')+'>'+esc(o)+'</button>').join('')+
        '</div>'+(a!==null?'<p class="why on">'+(a===q.a?'Correct. ':'Compare the highlighted answer. ')+esc(q.why)+'</p>':'')+
        '</fieldset>'+(a!==null?'<button class="btn" data-retry>Try the questions again</button>':'')+
        '<p role="status" data-quiz-status></p></div>';
      box.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
        answers[qi]=Number(b.dataset.answer);Accel.patch(l.id,{answers});draw();
        const why=box.querySelector('.why');if(why){why.tabIndex=-1;why.focus();}});
      const retry=box.querySelector('[data-retry]');
      if(retry)retry.onclick=()=>{answers=l.quiz.map(()=>null);Accel.patch(l.id,{answers});draw();};
      if(answers.every(x=>x!==null)){
        const score=Accel.quiz(l.id,answers,l.quiz);
        box.querySelector('[data-quiz-status]').textContent=score+' of '+l.quiz.length+
          ' correct. '+(score===l.quiz.length?'Understanding check passed.':'Your previous best result is retained.');
      }
      document.getElementById('st-hint').textContent=answers[qi]===null?'Pick an answer':'';
    }
    draw();
  }

  const prompts={overtones:'Hear the target, then recreate its harmonic balance.',perspective:'Bring Harmony forward and confirm the result by listening.',separation:'Make the melody easier to follow using exactly one separation tool.','tone-colour':'Play a mystery sample, then select the instrument you hear.',voicing:'Keep a complete C-major triad, reinforce C and try wider low spacing.','voice-leading':'Keep Am, F, C and G complete, moving each voice by no more than two semitones.',motifs:'Write three to five notes that you can sing back.',prevade:'Build a phrase with familiar material, a variation and an independent new ending.','question-answer':'Compare B4 over V followed by C5 over I to hear the leading tone resolve.',harmony:'Include ii or vi, finish on I, then compare the primary chords.',countermelody:'Place at least one response in a rest in the theme.',ostinato:'Use at least four onsets and an accent. Lower the pattern until the melody is clear.'};
  function init(l){
    Accel.patch(l.id,{seen:true});Accel.setLast('/'+l.module+'/'+l.id);
    active=AccelWidgets.mount(document.getElementById('demo-host'),l);
    curLesson=l;curSteps=stepsOf(l);curStep=0;
    document.getElementById('rail').onclick=e=>{const b=e.target.closest('button[data-s]');if(b)showStep(+b.dataset.s);};
    document.getElementById('st-back').onclick=()=>showStep(curStep-1);
    document.getElementById('st-next').onclick=()=>{
      if(curStep===curSteps.length-1){const n=LESSONS[LESSONS.indexOf(l)+1];go(n?'/'+n.module+'/'+n.id:'/');}
      else showStep(curStep+1);};
    showStep(0);
  }

  function backups(){view.querySelector('[data-export]').onclick=()=>{const blob=new Blob([Accel.export()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='accelerator-progress-and-sketches.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};view.querySelector('[data-import]').onchange=async e=>{const f=e.target.files[0],feedback=view.querySelector('[data-backup-status]');if(!f)return;try{if(f.size>2e6)throw Error('Choose an Accelerator backup smaller than 2 MB.');Accel.import(await f.text());feedback.textContent='Backup imported. Completed progress was retained.';progress();}catch(err){feedback.textContent=err.message;}};}
  function go(next){if(!inFrame)history.pushState({path:next},'','#'+next);route(next);}

  function route(next){
    if(active){active.capture();active.destroy();active=null;}
    AccelAudio.stop();curLesson=null;curSteps=[];
    path=next||'/';
    const parts=path.replace(/^\/?/,'').split('/').filter(Boolean),
          mod=MODULES.find(m=>m.id===parts[0]),
          l=LESSONS.find(x=>x.module===parts[0]&&x.id===parts[1]);
    document.documentElement.classList.toggle('lesson-view',!!l);
    view.innerHTML=l?lessonView(l):overview(mod);

    /* the breadcrumb lives in the nav bar, beside the module name — atlas rules */
    const bar=document.getElementById('atl-nav'),crumb=document.getElementById('atl-nav-crumb');
    bar.classList.toggle('is-sub',!!l);
    crumb.innerHTML=l
      ? '<div class="atl-crumb"><span class="atl-crumb-root"><a href="#/'+l.module+'">'+
        esc(MODULES.find(m=>m.id===l.module).title)+'</a><i>/</i></span><span>Lesson '+l.n+'</span></div>'
      : '';

    try{if(l)init(l);else backups();}
    catch(err){const h=document.getElementById('demo-host');
      if(h)h.innerHTML='<p class="ac-feedback" role="alert">The activity could not start. Your saved progress is retained. Reload to retry.</p>';
      console.error('[Accelerator]',err);}
    progress();
    if(!Accel.writable()){const p=document.createElement('p');p.className='ac-feedback';
      p.textContent='Browser storage is unavailable. Download a backup before closing this page.';view.prepend(p);}
    const heading=view.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
    window.scrollTo({top:0,behavior:'instant'});
  }
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#/"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();const next=a.getAttribute('href').slice(1);if(!inFrame)history.pushState({path:next},'','#'+next);route(next);});
  window.addEventListener('popstate',()=>route(location.hash.slice(1)||'/'));window.addEventListener('hashchange',()=>{const next=location.hash.slice(1)||'/';if(next!==path)route(next);});window.addEventListener('beforeunload',()=>{active?.capture();});
  document.addEventListener('keydown',e=>{
    if(!curLesson||e.metaKey||e.ctrlKey||e.altKey)return;
    if(/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.target.tagName))return;
    if(e.key==='ArrowRight'){e.preventDefault();showStep(curStep+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();showStep(curStep-1);}});
  route(!inFrame&&location.hash.startsWith('#/')?location.hash.slice(1):'/');
})();
