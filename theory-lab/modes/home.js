/* The module's front page: the lessons, the tools, and the ear quiz. Built from
   the same LESSONS array the lesson pages use, so a new lesson appears here
   without this file changing. */
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const L = typeof LESSONS !== 'undefined' ? LESSONS : [];

  const lessons = L.filter(l => l.kind !== 'lab');
  document.getElementById('md-lessons').innerHTML = lessons.map(l =>
    `<a class="md-lesson" href="lessons.html#/${esc(l.module)}/${esc(l.id)}">
       <span class="n">${l.n}</span>
       <span><h3>${esc(l.title)}</h3><p>${esc(l.short || '')}</p></span>
     </a>`).join('');

  const tools = L.filter(l => l.kind === 'lab').map(l =>
    `<a class="md-tool" href="lessons.html#/${esc(l.module)}/${esc(l.id)}">
       <h3>${esc(l.title)}</h3><p>${esc(l.claim || '')}</p></a>`);
  /* the quiz is its own page, so it is listed here rather than in LESSONS */
  tools.push(`<a class="md-tool" href="ear.html">
       <h3>Name the mode</h3>
       <p>Hear a phrase over a drone and say which mode it is. Five levels, from major-or-minor up to all seven.</p></a>`);
  document.getElementById('md-tools').innerHTML = tools.join('');

  window.addEventListener('scroll', () => {
    document.getElementById('lab-nav').classList.toggle('is-stuck', window.scrollY > 20);
  }, { passive:true });
})();
