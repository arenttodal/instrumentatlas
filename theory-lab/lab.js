/* The Theory Lab home. One card per entry in LAB_MODULES, in the Dojo's
   modes-menu pattern. Loads after modules.js, both deferred. */
(() => {
  const grid = document.getElementById('lab-modules');
  if(!grid || typeof LAB_MODULES === 'undefined') return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const LOCK = `<svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden="true">
    <rect x="1" y="4.6" width="8" height="5.9" rx="1.4" stroke="currentColor" stroke-width="1.1"/>
    <path d="M3 4.6V3.2a2 2 0 0 1 4 0v1.4" stroke="currentColor" stroke-width="1.1"/></svg>`;
  const TAG = {
    open:    '<span class="lab-tag" data-state="open">Unlocked</span>',
    members: '<span class="lab-tag" data-state="members">' + LOCK + 'Members</span>',
    soon:    '<span class="lab-tag" data-state="soon">Coming soon</span>'
  };

  grid.innerHTML = LAB_MODULES.map(m => {
    const state = labState(m), live = state !== 'soon';
    const tag = TAG[state] || '';
    /* Somewhere to buy it, for a card you cannot open yet. */
    const buy = (state === 'members' && m.buy)
      ? '<a class="lab-buy" href="' + esc(m.buy) + '" target="_blank" rel="noopener noreferrer">Get the course</a>' : '';
    return `<${live ? 'a' : 'div'} class="lab-module" data-state="${state}" data-id="${esc(m.id)}"
        ${live ? 'href="' + esc(labHref(m)) + '"' : 'aria-disabled="true"'}>
      <div class="lab-module-art">${(typeof LAB_ART !== 'undefined' && LAB_ART[m.icon]) || ''}</div>
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.blurb)}</p>
      <div class="count"><span>${esc(m.meta || '')}</span>${tag}${buy}</div>
    </${live ? 'a' : 'div'}>`;
  }).join('');

  const open = LAB_MODULES.filter(m => labState(m) === 'open').length;
  document.getElementById('lab-count').textContent =
    'Theory Lab · ' + LAB_MODULES.length + ' module' + (LAB_MODULES.length === 1 ? '' : 's') +
    (open ? ' · ' + open + ' unlocked' : '');

  window.addEventListener('scroll', () => {
    document.getElementById('lab-nav').classList.toggle('is-stuck', window.scrollY > 20);
  }, { passive:true });
})();
