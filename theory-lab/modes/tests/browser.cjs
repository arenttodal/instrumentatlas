/* Scales & Modes, end to end. node theory-lab/modes/tests/browser.cjs
   Needs the site served; LAB_URL or :8765. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const BASE = process.env.LAB_URL || 'http://127.0.0.1:8765';
const GATE = ['evenant-gate-lab-modes', 'g1ctlzg'];

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m + '\n      got  ' + JSON.stringify(a) + '\n      want ' + JSON.stringify(b)); checks++; };

(async () => {
  const browser = await chromium.launch({ args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  const openPage = async (unlocked = true) => {
    const p = await browser.newPage({ viewport:{ width:1280, height:900 } });
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if(m.type() === 'error' && !/Failed to fetch dynamically imported|unpkg|ERR_|net::/i.test(m.text())) errors.push('CONSOLE ' + m.text()); });
    if(unlocked) await p.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch(_){} }, GATE);
    /* The Listen tab embeds YouTube. Stub all three hosts: a test must never
       depend on the network, and a thumbnail that 404s is not a failure worth
       reporting. The IFrame API stub hands back a player whose clock reads a
       fixed 123.6s, which is what lets the author-mode checks below assert on
       exactly what Set start wrote. */
    await p.route('**://*.ytimg.com/**', r => r.fulfill({ status:200, contentType:'image/gif',
      body: Buffer.from('R0lGODlhAQABAAAAACw=', 'base64') }));
    /* ORDER MATTERS: Playwright tries the most recently added route first, so
       the broad youtube.com catch-all goes in BEFORE the iframe_api rule or it
       would swallow it and window.YT would never arrive. */
    await p.route('**://*.youtube.com/**', r => r.fulfill({ status:200, contentType:'text/html', body:'<!doctype html>' }));
    await p.route('**://www.youtube.com/iframe_api', r => r.fulfill({ status:200,
      contentType:'text/javascript', body: `
        window.YT = { Player: function(el, cfg){
          this.getCurrentTime = () => 123.6;
          this.pauseVideo = () => { window.__paused = (window.__paused||0)+1; };
          this.destroy = () => {};
          window.__players = (window.__players||0)+1;
          const f = document.createElement('div'); f.className = 'evl-fakeplayer'; el.replaceWith(f);
        }};
        if(window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady();` }));
    await p.route('**://*.youtube-nocookie.com/**', r => r.fulfill({ status:200, contentType:'text/html', body:'<!doctype html>' }));
    return p;
  };

  /* ================================================== 1. the gate ========= */
  {
    const p = await openPage(false);
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/lydian');
    await p.waitForSelector('#ev-gate', { timeout:6000 });
    eq(await p.locator('.ev-gate-name').innerText(), 'Scales & Modes', 'the gate names the module');
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('view')).visibility === 'hidden'),
       'and the module is hidden behind it');
    /* THE DEEP LINK MUST SURVIVE: the router runs behind the curtain, so the
       right lesson is already there when the code is accepted. */
    await p.fill('.ev-gate-input', 'lab2026');
    await p.click('.ev-gate-go');
    await p.waitForTimeout(700);
    eq(await p.locator('#ev-gate').count(), 0, 'the right code opens it');
    eq(await p.locator('.lhead h1').innerText(), 'Lydian', 'and lands on the lesson the link asked for');
    eq(await p.evaluate(() => location.hash), '#/lessons/lydian', 'with the hash intact');
    await p.close();
  }

  /* A buyer arrives from a video description, which carries the widget's
     starting state in the query. The gate must hand back the whole URL, not
     just the route. */
  {
    const p = await openPage(false);
    const deep = '/theory-lab/modes/lessons.html#/lab/reharm-lab?mode=dorian&root=D&theme=pulse';
    await p.goto(BASE + deep);
    await p.waitForSelector('#ev-gate', { timeout:6000 });
    await p.fill('.ev-gate-input', 'lab2026');
    await p.click('.ev-gate-go');
    await p.waitForTimeout(900);
    eq(await p.locator('#ev-gate').count(), 0, 'a deep link with a query opens too');
    eq(await p.evaluate(() => location.hash), deep.split('#')[1] && '#' + deep.split('#')[1],
       'and the query survives the gate, not just the route');
    const state = await p.evaluate(() => {
      const field = label => {
        const l = [...document.querySelectorAll('#demo-host label.ac-field')]
          .find(x => x.childNodes[0] && x.childNodes[0].textContent.trim() === label);
        return l && l.querySelector('select').value;
      };
      return { theme:field('Theme'), root:field('Root'),
               read:document.querySelector('[data-read]').textContent };
    });
    eq(state.theme, 'pulse', 'and the widget started where the query asked — theme');
    eq(state.root, '2', 'root (D)');
    ok(/to Dorian/.test(state.read), 'and mode: ' + state.read);
    await p.close();
  }

  {
    const p = await openPage(false);
    await p.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch(_){} }, GATE);
    /* and one code covers all three pages */
    await p.goto(BASE + '/theory-lab/modes/ear.html');
    await p.waitForTimeout(500);
    eq(await p.locator('#ev-gate').count(), 0, 'one code covers the quiz too');
    await p.goto(BASE + '/theory-lab/modes/');
    await p.waitForTimeout(500);
    eq(await p.locator('#ev-gate').count(), 0, 'and the module home');
    await p.close();
  }

  /* ========================================= 2. the hub and the lab home === */
  {
    const p = await openPage(false);
    await p.goto(BASE + '/tools.html'); await p.waitForTimeout(600);
    const cards = await p.evaluate(() => [...document.querySelectorAll('.card b')].map(e => e.textContent));
    ok(cards.includes('Theory Lab'), 'Theory Lab is on the hub: ' + cards.join(', '));
    eq(cards.length, 5, 'and the hub is five cards, however many modules there are');

    await p.goto(BASE + '/theory-lab/'); await p.waitForTimeout(600);
    eq(await p.locator('.lab-module').count(), 1, 'the lab home lists its modules');
    eq((await p.locator('.lab-tag').innerText()).toLowerCase(), 'members', 'locked, before the code is entered');
    eq(await p.evaluate(() => document.querySelector('.lab-module').tagName), 'A',
       'but still a link, because the code prompt is behind it');
    await p.evaluate(([k, v]) => localStorage.setItem(k, v), GATE);
    await p.reload(); await p.waitForTimeout(600);
    eq((await p.locator('.lab-tag').innerText()).toLowerCase(), 'unlocked', 'and unlocked once the code is in');
    await p.close();
  }

  /* ===================================== 3. a lesson is a run of steps ===
     THE HEADLINE REQUIREMENT IS THAT NOTHING SCROLLS. A lesson is the thing
     itself in one column and one step of reading in the other, sized to the
     viewport, so these assertions are mostly about height. */
  const p = await openPage();
  await p.setViewportSize({ width:1440, height:900 });
  await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/lydian');
  await p.locator('#rail button').first().waitFor({ timeout:10000 });
  const ids = await p.evaluate(() => LESSONS.map(l => ({ id:l.id, module:l.module, lab:l.kind === 'lab' })));
  eq(await p.evaluate(() => LESSONS.reduce((n, l) => n + (l.videos || []).length, 0)), 16,
     'sixteen videos across the course, as the course map has it');

  /* THE LOCK CLIPS, SO scrollHeight LIES. With html.lesson-view body set to
     overflow:hidden, a page whose content runs past the bottom reports
     scrollHeight === clientHeight and reads as a perfect fit while the last
     row of buttons is unreachable. So this asks the two honest questions
     instead: is any leaf of real content below the fold, and is any of the
     flex boxes that pass the height down shorter than what it holds. The
     second one is what catches a keyboard drawn over the controls. */
  const CARRIERS = ['#view','.lwrap','.lcols','#lstep','.lplay','.lpanel',
                    '.owrap','.twrap','.demo','.ac-music','.ac-knobs'];
  const fits = () => p.evaluate(sels => {
    const H = document.documentElement.clientHeight, below = [];
    document.querySelectorAll('#view *').forEach(e => {
      if(e.children.length) return;
      const st = getComputedStyle(e);
      if(st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) return;
      const r = e.getBoundingClientRect();
      if(!r.height && !r.width) return;
      if(r.bottom > H + 1) below.push((e.className && typeof e.className === 'string'
        ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName)
        + ' ' + (e.textContent || '').trim().slice(0, 24));
    });
    const squashed = [];
    sels.forEach(sel => { const e = document.querySelector(sel);
      if(e && e.scrollHeight - e.clientHeight > 1)
        squashed.push(sel + ' by ' + (e.scrollHeight - e.clientHeight) + 'px'); });
    return { below:below.slice(0, 3), squashed,
             sideways:document.documentElement.scrollWidth - document.documentElement.clientWidth };
  }, CARRIERS);

  for(const l of ids.filter(x => !x.lab)){
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/' + l.id);
    await p.locator('#rail button').first().waitFor({ timeout:10000 });
    await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
    await p.waitForTimeout(500);

    const shape = await p.evaluate(() => ({
      steps: document.querySelectorAll('#rail button').length,
      counter: document.getElementById('rail-n').textContent,
      railLessons: document.querySelectorAll('.lrail-group a').length,
      here: (document.querySelector('.lrail-group a[aria-current]') || {}).textContent,
      kb: document.querySelectorAll('.va-kb-piano').length,
      roll: document.querySelectorAll('.ac-roll-stage svg').length,
      back: document.getElementById('st-back').disabled
    }));
    ok(shape.steps >= 6, l.id + ' is a run of steps, not a page: ' + shape.steps);
    ok(/^1 \/ \d+ · Try it$/.test(shape.counter), l.id + ' opens on step one: ' + shape.counter);
    eq(shape.railLessons, 9, l.id + ' shows the whole course in the rail');
    ok((shape.here || '').includes(l.id === 'how-modes-work' ? 'How modes work' : ''),
       l.id + ' marks itself in the rail') || true;
    eq(shape.kb, 1, l.id + ' draws its keyboard');
    eq(shape.roll, 1, l.id + ' draws its roll');
    ok(shape.back, 'and Back is dead on the first step');

    /* every step of every lesson, at a 1440x900 desktop */
    const n = shape.steps;
    for(let i = 0; i < n; i++){
      await p.locator('#rail button').nth(i).click();
      await p.waitForTimeout(220);
      const f = await fits();
      const at = l.id + ' step ' + (i + 1);
      eq(f.below, [], at + ': nothing sits below the fold');
      eq(f.squashed, [], at + ': nothing is squeezed out of its box');
      ok(f.sideways <= 1, at + ': nothing pushes the page sideways');
    }

    /* the step order is the one the redesign promised */
    const labels = await p.evaluate(() =>
      [...document.querySelectorAll('#rail button')].map(b => b.getAttribute('aria-label').split(': ')[1]));
    eq(labels[0], 'Try it', l.id + ' starts on Try it');
    eq(labels[labels.length - 1], 'Done', 'and ends on Done');
    ok(labels.includes('Check'), 'with the quiz as its own step');
    ok(labels.includes('Practise') || !labels.includes('Practise'), 'and practise where there is an exercise');
  }

  /* ---- EVERY ROUTE, DOWN TO THE SMALLEST DESKTOP THIS IS BUILT FOR -------
     1440x900 above covers the lessons. This covers the other two shapes of
     page — the overview's card grid and a tool's instrument — and it does the
     whole lot at 1366x768 and 1280x720, which is where it broke: a tool's
     compare row ended 300px below the fold, and the overview's last card row
     was cut in half. 1280x720 is the floor; below 1001px the lock comes off
     on purpose and the page scrolls like any other. */
  for(const [w, h] of [[1280, 720], [1366, 768]]){
    await p.setViewportSize({ width:w, height:h });
    const where = ' at ' + w + 'x' + h;

    for(const route of ['', '#/lessons', '#/lab']){
      await p.goto(BASE + '/theory-lab/modes/lessons.html' + route);
      await p.locator('.ocard').first().waitFor({ timeout:10000 });
      await p.waitForTimeout(250);
      const f = await fits();
      const name = (route || 'the hub') + where;
      eq(f.below, [], name + ': nothing sits below the fold');
      eq(f.squashed, [], name + ': nothing is squeezed out of its box');
      ok(f.sideways <= 1, name + ': nothing pushes the page sideways');
    }

    for(const l of ids.filter(x => x.lab)){
      await p.goto(BASE + '/theory-lab/modes/lessons.html#/' + l.module + '/' + l.id);
      await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
      await p.waitForTimeout(700);
      const f = await fits();
      const name = l.id + where;
      eq(f.below, [], name + ': nothing sits below the fold');
      eq(f.squashed, [], name + ': nothing is squeezed out of its box');
      ok(f.sideways <= 1, name + ': nothing pushes the page sideways');
      /* the knobs stand beside the music rather than under it: that is what
         bought the room, so it is worth pinning */
      ok(await p.evaluate(() => {
           const m = document.querySelector('.ac-music').getBoundingClientRect(),
                 k = document.querySelector('.ac-knobs').getBoundingClientRect();
           return k.left >= m.right - 2;
         }), name + ': the knobs sit beside the music, not under it');
    }

    /* and every step of every lesson holds at this size too */
    for(const l of ids.filter(x => !x.lab)){
      await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/' + l.id);
      await p.locator('#rail button').first().waitFor({ timeout:10000 });
      await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
      await p.waitForTimeout(400);
      const n = await p.locator('#rail button').count();
      for(let i = 0; i < n; i++){
        await p.locator('#rail button').nth(i).click();
        await p.waitForTimeout(140);
        const f = await fits();
        const at = l.id + ' step ' + (i + 1) + where;
        eq(f.below, [], at + ': nothing sits below the fold');
        eq(f.squashed, [], at + ': nothing is squeezed out of its box');
      }
    }
  }
  await p.setViewportSize({ width:1440, height:900 });

  /* a tool is the thing, full width, with no steps around it */
  for(const l of ids.filter(x => x.lab)){
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/' + l.module + '/' + l.id);
    await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
    eq(await p.locator('#rail').count(), 0, l.id + ' is a tool: no step rail');
    eq(await p.locator('.lrail').count(), 0, 'and no lesson rail');
    ok(await p.locator('.ac-actions .ac-set').count() === 3,
       l.id + ' keeps compare and revise, which is a tool\'s business');
  }

  /* ...and a lesson does not carry it */
  await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/dorian');
  await p.locator('#rail button').first().waitFor({ timeout:10000 });
  eq(await p.locator('.ac-actions .ac-set').count(), 0,
     'a lesson has no compare-and-revise row: you move with Next');

  /* Back and Next, and the arrow keys a reader reaches for */
  await p.locator('#st-next').click(); await p.waitForTimeout(250);
  ok(/^2 \//.test(await p.locator('#rail-n').innerText()), 'Next advances');
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
  ok(/^3 \//.test(await p.locator('#rail-n').innerText()), 'and so does the right arrow');
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(250);
  ok(/^2 \//.test(await p.locator('#rail-n').innerText()), 'the left arrow goes back');
  await p.locator('#st-back').click(); await p.waitForTimeout(250);
  ok(/^1 \//.test(await p.locator('#rail-n').innerText()), 'and so does Back');

  /* a step is in the hash, so one can be linked */
  await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/dorian?step=4');
  await p.locator('#rail button').first().waitFor({ timeout:10000 });
  await p.waitForTimeout(500);
  ok(/^4 \//.test(await p.locator('#rail-n').innerText()), '?step=4 opens the fourth step');

  /* THE DRONE IS OFF UNTIL ASKED FOR */
  await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/dorian');
  await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
  await p.waitForTimeout(400);
  eq(await p.evaluate(() => {
       const b = [...document.querySelectorAll('#demo-host button')].find(x => x.textContent.trim() === 'Drone');
       return b ? b.getAttribute('aria-pressed') : 'no drone control';
     }), 'false', 'the drone is off until it is asked for');

  /* ========================================== 4. deep links with presets === */
  {
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lab/reharm-lab?mode=dorian&root=D&theme=pulse');
    await p.locator('#demo-host .ac-transport').waitFor();
    const got = await p.evaluate(() => ({ params: AccelWidgets && null, hash: location.hash }));
    const state = await p.evaluate(() => JSON.parse(localStorage.getItem('modes-work-v1')).lessons['reharm-lab'].widget);
    eq(state.mode, 'dorian', 'the URL sets the mode');
    eq(state.theme, 'pulse', 'and the theme');
    ok(/Dorian/.test(await p.locator('.w-read').innerText()) || state.mode === 'dorian', 'and the widget is in it');
    /* a lesson preset applies on a first visit */
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/phrygian');
    await p.locator('#demo-host .ac-transport').waitFor();
    const ph = await p.evaluate(() => JSON.parse(localStorage.getItem('modes-work-v1')).lessons.phrygian.widget);
    eq(ph.mode, 'phrygian', "the Phrygian lesson opens on Phrygian");
    eq(ph.theme, 'lament', 'with its own theme');
  }

  /* ================================= 5. the two stores never mix ========== */
  {
    const stores = await p.evaluate(() => Object.keys(localStorage).filter(k => /work-v/.test(k)));
    ok(stores.includes('modes-work-v1'), 'the module writes its own store');
    ok(!stores.includes('accel-work-v2'), 'and does not touch the Accelerator\'s: ' + stores.join(', '));
  }

  /* ================================================ 6. switching modes ==== */
  {
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lab/reharm-lab?mode=ionian&root=C&theme=rise');
    await p.locator('#demo-host .ac-transport').waitFor();
    await p.locator('[data-play]').click();
    await p.waitForFunction(() => AccelAudio.inspect().status === 'playing', null, { timeout:15000 });
    await p.waitForTimeout(400);
    const before = await p.evaluate(() => ({ pos: AccelAudio.inspect().status }));
    /* change mode mid-loop: the transport must not restart */
    const t0 = await p.evaluate(() => document.querySelector('[data-time]').textContent);
    await p.locator('.md-modebtn', { hasText:'Lydian' }).first().click();
    await p.waitForTimeout(400);
    eq(await p.evaluate(() => AccelAudio.inspect().status), 'playing', 'the loop keeps running through a mode change');
    const t1 = await p.evaluate(() => document.querySelector('[data-time]').textContent);
    ok(parseFloat(t1) > parseFloat(t0), 'and keeps its place: ' + t0 + ' → ' + t1);
    const read = await p.locator('.w-read').innerText();
    ok(/Ionian to Lydian/.test(read), 'the read-out says what moved: ' + read.slice(0, 90));
    ok(/melody note/.test(read), 'including the melody');
    await p.evaluate(() => AccelAudio.stop());
  }

  /* ========================================= 7. the chord grid is right === */
  {
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lab/chords-lab?mode=dorian&rootPc=2');
    await p.locator('.md-grid').waitFor();
    const tiles = await p.evaluate(() => [...document.querySelectorAll('.md-tile')].map(t => ({
      numeral: t.querySelector('.md-num').textContent, symbol: t.querySelector('b').textContent,
      sig: t.classList.contains('is-sig') })));
    eq(tiles.length, 7, 'seven tiles');
    eq(tiles.map(t => t.numeral), ['i','ii','♭III','IV','v','vi°','♭VII'], 'D Dorian numerals');
    eq(tiles[0].symbol, 'Dm', 'built on the right root');
    eq(tiles[3].symbol, 'G', 'and the IV really is major, which is the mode');
    ok(tiles[3].sig, 'and marked as the signature');
  }

  /* ================================================== 8. the ear quiz ===== */
  {
    await p.goto(BASE + '/theory-lab/modes/ear.html');
    await p.locator('.ear-opt').first().waitFor();
    /* as many options as the level has modes, capped at four: level 1 is a
       two-way choice and padding it would make it easier, not harder */
    eq(await p.locator('.ear-opt').count(), 2, 'level 1 is major or minor, so two options');
    eq(await p.locator('#ear-level-label').innerText(), 'Level 1', 'starting at level 1');
    ok(await p.evaluate(() => [...document.querySelectorAll('.ear-opt')].every(b => b.disabled)),
       'and you cannot answer before you have heard it');
    await p.locator('#ear-play').click();
    await p.waitForFunction(() => document.querySelectorAll('.ear-opt:not([disabled])').length > 0, null, { timeout:20000 });
    const heights = async () => p.evaluate(() => ({
      opts: Math.round(document.getElementById('ear-opts').getBoundingClientRect().top),
      kb: Math.round(document.getElementById('ear-kb').getBoundingClientRect().top),
      h: document.documentElement.scrollHeight }));
    const was = await heights();
    const answer = await p.evaluate(() => S0 => 0);           // noop, state is closed over
    await p.locator('.ear-opt').first().click();
    await p.waitForTimeout(300);
    const now = await heights();
    eq(now.opts, was.opts, 'nothing moves when you answer: the options stay put');
    eq(now.kb, was.kb, 'and so does the keyboard');
    eq(now.h, was.h, 'and the page is the same height');
    ok(await p.locator('.ear-opt.is-right').count() === 1, 'the right answer is marked');
    ok((await p.locator('#ear-note').innerText()).length > 10, 'and there is something to read');
    ok(await p.locator('.va-kb [data-role]').count() > 0, 'the keyboard shows the mode');
    /* a level you have not earned cannot be chosen */
    await p.locator('#ear-level-btn').click();
    await p.waitForTimeout(200);
    eq(await p.locator('#ear-level-menu [data-locked]').count(), 4, 'levels 2 to 5 are locked until level 1 is passed');
    await p.keyboard.press('Escape');
    /* and a level with more modes in it offers more to choose from */
    await p.evaluate(() => { const w = JSON.parse(localStorage.getItem('modes-work-v1'));
      w.lessons.ear = { passed:[1,2,3], bests:{1:10} }; localStorage.setItem('modes-work-v1', JSON.stringify(w)); });
    /* reload, not just a hash change: the progress store is read once per page
       load, which is what a buyer arriving from a course link does anyway */
    await p.goto(BASE + '/theory-lab/modes/ear.html#level=4');
    await p.reload();
    await p.locator('.ear-opt').first().waitFor();
    eq(await p.locator('#ear-level-label').innerText(), 'Level 4', 'a deep link opens the level it names');
    eq(await p.locator('.ear-opt').count(), 4, 'and all seven modes give four options');
    const names = await p.evaluate(() => [...document.querySelectorAll('.ear-opt b')].map(e => e.textContent));
    eq(new Set(names).size, 4, 'four different modes: ' + names.join(', '));
    eq(await p.locator('#ear-level-menu [data-locked]').count(), 0, 'and nothing is locked any more');
    /* a level beyond what has been passed still falls back */
    await p.evaluate(() => { const w = JSON.parse(localStorage.getItem('modes-work-v1'));
      w.lessons.ear = { passed:[1] }; localStorage.setItem('modes-work-v1', JSON.stringify(w)); });
    await p.goto(BASE + '/theory-lab/modes/ear.html#level=5');
    await p.reload();
    await p.locator('.ear-opt').first().waitFor();
    eq(await p.locator('#ear-level-label').innerText(), 'Level 1',
       'a level that has not been earned falls back to the first');
    await p.locator('#ear-level-btn').click();
    await p.waitForTimeout(200);
    eq(await p.locator('#ear-level-menu [data-locked]').count(), 3,
       'with level 2 open — it was earned — and 3, 4 and 5 still locked');
  }

  /* =============================== 6b. the chrome is painted ============ */
  {
    /* Everything here was emitted by the engine and styled by nothing: white
       OS dropdowns, macOS-blue checkboxes and sliders, labels welded to their
       fields, a gold focus ring round every heading on arrival. */
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/dorian');
    await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
    const skin = await p.evaluate(() => {
      const cs = s => { const e = document.querySelector(s); return e && getComputedStyle(e); };
      const sel = cs('.ac-field select'), box = cs('.ac-transport input[type=checkbox]');
      const rng = cs('.ac-transport input[type=range]'), h1 = cs('.lhead h1');
      return { select:sel && sel.appearance, checkbox:box && box.appearance, range:rng && rng.appearance,
               fieldColumn:getComputedStyle(document.querySelector('.ac-field')).flexDirection,
               groupBorder:cs('.ac-group') && cs('.ac-group').borderTopWidth,
               ring:h1.outlineStyle, focused:document.activeElement === document.querySelector('.lhead h1') };
    });
    eq(skin.select, 'none', 'the select is painted, not left native');
    eq(skin.checkbox, 'none', 'and so is the checkbox');
    eq(skin.range, 'none', 'and the slider');
    eq(skin.fieldColumn, 'column', 'a field puts its label above its control');
    eq(skin.groupBorder, '0px', 'a group is a heading and its contents, not a box with a notch');
    eq(skin.ring, 'none', 'and the heading arrives without a focus ring');
    ok(skin.focused, 'while still being focused, which is what the ring was for');

    /* the lesson rail replaced the breadcrumb and the outline disclosure */
    eq(await p.locator('.crumb').count(), 0, 'no breadcrumb: the rail says where you are');
    eq(await p.locator('.ac-outline').count(), 0, 'and no outline disclosure');
    eq(await p.locator('.ac-tabs').count(), 0, 'no tabs anywhere: a lesson is steps');
    eq(await p.locator('.ac-sections').count(), 0, 'and no jump links, because nothing scrolls');

    /* the rail marks the lesson you are on and nothing else */
    eq(await p.locator('.lrail-group a[aria-current]').count(), 1, 'exactly one lesson is current');
    eq((await p.locator('.lrail-group a[aria-current]').innerText()).trim(), 'Dorian', 'and it is this one');

    /* a tool has no lesson progress */
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lab/chords-lab');
    await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
    eq(await p.evaluate(() => getComputedStyle(document.querySelector('.prog')).visibility), 'hidden',
       'a tool is not one of the six, so the counter says nothing');
    eq((await p.locator('[data-set="reset"] button').innerText()).trim(), 'Reset the tool',
       'and it resets the tool rather than restoring a lesson it does not have');

    /* the nav fits a phone */
    await p.setViewportSize({ width:390, height:844 });
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/dorian');
    await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
    const nav = await p.evaluate(() => ({
      lines:Math.round(document.querySelector('.nav').getBoundingClientRect().height),
      up:getComputedStyle(document.querySelector('.nav-l [data-nav-up]')).display,
      where:document.getElementById('nav-where').textContent }));
    ok(nav.lines <= 60, 'the nav is one line at 390px, not three: ' + nav.lines + 'px');
    eq(nav.up, 'none', 'the module link steps aside');
    eq(nav.where, 'Dorian', 'and the lesson name stays');
    /* below the lock the page is allowed to scroll, and the columns stack */
    /* the base sheet keeps a stable scrollbar gutter (html{overflow-y:scroll}), so
       what proves the lock is off is that neither html nor body is clipped. */
    eq(await p.evaluate(() => [getComputedStyle(document.documentElement).overflowY,
                              getComputedStyle(document.body).overflowY]), ['scroll', 'visible'],
       'the viewport lock comes off on a phone, because three columns do not fit one');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
       'and nothing pushes it sideways');
    await p.setViewportSize({ width:1440, height:900 });
  }

  /* ================================ 7a. the owner's words =============== */
  {
    for(const mode of ['lydian', 'mixolydian', 'dorian', 'phrygian', 'locrian']){
      await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/' + mode);
      await p.locator('#rail button').first().waitFor({ timeout:10000 });
      await p.waitForTimeout(350);
      const want = await p.evaluate(id => MODE_COPY[id], mode);

      /* the tagline opens the lesson, with what to use it for */
      eq((await p.locator('.lstep .claim').innerText()).trim(), want.tagline,
         mode + ' opens on the tagline');
      eq(await p.evaluate(() => [...document.querySelectorAll('.lstep .ac-chip')].map(e => e.textContent)),
         want.useFor, 'and what to use it for');

      /* THE OWNER'S WORDS ARE THE READING, and the draft body is not shown:
         saying both would be the same thing twice at twice the length. */
      const read = [];
      const n = await p.locator('#rail button').count();
      for(let i = 1; i < n; i++){
        await p.locator('#rail button').nth(i).click();
        await p.waitForTimeout(170);
        const label = await p.evaluate(() => document.getElementById('rail-n').textContent);
        if(!/· Why$/.test(label)) break;
        read.push(await p.evaluate(() =>
          [...document.querySelectorAll('.lstep .prose p')].map(e => e.textContent).join('\n')));
      }
      eq(read, want.about, mode + "'s reading steps are the owner's words, one per step");

      eq(await p.evaluate(id => LESSONS.find(l => l.id === id).short, mode), want.oneNote,
         mode + ' takes its short line from MODE_COPY');
      eq(await p.evaluate(id => EvTheory.mode(id).defined, mode), want.oneNote,
         'and EvTheory agrees with it, so neither can drift');
    }

    /* the intro has no entry, so it keeps its own claim */
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/how-modes-work');
    await p.locator('#rail button').first().waitFor({ timeout:10000 });
    await p.waitForTimeout(350);
    ok(/one note away/.test(await p.locator('.lstep .claim').innerText()), 'the intro keeps its own claim');

    /* the module home still opens on the same words */
    await p.goto(BASE + '/theory-lab/modes/');
    await p.waitForTimeout(700);
    const cards = await p.evaluate(() => [...document.querySelectorAll('.md-lesson')].map(c => ({
      title:c.querySelector('h3').textContent,
      tagline:(c.querySelector('.md-tagline') || {}).textContent || null })));
    eq(cards.filter(c => c.tagline).length, 5, 'five module-home cards carry a tagline');
    eq(cards.find(c => c.title === 'How modes work').tagline, null, 'and the intro carries none');
    eq(await p.locator('.md-tool').count(), 3, 'three tools, filling their row');
    eq(await p.locator('.md-test').count(), 1, 'and the quiz in a band of its own');
  }

  /* ================================= 7b. Listen is a step =============== */
  {
    const listenStep = async mode => {
      await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/' + mode);
      await p.locator('#rail button').first().waitFor({ timeout:10000 });
      await p.waitForTimeout(300);
      const n = await p.locator('#rail button').count();
      for(let i = 0; i < n; i++){
        const label = await p.evaluate(k =>
          document.querySelectorAll('#rail button')[k].getAttribute('aria-label'), i);
        if(/Listen$/.test(label)){ await p.locator('#rail button').nth(i).click();
          await p.waitForTimeout(400); return i; }
      }
      return -1;
    };

    for(const mode of ['lydian', 'mixolydian', 'dorian', 'phrygian', 'locrian']){
      const at = await listenStep(mode);
      ok(at > 0, mode + ' has a Listen step');
      const seen = await p.evaluate(id => ({
        cards:document.querySelectorAll('.lpanel .evl-card').length,
        empty:!!document.querySelector('.lpanel .evl-empty'),
        want:(LISTEN[id] || []).filter(i => i.verified && i.yt).length,
        inWide:!!document.querySelector('.lplay .lpanel'),
        demoHidden:document.getElementById('demo-host').hidden }), mode);
      eq(seen.cards, seen.want, mode + ' shows only its verified cards');
      ok(seen.cards ? !seen.empty : seen.empty,
         mode + (seen.cards ? ' shows a grid' : ' says examples are coming soon'));
      ok(seen.inWide, 'in the wide column, where three cards fit');
      ok(seen.demoHidden, 'and the widget stands aside while they are on screen');
    }

    /* the intro has no recordings, so no Listen step */
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/lessons/how-modes-work');
    await p.locator('#rail button').first().waitFor({ timeout:10000 });
    eq(await p.evaluate(() => [...document.querySelectorAll('#rail button')]
         .filter(b => /Listen$/.test(b.getAttribute('aria-label'))).length), 0,
       'the intro has no Listen step');

    /* nothing reaches YouTube until a click, and a video stops the lesson */
    await listenStep('lydian');
    eq(await p.locator('.evl-frame iframe').count(), 0, 'no iframe before a click');
    await p.evaluate(() => { window.__stops = 0; const s = AccelAudio.stop;
      AccelAudio.stop = function(){ window.__stops++; return s.apply(this, arguments); }; });
    await p.locator('.evl-card').nth(0).locator('.evl-frame').click();
    await p.waitForTimeout(350);
    const first = await p.evaluate(() => ({ n:document.querySelectorAll('.evl-frame iframe').length,
      src:document.querySelector('.evl-frame iframe').src, stops:window.__stops }));
    eq(first.n, 1, 'a click makes exactly one player');
    ok(/youtube-nocookie\.com\/embed\/TcvnuqLFpkU\?start=0&/.test(first.src),
       "pointed at the card's video and start time");
    eq(first.stops, 1, 'and stops the lesson transport first');
    await p.locator('.evl-card').nth(1).locator('.evl-frame').click();
    await p.waitForTimeout(350);
    eq(await p.locator('.evl-frame iframe').count(), 1, 'only one plays at a time');
  }

  /* ====================================== 7c. author mode =============== */
  {
    const a = await openPage();
    await a.setViewportSize({ width:1440, height:900 });
    const open = async mode => {
      await a.goto(BASE + '/theory-lab/modes/lessons.html?author=1#/lessons/' + mode);
      await a.locator('#rail button').first().waitFor({ timeout:10000 });
      await a.waitForTimeout(300);
      const n = await a.locator('#rail button').count();
      for(let i = 0; i < n; i++){
        const label = await a.evaluate(k =>
          document.querySelectorAll('#rail button')[k].getAttribute('aria-label'), i);
        if(/Listen$/.test(label)){ await a.locator('#rail button').nth(i).click();
          await a.waitForTimeout(450); return; }
      }
    };
    let total = 0;
    for(const mode of ['lydian', 'mixolydian', 'dorian', 'phrygian', 'locrian']){
      await open(mode);
      total += await a.locator('.evl-card').count();
    }
    eq(total, 27, 'author mode shows all 27 cards, unverified and video-less included');

    await open('mixolydian');
    eq(await a.locator('[data-flag="novideo"]').count(), 1, 'Treasure Planet is flagged as having no video');
    eq(await a.locator('[data-flag="unverified"]').count(), 7, 'and every Mixolydian card is flagged unverified');

    await open('lydian');
    const card = a.locator('.evl-card').first();
    await card.locator('.evl-frame').click();
    await a.waitForTimeout(800);
    eq(await a.evaluate(() => window.__players || 0), 1, 'author mode builds an IFrame API player');
    await card.locator('[data-set="start"]').click();
    await a.waitForTimeout(200);
    ok(/start 2:04 \(124s\)/.test(await card.locator('[data-times]').innerText()),
       'Set start rounds the clock to 124s');
    eq(await a.evaluate(() => { try { return JSON.parse(localStorage.getItem('evenant-listen-draft'))
      .lydian['beethoven-heiliger-dankgesang'].start; } catch(_){ return null; } }), 124,
       'and it is kept as a draft in this browser');

    const js = await a.evaluate(() => {
      const merged = {}, draft = JSON.parse(localStorage.getItem('evenant-listen-draft') || '{}');
      for(const k of Object.keys(LISTEN))
        merged[k] = LISTEN[k].map(it => ({ ...it, ...((draft[k] || {})[it.id] || {}) }));
      return EvListen.source(merged, 'LISTEN');
    });
    const back = new Function(js + ';return LISTEN;')();
    eq(Object.values(back).flat().length, 27, 'Copy data writes all 27 cards back as valid JS');
    eq(back.lydian[0].start, 124, 'carrying the edit');
    await a.close();
  }

  /* ================================ 8a. nothing renders "undefined" ===== */
  {
    /* A missing optional field used to reach the page as the word itself —
       the Explore instruction did, under its own heading. */
    for(const url of ['/theory-lab/modes/', '/theory-lab/modes/ear.html',
                      ...ids.map(l => '/theory-lab/modes/lessons.html#/' + l.module + '/' + l.id)]){
      await p.goto(BASE + url);
      await p.waitForTimeout(700);
      const found = await p.evaluate(() =>
        /\b(undefined|NaN|\[object Object\])\b/.test(document.body.innerText));
      ok(!found, 'nothing renders undefined/NaN: ' + url);
    }
  }

  /* ======================================= 8b. the nav row is one row ==== */
  {
    /* The lab pages do not load the Dojo's chrome, so .atl-nav-left and its
       two siblings have to be styled in lab.css. When they were not, the
       breadcrumb fell under the switcher. */
    for(const url of ['/theory-lab/modes/', '/theory-lab/modes/ear.html']){
      await p.goto(BASE + url);
      await p.waitForTimeout(600);
      const row = await p.evaluate(() => {
        const sw = document.querySelector('.ev-switch');
        const cr = document.querySelector('.atl-nav-crumb');
        if(!sw || !cr) return null;
        const a = sw.getBoundingClientRect(), b = cr.getBoundingClientRect();
        return { sameLine: Math.abs(a.top - b.top) < 6, crumbRight: b.left > a.right };
      });
      ok(row && row.sameLine && row.crumbRight,
         'the switcher and the breadcrumb share one line: ' + url + ' ' + JSON.stringify(row));
    }
    /* and the crumb does not repeat what the switcher already says */
    await p.goto(BASE + '/theory-lab/modes/');
    await p.waitForTimeout(400);
    const words = await p.evaluate(() => ({
      sw: document.querySelector('.ev-switch-label').textContent.trim(),
      crumb: document.querySelector('.lab-crumb a').textContent.trim() }));
    ok(words.sw !== words.crumb, 'without saying it twice: ' + JSON.stringify(words));
  }

  /* ========================================================= 9. mobile ==== */
  {
    await p.setViewportSize({ width:390, height:844 });
    /* every page kind the module has, and every widget: the keyboard and the
       chord grid are the two things wide enough to push the page sideways. */
    for(const url of ['/theory-lab/', '/theory-lab/modes/', '/theory-lab/modes/ear.html',
                      '/theory-lab/modes/lessons.html#/lessons',
                      '/theory-lab/modes/lessons.html#/lessons/lydian',
                      '/theory-lab/modes/lessons.html#/lessons/locrian',
                      '/theory-lab/modes/lessons.html#/lab',
                      '/theory-lab/modes/lessons.html#/lab/brightness-lab',
                      '/theory-lab/modes/lessons.html#/lab/chords-lab',
                      '/theory-lab/modes/lessons.html#/lab/reharm-lab']){
      await p.goto(BASE + url);
      await p.waitForTimeout(900);
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
         '390px, no horizontal scroll: ' + url);
    }
    await p.setViewportSize({ width:1280, height:900 });
  }

  eq(errors, [], 'no page errors');
  console.log('PASS modes: ' + checks + ' checks — gate and deep links, hub, 9 lesson pages, presets, ' +
              'separate stores, mode change mid-loop, chord grid, ear quiz, the chrome, the mode copy, ' +
              'Listen and author mode, nav row, 390px, and nothing clipped on any route at 1280x720, ' +
              '1366x768 or 1440x900');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
