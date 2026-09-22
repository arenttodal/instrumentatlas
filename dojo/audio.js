/* ============================================================================
   EAR TRAINING · AUDIO ENGINE
   ----------------------------------------------------------------------------
   One engine, three modes. Belts had a copy, Layers had a near-identical copy,
   and Blend would have been a third; this is that code once, with the handful
   of genuine differences turned into options.

   It descends from the two engines already in this repo, both expensive to get
   right and both solving exactly this problem:

   From AudioCompare (atlas-studio.js) — one AudioContext, every clip decoded to
   a buffer, every source started at ONE scheduled time, and changing what you
   hear done as a gain ramp rather than a restart. That is what makes an A/B
   switchable mid-note and a solo instant, and it is why the Blend mode can
   cross-fade between two MIXES without the horn they share ever dipping.

   From the Score View (valley-sunrise-app/score.html) — every playing node
   lives in a registry, created only through startNode() and destroyed only
   through killNode()/killAll(). The version before it keyed nodes in a Map and
   overwrote entries, orphaning sources that kept playing with no reference:
   audible as phasing, as solo failing to isolate, and as sound continuing
   after stop.

   Usage:
     const A = makeDojoAudio({ srcOf: id => '…url…' });          // Belts, Blend
     const A = makeDojoAudio({ srcOf, sampleRate:32000 });        // Layers

   Options
     srcOf(id)     required. Where a clip id's audio lives.
     sampleRate    context rate. Layers passes 32000 because it holds twelve
                   stems of a two-minute piece; the other two run at the
                   device rate, because they are claims about timbre and the
                   top octave is where a piccolo and a celesta differ.
     cacheMax      decoded buffers kept. Default 8.
   ============================================================================ */

