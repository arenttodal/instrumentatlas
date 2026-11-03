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
    eq(await p.locator('.lesson h1').innerText(), 'Lydian', 'and lands on the lesson the link asked for');
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

  /* ============================================ 3. the lessons themselves == */
  const p = await openPage();
  await p.goto(BASE + '/theory-lab/modes/lessons.html#/');
  await p.waitForFunction(() => typeof LESSONS !== 'undefined' && document.querySelector('.lcard'));
  const meta = await p.evaluate(() => ({
    lessons: LESSONS.filter(l => l.kind !== 'lab').length,
    labs: LESSONS.filter(l => l.kind === 'lab').length,
    prog: document.getElementById('prog-txt').textContent
  }));
  eq(meta.lessons, 6, 'six lessons');
  eq(meta.labs, 3, 'three tools');
  eq(meta.prog, '0 of 6', 'progress counts the lessons, not the tools');

  const ids = await p.evaluate(() => LESSONS.map(l => ({ id:l.id, module:l.module, lab:l.kind === 'lab' })));
  eq(await p.evaluate(() => LESSONS.reduce((n, l) => n + (l.videos || []).length, 0)), 16,
     'sixteen videos across the course, as the course map has it');
  for(const l of ids){
    await p.goto(BASE + '/theory-lab/modes/lessons.html#/' + l.module + '/' + l.id);
    await p.locator('#demo-host .ac-transport').waitFor({ timeout:10000 });
    ok(await p.locator('.va-kb-piano').count() === 1, l.id + ' draws its keyboard');
    ok(await p.locator('.ac-roll-stage svg').count() === 1, l.id + ' draws its roll');
    if(l.lab){
      eq(await p.locator('.ac-sections').count(), 0, l.id + ' is a tool: no section nav');
      eq(await p.locator('[data-quiz]').count(), 0, '  and no quiz');
      eq(await p.locator('[data-challenge]').count(), 0, '  and no challenge');
    } else {
      eq(await p.locator('.sec').count(), 5, l.id + ' has the five sections');
      eq(await p.locator('.q').count(), 2, '  and two questions');
      ok((await p.locator('[data-challenge-prompt]').innerText()).length > 10, '  and a challenge prompt');
      /* as many video links as the data says — three for a mode taught in
         melody, harmony and texture, two for the intro and for Locrian */
      const want = await p.evaluate(id => (LESSONS.find(x => x.id === id).videos || []).length, l.id);
      eq(await p.locator('.ac-video').count(), want, '  and its ' + want + ' video links');
      ok(want >= 2, '  which is at least two');
    }
    /* it plays, and it stops */
    await p.locator('[data-play]').click();
    await p.waitForFunction(() => AccelAudio.inspect().status === 'playing', null, { timeout:15000 });
    await p.waitForTimeout(250);
    ok(await p.evaluate(() => AccelAudio.inspect().sources > 0), l.id + ' schedules sound');
    await p.locator('[data-stop]').click();
    eq(await p.evaluate(() => AccelAudio.inspect().sources), 0, l.id + ' stops dead');
    console.log('  ok  ' + l.id);
  }

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
              'separate stores, mode change mid-loop, chord grid, ear quiz, nav row, 390px');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
