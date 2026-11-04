const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
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
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),l.id+' mobile overflow');
  await page.setViewportSize({width:1280,height:900});
  console.log('PASS '+l.id+' playback, stop, mobile');
 }
 await page.goto('http://127.0.0.1:8765/accelerator.html#/foundations/overtones');
 await page.locator('[data-play]').click();await page.waitForFunction(()=>AccelAudio.inspect().status==='playing');
 await page.locator('.crumb a').first().click();
 assert.equal(await page.evaluate(()=>AccelAudio.inspect().sources),0);
 await page.screenshot({path:'/tmp/accelerator-course.png',fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
