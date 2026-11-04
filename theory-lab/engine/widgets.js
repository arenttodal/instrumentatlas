/* Shared accessible controls and activity lifecycle. */
const AccelWidgets = (() => {
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function button(host,label,fn){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=label;b.onclick=fn;host.append(b);return b;}
  function group(host,label){const f=document.createElement('fieldset');f.className='ac-group';const l=document.createElement('legend');l.textContent=label;f.append(l);host.append(f);return f;}
  function select(host,label,values,value,change){const l=document.createElement('label');l.className='ac-field';l.append(document.createTextNode(label));const input=document.createElement('select');values.forEach(v=>{const o=document.createElement('option');o.value=typeof v==='object'?v.value:v;o.textContent=typeof v==='object'?v.label:v;input.append(o);});input.value=String(value);input.onchange=()=>change(input.value);l.append(input);host.append(l);return input;}
  function range(host,label,value,min,max,step,change){const l=document.createElement('label');l.className='ac-field';const t=document.createElement('span'),o=document.createElement('output');t.textContent=label+' ';o.textContent=value;t.append(o);const i=document.createElement('input');Object.assign(i,{type:'range',min,max,step,value});
    /* --p is the fraction travelled; the CSS paints the track from it. */
    const paint=()=>i.style.setProperty('--p',(i.value-min)/(max-min)||0);
    i.oninput=()=>{o.textContent=i.value;paint();change(Number(i.value));};paint();
    l.append(t,i);host.append(l);return i;}
  /* A BOOLEAN LOOKS LIKE A BOOLEAN. As a pill it was indistinguishable from
     "Play the cadence" — same shape, same size, one of them a state and one of
     them an action. It keeps aria-pressed (and its label as its only text, so
     anything reading the button still reads "Drone"); the track is decoration. */
  function toggle(host,label,value,change){const b=button(host,label,()=>{value=!value;b.setAttribute('aria-pressed',String(value));change(value);});
    b.classList.add('ac-switch');const t=document.createElement('i');t.className='ac-sw-track';t.setAttribute('aria-hidden','true');b.prepend(t);
    b.setAttribute('aria-pressed',String(value));return b;}
  /* A SEGMENTED CONTROL: one ordered choice, not N loose buttons. The track is
     an inner element rather than the fieldset itself, because the legend has to
     sit ABOVE the track and a fieldset cannot paint one without painting the
     other — which is how "Mode" ended up printed inside the pill. Returns the
     track, so callers append their buttons to the thing that holds them. */
  function segment(host,label){const f=group(host,label);f.classList.add('ac-seg');
    const t=document.createElement('div');t.className='ac-seg-track';f.append(t);return t;}
  const pitches=(lo=36,hi=84)=>Array.from({length:hi-lo+1},(_,i)=>({value:i+lo,label:Accel.note(i+lo)}));
  function editor(host,label,notes,change,steps=8){
    const f=group(host,label);f.classList.add('ac-editor');let current=Accel.clone(notes);
    for(let k=0;k<steps;k++){
      const row=document.createElement('div');row.className='ac-step';f.append(row);const old=current.find(n=>Math.abs(n.s-k*.5)<.001);
      const apply=()=>{current=current.filter(n=>Math.abs(n.s-k*.5)>.001);if(p.value!=='rest')current.push({m:Number(p.value),s:k*.5,d:Number(d.value),accent:a.getAttribute('aria-pressed')==='true'});current.sort((a,b)=>a.s-b.s);change(current.map((n,i)=>({...n,d:Math.min(n.d,steps*.5-n.s,current[i+1]?current[i+1].s-n.s:Infinity)})));};
      const p=select(row,'Step '+(k+1),[{value:'rest',label:'No onset'},...pitches()],old?.m??'rest',apply);
      const lengths=[.5,1,1.5,2];if(old&& !lengths.includes(old.d))lengths.push(old.d);
      const d=select(row,'Length',lengths.sort((a,b)=>a-b).map(v=>({value:v,label:v+' beats'})),old?.d||.5,apply);
      const a=toggle(row,'Accent',!!old?.accent,apply);
    }
    return f;
  }
  function roll(host,events,beats){
    const ns=events.filter(n=>Number.isFinite(n.m)),lo=Math.min(36,...ns.map(n=>n.m))-2,hi=Math.max(72,...ns.map(n=>n.m))+2;
    const colors=['#D4A04A','#8FB4E0','#5FB89A','#CB99DF'],layers=[...new Set(ns.map(n=>n.layer||'Theme'))];
    const x=n=>35+n.s/beats*650,y=n=>170-(n.m-lo)/(hi-lo)*145;
    /* preserveAspectRatio="none" so the roll FILLS its box at whatever shape the
       layout hands it. It is a chart, not a picture: stretching the grid and the
       note bars is exactly right, and it is what lets one roll serve a tall
       lesson column and a short wide tool strip without either letterboxing.
       Two things make that safe — strokes are marked non-scaling so the grid
       lines stay hairlines however far the box stretches, and the bar numbers
       are HTML underneath rather than <text> inside, because type is the one
       thing that must not stretch. Keeping the box 35..685 of 720 wide also
       keeps the playhead's percentages honest. */
    let svg='<svg viewBox="0 0 720 180" preserveAspectRatio="none" role="img" aria-label="Piano roll. Pitch rises vertically and beats move left to right.">';
    for(let b=0;b<=beats;b++)svg+='<line x1="'+(35+b/beats*650)+'" x2="'+(35+b/beats*650)+'" y1="16" y2="175" stroke="white" vector-effect="non-scaling-stroke" opacity="'+(b%4?'.035':'.13')+'"/>';
    ns.forEach(n=>svg+='<rect x="'+x(n)+'" y="'+y(n)+'" width="'+Math.max(2,Math.min(n.d,beats-n.s)/beats*650-2)+'" height="7" rx="2" fill="'+colors[layers.indexOf(n.layer||'Theme')%4]+'"><title>'+esc(Accel.note(n.m)+' at beat '+(n.s+1)+', '+n.d+' beats')+'</title></rect>');
    layers.forEach((l,i)=>{const line=ns.filter(n=>n.layer===l&&n.voice).sort((a,b)=>a.s-b.s);if(line.length>1)svg+='<polyline points="'+line.map(n=>x(n)+','+(y(n)+3)).join(' ')+'" fill="none" stroke="'+colors[i%4]+'" vector-effect="non-scaling-stroke" opacity=".55"/>';});
    let bars='';
    for(let b=0;b<beats;b+=4)bars+='<span style="left:'+((35+b/beats*650)/720*100)+'%">Bar '+(b/4+1)+'</span>';
    host.innerHTML='<div class="ac-roll-stage">'+svg+'</svg><i class="ac-playhead" aria-hidden="true"></i></div>'+
      '<div class="ac-roll-bars" aria-hidden="true">'+bars+'</div><div class="ac-legend">'+layers.map((l,i)=>'<span style="color:'+colors[i%4]+'">'+esc(l)+'</span>').join('')+'</div>';
  }
  /* `params` is what a deep link asked for. It is merged over the lesson's own
     preset — the URL wins, because it is the more specific instruction — and
     handed to the activity as kit.params.

     Applying it to state: a deep link is an explicit request for a particular
     view, so it overrides whatever was saved. A preset with no deep link is
     only a starting point, so it applies on a first visit and then leaves the
     learner's own work alone. */
  function mount(host,lesson,params){
    const saved=Accel.lesson(lesson.id);let state=Accel.clone(saved.widget||{});if(!state||typeof state!=='object'||Array.isArray(state))state={};
    const linked=!!(params&&Object.keys(params).length);
    /* A URL carries everything as a string. A preset carries real types, and
       kit.defaults() rejects a value whose type does not match its default —
       which is right for a corrupted saved state and wrong for '?rootPc=2',
       so the query is coerced back to what it plainly is before it is merged. */
    const typed={};
    for(const k in (params||{})){
      const v=params[k];
      typed[k] = v==='true' ? true : v==='false' ? false
               : (v!=='' && v!=null && !isNaN(v)) ? Number(v) : v;
    }
    const wanted={...(lesson.preset||{}),...typed};
    if(linked||!saved.widget) Object.assign(state,Accel.clone(wanted));
    let alive=true;let comparisons=saved.comparisons||{},undo=[],redo=[],previous=null,revising=false,cleanup=()=>{},spec,info;
    /* TWO BOXES, NOT ONE STACK. `.ac-music` is what you listen to — transport,
       timeline, piano roll, and whatever the activity hangs off the roll (the
       keyboard, the chord grid, both inserted with rollHost.after()). `.ac-knobs`
       is what you turn. A lesson stacks them, because its column is narrow; a
       tool stands them side by side, because a tool has the whole page and
       stacking them is what used to put its last button off the bottom of the
       screen. Everything here is still found with host.querySelector, so the
       nesting costs the widgets nothing. */
    host.innerHTML='<div class="ac-music">'+
      /* ONE PRIMARY, TWO QUIET ONES. Play is the thing you came to press, so it
         is the only filled control on the panel; back-to-start and stop are
         glyphs beside it, because three identical pills made the reader read
         three words to find one button. */
      '<div class="ac-transport">'+
        '<div class="ac-tg">'+
          '<button type="button" class="btn primary" data-play data-state="play">'+
            '<i class="ac-ico" aria-hidden="true"></i><span data-play-text>Play</span></button>'+
          '<button type="button" class="btn icon" data-restart aria-label="Back to the start" title="Back to the start">'+
            '<i class="ac-ico ico-start" aria-hidden="true"></i></button>'+
          '<button type="button" class="btn icon" data-stop aria-label="Stop" title="Stop">'+
            '<i class="ac-ico ico-stop" aria-hidden="true"></i></button>'+
        '</div>'+
        '<label class="ac-sw"><input type="checkbox" data-loop checked><i aria-hidden="true"></i><span>Loop</span></label>'+
        '<label class="ac-vol"><span>Vol</span><input type="range" data-volume min="0" max="1" step=".01"></label>'+
        '<span class="ac-audio-status" data-status role="status">Audio loads when you press Play.</span>'+
        '<span class="ac-time" data-time>0:00</span>'+
      '</div>'+
      '<div class="ac-scrub" data-scrub tabindex="0" role="slider" aria-label="Playhead"'+
        ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="ac-timeline"><i data-progress></i></div></div>'+
      '<div data-roll></div></div>'+
      '<div class="ac-knobs"><div class="ac-controls" data-controls></div>'+
      '<p class="w-read" data-read aria-live="polite"></p><div class="ac-actions" data-actions></div></div>';
    const q=s=>host.querySelector(s),controls=q('[data-controls]'),actions=q('[data-actions]');
    const transport=new AccelAudio.Transport(t=>{
      const pb=q('[data-play]');
      q('[data-play-text]').textContent=t.status==='playing'?'Pause':t.status==='loading'?'Cancel loading':t.status==='paused'?'Resume':'Play';
      pb.setAttribute('aria-pressed',String(t.status==='playing'));
      /* the glyph is drawn in CSS off this one attribute, so there is no icon
         font, no sprite and nothing to get out of step with the label */
      pb.dataset.state=t.status==='playing'?'pause':t.status==='loading'?'loading':'play';
      q('[data-status]').textContent=t.status==='error'?t.error+' Press Play to retry.':t.status==='loading'?'Loading samples…':t.status==='playing'?'Playing. Edits update the current phrase position.':lesson.id==='overtones'?'Ready. Harmonic synthesis.':'Ready. Sampled instruments; performance references are separate.';
    },(p,d)=>{const f=d?p/d:0;
      q('[data-progress]').style.width=f*100+'%';
      const sc=q('[data-scrub]');sc.style.setProperty('--p',f);sc.setAttribute('aria-valuenow',Math.round(f*100));
      q('[data-time]').textContent=p.toFixed(1)+' / '+d.toFixed(1)+' s';
      const h=q('.ac-playhead');if(h){h.style.left=(4.86+f*90.28)+'%';h.style.visibility=transport.status==='playing'?'visible':'hidden';}});
    q('[data-play]').onclick=()=>['playing','loading'].includes(transport.status)?transport.pause():transport.play();
    q('[data-restart]').onclick=()=>transport.play(0);q('[data-stop]').onclick=()=>transport.stop();
    q('[data-loop]').onchange=e=>transport.loop=e.target.checked;
    /* --p is how far along the track the fill reaches. A slider whose travelled
       half looks exactly like its untravelled half is a line with a dot on it. */
    const vol=q('[data-volume]'),paintVol=()=>vol.style.setProperty('--p',vol.value);
    vol.value=AccelAudio.volume();paintVol();
    vol.oninput=e=>{paintVol();AccelAudio.setVolume(e.target.value);};
    /* THE PLAYHEAD IS SOMETHING YOU MOVE. A progress bar you cannot touch is
       decoration; every instrument lets you drop the needle. Click to seek, and
       the arrow keys do the same from the keyboard — which is why app.js stops
       reading arrows for step navigation once focus is inside the widget. */
    const scrub=q('[data-scrub]'),seek=at=>{const d=transport.duration;if(d>0)transport.play(Math.max(0,Math.min(d-.001,at)));};
    /* measured on the groove, not on its padded hit area, so where you click is
       where the knob lands */
    scrub.onclick=e=>{const r=scrub.querySelector('.ac-timeline').getBoundingClientRect();if(!r.width)return;
      seek(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*transport.duration);};
    scrub.onkeydown=e=>{const d=transport.duration;if(!d)return;const at=transport.position;
      if(e.key==='ArrowRight')seek(at+d/16);else if(e.key==='ArrowLeft')seek(at-d/16);
      else if(e.key==='Home')seek(0);else return;
      e.preventDefault();e.stopPropagation();};
    const save=()=>Accel.patch(lesson.id,{widget:state,comparisons});
    function update(){
      const serialized=JSON.stringify(state);if(previous!==null&&previous!==serialized&&!revising){undo.push(JSON.parse(previous));undo=undo.slice(-40);redo=[];}previous=serialized;
      info=spec.build();transport.replace(info.events,info.bpm||88,info.beats||4);roll(q('[data-roll]'),info.events,info.beats||4);spec.draw?.(q('[data-roll]'));q('[data-read]').textContent=spec.read();save();
    }
    /* TWO BANDS, NOT ONE WRAPPING ROW.
       A control row that mixes labelled fields — two lines tall, a caption over
       a control — with bare switches and buttons one line tall cannot wrap
       tidily: whatever lands at the start of the second line sets its baseline,
       and the next label along begins halfway across the row under nothing.
       That stagger is most of why the panel read as thrown together.

       So: settings first, in their own band, where every item is a caption over
       a control and they all line up; then the switches and the actions that
       act on them, in a band of their own. Activities declare their controls in
       whatever order reads best and this sorts them, so no activity has to know
       the rule and a new one gets it for free. */
    function band(){
      const kids=[...controls.children];
      const isField=e=>e.classList.contains('ac-field')||e.classList.contains('ac-seg');
      const fields=kids.filter(isField),rest=kids.filter(e=>!isField(e));
      if(!fields.length||!rest.length)return;
      const a=document.createElement('div');a.className='ac-band';a.append(...fields);
      const b=document.createElement('div');b.className='ac-band ac-band-act';b.append(...rest);
      controls.append(a,b);
    }
    function redraw(){cleanup();cleanup=()=>{};controls.replaceChildren();spec.render();band();update();}
    function restore(value){Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,Accel.clone(value));redraw();}
    const kit={host:controls,params:wanted,button,group,segment,select,range,toggle,editor,pitches,update,redraw,
      clean:f=>{const prev=cleanup;cleanup=()=>{prev();f();};},
      say:text=>q('[data-read]').textContent=text,
      saveSketch:(values,text)=>{Accel.setSketch(values);q('[data-read]').textContent=text;},
      play:()=>transport.play(0),
      preview:async(events,bpm=88,beats=4)=>{if(!alive)return;const t=await AccelAudio.preview(events,bpm,beats);if(t.status==='error')q('[data-status]').textContent=t.error;},
      error:e=>q('[data-status]').textContent=e.message,
      defaults:values=>{for(const [k,v] of Object.entries(values))if(!(k in state)||typeof state[k]!==typeof v||Array.isArray(v)&&!Array.isArray(state[k]))state[k]=Accel.clone(v);},
      notes:(key,fallback)=>{if(!Accel.valid(state[key]))state[key]=Accel.clone(fallback);}
    };
    /* BY FIELD, NOT BY ID. `activity` lets several lessons share one widget
       with different presets — six modes, one reharmonizer. It falls back to
       the lesson id, which is how every Accelerator lesson resolves. (The
       `demo` field this engine inherited is dead and is not consulted.) */
    const make=AccelActivities[lesson.activity||lesson.id];
    if(typeof make!=='function') throw Error('No activity named '+(lesson.activity||lesson.id));
    /* band() here too, not only in redraw(): the first paint is the one the
       reader actually sees, and it was the one going out unbanded. */
    spec=make(state,kit);spec.render();band();update();const original=Accel.clone(state);
    /* THREE JOBS, NOT SEVEN BUTTONS. Keeping and hearing a version, stepping
       through history, and starting over are different things, and in one flat
       row of identical pills they read as one undifferentiated clump. Same
       buttons, same labels — grouped, with the way out as a quiet link. */
    /* ONLY ON A TOOL. Keep/Hear A and B, undo, redo and reset are for someone
       turning the thing over; on a lesson you move with Next, and seven more
       buttons under the music is the clutter this page exists to avoid. */
    if(lesson.kind!=='lab') return {check:()=>spec.check(),play:()=>transport.play(0),
      inspect:()=>Accel.clone(info),capture:save,
      step:at=>{if(spec.step)try{spec.step(at);}catch(err){console.error('[activity step]',err);}},
      destroy:()=>{alive=false;cleanup();transport.destroy();}};
    const compare=group(actions,'Compare and revise');
    const set=name=>{const d=document.createElement('div');d.className='ac-set';d.dataset.set=name;compare.append(d);return d;};
    /* One segmented pair per slot, not one run of four. Keep A and Hear A are
       two things you do to the same saved version; welding all four together
       said they were one control with four positions. */
    for(const slot of ['A','B']){
      const g=set('ab'+slot);
      button(g,'Keep '+slot,()=>{comparisons[slot]=Accel.clone(state);save();kit.say('Version '+slot+' saved.');});
      button(g,'Hear '+slot,()=>{if(!comparisons[slot]){kit.say('Keep a version in '+slot+' first.');return;}const playing=transport.status==='playing';restore(comparisons[slot]);if(!playing)transport.play(0);});
    }
    const history=set('history');
    button(history,'Undo',()=>{if(!undo.length)return;redo.push(Accel.clone(state));revising=true;restore(undo.pop());revising=false;});
    button(history,'Redo',()=>{if(!redo.length)return;undo.push(Accel.clone(state));revising=true;restore(redo.pop());revising=false;});
    /* "Restore lesson start" on a tool is the wrong words: there is no lesson. */
    button(set('reset'),lesson.kind==='lab'?'Reset the tool':'Restore lesson start',()=>restore(original));
    /* THE DEMONSTRATION CAN FOLLOW THE EXPLANATION. The page tells the widget
       which step the reader is on; an activity that wants to react declares
       step(info) and one that does not is simply never asked. */
    return {check:()=>spec.check(),play:()=>transport.play(0),inspect:()=>Accel.clone(info),capture:save,
      step:at=>{if(spec.step)try{spec.step(at);}catch(err){console.error('[activity step]',err);}},
      destroy:()=>{alive=false;cleanup();transport.destroy();}};
  }
  return {mount,esc};
})();