function makeDojoAudio(opts){

  const srcOf     = opts.srcOf;
  const CACHE_MAX = opts.cacheMax || 8;
  const LEAD      = 0.08;          // scheduling lead, so every source starts together
  const RAMP      = 0.02;          // inside AudioCompare's 15–30 ms window

  let ctx = null, gen = 0;
  const buffers = new Map();       // key -> AudioBuffer. Insertion order is LRU order.
  const LIVE    = new Set();       // {id, src, gain} — nothing else holds a node

  let startTime = 0, duration = 0;
  let playing = false, loading = false, failed = null;
  let onstate = () => {};

  /* Invariant 9 in the handoff: never at load, only on a gesture. */
  function ensureCtx(){
    if(!ctx){
      const C = window.AudioContext || window.webkitAudioContext;
      ctx = opts.sampleRate ? new C({ sampleRate: opts.sampleRate }) : new C();
    }
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

  function startNode(id, buf, when, gainValue, loopEnd, offset){
    killId(id);                                  // never two nodes for one clip
    if(!buf) return null;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if(loopEnd){ src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(loopEnd, buf.duration); }
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    src.connect(gain).connect(ctx.destination);
    const n = { id, src, gain };
    src.onended = () => {
      LIVE.delete(n);
      if(!LIVE.size && playing){ playing = false; onstate(); }
    };
    src.start(when, offset || 0);
    LIVE.add(n);
    return n;
  }

  /* ---- buffers ---- */
  function touch(k){ const b = buffers.get(k); buffers.delete(k); buffers.set(k, b); }

  function evict(){
    if(buffers.size <= CACHE_MAX) return;
    for(const k of [...buffers.keys()]){
      if(buffers.size <= CACHE_MAX) break;
      if(nodeFor(k.split('@')[0])) continue;     // never drop something that is sounding
      buffers.delete(k);
    }
  }

  /* `cut` is {start, dur} or null. When given, the decoded buffer is copied
     down to those seconds and the full one dropped — a section is ten to
     sixteen seconds of a 113-second piece, so a five-stem exercise holds about
     20 MB instead of 145 MB, and the full buffer exists only while one stem is
     being cut. A short fade at each edge: the cut lands wherever the bar line
     lands, which is rarely a zero crossing, and the loop point would click on
     every pass. */
  async function decode(id, cut){
    const key = cut ? `${id}@${cut.start.toFixed(3)}+${cut.dur.toFixed(3)}` : id;
    if(buffers.has(key)){ touch(key); return buffers.get(key); }

    const url = srcOf(id);
    const res = await fetch(url);
    if(!res.ok) throw new Error('Missing audio file: ' + url);
    const full = await ensureCtx().decodeAudioData(await res.arrayBuffer());

    let out = full;
    if(cut){
      const sr   = full.sampleRate;
      const off  = Math.max(0, Math.round(cut.start * sr));
      const n    = Math.max(1, Math.min(Math.round(cut.dur * sr), full.length - off));
      const fade = Math.min(Math.round(0.014 * sr), n >> 1);
      out = ctx.createBuffer(full.numberOfChannels, n, sr);
      for(let c = 0; c < full.numberOfChannels; c++){
        const dst = out.getChannelData(c);
        dst.set(full.getChannelData(c).subarray(off, off + n));
        for(let i = 0; i < fade; i++){
          const g = i / fade;
          dst[i] *= g;
          dst[n - 1 - i] *= g;
        }
      }
    }
    buffers.set(key, out);
    return out;                                  // `full` is unreferenced when cut
  }

  /* ---- transport ----
     `ids` all start at one scheduled time, each through its own gain. `gains`
     says which of them is audible; anything not named starts silent and can be
     ramped up later without a restart, which is the whole A/B mechanism.

     `lock` is for a set that sounds SIMULTANEOUSLY and must not drift: it loops
     every clip at the shortest duration in the set. A/B sets pass lock:false,
     because only one side is ever audible and truncating the longer clip to
     the shorter would cut a phrase for nothing.

     Every play() takes a generation token. Decoding is async, so a play still
     fetching when the learner presses Next — or presses play again — must not
     start its sources afterwards: that is how a clip from the previous question
     ends up sounding underneath the next one, with nothing on screen to explain
     it. stop() bumps the generation too, so stop means stop, including work
     that has not landed yet. */
  async function play(ids, options){
    const o = options || {};
    const mine = ++gen;
    failed = null;
    try {
      ensureCtx();
      if(ctx.state === 'suspended') await ctx.resume();
      loading = true; onstate();

      const bufs = [];
      for(const id of ids){
        bufs.push(await decode(id, o.cut || null));
        if(mine !== gen) return false;           // superseded while decoding
      }
      evict();
      loading = false;

      killAll();
      const durs   = bufs.map(b => b.duration);
      duration     = o.cut ? Math.min(...durs) : Math.max(...durs);
      const shared = o.lock ? Math.min(...durs) : 0;
      const when   = ctx.currentTime + LEAD;
      /* No gains map means "play this set" and everything comes up — which is
         what Layers wants of a mix and what Belts wants of a single clip. A
         map is exhaustive: anything it does not name starts silent, ready to
         be ramped up later without a restart. */
      ids.forEach((id, i) => startNode(
        id, bufs[i], when,
        o.gains ? (id in o.gains ? o.gains[id] : 0) : 1,
        o.loop ? (shared || bufs[i].duration) : 0
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

  /* ---- extend: add to a mix that is already sounding, in step with it ----
     play() replaces everything and starts from zero. That is right when the
     question changes and wrong when it has not: Blend's A/B needs the clips you
     did NOT hear brought in underneath the ones you did, silent, so that
     switching sides is a gain ramp over music that never stopped. A new source
     starts at the buffer position the running loop is already at, so it lands
     in phase rather than at the top of the phrase.

     It assumes what the material guarantees: every clip of a set is the same
     length, bounced from one project. Anything shorter is wrapped by the
     modulo and would sit out of phase. */
  async function extend(ids, options){
    const o = options || {};
    if(!playing || !LIVE.size) return play(ids, o);
    const mine = ++gen;
    const want = ids.filter(id => !nodeFor(id));
    try {
      if(want.length){
        loading = true; onstate();
        const bufs = [];
        for(const id of want){
          bufs.push(await decode(id, o.cut || null));
          if(mine !== gen) return false;         // superseded while decoding
        }
        evict();
        loading = false;
        const when = ctx.currentTime + LEAD;
        want.forEach((id, i) => {
          const b = bufs[i];
          const at = b.duration ? (((when - startTime) % b.duration) + b.duration) % b.duration : 0;
          startNode(id, b, when, o.gains ? (id in o.gains ? o.gains[id] : 0) : 1,
                    o.loop ? b.duration : 0, at);
        });
      }
      if(o.gains) setGains(o.gains);
    } catch(e){
      if(mine !== gen) return false;
      loading = false; failed = e.message;
      console.error(e);
      return false;
    } finally {
      if(mine === gen) onstate();
    }
    return true;
  }

  function stop(){
    gen++;                                       // abandon anything still decoding
    killAll();
    playing = false;
    loading = false;
    onstate();
  }

  /* ---- gains. A ramp, never a restart. ----
     setGains takes a map and is the general case: Blend cross-fades between
     two mixes with it, and the horn both mixes share simply stays at 1 and
     never dips. select() and solo() are the two shapes the other modes want. */
  function setGains(map, ramp){
    if(!ctx) return;
    const now = ctx.currentTime;
    const r = ramp === undefined ? RAMP : ramp;
    LIVE.forEach(n => {
      const target = n.id in map ? map[n.id] : 0;
      n.gain.gain.cancelScheduledValues(now);
      n.gain.gain.setValueAtTime(n.gain.gain.value, now);
      n.gain.gain.linearRampToValueAtTime(target, now + r);
    });
  }
  /* exactly one audible */
  function select(id, ramp){ setGains({ [id]:1 }, ramp); }
  /* one audible, or everything back up when id is null */
  function solo(id, ramp){
    if(id === null){ const all = {}; LIVE.forEach(n => all[n.id] = 1); setGains(all, ramp === undefined ? 0.03 : ramp); }
    else setGains({ [id]:1 }, ramp === undefined ? 0.03 : ramp);
  }

  function position(){
    if(!playing || !ctx) return 0;
    /* sources are scheduled LEAD seconds ahead, so this is negative until they
       actually start; clamped so a progress bar never gets a negative scale */
    const p = Math.max(0, ctx.currentTime - startTime);
    return duration ? (p % duration) : 0;
  }

  /* the current gain of every live node. The registry stays private; this is a
     read-only window onto it, for the modes' own state and for tests. */
  function levels(){
    const o = {};
    LIVE.forEach(n => { o[n.id] = Math.round(n.gain.gain.value * 1000) / 1000; });
    return o;
  }

  return {
    play, extend, stop, setGains, select, solo, position, levels, ensureCtx,
    get playing(){ return playing; },
    get loading(){ return loading; },
    get duration(){ return duration; },
    get error(){ return failed; },
    set onstate(fn){ onstate = fn; }
  };
}
