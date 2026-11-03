const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // The Accelerator is behind evenant-gate.js. Seed the unlock so the suite is
 // what gets tested rather than the code prompt. The value is the djb2 of the
 // access code, which is what the gate stores; see evenant-gate.js.
 await page.addInitScript(()=>{try{localStorage.setItem('evenant-gate-accelerator','g3j74oa');}catch(_){}});
 await page.goto((process.env.ACCEL_URL||'http://127.0.0.1:8765')+'/accelerator.html');
 const lessons=await page.evaluate(()=>LESSONS.map(l=>({id:l.id,module:l.module})));
 assert.equal(lessons.length,12);
 for(const l of lessons){
  await page.goto('http://127.0.0.1:8765/accelerator.html#/'+l.module+'/'+l.id);
  await page.locator('[data-play]').waitFor();
  await page.locator('[data-play]').click();
  await page.waitForFunction(()=>AccelAudio.inspect().status==='playing');
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(()=>AccelAudio.inspect().sources>0),l.id+' schedules sound');
  await page.locator('[data-stop]').click();
  assert.equal(await page.evaluate(()=>AccelAudio.inspect().sources),0);
  /* a missing optional field used to reach the page as the word itself */
  assert.ok(!/\b(undefined|NaN|\[object Object\])\b/.test(await page.evaluate(()=>document.body.innerText)),
            l.id+' renders undefined/NaN');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),l.id+' mobile overflow');
  await page.setViewportSize({width:1280,height:900});
  console.log('PASS '+l.id+' playback, stop, mobile');
 }
 /* The chrome the engine emits and nothing used to style. The Accelerator has
    no [data-nav-up] in its nav, so unlike the Theory Lab it KEEPS its
    breadcrumb — that line is its only way back to the module. */
 await page.goto('http://127.0.0.1:8765/accelerator.html#/foundations/overtones');
 await page.locator('#demo-host .ac-transport').waitFor();
 const chrome=await page.evaluate(()=>{
   const cs=s=>{const e=document.querySelector(s);return e&&getComputedStyle(e);};
   return {select:cs('.ac-field select')&&cs('.ac-field select').appearance,
           checkbox:cs('.ac-transport input[type=checkbox]').appearance,
           range:cs('.ac-transport input[type=range]').appearance,
           ring:cs('h1').outlineStyle, focused:document.activeElement===document.querySelector('h1'),
           crumb:document.querySelectorAll('.crumb').length,
           sets:[...document.querySelectorAll('.ac-actions .ac-set')].map(d=>d.dataset.set),
           caption:document.querySelectorAll('.ac-caption').length,
           prose:Math.round(document.querySelector('.prose p').getBoundingClientRect().width),
           source:Math.round(document.querySelector('.source').getBoundingClientRect().width)};
 });
 assert.equal(chrome.checkbox,'none','the transport checkbox is painted');
 assert.equal(chrome.range,'none','and the slider');
 if(chrome.select!==null) assert.equal(chrome.select,'none','and any select');
 assert.equal(chrome.ring,'none','the heading arrives without a focus ring');
 assert.ok(chrome.focused,'while still being focused for a screen reader');
 assert.equal(chrome.crumb,1,'the Accelerator keeps its breadcrumb: it is the only way back');
 assert.deepEqual(chrome.sets,['ab','history','reset'],'compare and revise is three groups');
 assert.equal(chrome.caption,0,'and Practise no longer restates its own controls');
 assert.ok(chrome.source<=chrome.prose,'the credit line is not the widest text on the page');
 console.log('PASS chrome painted, heading unringed, breadcrumb kept, measures capped');

 await page.goto('http://127.0.0.1:8765/accelerator.html#/foundations/overtones');
 await page.locator('[data-play]').click();await page.waitForFunction(()=>AccelAudio.inspect().status==='playing');
 await page.locator('.crumb a').first().click();
 assert.equal(await page.evaluate(()=>AccelAudio.inspect().sources),0);
 await page.screenshot({path:'/tmp/accelerator-course.png',fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
