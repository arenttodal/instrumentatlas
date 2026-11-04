const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const BASE = process.env.ACCEL_URL || 'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'){const t=m.text();if(!/fonts\.googleapis|ERR_|CERT/.test(t))errors.push(t);}});
 /* count scheduled oscillators: these activities synthesise, so this is the
    honest test that a demonstration actually makes a sound. */
 await page.addInitScript(()=>{window.__osc=0;const C=window.AudioContext;
  window.AudioContext=class extends C{createOscillator(){window.__osc++;return super.createOscillator();}}});

 await page.goto(BASE+'/accelerator.html');
 const lessons=await page.evaluate(()=>LESSONS.map(l=>({id:l.id,module:l.module})));
 assert.equal(lessons.length,12);

 for(const l of lessons){
  await page.goto(BASE+'/accelerator.html#/'+l.module+'/'+l.id);
  await page.locator('#demo-host .btn, #demo-host .w-missing').first().waitFor();
  assert.equal(await page.locator('#demo-host .w-missing').count(),0,l.id+' activity mounts');

  const before=await page.evaluate(()=>window.__osc);
  await page.locator('#demo-host .btn').first().click();
  await page.waitForTimeout(250);
  assert.ok(await page.evaluate(()=>window.__osc)>before,l.id+' schedules sound');

  const steps=await page.evaluate(()=>document.querySelectorAll('#rail button').length);
  assert.ok(steps>3,l.id+' has a step rail');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('#rail button.on').length),1,l.id+' marks one current step');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),l.id+' fits the viewport');

  /* every step must leave the activity mounted and the page one screen tall */
  for(let i=1;i<steps;i++){
   await page.evaluate(k=>document.querySelectorAll('#rail button')[k].click(),i);
   await page.waitForTimeout(60);
   assert.ok(await page.evaluate(()=>document.getElementById('demo-host').children.length>0),
     l.id+' keeps the activity mounted on step '+(i+1));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),
     l.id+' still fits on step '+(i+1));
  }

  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),l.id+' mobile overflow');
  await page.setViewportSize({width:1280,height:900});
  console.log('PASS '+l.id+' mounts, sounds, '+steps+' steps, one screen throughout');
 }

 /* the demonstration follows the explanation */
 await page.goto(BASE+'/accelerator.html#/foundations/overtones');
 await page.locator('#rail button').first().waitFor();
 const scenes=[];
 for(let i=1;i<=4;i++){
  await page.evaluate(k=>document.querySelectorAll('#rail button')[k].click(),i);
  await page.waitForTimeout(120);
  scenes.push(await page.evaluate(()=>document.querySelector('#ot-svg text').textContent));
 }
 assert.equal(new Set(scenes).size,4,'overtones shows a distinct scene per beat');
 assert.ok(await page.evaluate(()=>!!document.querySelector('.w-tip')),'a read step shows its coachmark');
 console.log('PASS overtones scenes follow the steps ('+new Set(scenes).size+' distinct)');

 /* leaving a lesson silences it */
 await page.goto(BASE+'/accelerator.html#/foundations/perspective');
 await page.locator('#demo-host .btn').first().waitFor();
 await page.locator('#demo-host .btn').first().click();
 await page.waitForTimeout(200);
 await page.locator('.atl-nav-crumb a').first().click();
 await page.waitForTimeout(150);
 const after=await page.evaluate(()=>window.__osc);
 await page.waitForTimeout(1200);
 assert.equal(await page.evaluate(()=>window.__osc),after,'navigation stops the loop');
 console.log('PASS navigation stops scheduling');

 assert.deepEqual(errors,[]);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
