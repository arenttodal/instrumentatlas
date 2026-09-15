/* Shared accessible controls and activity lifecycle. */
const AccelWidgets = (() => {
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function button(host,label,fn){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=label;b.onclick=fn;host.append(b);return b;}
  function group(host,label){const f=document.createElement('fieldset');f.className='ac-group';const l=document.createElement('legend');l.textContent=label;f.append(l);host.append(f);return f;}
  function select(host,label,values,value,change){const l=document.createElement('label');l.className='ac-field';l.append(document.createTextNode(label));const input=document.createElement('select');values.forEach(v=>{const o=document.createElement('option');o.value=typeof v==='object'?v.value:v;o.textContent=typeof v==='object'?v.label:v;input.append(o);});input.value=String(value);input.onchange=()=>change(input.value);l.append(input);host.append(l);return input;}
  function range(host,label,value,min,max,step,change){const l=document.createElement('label');l.className='ac-field';const t=document.createElement('span'),o=document.createElement('output');t.textContent=label+' ';o.textContent=value;t.append(o);const i=document.createElement('input');Object.assign(i,{type:'range',min,max,step,value});i.oninput=()=>{o.textContent=i.value;change(Number(i.value));};l.append(t,i);host.append(l);return i;}
  function toggle(host,label,value,change){const b=button(host,label,()=>{value=!value;b.setAttribute('aria-pressed',String(value));change(value);});b.setAttribute('aria-pressed',String(value));return b;}
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
    let svg='<svg viewBox="0 0 720 210" role="img" aria-label="Piano roll. Pitch rises vertically and beats move left to right.">';
    for(let b=0;b<=beats;b++)svg+='<line x1="'+(35+b/beats*650)+'" x2="'+(35+b/beats*650)+'" y1="16" y2="175" stroke="white" opacity="'+(b%4?'.035':'.13')+'"/>';
    ns.forEach(n=>svg+='<rect x="'+x(n)+'" y="'+y(n)+'" width="'+Math.max(2,Math.min(n.d,beats-n.s)/beats*650-2)+'" height="7" rx="2" fill="'+colors[layers.indexOf(n.layer||'Theme')%4]+'"><title>'+esc(Accel.note(n.m)+' at beat '+(n.s+1)+', '+n.d+' beats')+'</title></rect>');
    layers.forEach((l,i)=>{const line=ns.filter(n=>n.layer===l&&n.voice).sort((a,b)=>a.s-b.s);if(line.length>1)svg+='<polyline points="'+line.map(n=>x(n)+','+(y(n)+3)).join(' ')+'" fill="none" stroke="'+colors[i%4]+'" opacity=".55"/>';});
    for(let b=0;b<beats;b+=4)svg+='<text x="'+(35+b/beats*650)+'" y="199" fill="#BEC0C8" font-size="12">Bar '+(b/4+1)+'</text>';
    host.innerHTML='<div class="ac-roll-stage">'+svg+'</svg><i class="ac-playhead" aria-hidden="true"></i></div><div class="ac-legend">'+layers.map((l,i)=>'<span style="color:'+colors[i%4]+'">'+esc(l)+'</span>').join('')+'</div>';
  }
  function mount(host,lesson){
    const saved=Accel.lesson(lesson.id);let state=Accel.clone(saved.widget||{});if(!state||typeof state!=='object'||Array.isArray(state))state={};
    let alive=true;let comparisons=saved.comparisons||{},undo=[],redo=[],previous=null,revising=false,cleanup=()=>{},spec,info;
    host.innerHTML='<div class="ac-transport"><button class="btn gold" data-play>Play</button><button class="btn" data-restart>Restart</button><button class="btn" data-stop>Stop</button><label class="ac-inline">Loop <input type="checkbox" data-loop checked></label><label class="ac-inline">Volume <input type="range" data-volume min="0" max="1" step=".01"></label><span data-time>0:00</span></div><p class="ac-audio-status" data-status role="status">Audio loads when you press Play.</p><div class="ac-timeline"><i data-progress></i></div><div data-roll></div><div class="ac-controls" data-controls></div><p class="w-read" data-read aria-live="polite"></p><div class="ac-actions" data-actions></div>';
    const q=s=>host.querySelector(s),controls=q('[data-controls]'),actions=q('[data-actions]');
    const transport=new AccelAudio.Transport(t=>{
      q('[data-play]').textContent=t.status==='playing'?'Pause':t.status==='loading'?'Cancel loading':t.status==='paused'?'Resume':'Play';q('[data-play]').setAttribute('aria-pressed',String(t.status==='playing'));
      q('[data-status]').textContent=t.status==='error'?t.error+' Press Play to retry.':t.status==='loading'?'Loading samples…':t.status==='playing'?'Playing. Edits update the current phrase position.':lesson.id==='overtones'?'Ready. Harmonic synthesis.':'Ready. Sampled instruments; performance references are separate.';
    },(p,d)=>{q('[data-progress]').style.width=(d?p/d*100:0)+'%';q('[data-time]').textContent=p.toFixed(1)+' / '+d.toFixed(1)+' s';const h=q('.ac-playhead');if(h){h.style.left=(4.86+(d?p/d:0)*90.28)+'%';h.style.visibility=transport.status==='playing'?'visible':'hidden';}});
    q('[data-play]').onclick=()=>['playing','loading'].includes(transport.status)?transport.pause():transport.play();
    q('[data-restart]').onclick=()=>transport.play(0);q('[data-stop]').onclick=()=>transport.stop();
    q('[data-loop]').onchange=e=>transport.loop=e.target.checked;q('[data-volume]').value=AccelAudio.volume();q('[data-volume]').oninput=e=>AccelAudio.setVolume(e.target.value);
    const save=()=>Accel.patch(lesson.id,{widget:state,comparisons});
    function update(){
      const serialized=JSON.stringify(state);if(previous!==null&&previous!==serialized&&!revising){undo.push(JSON.parse(previous));undo=undo.slice(-40);redo=[];}previous=serialized;
      info=spec.build();transport.replace(info.events,info.bpm||88,info.beats||4);roll(q('[data-roll]'),info.events,info.beats||4);spec.draw?.(q('[data-roll]'));q('[data-read]').textContent=spec.read();save();
    }
    function redraw(){cleanup();cleanup=()=>{};controls.replaceChildren();spec.render();update();}
    function restore(value){Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,Accel.clone(value));redraw();}
    const kit={host:controls,button,group,select,range,toggle,editor,pitches,update,redraw,
      clean:f=>{const prev=cleanup;cleanup=()=>{prev();f();};},
      say:text=>q('[data-read]').textContent=text,
      saveSketch:(values,text)=>{Accel.setSketch(values);q('[data-read]').textContent=text;},
      play:()=>transport.play(0),
      preview:async(events,bpm=88,beats=4)=>{if(!alive)return;const t=await AccelAudio.preview(events,bpm,beats);if(t.status==='error')q('[data-status]').textContent=t.error;},
      error:e=>q('[data-status]').textContent=e.message,
      defaults:values=>{for(const [k,v] of Object.entries(values))if(!(k in state)||typeof state[k]!==typeof v||Array.isArray(v)&&!Array.isArray(state[k]))state[k]=Accel.clone(v);},
      notes:(key,fallback)=>{if(!Accel.valid(state[key]))state[key]=Accel.clone(fallback);}
    };
    spec=AccelActivities[lesson.id](state,kit);spec.render();update();const original=Accel.clone(state);
    const compare=group(actions,'Compare and revise');
    for(const slot of ['A','B']){
      button(compare,'Keep '+slot,()=>{comparisons[slot]=Accel.clone(state);save();kit.say('Version '+slot+' saved.');});
      button(compare,'Hear '+slot,()=>{if(!comparisons[slot]){kit.say('Keep a version in '+slot+' first.');return;}const playing=transport.status==='playing';restore(comparisons[slot]);if(!playing)transport.play(0);});
    }
    button(compare,'Undo',()=>{if(!undo.length)return;redo.push(Accel.clone(state));revising=true;restore(undo.pop());revising=false;});
    button(compare,'Redo',()=>{if(!redo.length)return;undo.push(Accel.clone(state));revising=true;restore(redo.pop());revising=false;});
    button(compare,'Restore lesson start',()=>restore(original));
    return {check:()=>spec.check(),play:()=>transport.play(0),inspect:()=>Accel.clone(info),capture:save,destroy:()=>{alive=false;cleanup();transport.destroy();}};
  }
  return {mount,esc};
})();
