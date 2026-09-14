/* ============================================================================
   EVENANT · MODULE SWITCHER
   ----------------------------------------------------------------------------
   Turns a header's existing module title into the trigger for a menu that
   switches between tools. Loads after evenant-modules.js, both deferred.

   Mount it by marking the element that already says which tool you are in:

     <div class="atl-nav-title" data-ev-switch>The Instrument Atlas</div>

   That element is ADOPTED, not restyled: it is moved inside a button whose own
   rules are scoped to .ev-switch so nothing lands on it. Its font, colour,
   tracking and position stay exactly as the host stylesheet left them, which
   is the point — the switcher should look like the title it replaced, with a
   chevron. An empty [data-ev-switch] gets a label created instead, for a
   header that has no module title of its own to adopt.

   The menu is position:fixed. Two of the four headers sit inside an ancestor
   with overflow hidden — score.html clips at html,body — so an absolutely
   positioned menu is cut off in exactly the places it is most needed. Fixed
   also means one stacking context to reason about rather than four.
   ============================================================================ */

(function(){

const host = document.querySelector('[data-ev-switch]');
if(!host || typeof EVENANT_MODULES === 'undefined') return;

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const icon = k => `<svg class="ev-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor"
  stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EVENANT_ICONS[k] || ''}</svg>`;

const active = evenantModule(EVENANT_ACTIVE);

/* ---------------------------------------------------------------- build --- */
const wrap = document.createElement('div');
wrap.className = 'ev-switch';

const btn = document.createElement('button');
btn.type = 'button';
btn.className = 'ev-switch-btn';
btn.id = 'ev-switch-btn';
btn.setAttribute('aria-haspopup', 'menu');
btn.setAttribute('aria-expanded', 'false');
btn.setAttribute('aria-controls', 'ev-switch-menu');
btn.setAttribute('aria-label', `${active ? active.name : 'Tools'} — switch tool`);

/* adopt the host element if it has something to say, otherwise make a label */
host.replaceWith(wrap);
if(host.textContent.trim() || host.children.length){
  host.removeAttribute('data-ev-switch');
  btn.appendChild(host);
} else {
  const lbl = document.createElement('span');
  lbl.className = 'ev-switch-label';
  lbl.textContent = active ? active.name : 'Tools';
  btn.appendChild(lbl);
}
btn.insertAdjacentHTML('beforeend',
  `<svg class="ev-chev" viewBox="0 0 10 6" fill="none" width="10" height="6" aria-hidden="true">
     <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`);

const row = m => {
  const on  = !!active && m.id === active.id;
  const off = m.status !== 'available';
  const tag = off ? 'span' : 'a';
  return `<${tag} class="ev-item" role="menuitem" tabindex="-1"
      ${off ? 'aria-disabled="true"' : `href="${esc(evenantHref(m))}" data-id="${esc(m.id)}"`}
      ${on ? 'aria-current="true" data-active="1"' : ''}>
      ${icon(m.icon)}<span class="ev-item-name">${esc(m.name)}</span>
      ${off ? '<span class="ev-soon">Coming soon</span>' : ''}
      ${on  ? `<svg class="ev-tick" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                 <path d="M2 6.4l2.6 2.6L10 3.4" stroke="currentColor" stroke-width="1.6"
                       stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}
    </${tag}>`;
};

const menu = document.createElement('div');
menu.className = 'ev-menu';
menu.id = 'ev-switch-menu';
menu.setAttribute('role', 'menu');
menu.setAttribute('aria-labelledby', 'ev-switch-btn');
menu.hidden = true;
menu.innerHTML =
  row(EVENANT_TOOLS_HOME) +
  '<div class="ev-rule" role="separator"></div>' +
  EVENANT_MODULES.map(row).join('');

wrap.appendChild(btn);
wrap.appendChild(menu);

const items = () => [...menu.querySelectorAll('.ev-item:not([aria-disabled])')];

/* ------------------------------------------------------------- position ---
   Anchored to the trigger's left edge and kept inside the viewport. Recomputed
   while open rather than once, because every one of these headers is sticky
   and two of them can reflow underneath it. */
function place(){
  const r = btn.getBoundingClientRect();
  const w = menu.offsetWidth;
  menu.style.top  = Math.round(r.bottom + 10) + 'px';
  menu.style.left = Math.round(Math.max(8, Math.min(r.left, window.innerWidth - w - 8))) + 'px';
}

/* ------------------------------------------------------------ open/close --- */
let open = false;

function setOpen(on, focusFirst){
  if(on === open) return;
  open = on;
  menu.hidden = !on;
  wrap.dataset.open = on ? '1' : '0';
  btn.setAttribute('aria-expanded', String(on));
  if(on){
    place();
    if(focusFirst){ const i = items(); if(i.length) i[0].focus(); }
    addEventListener('resize', place);
    addEventListener('scroll', place, true);
  } else {
    removeEventListener('resize', place);
    removeEventListener('scroll', place, true);
  }
}
const close = back => { setOpen(false); if(back) btn.focus(); };

btn.addEventListener('click', e => {
  e.stopPropagation();
  open ? close(false) : setOpen(true, false);
});

btn.addEventListener('keydown', e => {
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault();
    if(!open) setOpen(true, true);
    else { const i = items(); if(i.length) (e.key === 'ArrowDown' ? i[0] : i[i.length - 1]).focus(); }
  }
});

menu.addEventListener('keydown', e => {
  const i = items();
  const at = i.indexOf(document.activeElement);
  if(e.key === 'ArrowDown'){ e.preventDefault(); i[(at + 1) % i.length].focus(); }
  else if(e.key === 'ArrowUp'){ e.preventDefault(); i[(at - 1 + i.length) % i.length].focus(); }
  else if(e.key === 'Home'){ e.preventDefault(); i[0].focus(); }
  else if(e.key === 'End'){ e.preventDefault(); i[i.length - 1].focus(); }
  else if(e.key === 'Escape'){ e.preventDefault(); close(true); }
  else if(e.key === 'Tab'){ close(false); }
});

/* Choosing the tool you are already in closes the menu and does nothing else.
   Following the link would reload the page and throw away the instrument, the
   tab and whatever is playing, which is not what picking your own name means. */
menu.addEventListener('click', e => {
  const a = e.target.closest('.ev-item');
  if(!a) return;
  if(a.hasAttribute('aria-disabled')){ e.preventDefault(); return; }
  if(a.dataset.active === '1'){ e.preventDefault(); close(true); return; }
  close(false);                       // a real destination: let the link run
});

document.addEventListener('click', e => { if(open && !wrap.contains(e.target)) close(false); });
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && open && !menu.contains(document.activeElement)) close(true);
});

})();
