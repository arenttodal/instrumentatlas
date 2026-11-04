/* ============================================================================
   EVENANT · ACCESS GATE
   ----------------------------------------------------------------------------
   Holds a tool back from general view until a code is typed, and remembers the
   answer so it is typed once per browser rather than once per visit.

   THIS IS A CURTAIN, NOT A LOCK. The site is static: the page, its scripts and
   this check are all delivered to anyone who asks for the URL, so anyone who
   opens the developer tools can walk straight past it, and search engines that
   ignore robots.txt can still reach whatever the page renders. It keeps a tool
   that is not finished from being stumbled into. It does not keep a determined
   person out, and nothing behind it should be anything that matters if seen.
   The only way to have the second thing is a server that refuses to send the
   page at all, which this site does not have.

   The code is stored as a hash rather than in plain sight — that is obfuscation
   so the answer is not the first string a reader's eye lands on, and it is not
   a second line of defence. Generate one with evenantGateHash('CODE') in a
   console.

   Mount it on the page that needs it:

     <script>document.documentElement.dataset.gate = 'locked';</script>   in <head>
     <link rel="stylesheet" href="evenant-gate.css">
     <script defer src="evenant-gate.js"
             data-gate="accelerator" data-gate-hash="…" data-gate-name="The Accelerator"></script>

   The inline line in the head is what stops the page painting before the gate
   is drawn — the gate's own script is deferred and so runs after the document
   is parsed, which is one paint too late. The stylesheet hides everything while
   that attribute is set, and the script clears it the moment the code is right
   or a previous answer is found.
   ============================================================================ */

/* djb2 over the upper-cased code. Not a security function and not used as one. */
function evenantGateHash(s){
  let h = 5381;
  const t = String(s).trim().toUpperCase();
  for(let i = 0; i < t.length; i++) h = (((h << 5) + h) ^ t.charCodeAt(i)) >>> 0;
  return 'g' + h.toString(36);
}

(function(){

const me = document.currentScript;
if(!me) return;
const KEY  = me.dataset.gate || 'tool';
const HASH = me.dataset.gateHash || '';
const NAME = me.dataset.gateName || 'This tool';
const STORE = `evenant-gate-${KEY}`;
const root = document.documentElement;

const open = () => {
  delete root.dataset.gate;
  const g = document.getElementById('ev-gate');
  if(g) g.remove();
  /* the page under the gate built itself while it was hidden, and anything
     that measured itself at zero needs to measure again */
  window.dispatchEvent(new Event('resize'));
};

let already = false;
try { already = localStorage.getItem(STORE) === HASH; } catch(_){}
if(already || !HASH){ open(); return; }

const build = () => {
  const el = document.createElement('div');
  el.className = 'ev-gate';
  el.id = 'ev-gate';
  el.innerHTML = `
    <form class="ev-gate-card" novalidate>
      <img class="ev-gate-logo" src="${typeof EVENANT_LOGO !== 'undefined' ? EVENANT_LOGO : ''}" alt="Evenant">
      <p class="ev-gate-soon">Coming soon</p>
      <h1 class="ev-gate-name"></h1>
      <p class="ev-gate-say">This one is not finished. Enter the access code to look around.</p>
      <div class="ev-gate-field">
        <input class="ev-gate-input" type="password" inputmode="text" autocomplete="off"
               autocapitalize="characters" spellcheck="false" aria-label="Access code"
               aria-describedby="ev-gate-err" placeholder="Access code">
        <button class="ev-gate-go" type="submit">Enter</button>
      </div>
      <p class="ev-gate-err" id="ev-gate-err" role="alert">&nbsp;</p>
      <a class="ev-gate-back" href="${typeof EVENANT_ROOT !== 'undefined' ? EVENANT_ROOT + 'tools.html' : 'tools.html'}">
        All tools</a>
    </form>`;
  el.querySelector('.ev-gate-name').textContent = NAME;
  document.body.appendChild(el);

  const form = el.querySelector('form');
  const box  = el.querySelector('.ev-gate-input');
  const err  = el.querySelector('.ev-gate-err');
  box.focus({ preventScroll:true });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if(evenantGateHash(box.value) === HASH){
      try { localStorage.setItem(STORE, HASH); } catch(_){}
      el.dataset.leaving = '1';
      setTimeout(open, 260);
      return;
    }
    /* the message keeps its line whether or not there is anything on it, so
       the card does not grow under the pointer at the moment you mistype */
    const card = el.querySelector('.ev-gate-card');
    err.textContent = 'Not that one.';
    card.dataset.wrong = '1';
    box.select();
    setTimeout(() => { delete card.dataset.wrong; }, 420);
  });
  box.addEventListener('input', () => { err.innerHTML = '&nbsp;'; });
};

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
else build();

})();
