/* Activities share the musical model, state and transport. */
const AccelActivities = (() => {
  const A=Accel,cp=A.clone;
  const sampled=(ns,instrument='piano',layer='Theme',gain=.14)=>ns.map(n=>({...n,instrument,layer,gain}));
  const motif=()=>A.sketch().motif;
  const ending=()=>[{m:69,s:0,d:1},{m:67,s:1,d:1},{m:64,s:2,d:1},{m:60,s:3,d:1}];
  const phrase=()=>A.valid(A.sketch().phrase)&&A.sketch().phrase.length?A.sketch().phrase:A.phrase(motif(),['original','original','third','ending'],ending());
  const validNumbers=(v,n,lo,hi)=>Array.isArray(v)&&v.length===n&&v.every(x=>Number.isFinite(x)&&x>=lo&&x<=hi);
  const activities={};
  activities.overtones=(s,u)=>{
    u.defaults({partials:[1,.35,.2,.12,.08,.06,.04,.025],match:false,target:[1,0,.3,0,.12,0,.05,0]});
    if(!validNumbers(s.partials,8,0,1))s.partials=[1,.35,.2,.12,.08,.06,.04,.025];
    if(!validNumbers(s.target,8,0,1))s.target=[1,0,.3,0,.12,0,.05,0];
    return {
      build:()=>({events:[{m:48,s:0,d:4,instrument:'synth',partials:s.partials,match:s.match,gain:.24}],beats:4,bpm:60}),
      draw:host=>host.innerHTML='<div class="ac-partials" role="img" aria-label="Harmonic amplitudes">'+s.partials.map((v,i)=>'<div><i style="height:'+Math.round(v*140)+'px"></i><span>×'+(i+1)+'</span><span>'+v.toFixed(2)+'</span></div>').join('')+'</div>',
      render:()=>{const g=u.group(u.host,'Exact harmonic amplitudes');s.partials.forEach((v,i)=>u.range(g,'Harmonic '+(i+1)+': '+(130.8128*(i+1)).toFixed(1)+' Hz',v,0,1,.01,n=>{s.partials[i]=n;u.update();}));
        u.toggle(u.host,'Match harmonic energy',s.match,v=>{s.match=v;u.update();});
        u.button(u.host,'Fundamental only',()=>{s.partials=[1,0,0,0,0,0,0,0];u.redraw();});
        u.button(u.host,'Restore harmonics',()=>{s.partials=[1,.35,.2,.12,.08,.06,.04,.025];u.redraw();});
        u.button(u.host,'Hear challenge target',()=>u.preview([{m:48,s:0,d:3,instrument:'synth',partials:s.target,gain:.24}],60,3));
        u.button(u.host,'New target',()=>{s.target=[1,...Array.from({length:7},(_,i)=>Math.random()>.5?Number((.5/(i+2)).toFixed(2)):0)];u.update();u.preview([{m:48,s:0,d:3,instrument:'synth',partials:s.target,gain:.24}],60,3);});},
      read:()=>!s.partials.some(v=>v>0)?'All partials are silent.':!s.partials[0]?'The fundamental is absent. Remaining harmonics may still suggest its pitch.':s.partials.filter(v=>v>0).length===1?'Only the fundamental is sounding: a sine wave.':'The bars and sound use exactly the same amplitudes. Harmonic frequencies are integer multiples; musical note names are approximate.',
      check:()=>({ok:s.partials.every((v,i)=>Math.abs(v-s.target[i])<.08),text:'Target amplitudes from harmonic 1 to 8: '+s.target.join(', ')+'. Compare by ear before revealing this hint.'})
    };
  };
  activities.perspective=(s,u)=>{
    u.defaults({layers:[{level:80,activity:75,variation:60,mute:false},{level:45,activity:30,variation:20,mute:false},{level:25,activity:10,variation:5,mute:false}]});
    if(s.layers.length!==3||s.layers.some(l=>!l||!['level','activity','variation'].every(k=>Number.isFinite(l[k])&&l[k]>=0&&l[k]<=100)))s.layers=[{level:80,activity:75,variation:60},{level:45,activity:30,variation:20},{level:25,activity:10,variation:5}];
    const labels=['Melody','Harmony','Drone'];
    return {
      build:()=>({events:s.layers.flatMap((l,i)=>{const count=1+Math.round(l.activity/100*15),step=8/count;return Array.from({length:count},(_,k)=>({m:[67,52,36][i]+(k%4<Math.round(l.variation/25)?[0,2,4,7][k%4]:0),s:k*step,d:step*.92,instrument:['flute','viola','cello'][i],layer:labels[i],gain:l.mute?0:.15*l.level/100}));}),beats:8,bpm:84}),
      render:()=>{s.layers.forEach((l,i)=>{const g=u.group(u.host,labels[i]);for(const [k,label] of [['level','Loudness'],['activity','Rhythmic activity'],['variation','Pitch variation']])u.range(g,label,l[k],0,100,1,v=>{l[k]=v;u.update();});u.toggle(g,'Mute',!!l.mute,v=>{l.mute=v;u.update();});u.button(g,'Solo',()=>{s.layers.forEach((x,j)=>x.mute=j!==i);u.redraw();});});u.button(u.host,'Hear all layers',()=>{s.layers.forEach(l=>l.mute=false);u.redraw();});},
      read:()=>{const ranked=s.layers.map((l,i)=>({name:labels[i],v:l.mute?0:l.level*.4+l.activity*.35+l.variation*.25})).sort((a,b)=>b.v-a.v);return 'Modelled focus: '+ranked[0].name+'. This is a teaching estimate, not a measurement of your attention. All three activity and variation controls affect the sounding notes.';},
      check:()=>({ok:!s.layers[1].mute&&s.layers[1].level>s.layers[0].level,text:'Bring Harmony forward, compare it with your starting version, and judge whether you can follow its line. Loudness alone is not a perceptual score.'})
    };
  };
  activities.separation=(s,u)=>{
    u.defaults({register:false,rhythm:false,articulation:false,colour:false,solo:'All'});
    const ns=[{m:72,s:0,d:1},{m:74,s:1,d:1},{m:76,s:2,d:2},{m:74,s:4,d:1},{m:72,s:5,d:1},{m:71,s:6,d:2}],labels=['Melody','Harmony','Bass'];
    return {
      build:()=>({events:labels.flatMap((label,i)=>ns.map(n=>({...n,m:n.m-i*5-(s.register?i*12:0),s:n.s+((s.rhythm&&i) ? .5 : 0),d:s.articulation&&i?Math.min(.25,n.d):n.d,instrument:s.colour?['oboe','viola','cello'][i]:'piano',layer:label,gain:s.solo!=='All'&&s.solo!==label?0:.12}))).map(n=>({...n,d:Math.min(n.d,8-n.s)})),beats:8,bpm:80}),
      render:()=>{for(const k of ['register','rhythm','articulation','colour'])u.toggle(u.host,'Separate by '+k,s[k],v=>{s[k]=v;u.update();});u.select(u.host,'Listen to',['All',...labels],s.solo,v=>{s.solo=v;u.update();});},
      read:()=> 'Pitch classes and note count stay fixed. Register changes octaves; rhythm offsets the accompaniment; articulation shortens its note envelopes; colour changes the sampled instruments. Short envelopes are not recorded pizzicato.',
      check:()=>({ok:['register','rhythm','articulation','colour'].filter(k=>s[k]).length===1,text:'Use exactly one separation tool, compare against A, and describe which difference helped the melody stand out.'})
    };
  };
  activities['tone-colour']=(s,u)=>{
    const instruments=['flute','oboe','clarinet','horn','trumpet','violin'];u.defaults({instrument:'flute',mode:'Note',match:true});if(!instruments.includes(s.instrument))s.instrument='flute';
    return {
      build:()=>({events:sampled(s.mode==='Note'?[{m:60,s:0,d:3}]:A.seed(),s.instrument,'Instrument',.18).map(n=>({...n,match:s.match})),beats:4,bpm:72}),
      render:()=>{u.select(u.host,'Sampled instrument',instruments,s.instrument,v=>{s.instrument=v;u.update();});u.select(u.host,'Material',['Note','Phrase'],s.mode,v=>{s.mode=v;u.update();});u.toggle(u.host,'Match sample level',s.match,v=>{s.match=v;u.update();});
        const canvas=document.createElement('canvas');canvas.width=640;canvas.height=140;canvas.className='ac-spectrum';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Live spectrum of the current audio');u.host.append(canvas);let raf;
        const draw=()=>{const c=canvas.getContext('2d'),bins=AccelAudio.spectrum();c.clearRect(0,0,640,140);c.fillStyle='#8FB4E0';if(bins)for(let i=0;i<80;i++){const v=bins[Math.floor((i/80)**2*(bins.length-1))]/255;c.fillRect(i*8,140-v*135,5,v*135);}raf=requestAnimationFrame(draw);};draw();u.clean(()=>cancelAnimationFrame(raf));
        const refs=u.group(u.host,'Performance references: different passages');instruments.forEach(id=>u.button(refs,id,async()=>{try{const src='audio/instruments/'+id+'/'+(id==='clarinet'?'sustained':'signature-phrase')+'.aac';const r=await AccelAudio.load(src);await u.preview([{src,m:60,s:0,d:r.buffer.duration,layer:id,gain:.5,match:false}],60,r.buffer.duration);}catch(e){u.error(e);}}));
        u.button(u.host,'Hear mystery instrument',()=>{s.mystery=instruments[Math.floor(Math.random()*instruments.length)];u.update();u.preview(sampled(A.seed(),s.mystery),72,4);});},
      read:()=> 'These are instrument samples at one recorded dynamic. A volume change does not represent a player changing dynamics. The live spectrum measures the playing signal, including attack and decay. Performance references use different passages and are not controlled A/B pairs.',
      check:()=>({ok:!!s.mystery&&s.instrument===s.mystery,text:s.mystery?'The mystery instrument was '+s.mystery+'. Replay and compare its attack and harmonic balance.':'Play the mystery sample, then choose the instrument you hear.'})
    };
  };
  activities.voicing=(s,u)=>{
    u.defaults({voices:[48,52,55,60],instrument:'piano'});if(!validNumbers(s.voices,4,36,84))s.voices=[48,52,55,60];if(!['piano','violin','horn'].includes(s.instrument))s.instrument='piano';
    const read=()=>A.voicing(s.voices).map(c=>(c.ok?'✓ ':'Try: ')+c.text).join(' ');
    return {build:()=>({events:sampled(s.voices.map(m=>({m,s:0,d:4})),s.instrument,'Chord',.12),beats:4,bpm:72}),
      render:()=>{s.voices.forEach((m,i)=>u.select(u.host,['Bass','Tenor','Alto','Soprano'][i],u.pitches(),m,v=>{s.voices[i]=Number(v);u.update();}));u.select(u.host,'Instrument',['piano','violin','horn'],s.instrument,v=>{s.instrument=v;u.update();});u.button(u.host,'Close voicing',()=>{s.voices=[48,52,55,60];u.redraw();});u.button(u.host,'Suggested spacing',()=>{s.voices=[36,48,55,64];u.redraw();});u.button(u.host,'Arpeggiate',()=>u.preview(sampled(s.voices.map((m,i)=>({m,s:i,d:1})),s.instrument),88,4));},read,
      check:()=>({ok:A.voicing(s.voices).every(c=>c.ok),text:read()})};
  };
  activities['voice-leading']=(s,u)=>{
    const block=[[57,60,64,69],[53,57,60,65],[48,52,55,60],[55,59,62,67]],smooth=[[57,60,64,69],[57,60,65,69],[55,60,64,67],[55,59,62,67]],labels=['Bass','Tenor','Alto','Soprano'];
    u.defaults({chords:block,split:false,solo:'All'});if(s.chords.length!==4||s.chords.some(c=>!validNumbers(c,4,36,84)))s.chords=cp(block);
    return {
      build:()=>({events:s.chords.flatMap((ch,b)=>ch.map((m,i)=>({m,s:b*4,d:4,instrument:s.split?['cello','viola','violin','violin'][i]:'piano',layer:labels[i],voice:true,gain:(s.solo==='All'||s.solo===labels[i]) ? .12 : 0}))),beats:16,bpm:80}),
      render:()=>{u.button(u.host,'Block chords',()=>{s.chords=cp(block);u.redraw();});u.button(u.host,'Small movements',()=>{s.chords=cp(smooth);u.redraw();});u.toggle(u.host,'Split across sampled strings',s.split,v=>{s.split=v;u.update();});u.select(u.host,'Solo',['All',...labels],s.solo,v=>{s.solo=v;u.update();});s.chords.forEach((ch,b)=>{const g=u.group(u.host,['Am','F','C','G'][b]);ch.forEach((m,i)=>u.select(g,labels[i],u.pitches(),m,v=>{s.chords[b][i]=Number(v);u.update();}));});},
      read:()=>{let total=0;s.chords.slice(1).forEach((ch,b)=>ch.forEach((m,i)=>total+=Math.abs(m-s.chords[b][i])));return 'Total movement: '+total+' semitones. The four voices retain their identities across four full bars. Small movement is a useful constraint, not a guarantee of quality. Samples do not contain recorded legato transitions.';},
      check:()=>{const pcs=[[9,0,4],[5,9,0],[0,4,7],[7,11,2]],complete=s.chords.every((ch,b)=>pcs[b].every(pc=>ch.some(m=>m%12===pc))&&ch.every(m=>pcs[b].includes(m%12))),small=s.chords.slice(1).every((ch,b)=>ch.every((m,i)=>Math.abs(m-s.chords[b][i])<=2));return {ok:complete&&small,text:complete?'Keep each move to two semitones or less, then sing each individual line.':'Restore the notes of Am, F, C and G before evaluating movement.'};}
    };
  };
  activities.motifs=(s,u)=>{
    u.defaults({notes:motif(),interval:7,direction:1,rhythm:'Even'});u.notes('notes',motif());
    const preset=()=>{const starts=s.rhythm==='Three shorts'?[0,.5,1,1.5]:[0,1,2,3];s.notes=starts.map((start,i)=>({m:60+((s.rhythm==='Three shorts'?i===3:i===1)?s.direction*s.interval:0),s:start,d:i===3?4-start:starts[i+1]-start}));u.redraw();};
    return {build:()=>({events:sampled(s.notes),beats:4,bpm:92}),
      render:()=>{u.editor(u.host,'Your four-beat motif',s.notes,ns=>{s.notes=ns;u.update();});u.select(u.host,'Starting interval',Array.from({length:12},(_,i)=>({value:i+1,label:(i+1)+' semitones'})),s.interval,v=>{s.interval=Number(v);preset();});u.select(u.host,'Direction',[{value:1,label:'Up'},{value:-1,label:'Down'}],s.direction,v=>{s.direction=Number(v);preset();});u.select(u.host,'Starting rhythm',['Even','Three shorts'],s.rhythm,v=>{s.rhythm=v;preset();});u.button(u.host,'Beethoven: G G G E♭',()=>{s.notes=[{m:67,s:.5,d:.5},{m:67,s:1,d:.5},{m:67,s:1.5,d:.5},{m:63,s:2,d:2}];u.redraw();});u.button(u.host,'Save motif for the course',()=>u.saveSketch({motif:s.notes},'Motif saved. Later lessons can bring in this material without overwriting their existing work.'));u.button(u.host,'Clear motif',()=>{s.notes=[];u.redraw();});},
      read:()=>s.notes.length+' notes in concert pitch. “No onset” means no note starts at that step; shorten a preceding note to create silence. Interval character depends on context.',
      check:()=>({ok:s.notes.length>=3&&s.notes.length<=5,text:'Create three to five notes with a recognisable interval or rhythm. Replay it, then sing it without playback.'})};
  };
  activities.prevade=(s,u)=>{
    u.defaults({motif:motif(),slots:['original','original','invert','ending'],ending:ending()});u.notes('motif',motif());u.notes('ending',ending());
    const kinds=['original','third','invert','displace','ending'];if(s.slots.length!==4||s.slots.some(k=>!kinds.includes(k)))s.slots=['original','original','invert','ending'];
    const assemble=()=>A.phrase(s.motif,s.slots,s.ending);
    return {build:()=>({events:assemble().map(n=>({...n,instrument:'piano',layer:'Slot '+(Math.floor(n.s/4)+1),gain:.14})),beats:16,bpm:92}),
      render:()=>{u.button(u.host,'Bring in saved motif',()=>{s.motif=motif();u.redraw();});u.editor(u.host,'Source motif',s.motif,ns=>{s.motif=ns;u.update();});
        s.slots.forEach((kind,i)=>{const g=u.group(u.host,'Phrase slot '+(i+1));u.select(g,'Material',[{value:'original',label:'Original / repetition'},{value:'third',label:'Up a minor third'},{value:'invert',label:'Invert intervals'},{value:'displace',label:'Displace one beat'},{value:'ending',label:'Your new ending'}],kind,v=>{s.slots[i]=v;u.update();});const before=u.button(g,'Move earlier',()=>{[s.slots[i-1],s.slots[i]]=[s.slots[i],s.slots[i-1]];u.redraw();});before.disabled=i===0;const after=u.button(g,'Move later',()=>{[s.slots[i+1],s.slots[i]]=[s.slots[i],s.slots[i+1]];u.redraw();});after.disabled=i===3;});
        u.editor(u.host,'Write an independent ending',s.ending,ns=>{s.ending=ns;u.update();});u.button(u.host,'Save phrase for the course',()=>u.saveSketch({phrase:assemble()},'Phrase saved for Question and answer and Harmony.'));},
      read:()=>{const ns=assemble();if(!ns.length)return 'Write a motif or ending to hear a phrase.';const top=Math.max(...ns.map(n=>n.m)),hits=ns.filter(n=>n.m===top);return 'Highest note: '+A.note(top)+', first in bar '+(Math.floor(hits[0].s/4)+1)+', heard '+hits.length+' time(s). Repeated high points are an option, not an error. Extreme transformations shift by octaves to stay within the playable range.';},
      check:()=>({ok:s.slots.includes('original')&&s.slots.includes('ending')&&s.ending.length>0&&s.slots.some(k=>['third','invert','displace'].includes(k)),text:'Include familiar material, a variation and an independently written ending. Keep two versions and compare their direction.'})};
  };
  activities['question-answer']=(s,u)=>{
    u.defaults({notes:phrase().filter(n=>n.s<4),question:62,answer:60,chords:true,solo:'Both'});u.notes('notes',A.seed());
    const halves=()=>[s.question,s.answer].flatMap((landing,i)=>s.notes.filter(n=>n.s<3).map(n=>({...n,s:n.s+i*4,d:Math.min(n.d,3-n.s)})).concat([{m:Number(landing),s:3+i*4,d:1}]));
    return {build:()=>({events:sampled(halves().filter(n=>s.solo==='Both'||(s.solo==='Question'?n.s<4:n.s>=4))).concat(s.chords?[...A.chords[2].v.map(m=>({m,s:0,d:4,instrument:'piano',layer:'Harmony',gain:s.solo==='Answer'?0:.09})),...A.chords[0].v.map(m=>({m,s:4,d:4,instrument:'piano',layer:'Harmony',gain:s.solo==='Question'?0:.09}))]:[]),beats:8,bpm:88}),
      render:()=>{u.button(u.host,'Bring in saved material',()=>{s.notes=phrase().filter(n=>n.s<4);u.redraw();});for(const [key,label] of [['question','Question ending over V'],['answer','Answer ending over I']])u.select(u.host,label,[60,62,64,65,67,69,71,72].map(m=>({value:m,label:A.note(m)})),s[key],v=>{s[key]=Number(v);u.update();});u.toggle(u.host,'Play V then I harmony',s.chords,v=>{s.chords=v;u.update();});u.select(u.host,'Audition',['Both','Question','Answer'],s.solo,v=>{s.solo=v;u.update();});u.button(u.host,'Save question and answer',()=>u.saveSketch({dialogue:halves()},'Dialogue saved. Harmony can use your dialogue or your longer phrase.'));},
      read:()=>!s.chords?'Melody alone: closure depends on the implied key and contour. Compare your own impression.':'Question: '+A.note(s.question)+' over G major. Answer: '+A.note(s.answer)+' over C major. '+(!A.chords[2].pcs.includes(s.question%12)?'The non-chord question ending may add tension. ':'The question ending belongs to V. ')+(s.answer%12===0?'The answer lands on the tonic.':'Compare this answer with C; chord membership alone does not determine closure.'),
      check:()=>({ok:s.question===71&&s.answer===72,text:'Try B4 over V followed by C5 over I to hear the leading tone rise by a semitone. Then compare C4, which reaches the tonic by a different contour.'})};
  };
  activities.harmony=(s,u)=>{
    u.defaults({notes:phrase(),pick:[0,1,2,0]});u.notes('notes',phrase());if(!validNumbers(s.pick,4,0,8)||s.pick.some(i=>!A.chords[i]))s.pick=[0,1,2,0];
    return {build:()=>({events:sampled(s.notes).concat(s.pick.flatMap((c,b)=>A.chords[c].v.map(m=>({m,s:b*4,d:4,instrument:'piano',layer:'Harmony',gain:.1})))),beats:16,bpm:84}),
      render:()=>{u.button(u.host,'Bring in saved phrase',()=>{s.notes=phrase();u.redraw();});u.button(u.host,'Use saved dialogue twice',()=>{const ns=A.sketch().dialogue;if(A.valid(ns)&&ns.length){s.notes=ns.concat(ns.map(n=>({...n,s:n.s+8})));u.redraw();}else u.say('Save a dialogue in Question and answer first.');});s.pick.forEach((c,b)=>u.select(u.host,'Bar '+(b+1),A.chords.map((ch,i)=>({value:i,label:ch.name+' ('+ch.rn+')'})),c,v=>{s.pick[b]=Number(v);u.update();}));u.button(u.host,'Primary chords',()=>{s.pick=[0,1,2,0];u.redraw();});u.button(u.host,'Alternative colours',()=>{s.pick=[4,3,2,0];u.redraw();});u.button(u.host,'Save harmonised phrase',()=>u.saveSketch({harmonised:{notes:s.notes,pick:s.pick}},'Harmony saved for Countermelody and Ostinato.'));},
      read:()=>s.pick.map((c,b)=>{const f=A.fit(s.notes,A.chords[c],b);return 'Bar '+(b+1)+', '+A.chords[c].name+': '+f.fit.toFixed(1)+'/'+f.total.toFixed(1)+' weighted overlap. Sustained non-chord notes: '+(f.items.filter(n=>!n.inside&&n.d>=1).map(n=>A.note(n.m)).join(', ')||'none')+'.';}).join(' ')+' This is a clue, not a musical quality score.',
      check:()=>({ok:s.pick[3]===0&&s.pick.some(c=>c===3||c===4),text:'Try ii or vi in the phrase and finish on I. Compare the colour with the primary chords; shared notes do not guarantee the same function.'})};
  };
  activities.countermelody=(s,u)=>{
    u.defaults({theme:phrase(),counter:[{m:48,s:3,d:1},{m:55,s:7,d:1},{m:52,s:11,d:1},{m:48,s:15,d:1}],instrument:'cello',level:55,shift:0,solo:'Both',short:false});u.notes('theme',phrase());u.notes('counter',[]);if(!['cello','viola','oboe','horn'].includes(s.instrument))s.instrument='cello';
    const counter=()=>s.counter.map(n=>({...n,m:n.m+Number(s.shift),d:s.short?Math.min(.25,n.d):n.d}));
    return {build:()=>({events:sampled(s.theme,'piano','Theme',s.solo==='Counter'?0:.14).concat(sampled(counter(),s.instrument,'Counter',s.solo==='Theme'?0:.14*s.level/100)),beats:16,bpm:88}),
      render:()=>{u.button(u.host,'Bring in saved theme',()=>{const h=A.sketch().harmonised;s.theme=A.valid(h?.notes)?h.notes:phrase();u.redraw();});u.editor(u.host,'Supporting line: eight beats, repeated',s.counter.filter(n=>n.s<8),ns=>{s.counter=ns.concat(ns.map(n=>({...n,s:n.s+8})));u.update();},16);u.select(u.host,'Instrument',['cello','viola','oboe','horn'],s.instrument,v=>{s.instrument=v;u.update();});u.select(u.host,'Register',[{value:-12,label:'Octave lower'},{value:0,label:'As written'},{value:12,label:'Octave higher'}],s.shift,v=>{s.shift=Number(v);u.update();});u.range(u.host,'Counter level',s.level,0,100,1,v=>{s.level=v;u.update();});u.toggle(u.host,'Short note envelopes',s.short,v=>{s.short=v;u.update();});u.select(u.host,'Solo',['Both','Theme','Counter'],s.solo,v=>{s.solo=v;u.update();});u.button(u.host,'Save countermelody',()=>u.saveSketch({counter:counter(),counterInstrument:s.instrument,counterLevel:s.level},'Countermelody saved for the final sketch.'));},
      read:()=>s.counter.filter(n=>s.theme.some(t=>t.s<n.s+n.d&&t.s+t.d>n.s)).length+' counter notes overlap the theme. Overlap can work; compare rhythm, register, note length and level before deciding.',
      check:()=>({ok:s.counter.length>0&&s.counter.some(n=>!s.theme.some(t=>t.s<n.s+n.d&&t.s+t.d>n.s)),text:'Place at least one response in a rest. If your theme has no rests, create one in PReVaDe and bring the updated phrase back in.'})};
  };
  activities.ostinato=(s,u)=>{
    u.defaults({pattern:[{m:48,s:0,d:.5},{m:55,s:1,d:.5},{m:60,s:2,d:.5},{m:55,s:3,d:.5}],melody:true,level:45,source:'Fifths'});u.notes('pattern',[]);
    const build=()=>{const sketch=A.sketch(),h=sketch.harmonised,theme=A.valid(h?.notes)?h.notes:phrase(),pattern=Array.from({length:4},(_,b)=>s.pattern.map(n=>({...n,s:n.s+4*b}))).flat();
      const harmony=h&&validNumbers(h.pick,4,0,8)&&h.pick.every(c=>A.chords[c])?h.pick.flatMap((c,b)=>A.chords[c].v.map(m=>({m,s:b*4,d:4,instrument:'piano',layer:'Harmony',gain:.08}))) : [];
      return {events:sampled(pattern,'piano','Ostinato',.14*s.level/100).concat(s.melody?sampled(theme,'flute','Theme',.15):[]).concat(harmony).concat(A.valid(sketch.counter)?sampled(sketch.counter,AccelAudio.banks[sketch.counterInstrument]?sketch.counterInstrument:'cello','Counter',.12*(sketch.counterLevel??55)/100):[]),beats:16,bpm:96};};
    return {build,
      render:()=>{u.editor(u.host,'Ostinato: one four-beat bar',s.pattern,ns=>{s.pattern=ns;u.update();});u.select(u.host,'Starting material',['Fifths','Arpeggio','Scale'],s.source,v=>{s.source=v;const pitches=v==='Fifths'?[48,55,60,55]:v==='Arpeggio'?[48,52,55,60]:[48,50,52,53];s.pattern=pitches.map((m,i)=>({m,s:i,d:.5}));u.redraw();});u.toggle(u.host,'Melody on',s.melody,v=>{s.melody=v;u.update();});u.range(u.host,'Ostinato level',s.level,0,100,1,v=>{s.level=v;u.update();});u.button(u.host,'Save final sketch',()=>u.saveSketch({ostinato:s.pattern,ostinatoLevel:s.level},'Final sketch saved. Compare the original motif and completed arrangement.'));u.button(u.host,'Hear original motif',()=>u.preview(sampled(motif()),96,4));u.button(u.host,'Hear complete sketch',()=>u.preview(build().events,96,16));},
      read:()=>s.pattern.length+' onsets per bar. Leaving out the third reduces major/minor specificity, but the pitches still need to fit the harmony. Melody toggles apply immediately.',
      check:()=>({ok:s.pattern.length>=4&&s.pattern.some(n=>n.accent)&&s.level<65,text:'Use at least four onsets and one accent. Lower the pattern until you can comfortably follow the melody. This checks exercise constraints, not musical quality.'})};
  };
  return activities;
})();
