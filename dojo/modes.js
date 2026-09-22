/* ============================================================================
   EAR TRAINING · MODES MENU
   ----------------------------------------------------------------------------
   One table, rendered as cards. A new mode is an entry here and its page —
   the same bargain as EVENANT_MODULES one level up.
   ============================================================================ */

const DOJO_MODES = [
  {
    id:'belts', name:'Belts', href:'belts.html', status:'live',
    blurb:'Hear one instrument, alone and dry, and name it. Get it wrong and the two are played back to back so you can hear the difference rather than read about it.',
    meta:'Belt 2 of 7 · 15 instruments'
  },
  {
    id:'layers', name:'Layers', href:'layers.html', status:'live',
    blurb:'A real passage, three to five parts at once. Drag each one into the job it is doing — melody, countermelody or harmony.',
    meta:'5 passages · themes 4 and 5'
  },
  {
    id:'blend', name:'Blend', href:'blend.html', status:'live',
    blurb:'Several instruments are playing one line at once. Name every one of them — and at the hardest level, say which sits an octave over or under the others.',
    meta:'3 levels · 4 themes'
  }
];

/* Each mode gets a diagram of its own shape where a family card has its
   seating arc: one lit bar for naming a single instrument, three stacked lanes
   for sorting a texture, two merging lanes for blend. */
const MODE_ART = {
  belts:`<svg viewBox="0 0 220 104" fill="none" aria-hidden="true">
    <g stroke="#2A2E3A" stroke-width="7" stroke-linecap="round">
      <path d="M26 26h168"/><path d="M26 78h168"/></g>
    <path class="lit" d="M26 52h168" stroke="#D4A04A" stroke-width="7" stroke-linecap="round"/>
    <circle class="lit" cx="110" cy="52" r="13" fill="#080C14" stroke="#D4A04A" stroke-width="1.6"/>
    <circle class="lit" cx="110" cy="52" r="4" fill="#D4A04A"/></svg>`,
  layers:`<svg viewBox="0 0 220 104" fill="none" aria-hidden="true">
    <g stroke-width="7" stroke-linecap="round">
      <path class="lit" d="M26 22h120" stroke="#D4A04A"/>
      <path class="lit" d="M26 52h84"  stroke="#C6A97C"/>
      <path class="lit" d="M26 82h150" stroke="#6E8FB8"/></g>
    <g stroke="#2A2E3A" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 12">
      <path d="M152 22h42"/><path d="M116 52h78"/><path d="M182 82h12"/></g></svg>`,
  blend:`<svg viewBox="0 0 220 104" fill="none" aria-hidden="true">
    <g stroke="#2A2E3A" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M26 30c56 0 60 22 84 22h84"/><path d="M26 74c56 0 60-22 84-22"/></g></svg>`
};

(function(){
  const grid = document.getElementById('dj-modes');
  if(!grid) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  grid.innerHTML = DOJO_MODES.map(m => {
    const off = m.status !== 'live';
    const tag = off ? 'div' : 'a';
    return `<${tag} class="dj-mode" ${off ? 'data-soon aria-disabled="true"' : `href="${esc(m.href)}"`}>
      <div class="dj-mode-art">${MODE_ART[m.id] || ''}</div>
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.blurb)}</p>
      <div class="count">${off ? 'Coming soon — ' : ''}${esc(m.meta)}</div>
    </${tag}>`;
  }).join('');
})();
