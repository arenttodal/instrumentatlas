/* One playback owner, sample cache and cancellable audio-clock scheduler. */
const AccelAudio = (() => {
  let ctx,master,analyser,owner=null,volume=.6;
  const cache=new Map(),pending=new Map();
  const banks={piano:[36,43,48,55,60,67,72,79,84],flute:[48,60,72],oboe:[48,60,72],clarinet:[48,60,72],horn:[48,60,72],trumpet:[48,60,72],violin:[48,60,72],viola:[48,60,72],cello:[36,48,60]};
  function context(){if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('Interactive audio is unavailable in this browser.');ctx=new C();master=ctx.createGain();master.gain.value=volume;analyser=ctx.createAnalyser();analyser.fftSize=2048;master.connect(analyser).connect(ctx.destination);}return ctx;}
  const anchor=(instrument,m)=>banks[instrument].reduce((a,b)=>Math.abs(b-m)<Math.abs(a-m)?b:a);
  const path=n=>'accelerator/audio/'+(n.instrument||'piano')+'/'+Accel.note(anchor(n.instrument||'piano',n.m))+'.mp3';
  async function load(url){
    if(cache.has(url))return cache.get(url);if(pending.has(url))return pending.get(url);
    const p=(async()=>{const response=await fetch(url);if(!response.ok)throw Error('Audio could not load. Check your connection and retry.');const buffer=await context().decodeAudioData(await response.arrayBuffer());
      const d=buffer.getChannelData(0);let sum=0,count=0;for(let i=Math.floor(buffer.sampleRate*.03);i<Math.min(d.length,buffer.sampleRate);i+=4){sum+=d[i]*d[i];count++;}
      const trim=Math.min(3,.12/Math.max(.015,Math.sqrt(sum/Math.max(1,count))));const result={buffer,trim};cache.set(url,result);return result;})();
    pending.set(url,p);try{return await p;}finally{pending.delete(url);}
  }
  class Transport {
    constructor(onstate=()=>{},onprogress=()=>{}){this.onstate=onstate;this.onprogress=onprogress;this.events=[];this.bpm=88;this.beats=4;this.loop=true;this.status='idle';this.offset=0;this.token=0;this.sources=new Set();}
    get duration(){return this.beats*60/this.bpm;}
    get position(){return this.status==='playing'?Math.max(0,(context().currentTime-this.start)%this.duration):this.offset;}
    configure(events,bpm=88,beats=4){this.events=events.filter(n=>n.d>0&&n.s>=0&&n.s<beats).map(n=>({...n,d:Math.min(n.d,beats-n.s)}));this.bpm=bpm;this.beats=beats;}
    async play(offset=this.offset,lead=.035){
      if(owner&&owner!==this)owner.stop();owner=this;const token=++this.token;this.teardown();this.offset=Math.max(0,Math.min(offset,this.duration-.001));this.error='';this.status='loading';this.onstate(this);
      try{const c=context();if(c.state!=='running')await c.resume();if(c.state!=='running')throw Error('Tap Play again to enable audio.');
        await Promise.all([...new Set(this.events.filter(n=>n.instrument!=='synth').map(n=>n.src||path(n)))].map(load));if(token!==this.token)return;
        this.start=c.currentTime+lead-this.offset;this.cycle=0;this.queue=null;this.status='playing';this.pump();this.timer=setInterval(()=>this.pump(),25);this.tick();this.onstate(this);
      }catch(e){if(token!==this.token)return;this.status='error';this.error=e.message;this.onstate(this);}
    }
    pump(){
      if(this.status!=='playing')return;const now=context().currentTime,horizon=now+.12,spb=60/this.bpm;
      const queue=()=>this.events.map(n=>({...n,at:this.start+this.cycle*this.duration+n.s*spb,end:this.start+this.cycle*this.duration+(n.s+n.d)*spb})).sort((a,b)=>a.at-b.at);
      if(!this.queue)this.queue=queue();
      while(this.queue.length&&this.queue[0].at<horizon){const n=this.queue.shift();if(n.end>now)this.schedule(n,Math.max(now+.005,n.at));}
      const end=this.start+(this.cycle+1)*this.duration;
      if(!this.queue.length&&end<horizon&&this.loop){this.cycle=Math.max(this.cycle+1,Math.floor((now-this.start)/this.duration));this.queue=queue();}
      else if(!this.loop&&now>end+.08)this.stop();
    }
    schedule(n,when){
      const c=context(),dur=Math.max(.02,n.end-when),env=c.createGain();env.connect(master);
      const gain=(n.gain??.14)*(n.accent?1.3:1);env.gain.setValueAtTime(0,when);env.gain.linearRampToValueAtTime(gain,when+Math.min(.02,dur*.2));env.gain.setValueAtTime(gain,when+Math.max(.02,dur-.04));env.gain.linearRampToValueAtTime(0,when+dur+.015);
      const record={env,nodes:[]};this.sources.add(record);let finished=false;
      const finish=()=>{if(finished)return;finished=true;record.nodes.forEach(n=>{try{n.disconnect();}catch(_){}});env.disconnect();this.sources.delete(record);};
      if(n.instrument==='synth'){
        const amps=n.partials||[1,.3,.15,.08];const scale=n.match?1/Math.max(.1,Math.sqrt(amps.reduce((a,v)=>a+v*v,0))):1;
        amps.forEach((amp,k)=>{if(!amp)return;const o=c.createOscillator(),g=c.createGain();o.frequency.value=440*2**((n.m-69)/12)*(k+1);g.gain.value=amp*scale*.6;o.connect(g).connect(env);record.nodes.push(o,g);o.start(when);o.stop(when+dur+.025);o.onended=finish;});if(!record.nodes.length)finish();
      }else{
        const instrument=n.instrument||'piano',entry=cache.get(n.src||path(n));if(!entry){finish();return;}
        const source=c.createBufferSource(),g=c.createGain();source.buffer=entry.buffer;source.playbackRate.value=n.src?1:2**((n.m-anchor(instrument,n.m))/12);g.gain.value=n.match===false?1:entry.trim;source.connect(g).connect(env);record.nodes.push(source,g);
        const offset=Math.max(0,when-n.at)*source.playbackRate.value;if(offset>=entry.buffer.duration){finish();return;}
        source.start(when,offset);source.stop(when+dur+.025);source.onended=finish;
      }
    }
    tick(){cancelAnimationFrame(this.raf);if(this.status!=='playing')return;this.onprogress(this.position,this.duration);this.raf=requestAnimationFrame(()=>this.tick());}
    teardown(){clearInterval(this.timer);cancelAnimationFrame(this.raf);this.queue=null;const now=ctx?ctx.currentTime:0;
      this.sources.forEach(r=>{try{r.env.gain.cancelScheduledValues(now);r.env.gain.setValueAtTime(r.env.gain.value,now);r.env.gain.linearRampToValueAtTime(0,now+.015);}catch(_){}r.nodes.forEach(n=>{try{if(n.stop)n.stop(now+.02);}catch(_){}});});this.sources.clear();}
    pause(){const p=this.position;++this.token;this.teardown();this.offset=p;this.status='paused';this.onstate(this);}
    stop(){++this.token;this.teardown();this.offset=0;this.status='idle';this.onstate(this);this.onprogress(0,this.duration);}
    replace(events,bpm,beats){const playing=['playing','loading'].includes(this.status),pos=this.position;this.configure(events,bpm,beats);if(playing)this.play(pos%this.duration,0);}
    destroy(){this.stop();if(owner===this)owner=null;}
  }
  async function preview(events,bpm=88,beats=4){const t=new Transport();t.configure(events,bpm,beats);t.loop=false;await t.play(0);return t;}
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&owner)owner.pause();});window.addEventListener('pagehide',()=>{if(owner)owner.stop();});
  return {Transport,preview,load,banks,stop:()=>owner?.stop(),volume:()=>volume,
    setVolume:v=>{volume=Number(v);if(master)master.gain.setTargetAtTime(volume,ctx.currentTime,.015);},
    spectrum:()=>{if(!analyser)return null;const b=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(b);return b;},
    inspect:()=>({status:owner?.status||'idle',sources:owner?.sources.size||0})};
})();
