/* Quarter-note beats and concert-pitch MIDI throughout. */
const Accel = (() => {
  const clone = x => JSON.parse(JSON.stringify(x));
  const names = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const note = m => names[(m % 12 + 12) % 12] + (Math.floor(m / 12) - 1);
  const seed = () => [{m:60,s:0,d:1},{m:67,s:1,d:1},{m:65,s:2,d:1},{m:64,s:3,d:1}];
  const valid = ns => Array.isArray(ns) && ns.length <= 256 && ns.every(n => n && Number.isInteger(n.m) && n.m >= 24 && n.m <= 96 && Number.isFinite(n.s) && n.s >= 0 && n.s < 128 && Number.isFinite(n.d) && n.d > 0 && n.d <= 32);
  const chords = [
    {name:'C',rn:'I',pcs:[0,4,7],v:[36,55,64]}, {name:'F',rn:'IV',pcs:[5,9,0],v:[41,60,69]},
    {name:'G',rn:'V',pcs:[7,11,2],v:[43,62,71]}, {name:'Dm',rn:'ii',pcs:[2,5,9],v:[38,57,65]},
    {name:'Am',rn:'vi',pcs:[9,0,4],v:[33,52,60]}, {name:'Em',rn:'iii',pcs:[4,7,11],v:[40,59,67]},
    {name:'D♭',rn:'♭II',pcs:[1,5,8],v:[37,56,65]}, {name:'A♭',rn:'♭VI',pcs:[8,0,3],v:[32,51,60]},
    {name:'B♭',rn:'♭VII',pcs:[10,2,5],v:[34,53,62]}
  ];
  const voicing = ns => {
    const s=[...ns].sort((a,b)=>a-b),count=pc=>s.filter(m=>m%12===pc).length;
    return [
      {ok:s.every(m=>[0,4,7].includes(m%12)),text:'Keep the notes within C major for this exercise.'},
      {ok:[0,4,7].every(pc=>count(pc)>0),text:'Include C, E and G. Octaves alone do not make a complete triad.'},
      {ok:count(0)>=2,text:'Reinforce C with a second root.'},
      {ok:count(4)===1,text:count(4)+' third(s) present; aim for one E in this exercise.'},
      {ok:s[0]>=60 || s[1]-s[0]>=7,text:'Try wider spacing between the low voices.'},
      {ok:s[3]-s[2]<=s[1]-s[0],text:'Compare tighter upper spacing against the wider bass.'}
    ];
  };
  const transform = (ns,kind) => {
    if(!ns.length)return [];
    let r=clone(ns);
    if(kind==='third')r=r.map(n=>({...n,m:n.m+3}));
    if(kind==='invert')r=r.map(n=>({...n,m:2*ns[0].m-n.m}));
    if(kind==='displace')r=r.map(n=>({...n,s:(n.s+1)%4,d:Math.min(n.d,4-(n.s+1)%4)}));
    while(Math.min(...r.map(n=>n.m))<24)r=r.map(n=>({...n,m:n.m+12}));
    while(Math.max(...r.map(n=>n.m))>96)r=r.map(n=>({...n,m:n.m-12}));
    return r.sort((a,b)=>a.s-b.s);
  };
  const phrase = (ns,slots,ending) => slots.flatMap((kind,i)=>(kind==='ending'?clone(ending):transform(ns,kind)).map(n=>({...n,s:n.s+4*i})));
  const fit = (ns,chord,bar) => {
    const items=ns.filter(n=>n.s<4*bar+4 && n.s+n.d>4*bar).map(n=>({...n,inside:chord.pcs.includes(n.m%12),weight:Math.min(n.s+n.d,4*bar+4)-Math.max(n.s,4*bar)+(n.s===4*bar?1:0)}));
    return {items,fit:items.filter(n=>n.inside).reduce((a,n)=>a+n.weight,0),total:items.reduce((a,n)=>a+n.weight,0)};
  };
  const key='accel-work-v2';let writable=true;
  let data={version:2,lessons:{},sketch:{motif:seed()},last:'/'};
  const plain = x => x && typeof x==='object' && !Array.isArray(x);
  try { const r=JSON.parse(localStorage.getItem(key)||'null'); if(r?.version===2 && plain(r.lessons) && plain(r.sketch) && valid(r.sketch.motif))data=r; } catch(_){}
  try { const old=JSON.parse(localStorage.getItem('accel-progress')||'{}');if(plain(old))for(const l of LESSONS)if(!Object.hasOwn(data.lessons,l.id)&&plain(old[l.id]))data.lessons[l.id]={seen:!!old[l.id].seen,exerciseDone:!!old[l.id].exerciseDone,quizPassed:!!old[l.id].quizPassed}; } catch(_){}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(data));writable=true;}catch(_){writable=false;}};
  const lesson=id=>Object.hasOwn(data.lessons,id)&&plain(data.lessons[id])?data.lessons[id]:{};
  const patch=(id,v)=>{data.lessons[id]={...lesson(id),...clone(v)};save();};
  const done=id=>!!(lesson(id).exerciseDone&&lesson(id).quizPassed);
  const quiz=(id,answers,qs)=>{const score=answers.filter((a,i)=>a===qs[i].a).length;patch(id,{answers,quizPassed:!!lesson(id).quizPassed||score===qs.length,bestScore:Math.max(lesson(id).bestScore||0,score),lastScore:score});return score;};
  return {clone,note,seed,valid,chords,voicing,transform,phrase,fit,lesson,patch,done,quiz,
    sketch:()=>clone(data.sketch),setSketch:v=>{data.sketch={...data.sketch,...clone(v)};save();},
    last:()=>data.last,setLast:p=>{data.last=p;save();},writable:()=>writable,
    export:()=>JSON.stringify(data,null,2),
    import:text=>{const r=JSON.parse(text);if(r?.version!==2 || !plain(r.lessons)||!plain(r.sketch)||!valid(r.sketch.motif))throw Error('Choose a valid Accelerator backup.');
      for(const l of LESSONS)if(plain(r.lessons[l.id]))patch(l.id,{...r.lessons[l.id],quizPassed:!!lesson(l.id).quizPassed||!!r.lessons[l.id].quizPassed,exerciseDone:!!lesson(l.id).exerciseDone||!!r.lessons[l.id].exerciseDone});
      data.sketch=clone(r.sketch);save();}
  };
})();
