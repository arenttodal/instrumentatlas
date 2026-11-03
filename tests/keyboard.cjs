/* The extracted keyboard against the Voicing Atlas original.
   node tests/keyboard.cjs

   The pixel comparison needs the Voicing Atlas source. Point VA_SOURCE at its
   index.html, or leave it and the default clone path is tried. Without it the
   behavioural half still runs and the comparison reports itself skipped, so
   this is safe to run in CI on a checkout that has only this repo. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const KB_JS  = fs.readFileSync(path.join(ROOT, 'evenant-keyboard.js'), 'utf8');
const KB_CSS = fs.readFileSync(path.join(ROOT, 'evenant-keyboard.css'), 'utf8');
const VA = process.env.VA_SOURCE || '/home/user/voicing-atlas/index.html';

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.deepEqual(a, b, m + '\n      got  ' + JSON.stringify(a) + '\n      want ' + JSON.stringify(b)); checks++; };

/* ---- the reference, pulled out of Voicing Atlas at run time so it cannot
        drift away from what Voicing Atlas actually ships ---- */
function referenceCss(){
  if(!fs.existsSync(VA)) return null;
  const src = fs.readFileSync(VA, 'utf8');
  const grab = (startRe, endRe) => {
    const a = src.search(startRe); if(a < 0) return '';
    const rest = src.slice(a); const b = rest.search(endRe);
    return b < 0 ? rest : rest.slice(0, b);
  };
  /* Both theme blocks, verbatim — the light :root is the base and
     [data-theme="dark"] overrides it, so the fixture page just sets that
     attribute rather than this test rewriting anyone's CSS. */
  const tokens = grab(/^\s*:root \{/m, /\/\* =+ ALWAYS-DARK/);
  const piano  = grab(/^\s*\.live-piano \{/m, /\n\s*\.keyboard-hint \{/);
  if(!tokens || !piano || !/--piano-bg/.test(tokens)) return null;
  return tokens + '\n' + piano;
}

/* VA's renderLivePiano markup, rebuilt for a given range and state map */
function referenceHtml(lo, hi, states){
  const PLAIN = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const nm = m => PLAIN[m % 12] + (Math.floor(m / 12) - 1);
  const whites = [], blacks = [];
  for(let m = lo; m <= hi; m++) (PLAIN[m % 12].includes('#') ? blacks : whites).push(m);
  const st = m => states[m] ? ' ' + states[m] : '';
  const w = whites.map(m =>
    `<div class="white-key${st(m)}" data-note="${nm(m)}">${m % 12 === 0 ? `<span class="note-label">${nm(m)}</span>` : ''}</div>`).join('');
  const b = whites.map((m, i) => {
    const next = whites[i + 1];
    const bk = blacks.find(x => x > m && (next === undefined || x < next));
    return bk === undefined
      ? `<div class="black-key-space"><div class="black-key hidden"></div></div>`
      : `<div class="black-key-space"><div class="black-key${st(bk)}" data-note="${nm(bk)}"></div></div>`;
  }).join('');
  return `<div class="live-piano" id="livePiano"><div class="white-keys">${w}</div><div class="black-keys">${b}</div></div>`;
}

const page1 = (extraCss, body, theme) => `<!DOCTYPE html><html${theme ? ' data-theme="' + theme + '"' : ''}><head><meta charset="utf-8"><style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{background:#080C14;font-family:system-ui,sans-serif}
#stage{width:720px;padding:0}
${extraCss}
</style></head><body><div id="stage">${body}</div></body></html>`;

(async () => {
  const browser = await chromium.launch({ args:['--no-sandbox'] });
  const page = await browser.newPage({ viewport:{ width:900, height:500 }, deviceScaleFactor:1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));

  /* ---------------------------------------------------- 1. structure ---- */
  await page.setContent(page1(KB_CSS, ''));
  await page.addScriptTag({ content: KB_JS });
  await page.evaluate(() => {
    window.kb = EvKeyboard.create(document.getElementById('stage'), { lo:48, hi:83, foot:false });
  });
  eq(await page.locator('.va-kb-white').count(), 21, 'C3–B5 has 21 white keys');
  eq(await page.locator('.va-kb-black:not([hidden])').count(), 15, 'and 15 black keys');
  eq(await page.locator('.va-kb-slot').count(), 21, 'one black slot per white key, so the rows stay in step');
  eq(await page.locator('.va-kb-label').allTextContents(), ['C3','C4','C5'], 'labels on the C\'s and nothing else');
  eq(await page.evaluate(() => [...document.querySelectorAll('[data-midi]')].map(e => +e.dataset.midi).sort((a,b)=>a-b)),
     Array.from({length:36}, (_, i) => 48 + i), 'every key in the range carries its MIDI number');

  /* ------------------------------------------- 2. states and overlays ---- */
  const bg = sel => page.evaluate(s => getComputedStyle(document.querySelector(s)).backgroundImage
                                     + '|' + getComputedStyle(document.querySelector(s)).backgroundColor, sel);
  const plainWhite = await bg('[data-midi="48"]');
  await page.evaluate(() => kb.setStates({ 60:'active', 62:'target', 64:'correct', 65:'wrong' }));
  for(const [m, s] of [[60,'active'],[62,'target'],[64,'correct'],[65,'wrong']])
    eq(await page.getAttribute(`[data-midi="${m}"]`, 'data-state'), s, `MIDI ${m} is ${s}`);
  ok(await bg('[data-midi="60"]') !== plainWhite, 'an active key does not look like a plain one');

  await page.evaluate(() => kb.setOverlays({ 66:'colour', 67:'root', 69:'scale' }));
  for(const [m, r] of [[66,'colour'],[67,'root'],[69,'scale']])
    eq(await page.getAttribute(`[data-midi="${m}"]`, 'data-role'), r, `MIDI ${m} has the ${r} role`);
  /* one at a time: setOverlays replaces the whole map, so racing these would
     only ever read whichever call landed last */
  const four = [];
  for(const r of ['colour','root','scale','chord']){
    await page.evaluate(role => kb.setOverlays({ 71: role }), r);
    four.push(await bg('[data-midi="71"]'));
  }
  eq(new Set(four).size, 4, 'the four roles are four different colours: ' + four.join(' / '));

  await page.evaluate(() => kb.clearOverlays());
  eq(await page.locator('[data-role]').count(), 0, 'clearOverlays clears them');
  await page.evaluate(() => kb.setStates({}));
  eq(await page.locator('[data-state]').count(), 0, 'and setStates({}) clears states');

  /* ------------------------------------------------------- 3. pointer ---- */
  await page.evaluate(() => {
    window.log = [];
    window.kb.destroy();
    window.kb = EvKeyboard.create(document.getElementById('stage'), {
      lo:48, hi:83, foot:false,
      onNoteOn:(m, src) => log.push(['on', m, src]),
      onNoteOff:(m, src) => log.push(['off', m, src])
    });
  });
  await page.locator('[data-midi="60"]').dispatchEvent('pointerdown', { pointerId:1, isPrimary:true, button:0 });
  eq(await page.getAttribute('[data-midi="60"]', 'data-state'), 'active', 'a held key reads as held');
  await page.locator('[data-midi="60"]').dispatchEvent('pointerup', { pointerId:1, isPrimary:true, button:0 });
  eq(await page.evaluate(() => log), [['on',60,'pointer'],['off',60,'pointer']], 'a tap is one note on and one note off');
  eq(await page.locator('[data-state]').count(), 0, 'and the key lets go');
  /* a black key is reachable: it sits above the whites and takes the pointer */
  await page.locator('[data-midi="61"]').dispatchEvent('pointerdown', { pointerId:2, isPrimary:true, button:0 });
  eq(await page.getAttribute('[data-midi="61"]', 'data-state'), 'active', 'a black key takes a tap');
  await page.locator('[data-midi="61"]').dispatchEvent('pointerup', { pointerId:2, isPrimary:true, button:0 });

  /* VA's rule: a key you hold that was being pointed at reads as correct */
  await page.evaluate(() => { log.length = 0; kb.setOverlays({ 64:'chord' }); });
  await page.locator('[data-midi="64"]').dispatchEvent('pointerdown', { pointerId:3, isPrimary:true, button:0 });
  eq(await page.getAttribute('[data-midi="64"]', 'data-state'), 'correct', 'playing a highlighted note turns it green');
  await page.locator('[data-midi="64"]').dispatchEvent('pointerup', { pointerId:3, isPrimary:true, button:0 });

  /* ---- press/release are visual only and must not report notes ---- */
  await page.evaluate(() => { log.length = 0; kb.clearOverlays(); kb.press(67); });
  eq(await page.getAttribute('[data-midi="67"]', 'data-state'), 'active', 'press() shows a key down');
  eq(await page.evaluate(() => log), [], 'press() is playback, not input: it reports nothing');
  await page.evaluate(() => kb.releaseAll());
  eq(await page.locator('[data-state]').count(), 0, 'releaseAll lets go of everything');

  /* -------------------------------------------------------- 4. typing ---- */
  await page.evaluate(() => {
    kb.destroy(); log = [];
    window.kb = EvKeyboard.create(document.getElementById('stage'), {
      lo:48, hi:83, foot:false, input:{ pointer:true, typing:true },
      onNoteOn:(m, src) => log.push(['on', m, src]), onNoteOff:(m, src) => log.push(['off', m, src])
    });
  });
  eq(await page.evaluate(() => EvKeyboard.typing.get()), false, 'typing is off until asked for');
  await page.evaluate(() => EvKeyboard.typing(true));
  await page.keyboard.press('a');
  eq(await page.evaluate(() => log), [['on',60,'typing'],['off',60,'typing']], "'a' is middle C");
  await page.evaluate(() => { log.length = 0; });
  await page.keyboard.press('w');
  eq(await page.evaluate(() => log.map(x => x[1])), [61,61], "'w' is the black key above it");
  await page.evaluate(() => { log.length = 0; });
  await page.keyboard.press('x');                       // octave up
  await page.keyboard.press('a');
  eq(await page.evaluate(() => log.map(x => x[1])), [72,72], "'x' moves the octave up");
  await page.evaluate(() => EvKeyboard.typing(false));
  await page.evaluate(() => { log.length = 0; });
  await page.keyboard.press('a');
  eq(await page.evaluate(() => log), [], 'and typing can be switched off again');

  /* typing must not steal keystrokes from a field */
  await page.evaluate(() => { EvKeyboard.typing(true); log.length = 0;
    const i = document.createElement('input'); i.id='probe'; document.body.appendChild(i); i.focus(); });
  await page.keyboard.press('a');
  eq(await page.evaluate(() => log), [], 'typing leaves text inputs alone');
  await page.evaluate(() => { EvKeyboard.typing(false); document.getElementById('probe').remove(); });

  /* ---------------------------------------------------------- 5. MIDI ---- */
  /* No MIDI device in a headless browser. What is testable is that asking is
     safe and that the answer is reported rather than thrown. */
  const midiAnswer = await page.evaluate(async () => {
    const before = EvKeyboard.midi.state;
    const got = await EvKeyboard.midi.enable();
    return { before, got, after: EvKeyboard.midi.state };
  });
  eq(midiAnswer.before, 'idle', 'MIDI starts idle');
  eq(typeof midiAnswer.got, 'boolean', 'enable() resolves a boolean rather than throwing');
  ok(['connected','none','denied','unsupported'].includes(midiAnswer.after),
     'and lands in a state it can report: ' + midiAnswer.after);

  /* ----------------------------------------------- 6. two octaves at 390 --- */
  await page.setViewportSize({ width:390, height:844 });
  await page.evaluate(() => {
    document.getElementById('stage').style.width = '100%';
    kb.destroy();
    window.kb = EvKeyboard.create(document.getElementById('stage'), { lo:48, hi:71, foot:false });
  });
  eq(await page.locator('.va-kb-white').count(), 14, 'two octaves is 14 white keys');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
     'and they fit 390px with no horizontal page scroll');
  const kw = await page.evaluate(() => document.querySelector('.va-kb-white').getBoundingClientRect().width);
  ok(kw >= 18, 'the keys stay wide enough to hit: ' + kw.toFixed(1) + 'px');
  await page.setViewportSize({ width:900, height:500 });

  /* ------------------------------- 7. against the Voicing Atlas original --- */
  const refCss = referenceCss();
  if(!refCss){
    console.log('SKIP  pixel comparison — no Voicing Atlas source at ' + VA);
  } else {
    const LO = 48, HI = 83;
    const STATES = { 60:'active', 62:'target', 64:'correct', 65:'wrong' };
    const ref = await browser.newPage({ viewport:{ width:900, height:400 }, deviceScaleFactor:1 });
    await ref.setContent(page1(refCss, referenceHtml(LO, HI, STATES), 'dark'));
    const mine = await browser.newPage({ viewport:{ width:900, height:400 }, deviceScaleFactor:1 });
    await mine.setContent(page1(KB_CSS, ''));
    await mine.addScriptTag({ content: KB_JS });
    await mine.evaluate(([lo, hi, states]) => {
      EvKeyboard.create(document.getElementById('stage'), { lo, hi, foot:false }).setStates(states);
    }, [LO, HI, STATES]);

    const read = (p, board, white, black, label) => p.evaluate(([bs, ws, bls, ls]) => {
      const px = n => Math.round(n * 10) / 10;
      const box = e => { const r = e.getBoundingClientRect(); return [px(r.width), px(r.height), px(r.left), px(r.top)]; };
      const paint = e => { const c = getComputedStyle(e); return [c.backgroundImage, c.backgroundColor, c.borderRightWidth, c.borderRadius]; };
      const b = document.querySelector(bs);
      return {
        board: [box(b), getComputedStyle(b).backgroundColor, getComputedStyle(b).borderRadius, getComputedStyle(b).overflow],
        whites: [...document.querySelectorAll(ws)].map(e => [box(e), paint(e)]),
        blacks: [...document.querySelectorAll(bls)].filter(e => !e.hidden && !e.classList.contains('hidden')).map(e => [box(e), paint(e)]),
        labels: [...document.querySelectorAll(ls)].map(e => [e.textContent.trim(), getComputedStyle(e).fontSize, getComputedStyle(e).fontWeight])
      };
    }, [board, white, black, label]);

    const a = await read(ref,  '.live-piano', '.live-piano .white-key', '.live-piano .black-key', '.live-piano .note-label');
    const m = await read(mine, '.va-kb-piano', '.va-kb-white', '.va-kb-black', '.va-kb-label');

    eq(m.board, a.board, 'the board itself: size, radius, background, clipping');
    eq(m.whites.length, a.whites.length, 'same number of white keys');
    eq(m.blacks.length, a.blacks.length, 'same number of black keys');
    for(let i = 0; i < a.whites.length; i++) eq(m.whites[i], a.whites[i], 'white key ' + i + ' matches Voicing Atlas');
    for(let i = 0; i < a.blacks.length; i++) eq(m.blacks[i], a.blacks[i], 'black key ' + i + ' matches Voicing Atlas');
    eq(m.labels, a.labels, 'labels match');

    /* and now the pixels, which is the claim that matters */
    const shotA = await ref.locator('.live-piano').screenshot();
    const shotB = await mine.locator('.va-kb-piano').screenshot();
    const same = Buffer.compare(shotA, shotB) === 0;
    if(same){ console.log('PASS  screenshot is byte-identical to Voicing Atlas (' + shotA.length + ' bytes)'); checks++; }
    else {
      const out = path.join(require('node:os').tmpdir(), 'kb-');
      fs.writeFileSync(out + 'va.png', shotA); fs.writeFileSync(out + 'evenant.png', shotB);
      assert.fail('screenshots differ although every computed style matched; wrote ' + out + 'va.png and ' + out + 'evenant.png');
    }
    await ref.close(); await mine.close();
  }

  eq(errors, [], 'no page errors');
  console.log('PASS keyboard: ' + checks + ' checks — structure, states, overlays, pointer, typing, MIDI, 390px' +
              (refCss ? ', and the Voicing Atlas comparison' : ''));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
