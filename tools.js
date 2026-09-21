/* ============================================================================
   ALL TOOLS · CARDS
   ----------------------------------------------------------------------------
   Renders the grid from the same registry the switcher uses, so a new tool
   appears in both from one entry in evenant-modules.js.
   ============================================================================ */
(function(){
  const grid = document.getElementById('grid');
  if(!grid || typeof EVENANT_MODULES === 'undefined') return;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const icon = k => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${EVENANT_ICONS[k] || ''}</svg>`;

  /* A 'locked' tool is unreleased AND reachable: it wears the Coming soon
     label like a 'soon' one, but it is a real link, because the code prompt
     that gates it is on the other side of that link. */
  const ARROW = '<svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 4h9M7 1l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  grid.innerHTML = EVENANT_MODULES.map(m => {
    const go   = evenantReachable(m);
    const soon = evenantUnreleased(m);
    const tag  = go ? 'a' : 'div';
    return `<${tag} class="card"${soon ? ' data-soon' : ''} ${go ? `href="${esc(evenantHref(m))}"` : 'aria-disabled="true"'}>
      <div class="card-head">${icon(m.icon)}<b>${esc(m.name)}</b>
        ${soon ? '<span class="here">Coming soon</span>' : ''}</div>
      <p>${esc(m.blurb)}</p>
      <span class="go">${!go ? 'Not yet available' : soon ? 'Access code' : 'Open'}
        ${go ? ARROW : ''}
      </span>
    </${tag}>`;
  }).join('');
})();
