/* The voice hook in the transport, and the Voicing Atlas sound layer on top.
   node tests/sound.cjs   (needs the site served; ACCEL_URL or :8765)

   smplr and its samples come from a CDN. Where that is reachable the real
   instruments load; where it is not — a locked-down CI runner, a train — the
   voice falls back to this repo's own banks, and that fallback is the thing
   this file checks hardest, because it is what decides whether a lesson makes
   a sound at all. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const BASE = process.env.ACCEL_URL || 'http://127.0.0.1:8765';

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m + '\n      got  ' + JSON.stringify(a) + '\n      want ' + JSON.stringify(b)); checks++; };

(async () => {
  const browser = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { try { localStorage.setItem('evenant-gate-accelerator','g3j74oa'); } catch(_){} });
  await page.goto(BASE + '/accelerator.html#/foundations/overtones');
  await page.locator('[data-play]').waitFor();

  /* ------------------------------------------------- 1. the hook exists --- */
  eq(await page.evaluate(() => typeof AccelAudio.voices.register), 'function', 'voices.register');
  eq(await page.evaluate(() => typeof AccelAudio.ctx), 'function', 'AccelAudio.ctx()');
  eq(await page.evaluate(() => AccelAudio.voices.list()), [], 'nothing is registered until something registers');

  /* --------------------------------- 2. a voice is loaded once and played --- */
  await page.evaluate(() => {
    window.spy = { loads:0, starts:[], stops:0 };
    AccelAudio.voices.register('test:tone', {
      load(ctx, dest){ spy.loads++; spy.ctx = ctx; spy.dest = dest; return Promise.resolve(true); },
      start(n){ spy.starts.push({ m:n.m, dur:Math.round(n.dur*100)/100, gain:n.gain });
                return () => { spy.stopped = (spy.stopped||0) + 1; }; },
      stopAll(){ spy.stops++; }
    });
  });
  ok(await page.evaluate(() => AccelAudio.voices.has('test:tone')), 'the voice is registered');

  await page.evaluate(async () => {
    window.T = new AccelAudio.Transport(() => {}, () => {});
    T.configure([{ m:60, s:0, d:1, instrument:'test:tone' },
                 { m:64, s:1, d:1, instrument:'test:tone' },
                 { m:67, s:2, d:2, instrument:'test:tone', gain:.3 }], 120, 4);
    T.loop = false;
    await T.play(0);
  });
  await page.waitForTimeout(400);
  eq(await page.evaluate(() => spy.loads), 1, 'load() runs once for the phrase');
  ok(await page.evaluate(() => spy.ctx === AccelAudio.ctx()), 'the voice is built on the transport\'s own context');
  ok(await page.evaluate(() => spy.dest === AccelAudio.master), 'and destined for its master gain');
  ok(await page.evaluate(() => spy.starts.length >= 1), 'notes reach the voice');
  eq(await page.evaluate(() => spy.starts[0].m), 60, 'the first note is the first note');
  eq(await page.evaluate(() => spy.starts[0].dur), 0.5, 'one beat at 120bpm is half a second');
  eq(await page.evaluate(() => spy.starts[0].gain), 0.14, 'and carries the default gain');

  await page.waitForTimeout(900);
  const third = await page.evaluate(() => spy.starts.find(s => s.m === 67));
  ok(third, 'and the later notes arrive as the scheduler reaches them');
  eq(third.gain, 0.3, 'a note with its own gain keeps it');
  eq(third.dur, 1, 'and its own length');

  /* --------------------------- 3. pause and stop silence a queued voice --- */
  await page.evaluate(() => { spy.stops = 0; T.pause(); });
  ok(await page.evaluate(() => spy.stops >= 1), 'pause tells every loaded voice to stop');
  await page.evaluate(() => { spy.stops = 0; T.play(0); });
  await page.waitForTimeout(250);
  await page.evaluate(() => { spy.stops = 0; T.stop(); });
  ok(await page.evaluate(() => spy.stops >= 1), 'and so does stop');
  eq(await page.evaluate(() => AccelAudio.inspect().sources), 0, 'with nothing left sounding');

  /* ------------------------- 4. a voice that cannot load is not a crash --- */
  await page.evaluate(() => {
    window.sad = { starts:0 };
    AccelAudio.voices.register('test:broken', {
      load(){ return Promise.reject(Error('no network')); },
      start(){ sad.starts++; }, stopAll(){}
    });
  });
  const survived = await page.evaluate(async () => {
    const t = new AccelAudio.Transport(() => {}, () => {});
    t.configure([{ m:60, s:0, d:1, instrument:'test:broken' }], 120, 2);
    t.loop = false;
    let threw = null;
    try { await t.play(0); } catch(e){ threw = e.message; }
    const out = { threw, status: t.status, loaded: AccelAudio.voices.loaded('test:broken') };
    t.destroy();
    return out;
  });
  eq(survived.threw, null, 'a failing voice does not throw out of play()');
  eq(survived.loaded, false, 'and is not marked loaded');
  eq(await page.evaluate(() => sad.starts), 0, 'so no note is sent to it');

  /* ------------------------------------- 5. EvSound registers everything --- */
  await page.addScriptTag({ url: '/evenant-sound.js' });
  const reg = await page.evaluate(() => EvSound.register(AccelAudio));
  eq(reg, 72, 'all 72 instruments register as voices');
  ok(await page.evaluate(() => AccelAudio.voices.has('va:splendid')), "including VA's grand");
  ok(await page.evaluate(() => AccelAudio.voices.has('va:sf-french-horn')), 'and its french horn');
  eq(await page.evaluate(() => EvSound.voice('splendid').instrument), 'va:splendid',
     'before anything loads, a widget is pointed at the Voicing Atlas voice');

  /* ------------------- 6. and falls back when the CDN is out of reach ---- */
  const fell = await page.evaluate(async () => {
    await AccelAudio.voices.ready('va:splendid').catch(() => {});
    return { status: EvSound.status('splendid'), v: EvSound.voice('splendid') };
  });
  if(fell.status === 'ready'){
    console.log('NOTE  the CDN is reachable here, so the real Voicing Atlas grand loaded');
    eq(fell.v.instrument, 'va:splendid', 'and stays the Voicing Atlas voice'); 
    eq(fell.v.fallback, false, 'with no fallback');
  } else {
    eq(fell.status, 'fallback', 'an unreachable CDN leaves the voice in fallback');
    eq(fell.v.instrument, 'piano', 'and a widget is pointed at this site\'s own piano instead');
    eq(fell.v.fallback, true, 'which it reports');
    ok(/could not be fetched|Offline/.test(fell.v.note), 'with something to say about it: ' + fell.v.note);
    /* the point of all this: the phrase still makes a sound */
    const sounded = await page.evaluate(async () => {
      const ev = EvSound.apply([{ m:60, s:0, d:1 }, { m:64, s:1, d:1 }], 'splendid');
      const t = new AccelAudio.Transport(() => {}, () => {});
      t.configure(ev, 120, 2); t.loop = false;
      await t.play(0);
      await new Promise(r => setTimeout(r, 250));
      const n = AccelAudio.inspect().sources;
      t.destroy();
      return { instrument: ev[0].instrument, sources: n };
    });
    eq(sounded.instrument, 'piano', 'EvSound.apply rewrites the events to the fallback');
    ok(sounded.sources > 0, 'and they actually sound: ' + sounded.sources + ' sources');
  }

  /* ------------------------------------------------------- 7. the picker --- */
  const groups = await page.evaluate(() => EvSound.options().map(g => g.group));
  eq(groups[0], 'Pianos & Keys', 'the picker opens on the pianos, as Voicing Atlas does');
  eq(groups[groups.length - 1], 'Offline · from this site', 'and ends with the banks that need no network');
  const sel = await page.evaluate(() => {
    const host = document.createElement('div'); document.body.append(host);
    let picked = null;
    const s = EvSound.picker(host, 'splendid', v => { picked = v; });
    s.value = 'sf-cello'; s.dispatchEvent(new Event('change'));
    const out = { picked, remembered: EvSound.remembered(), groups: s.querySelectorAll('optgroup').length,
                  total: s.querySelectorAll('option').length };
    host.remove();
    return out;
  });
  eq(sel.picked, 'sf-cello', 'choosing an instrument reports it');
  eq(sel.remembered, 'sf-cello', 'and remembers it');
  eq(sel.total, 81, 'every instrument plus the offline banks is in the list');
  eq(sel.groups, 11, 'in eleven groups');

  /* a network error reaching the CDN is expected here and is not a page error */
  const real = errors.filter(e => !/Failed to fetch dynamically imported|unpkg|NetworkError|Importing a module script failed/i.test(e));
  eq(real, [], 'no unexpected page errors');

  console.log('PASS sound: ' + checks + ' checks — voice hook, one context, pause and stop, ' +
              'a failing voice, 72 registrations, fallback, picker');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
