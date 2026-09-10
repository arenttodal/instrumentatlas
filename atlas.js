/* ============================================================================
   INSTRUMENT ATLAS · APPLICATION
   ----------------------------------------------------------------------------
   Rendering, routing, the seating map and the timbre chart. Reads everything
   from atlas-data.js, which must load first.
   ============================================================================ */

/* ============================================================================
   3. HELPERS
   ============================================================================ */
const PITCH_LO = 21, PITCH_HI = 108;
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const midiName = m => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
const famOf = id => FAMILIES.find(f => f.id === id);
const liveIds = () => Object.keys(INSTRUMENTS).filter(k => INSTRUMENTS[k].status === 'live');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* the only two places that know where demo audio lives. Every clip is
   <base>/<kind>/<id>/<file>.<ext>, so a new instrument needs a folder and a
   file slug in the data, never a path. */
const FAM_AUDIO  = (famId, file)  => `${AUDIO.base}families/${famId}/${file}.${AUDIO.ext}`;
const INST_AUDIO = (instId, file) => `${AUDIO.base}instruments/${instId}/${file}.${AUDIO.ext}`;

/* ============================================================================
   4. VIEWS
   ============================================================================ */
function viewHome(){
  return `
  <section class="atl-home">
    <div class="atl-wrap">
      <div class="atl-hero atl-fade">
        <div class="atl-eyebrow">${esc(COLLECTION.name)} Collection · ${FAMILIES.length} families · ${Object.keys(INSTRUMENTS).length} instruments</div>
        <h1><span>${esc(COLLECTION.title[0])}</span><span class="atl-serif-em">${esc(COLLECTION.title[1])}</span></h1>
        <p>${esc(COLLECTION.lede)}</p>
      </div>
      <div class="atl-fam-grid">
        ${FAMILIES.map((f,i) => `
          <a class="atl-fam-card atl-fade" style="transition-delay:${i*70}ms" href="#/${f.id}">
            <div class="atl-fam-arc">${miniArc(f.id)}</div>
            <h3>${esc(f.name)}</h3>
            <p>${esc(f.tagline)}</p>
            <div class="count">${f.members.length} instruments</div>
          </a>`).join('')}
      </div>
    </div>
  </section>`;
}

/* The strip uses the icons, not the engravings. The plates are detailed
   drawings with hatching and, at the 34px this box gives them, a piccolo is
   five pixels wide and a flute is a horizontal smear. The icons were drawn for
   this size. plates/thumbs/ is still generated if that decision is revisited. */
function stripArt(id){
  return THUMBS[id] || `<svg viewBox="0 0 40 52" fill="none" stroke="#4B4D57" stroke-width="1.1"><rect x="12" y="10" width="16" height="32" rx="8"/></svg>`;
}

function viewFamily(fam){
  return `
  <section class="atl-fampage">
    <div class="atl-wrap">
      <div class="atl-ovw">

        <div class="atl-fade">
          <div class="atl-page-head">
            <div class="atl-eyebrow">The Orchestra</div>
            <h1>${esc(fam.name)}</h1>
            <p class="lede">${esc(fam.lede)}</p>
            ${(fam.demos && fam.demos.length) ? `
            <div class="atl-fam-demos">
              ${fam.demos.map(d => `
                <button class="atl-fam-demo" data-src="${esc(FAM_AUDIO(fam.id, d.file))}" title="${esc(d.note)}">
                  <svg width="7" height="9" viewBox="0 0 7 9" fill="currentColor" aria-hidden="true"><path d="M0 0l7 4.5L0 9z"/></svg>
                  <span>${esc(d.label)}</span>
                  <i class="atl-fam-demo-prog"></i>
                </button>`).join('')}
            </div>` : ''}
          </div>

          <h3 class="atl-blockhead" style="margin-top:20px">What defines the family</h3>
          <ul class="atl-list">${fam.role.map(r => `<li>${r}</li>`).join('')}</ul>

          <h3 class="atl-blockhead" style="margin:0 0 14px">The instruments</h3>
          <div class="atl-strip" style="grid-template-columns:repeat(${Math.ceil(fam.members.length / 2)},minmax(0,1fr))">
            ${fam.members.map(id => {
              const it = INSTRUMENTS[id]; if(!it) return '';
              const on = it.status === 'live';
              const art = stripArt(id);
              const inner = `<div class="atl-sc-art">${art}</div><b>${esc(it.name)}</b>${on ? '' : '<span class="st">Soon</span>'}`;
              return on
                ? `<a class="atl-sc" href="#/${fam.id}/${id}">${inner}</a>`
                : `<div class="atl-sc is-planned">${inner}</div>`;
            }).join('')}
          </div>
        </div>

        <div class="atl-fade">
          <div class="atl-seatmap">
            <svg id="atl-seatmap-svg" viewBox="0 2 340 176" role="img" aria-label="Orchestra seating map, each dot is one player"></svg>
          </div>
          <div class="atl-seat" id="atl-ens" data-family="${fam.id}"></div>
        </div>

      </div>
    </div>
  </section>`;
}

/* --- seating map ------------------------------------------------------- */
/* Standard concert layout, conductor front-centre: strings in the inner arc,
   woodwinds behind them, brass behind those, percussion at the back, harp and
   keyboards out on the left. One dot per player, so the fan physically grows
   and shrinks with the ensemble slider. Angles run 180° (left) to 360° (right). */
const SEATS = [
  {fam:'strings',   id:'violin', part:0, label:'Vln I',  a:[182,214], r:[34,78]},
  {fam:'strings',   id:'violin', part:1, label:'Vln II', a:[214,244], r:[34,78]},
  {fam:'strings',   id:'viola',           label:'Vla',   a:[244,276], r:[34,78]},
  {fam:'strings',   id:'cello',           label:'Vc',    a:[276,306], r:[34,78]},
  {fam:'strings',   id:'double-bass',     label:'Cb',    a:[306,338], r:[56,82]},
  {fam:'strings',   id:'harp',            label:'Hp',    a:[206,222], r:[88,112]},
  {fam:'percussion',id:'celesta',         label:'Cel',   a:[188,204], r:[88,112]},
  {fam:'woodwinds', id:'clarinet',        label:'Cl',    a:[228,250], r:[88,112]},
  {fam:'woodwinds', id:'flute',           label:'Fl',    a:[250,268], r:[88,112]},
  {fam:'woodwinds', id:'piccolo',         label:'Picc',  a:[268,277], r:[88,112]},
  {fam:'woodwinds', id:'oboe',            label:'Ob',    a:[277,298], r:[88,112]},
  {fam:'woodwinds', id:'bassoon',         label:'Bsn',   a:[298,320], r:[88,112]},
  {fam:'brass',     id:'trumpet',         label:'Tpt',   a:[232,258], r:[116,136]},
  {fam:'brass',     id:'trombone',        label:'Tbn',   a:[258,284], r:[116,136]},
  {fam:'brass',     id:'tuba',            label:'Tba',   a:[284,300], r:[116,136]},
  {fam:'brass',     id:'horn',            label:'Hn',    a:[300,332], r:[116,136]},
  {fam:'percussion',id:'cymbals',         label:'Cym',   a:[205,228], r:[140,158]},
  {fam:'percussion',id:'snare-drum',      label:'Sn',    a:[228,250], r:[140,158]},
  {fam:'percussion',id:'bass-drum',       label:'BD',    a:[250,272], r:[140,158]},
  {fam:'percussion',id:'gong',            label:'Gng',   a:[272,294], r:[140,158]},
  {fam:'percussion',id:'timpani',         label:'Timp',  a:[300,332], r:[140,158]}
];

const SEAT_CX = 170, SEAT_CY = 172;
const pol = (a,r) => [SEAT_CX + r*Math.cos(a*Math.PI/180), SEAT_CY + r*Math.sin(a*Math.PI/180)];

/* annular sector outline for a seating block */
function seatWedge(a0,a1,r0,r1){
  const [x1,y1] = pol(a0,r0), [x2,y2] = pol(a1,r0), [x3,y3] = pol(a1,r1), [x4,y4] = pol(a0,r1);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r0} ${r0} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}
          L${x3.toFixed(1)} ${y3.toFixed(1)} A${r1} ${r1} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`;
}

function seatCount(g, tier){
  const fam = famOf(g.fam);
  const v = fam.sizes[g.id][tier];
  if(g.part === undefined) return countOf(v);
  const parts = String(v).split('+');
  return parseInt(parts[g.part], 10) || 0;
}

/* Miniature of the same seating fan, for the family cards on the home page.
   Same geometry, same source data, so the home page teaches where each family
   physically sits before you have clicked into anything. */
function miniArc(famId){
  const CX = 60, CY = 56, K = 54 / 172;   // same fan, scaled to the card
  const p = (a,r) => [CX + r*K*Math.cos(a*Math.PI/180), CY + r*K*Math.sin(a*Math.PI/180)];
  const wedge = (a0,a1,r0,r1) => {
    const [x1,y1]=p(a0,r0), [x2,y2]=p(a1,r0), [x3,y3]=p(a1,r1), [x4,y4]=p(a0,r1);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${(r0*K).toFixed(1)} ${(r0*K).toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}
            L${x3.toFixed(1)} ${y3.toFixed(1)} A${(r1*K).toFixed(1)} ${(r1*K).toFixed(1)} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`;
  };
  const paths = SEATS.map(g => {
    const mine = g.fam === famId;
    return `<path class="${mine ? 'lit' : ''}" d="${wedge(g.a[0],g.a[1],g.r[0],g.r[1])}"
      fill="${mine ? 'rgba(212,160,74,.30)' : 'rgba(143,180,224,.05)'}"
      stroke="${mine ? 'rgba(212,160,74,.75)' : 'rgba(143,180,224,.13)'}" stroke-width=".6"/>`;
  }).join('');
  return `<svg viewBox="2 0 116 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${paths}</svg>`;
}

function renderSeatmap(famId, tier){
  const svg = document.getElementById('atl-seatmap-svg');
  if(!svg) return;
  let out = '';

  SEATS.forEach(g => {
    const n = seatCount(g, tier);
    const mine = g.fam === famId;
    const [a0,a1] = g.a, [r0,r1] = g.r;

    /* block outline: always drawn, so empty sections read as absent, not missing */
    out += `<path d="${seatWedge(a0,a1,r0,r1)}" fill="${mine && n ? 'rgba(212,160,74,.07)' : 'rgba(143,180,224,.03)'}"
      stroke="${mine ? 'rgba(212,160,74,.35)' : 'rgba(143,180,224,.13)'}" stroke-width=".7"/>`;

    if(!n) return;

    /* pack n dots into rows across the block */
    const rows = n <= 3 ? 1 : n <= 8 ? 2 : n <= 15 ? 3 : 4;
    const per  = Math.ceil(n / rows);
    let left = n;
    for(let i = 0; i < rows && left > 0; i++){
      const cnt = Math.min(per, left); left -= cnt;
      const rr = r0 + (r1 - r0) * ((i + 0.5) / rows);
      for(let j = 0; j < cnt; j++){
        const aa = a0 + (a1 - a0) * ((j + 0.5) / cnt);
        const [x,y] = pol(aa, rr);
        out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${mine ? 2.5 : 2}"
          fill="${mine ? '#D4A04A' : '#8FB4E0'}" opacity="${mine ? 1 : .3}"/>`;
      }
    }

    /* label only the highlighted family, to keep the fan readable */
    if(mine){
      const [lx,ly] = pol((a0 + a1) / 2, r1 + 8);
      out += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#D4A04A" font-size="6.5"
        font-family="DM Sans,sans-serif" font-weight="700" letter-spacing=".4"
        text-anchor="middle">${esc(g.label)} ${n}</text>`;
    }
  });

  /* conductor's podium */
  out += `<rect x="${SEAT_CX - 7}" y="${SEAT_CY - 5}" width="14" height="7" rx="1.5"
    fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".8"/>`;

  svg.innerHTML = out;
  const t = document.getElementById('atl-seatmap-tier');
  if(t) t.textContent = tier === 0 ? famOf(famId).smallName : TIERS[tier].label;
}

/* --- ensemble sizer --------------------------------------------------- */
const countOf = v => String(v).split('+').reduce((a,b) => a + (parseInt(b,10) || 0), 0);

/* Section size as the span the ensemble slider actually covers, low to high,
   ignoring the tiers where the instrument is absent. Derived from the family's
   own sizes so the instrument page and the family page can never disagree. */
function sectionRange(fam, id){
  const counts = (fam.sizes[id] || []).map(countOf).filter(n => n > 0);
  if(!counts.length) return null;
  const lo = Math.min(...counts), hi = Math.max(...counts);
  return lo === hi ? String(lo) : `${lo}–${hi}`;
}

/* The shell is built once. Only the text and rows update as the slider moves,
   so the range input is never replaced mid-drag, which is what limited it to
   one step at a time before. Dragging, clicking anywhere on the track, clicking
   a tick label and arrow keys all work now. */
function initEnsemble(famId, startTier){
  const el = document.getElementById('atl-ens');
  if(!el) return;
  el.innerHTML = `
    <div class="atl-ens-top">
      <div class="atl-ens-name" id="atl-ens-name"></div>
      <div class="atl-ens-count" id="atl-ens-count"></div>
    </div>
    <div class="atl-ens-ex" id="atl-ens-ex"></div>
    <div class="atl-ens-slider">
      <input class="atl-range" id="atl-range" type="range" min="0" max="${TIERS.length - 1}"
             step="1" value="${startTier}" aria-label="Ensemble size">
      <div class="atl-ticks" id="atl-ens-ticks">
        ${TIERS.map((x,i) => `<button type="button" data-tier="${i}">${esc(x.tick)}</button>`).join('')}
      </div>
    </div>
    <div id="atl-ens-rows"></div>`;

  const range = document.getElementById('atl-range');
  range.addEventListener('input', () => updateEnsemble(famId, +range.value));
  el.querySelectorAll('.atl-ticks button').forEach(b =>
    b.addEventListener('click', () => { range.value = b.dataset.tier; updateEnsemble(famId, +b.dataset.tier); }));
  updateEnsemble(famId, startTier);
}

function updateEnsemble(famId, tier){
  const fam = famOf(famId), t = TIERS[tier];
  const total = fam.members.reduce((a,id) => a + countOf(fam.sizes[id][tier]), 0);

  document.getElementById('atl-ens-name').textContent  = tier === 0 ? fam.smallName : t.label;
  document.getElementById('atl-ens-count').textContent = total || '–';
  document.getElementById('atl-ens-ex').textContent    = `${t.era} · whole orchestra ${t.players} players`;
  document.querySelectorAll('#atl-ens-ticks button').forEach((b,i) => b.classList.toggle('on', i === tier));

  renderSeatmap(famId, tier);

  document.getElementById('atl-ens-rows').innerHTML = fam.members.map(id => {
    const v = fam.sizes[id][tier], n = countOf(v);
    const label = id === 'violin' ? 'Violin I / II' : INSTRUMENTS[id].name;
    return `<div class="atl-seat-row ${n ? '' : 'is-off'}">
      <span>${esc(label)}</span><b>${n ? esc(String(v)) : '–'}</b></div>`;
  }).join('') + (total ? '' : `<div class="atl-ens-note">${esc(fam.smallName)}.</div>`);
}

function initFamily(famId){
  initEnsemble(famId, 4);
}

/* A PLATES entry is either an inline SVG string, which is the placeholder line
   art, or {img:'plates/<id>.png'}, which is a converted engraving. Both forms
   go in the same frame with the same corner ticks and the same caption block;
   only the artwork and the credit line differ, so plates can be replaced one
   instrument at a time. */
const hasPlateImg = id => !!PLATES[id] && typeof PLATES[id] === 'object' && PLATES[id].img;

function plateArt(id){
  const p = PLATES[id];
  if(!p) return '';
  if(typeof p === 'string') return p;
  return p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : '';
}

function plateCap(id, it){
  if(!hasPlateImg(id)){
    return `<div class="src atl-cap-2d">Placeholder line art. Final plate to be a public-domain engraving via <a href="https://www.metmuseum.org/hubs/open-access" target="_blank" rel="noopener">The Met (CC0)</a></div>`;
  }
  return it.plateCredit ? `<div class="src atl-cap-2d">${esc(it.plateCredit)}</div>` : '';
}

function viewInstrument(id){
  const it = INSTRUMENTS[id], fam = famOf(it.family);
  const bars = n => Array.from({length:n}, () => `<i style="height:${4 + Math.random()*18}px"></i>`).join('');
  const rel = (rid, dir) => {
    const r = INSTRUMENTS[rid]; if(!r) return '';
    const on = r.status === 'live';
    const href = on ? `#/${r.family}/${rid}` : '#/' + r.family;
    return `<a href="${href}" class="${dir}"><span>${dir === 'r' ? 'Next' : 'Previous'}</span><b>${esc(r.name)}</b></a>`;
  };
  const vids = (it.gallery || GALLERY.map(g => g.v)).map(v => GALLERY.find(g => g.v === v)).filter(Boolean);
  /* the section-size fact is computed, not typed, so it tracks the family table */
  const secRange = sectionRange(fam, id);
  const facts = it.facts.map(f =>
    (secRange && /^section size$/i.test(f[0])) ? [f[0], secRange, f[2] || 'players'] : f);

  return `
  <section class="atl-instpage">
    <div class="atl-wrap">

      <div class="atl-insthead">
        <div>
          <div class="atl-eyebrow">${esc(fam.name)}</div>
          <h1>${esc(it.name)}</h1>
        </div>
        <div class="atl-tabs" role="tablist">
          <button class="atl-tab" role="tab" aria-selected="true"  data-tab="overview">Overview</button>
          <button class="atl-tab" role="tab" aria-selected="false" data-tab="timbre">Timbre</button>
          <button class="atl-tab" role="tab" aria-selected="false" data-tab="details">Details</button>
          <button class="atl-tab" role="tab" aria-selected="false" data-tab="gallery">Gallery <em>${vids.length}</em></button>
        </div>
      </div>

      <!-- OVERVIEW -->
      <div class="atl-panel is-active" data-panel="overview">
        <section class="atl-inst-top">
          <!-- 2D is the default view on every instrument, including the ones
               with a model. The 3D iframe is only fetched when the toggle is
               used, so a page with a model now costs nothing until asked. -->
          <div class="atl-plate atl-fade" data-view="2d">
            ${it.model ? `
            <div class="atl-plate-switch" role="group" aria-label="Plate view">
              <button type="button" data-pv="2d" aria-pressed="true">2D</button>
              <button type="button" data-pv="3d" aria-pressed="false">3D</button>
            </div>` : ''}
            <div class="atl-plate-art">${plateArt(id)}</div>
            ${it.model ? `
            <div class="atl-plate-3d">
              <iframe id="atl-plate-iframe" data-src="viewer/instruments.html?i=${esc(it.model)}&amp;embed=1"
                title="Interactive 3D ${esc(it.name)}" loading="lazy" allow="fullscreen"></iframe>
              <div class="atl-plate-3d-fail">The 3D viewer is not deployed yet.</div>
            </div>` : ''}
            <div class="atl-plate-cap">
              <div class="no">${esc(fam.name)} family</div>
              <div class="nm">${esc(it.latin)}</div>
              ${plateCap(id, it)}
              ${it.model ? `<div class="src atl-cap-3d">${esc(it.modelCredit || '')}${it.modelSource ? ` · <a href="${esc(it.modelSource)}" target="_blank" rel="noopener">Sketchfab</a>` : ''} · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> · <a href="viewer/instruments.html?i=${esc(it.model)}" target="_blank" rel="noopener">Open full screen &nearr;</a></div>` : ''}
            </div>
            <div class="atl-plate-facts">
              ${facts.map(f => `<div><span>${esc(f[0])}</span><b>${esc(f[1])}${f[2] ? ` <em>${esc(f[2])}</em>` : ''}</b></div>`).join('')}
            </div>
          </div>
          <div class="atl-inst-id atl-fade" style="transition-delay:90ms">
            <div class="epithet">${esc(it.epithet)}</div>
            <p class="summary">${esc(it.summary)}</p>
            <div class="atl-demos">
              <div class="atl-label" style="margin-bottom:12px">Listen</div>
              ${it.demos.map(d => { const src = d.file ? INST_AUDIO(id, d.file) : ''; return `
                <div class="atl-demo${src ? ' is-playable' : ''}"${src ? ` data-src="${esc(src)}"` : ''}>
                  <button class="atl-play" aria-label="Play ${esc(d.label)}"${src ? '' : ' aria-disabled="true"'}>
                    <svg class="ico-play" width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg>
                    <svg class="ico-pause" width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><rect x="0" y="0" width="4" height="14" rx="1"/><rect x="8" y="0" width="4" height="14" rx="1"/></svg>
                  </button>
                  <div class="atl-demo-meta"><b>${esc(d.label)}</b><span>${esc(d.note)}</span></div>
                  <div class="atl-wave">${bars(22)}</div>
                  <span class="atl-demo-dur">${esc(d.dur)}</span>
                </div>`; }).join('')}
              ${it.demos.some(d => d.file) ? '' :
                `<div class="atl-demo-note" id="atl-audio-note">Audio connects in the next build. Layout only for now.</div>`}
            </div>
          </div>
        </section>
      </div>

      <!-- TIMBRE -->
      <div class="atl-panel" data-panel="timbre">
        <!-- The chart is left to speak for itself: the axes are labelled on it,
             and the heading and explanation that used to sit here were written
             for the slot rather than taken from the source. -->
        <div class="atl-timbre-chart"><svg id="atl-timbre-svg" role="img"
          aria-label="Frequency map: the fundamentals and harmonics of every instrument in the collection, grouped by family against a piano keyboard, with ${esc(it.name)} highlighted"></svg></div>
        <!-- The families are named on the chart in their own colour, so the key
             only has to explain the two strengths of the bar. -->
        <div class="atl-timbre-key">
          <span><i style="background:#D4A04A"></i>${esc(it.name)}</span>
          <span><i class="atl-key-solid"></i>Fundamentals</span>
          <span><i class="atl-key-faded"></i>Harmonics</span>
          <span class="atl-key-note">Logarithmic, so an octave is the same width everywhere. For unpitched percussion the solid bar is where the body of the sound sits, not a playable range. Harmonic ceilings are approximate.</span>
        </div>
      </div>

      <!-- DETAILS -->
      <div class="atl-panel" data-panel="details">
        <!-- The same three facts as the plate caption, repeated here so the tab
             stands on its own: someone who opened Details directly should not
             have to go back to Overview for the range. -->
        <div class="atl-basics">
          ${facts.map(f => `<div><span>${esc(f[0])}</span><b>${esc(f[1])}${f[2] ? ` <em>${esc(f[2])}</em>` : ''}</b></div>`).join('')}
        </div>
        <!-- Limits and common mistakes are gone: what the book says about them
             is family generic, so it belongs on the family page rather than
             repeated identically across every instrument in the section. -->
        <div class="atl-detail">
          <div class="atl-block">
            <h3>Tone colour by register</h3>
            ${it.registers.map(r => `
              <div class="atl-reg">
                <div class="atl-reg-top"><b>${esc(r.label)}</b><span>${esc(r.pitch)}</span></div>
                <p>${esc(r.text)}</p>
              </div>`).join('')}
          </div>
          <div class="atl-block">
            <h3>Characteristics</h3>
            <ul class="atl-list">${it.characteristics.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
          </div>
          <div class="atl-block">
            <h3>Articulations</h3>
            <div class="atl-chips">${it.articulations.map(a => `<span class="atl-chip">${esc(a)}</span>`).join('')}</div>
          </div>
          <div class="atl-block">
            <h3>Blends well with</h3>
            <div class="atl-chips">
              ${it.blends.map(b => {
                const t = INSTRUMENTS[b.id];
                const on = t && t.status === 'live';
                return on
                  ? `<a class="atl-chip" href="#/${t.family}/${b.id}" title="${esc(b.note)}"><i>&rarr;</i>${esc(b.label)}</a>`
                  : `<span class="atl-chip" title="${esc(b.note)}" style="opacity:.6">${esc(b.label)}</span>`;
              }).join('')}
            </div>
          </div>
        </div>
        <div class="atl-pager">${rel(it.prev, 'l')}${rel(it.next, 'r')}</div>
      </div>

      <!-- GALLERY -->
      <div class="atl-panel" data-panel="gallery">
        <div class="atl-gallery">
          ${vids.map(g => `
            <div class="atl-vid">
              <div class="atl-vid-frame" data-yt="${esc(g.v)}" tabindex="0" role="button" aria-label="Play ${esc(g.title)}">
                <img src="https://i.ytimg.com/vi/${esc(g.v)}/hqdefault.jpg" alt="" loading="lazy">
                <div class="atl-vid-play"><i><svg width="15" height="17" viewBox="0 0 12 14" fill="#0A0C14" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg></i></div>
              </div>
              <div class="atl-vid-meta">
                <b>${esc(g.title)}</b>
                <span class="perf">${esc(g.perf)}</span>
                <!-- g.why is not rendered. The field is still on every entry in
                     GALLERY, so restoring the line is one span. -->
                <span class="cred">${esc(g.chan)} · <a href="https://www.youtube.com/watch?v=${esc(g.v)}" target="_blank" rel="noopener">Watch on YouTube</a></span>
              </div>
            </div>`).join('')}
        </div>
        <p class="atl-gallery-note">Videos are embedded through YouTube's own player and remain hosted on the rights holders' channels, and nothing is copied or re-uploaded. Each card credits the performing orchestra, conductor and uploading channel, and links back to the source. Six per instrument, chosen to show it working inside an orchestra rather than in isolation.</p>
      </div>

    </div>
  </section>`;
}

function initInstrument(id){
  wireTabs();
  renderTimbre(id);
  wirePlateSwitch();
  document.querySelectorAll('.atl-vid-frame').forEach(f => {
    const play = () => {
      if(f.dataset.on === '1') return;
      f.dataset.on = '1';
      f.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${f.dataset.yt}?autoplay=1&rel=0&modestbranding=1"
        title="YouTube video" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
    };
    f.addEventListener('click', play);
    f.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); play(); } });
  });
}

/* 2D engraving <-> 3D model, inside the plate. Instruments with a model open on
   3D, so the iframe is spun up on arrival; pages without one never touch WebGL.
   The iframe is still created only once, whether by default or by a click. */
function wirePlateSwitch(){
  const plate = document.querySelector('.atl-plate[data-view]');
  if(!plate) return;

  const load3d = () => {
    const f = document.getElementById('atl-plate-iframe');
    if(!f || f.src || !f.dataset.src) return;
    f.src = f.dataset.src;
    f.addEventListener('load', () => {
      let ok = false;
      try { ok = !!f.contentDocument.getElementById('stage'); } catch(_){ ok = true; }
      if(!ok){ f.style.display = 'none'; f.closest('.atl-plate-3d').classList.add('is-fail'); }
    }, {once:true});
  };

  plate.querySelectorAll('.atl-plate-switch button').forEach(b => {
    b.addEventListener('click', () => {
      const v = b.dataset.pv;
      plate.dataset.view = v;
      plate.querySelectorAll('.atl-plate-switch button')
        .forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      if(v === '3d') load3d();
    });
  });

  if(plate.dataset.view === '3d') load3d();
}

/* shared tab wiring for family + instrument pages */
function wireTabs(){
  const tabs = [...document.querySelectorAll('.atl-tab')];
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      document.querySelectorAll('.atl-panel').forEach(p =>
        p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
      observeFades();
    });
  });
}

/* ============================================================================
   5. RANGE & TIMBRE MAP
   ============================================================================ */
let currentInstrument = null, currentFamily = null;

/* ============================================================================
   FREQUENCY MAP. Full page, on the instrument's Timbre tab.
   Horizontal axis is frequency, logarithmic, 20 Hz to 20 kHz: one octave is
   the same width everywhere, which is the only scale on which instruments
   are comparable. Vertical axis is nothing at all. Rows are grouped by family
   and ordered within a family the way the rest of the site orders them, so a
   row's position carries no measurement and cannot be misread as one.

   Each row is drawn twice: the fundamentals, from the instrument's own range,
   at full strength, and the harmonics above them, faded. That upper stretch is
   why a bassoon and a cello occupying the same fundamentals still sound
   nothing alike, and it is the part a pitch-only chart cannot show.

   The keyboard along the bottom is the anchor. 88 keys, A0 to C8, one semitone
   per slot, which on a log frequency axis makes every slot the same width, so
   the keys line up with the frequencies above them exactly rather than
   approximately. It also shows how much of the audible band sits above the top
   of a piano: nearly two thirds of the width, all of it harmonics.
   ============================================================================ */
/* family colours, following the convention of printed orchestra seating charts:
   strings violet, woodwinds green, brass blue, percussion amber. Gold is reserved
   for the instrument you are reading, so no family uses it. */
/* The frequency map's palette, which is not the dock's: see STUDIO_FAM in
   atlas-data.js for why the two are deliberately different. */
const FAM_COLOR = {
  strings:'#9B8FD4', woodwinds:'#5FB89A', brass:'#6C9BD8', percussion:'#C9834F'
};

const HZ_LO = 20, HZ_HI = 20000;
const hzOf = m => 440 * Math.pow(2, (m - 69) / 12);
const hzTick = f => f >= 1000 ? (f / 1000) + 'k' : String(f);

/* families top to bottom. Low to high inside the plot would be one more thing
   to explain; this is the order the family menu and the seating map already
   use, so the chart matches the rest of the site. */
const TIMBRE_ORDER = ['percussion','brass','woodwinds','strings'];
const BLACK_KEYS = [1,3,6,8,10];

function renderTimbre(id){
  const svg = document.getElementById('atl-timbre-svg');
  if(!svg) return;

  const W = 1000, L = 124, R = 26, T = 26;
  const ROW = 15, GAP = 15, BAR = 7;
  const lg = Math.log10(HZ_LO), sp = Math.log10(HZ_HI) - lg;
  const px = f => L + (Math.log10(f) - lg) / sp * (W - L - R);

  let y = T;
  const groups = TIMBRE_ORDER.map((fid, gi) => {
    const f = FAMILIES.find(x => x.id === fid), top = y;
    const rows = f.members.map(k => {
      const row = { k, o:INSTRUMENTS[k], fid, cy:y + ROW / 2, sel:k === id };
      y += ROW;
      return row;
    });
    const g = { fid, name:f.name, top, bot:y, rows };
    if(gi < TIMBRE_ORDER.length - 1) y += GAP;
    return g;
  });
  const PLOT = y, KB = PLOT + 22, KBH = 30, H = KB + KBH + 38;

  /* ---- decade grid, running the full height of the plot ---- */
  const TICKS = [20,50,100,200,500,1000,2000,5000,10000,20000];
  let grid = '';
  TICKS.forEach(f => {
    const x = px(f).toFixed(1);
    grid += `<line x1="${x}" y1="${T - 8}" x2="${x}" y2="${PLOT}" stroke="#fff"
      stroke-opacity="${f === 1000 ? '.10' : '.045'}" stroke-width="1"/>`;
  });

  /* ---- family bracket and label down the left edge ---- */
  const side = groups.map(g => {
    const col = FAM_COLOR[g.fid], y0 = g.top + 2, y1 = g.bot - 2;
    return `<line x1="13" y1="${y0.toFixed(1)}" x2="13" y2="${y1.toFixed(1)}"
        stroke="${col}" stroke-opacity=".4" stroke-width="1.5"/>
      <text transform="translate(8.5,${((y0 + y1) / 2).toFixed(1)}) rotate(-90)" fill="${col}"
        fill-opacity=".85" font-size="9" font-weight="700" font-family="DM Sans,sans-serif"
        text-anchor="middle" letter-spacing="1.8">${esc(g.name.toUpperCase())}</text>`;
  }).join('');

  /* ---- one row per instrument ---- */
  /* The harmonic bar is drawn the full span first and the solid fundamentals
     laid over its left end, so the two meet without a seam: one bar that loses
     strength where the fundamentals stop. The harmonic fill is a gradient
     rather than a flat tint because the energy up there really does fall away;
     a flat block would claim the top of the range is as present as the bottom. */
  const defs = `<defs>${Object.keys(FAM_COLOR).concat('sel').map(k => {
    const c = k === 'sel' ? '#D4A04A' : FAM_COLOR[k];
    return `<linearGradient id="atl-h-${k}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${c}" stop-opacity="${k === 'sel' ? '.40' : '.26'}"/>
      <stop offset="1" stop-color="${c}" stop-opacity="${k === 'sel' ? '.09' : '.05'}"/>
    </linearGradient>`;
  }).join('')}</defs>`;

  const body = groups.reduce((all, g) => all.concat(g.rows), []).map(d => {
    const col = d.sel ? '#D4A04A' : FAM_COLOR[d.fid];
    const f0 = hzOf(d.o.range.lo), f1 = hzOf(d.o.range.hi);
    const x0 = px(f0), x1 = px(f1), x2 = px(Math.max(d.o.harmonics || f1, f1));
    const top = (d.cy - BAR / 2).toFixed(1);
    return `<g>
      ${d.sel ? `<rect x="${L}" y="${(d.cy - ROW / 2).toFixed(1)}" width="${(W - L - R).toFixed(1)}"
        height="${ROW}" fill="#D4A04A" fill-opacity=".05"/>` : ''}
      <rect x="${x0.toFixed(1)}" y="${top}" width="${Math.max(BAR, x2 - x0).toFixed(1)}"
        height="${BAR}" rx="${BAR / 2}" fill="url(#atl-h-${d.sel ? 'sel' : d.fid})"/>
      <rect x="${x0.toFixed(1)}" y="${top}" width="${Math.max(BAR, x1 - x0).toFixed(1)}"
        height="${BAR}" rx="${BAR / 2}" fill="${col}" fill-opacity="${d.sel ? '1' : '.85'}"/>
      <text x="${(L - 14).toFixed(1)}" y="${(d.cy + 3.6).toFixed(1)}" fill="${d.sel ? '#fff' : col}"
        fill-opacity="${d.sel ? '1' : '.8'}" font-size="${d.sel ? '11.5' : '10.5'}"
        font-weight="${d.sel ? '600' : '400'}" font-family="DM Sans,sans-serif"
        text-anchor="end">${esc(d.o.name)}</text>
    </g>`;
  }).join('');

  /* ---- the 88 key piano, A0 to C8, one semitone per slot ---- */
  /* One light strip carries all the white keys, because at this width a stroke
     around each of the fifty-two turns the keyboard into a barcode. The seams
     are drawn where a real keyboard shows them: full height between E and F and
     between B and C, where two white keys touch, and only along the front
     elsewhere, where the black key above already separates them. */
  const slot = m => { const a = px(hzOf(m - 0.5)); return { a, w:px(hzOf(m + 0.5)) - a }; };
  const front = KB + KBH * .62;
  let blacks = '', seams = '', octaves = '';
  for(let m = 21; m <= 108; m++){
    const { a, w } = slot(m);
    if(BLACK_KEYS.includes(m % 12)){
      blacks += `<rect x="${(a + w * .26).toFixed(1)}" y="${KB}" width="${(w * .48).toFixed(1)}"
        height="${(KBH * .62).toFixed(1)}" fill="#0A0E18"/>`;
      seams += `<line x1="${(a + w / 2).toFixed(1)}" y1="${front.toFixed(1)}"
        x2="${(a + w / 2).toFixed(1)}" y2="${KB + KBH}" stroke="#0A0E18" stroke-width=".8"/>`;
    } else if(m < 108 && !BLACK_KEYS.includes((m + 1) % 12)){
      seams += `<line x1="${(a + w).toFixed(1)}" y1="${KB}" x2="${(a + w).toFixed(1)}"
        y2="${KB + KBH}" stroke="#0A0E18" stroke-width=".8"/>`;
    }
    if(m % 12 === 0) octaves += `<text x="${(a + w / 2).toFixed(1)}" y="${KB + KBH + 13}"
      fill="${m === 60 ? '#D4A04A' : '#5E606A'}" font-size="9" font-family="DM Sans,sans-serif"
      text-anchor="middle" letter-spacing=".6">${midiName(m)}</text>`;
  }
  const lo = slot(21), hi = slot(108), mid = slot(60);
  const keyboard = `<rect x="${lo.a.toFixed(1)}" y="${KB}" width="${(hi.a + hi.w - lo.a).toFixed(1)}"
      height="${KBH}" rx="2" fill="#A7ACB8"/>
    <rect x="${mid.a.toFixed(1)}" y="${KB}" width="${mid.w.toFixed(1)}" height="${KBH}" fill="#D9BE8A"/>`
    + seams + blacks + octaves;

  /* ---- the hertz scale under the keyboard ---- */
  const hz = TICKS.map(f => `<line x1="${px(f).toFixed(1)}" y1="${KB + KBH + 3}"
      x2="${px(f).toFixed(1)}" y2="${KB + KBH + 8}" stroke="#fff" stroke-opacity=".12"/>
    <text x="${px(f).toFixed(1)}" y="${KB + KBH + 30}" fill="#4E505A" font-size="9.5"
      font-family="DM Sans,sans-serif" text-anchor="middle" letter-spacing=".8">${hzTick(f)}</text>`).join('')
    + `<text x="${(L - 14).toFixed(1)}" y="${KB + KBH + 30}" fill="#4E505A" font-size="9.5"
      font-weight="700" font-family="DM Sans,sans-serif" text-anchor="end" letter-spacing="1.4">HZ</text>`
    + `<text x="${(L - 14).toFixed(1)}" y="${KB + KBH + 13}" fill="#4E505A" font-size="9.5"
      font-weight="700" font-family="DM Sans,sans-serif" text-anchor="end" letter-spacing="1.4">PIANO</text>`;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = defs + grid + side + body + keyboard + hz;
}

/* ============================================================================
   6. NAV MENU + ROUTER
   ============================================================================ */
function buildMenu(){
  document.getElementById('atl-menu').innerHTML = FAMILIES.map(f => `
    <div class="atl-menu-col">
      <div class="atl-menu-head">
        <h4>${esc(f.name)}</h4>
        <a class="atl-menu-fam" href="#/${f.id}">Overview <em>→</em></a>
      </div>
      ${f.members.map(id => {
        const it = INSTRUMENTS[id]; if(!it) return '';
        return it.status === 'live'
          ? `<a href="#/${f.id}/${id}">${esc(it.name)}</a>`
          : `<span class="dim">${esc(it.name)}</span>`;
      }).join('')}
    </div>`).join('');
}

let currentPath = '/';

function route(path){
  if(typeof path === 'string') currentPath = path;
  const parts = currentPath.replace(/^#?\/?/, '').split('/').filter(Boolean);
  const view = document.getElementById('atl-view');
  currentInstrument = null; currentFamily = null;
  let label = 'Browse instruments';

  if(parts.length >= 2 && INSTRUMENTS[parts[1]] && INSTRUMENTS[parts[1]].status === 'live'){
    currentInstrument = parts[1];
    currentFamily = INSTRUMENTS[parts[1]].family;
    label = INSTRUMENTS[parts[1]].name;
    view.innerHTML = viewInstrument(parts[1]);
    initInstrument(parts[1]);
  } else if(parts.length >= 1 && famOf(parts[0])){
    currentFamily = parts[0];
    label = famOf(parts[0]).name;
    view.innerHTML = viewFamily(famOf(parts[0]));
    initFamily(parts[0]);
  } else {
    view.innerHTML = viewHome();
  }

  document.getElementById('atl-select-label').textContent = label;
  document.getElementById('atl-nav').classList.toggle('is-sub', parts.length > 0);
  document.getElementById('atl-topbar').classList.toggle('is-hidden', parts.length > 0);

  /* the breadcrumb lives in the nav bar, in line with the logo */
  const root = `<span class="atl-crumb-root"><a href="#/">${esc(COLLECTION.name)}</a><i>/</i></span>`;
  let crumb = '';
  if(currentInstrument){
    const f = famOf(currentFamily);
    crumb = `${root}<a href="#/${f.id}">${esc(f.name)}</a><i>/</i><span>${esc(INSTRUMENTS[currentInstrument].name)}</span>`;
  } else if(currentFamily){
    crumb = `${root}<span>${esc(famOf(currentFamily).name)}</span>`;
  }
  document.getElementById('atl-nav-crumb').innerHTML = crumb ? `<div class="atl-crumb">${crumb}</div>` : '';
  closeMenu();
  window.scrollTo({top:0, behavior:'instant' in window ? 'instant' : 'auto'});
  observeFades();
  wireFamilyVideo(parts.length === 0);
  wireRails(currentFamily, currentInstrument);
  /* the demo rows the player was pointing at have just been destroyed */
  if(typeof stopDemo === 'function') stopDemo();
}

/* ============================================================================
   SIBLING RAILS
   ----------------------------------------------------------------------------
   A chevron and a small label tucked into each margin, for stepping sideways
   through the atlas without going back up a level.

   Families cycle in FAMILIES order and wrap, so left of Strings is Percussion.
   Instruments cycle through every live instrument in family order and also
   wrap, which means the ends of a family lead into the next one rather than
   into nothing: that is the difference between these and the prev/next pager
   at the foot of the Details tab, which deliberately stops at the family edge.
   ============================================================================ */
function railOrder(){
  return FAMILIES.flatMap(f => f.members.filter(m => INSTRUMENTS[m] && INSTRUMENTS[m].status === 'live'));
}

function railTargets(famId, instId){
  if(instId){
    const all = railOrder(), i = all.indexOf(instId);
    if(i < 0) return null;
    const at = k => {
      const id = all[(k + all.length) % all.length], it = INSTRUMENTS[id];
      return { href:`#/${it.family}/${id}`, name:it.name,
               kicker: it.family === famId ? '' : famOf(it.family).name };
    };
    return { prev: at(i - 1), next: at(i + 1) };
  }
  if(famId){
    const i = FAMILIES.findIndex(f => f.id === famId);
    if(i < 0) return null;
    const at = k => {
      const f = FAMILIES[(k + FAMILIES.length) % FAMILIES.length];
      return { href:`#/${f.id}`, name:f.name, kicker:'' };
    };
    return { prev: at(i - 1), next: at(i + 1) };
  }
  return null;   /* home has no siblings */
}

function wireRails(famId, instId){
  const L = document.getElementById('atl-rail-l'), R = document.getElementById('atl-rail-r');
  if(!L || !R) return;
  const t = railTargets(famId, instId);
  [L, R].forEach(el => { el.hidden = !t; });
  if(!t) return;
  const chev = d => `<svg width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="${
    d === 'l' ? 'M7.5 1.5L1.5 7.5l6 6' : 'M1.5 1.5l6 6-6 6'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const label = x => `<span class="atl-rail-txt">${x.kicker ? `<i>${esc(x.kicker)}</i>` : ''}<b>${esc(x.name)}</b></span>`;
  L.href = t.prev.href; L.innerHTML = chev('l') + label(t.prev);
  L.setAttribute('aria-label', 'Previous: ' + t.prev.name);
  R.href = t.next.href; R.innerHTML = label(t.next) + chev('r');
  R.setAttribute('aria-label', 'Next: ' + t.next.name);
}

/* arrow keys do the same thing, as long as nothing is being typed into */
addEventListener('keydown', e => {
  if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if(t && (t.matches('input, textarea, select, [contenteditable]') || t.closest('.atl-dock'))) return;
  const rail = document.getElementById(e.key === 'ArrowLeft' ? 'atl-rail-l' : 'atl-rail-r');
  if(rail && !rail.hidden && rail.href){ e.preventDefault(); location.hash = rail.getAttribute('href'); }
});

/* ============================================================================
   FAMILY HOVER FOOTAGE
   ----------------------------------------------------------------------------
   Home page only. A <video> per family that declares one, all preload="none"
   with no src until the card is first hovered, so a visitor who never hovers
   downloads nothing at all. A short delay before starting means sweeping the
   cursor across the row does not fire every clip at once.
   ============================================================================ */
const VID = { peak:0.20, delay:120, timer:null, built:false };

function wireFamilyVideo(isHome){
  const layer = document.getElementById('atl-famvid');
  if(!layer) return;
  const off = window.matchMedia('(hover: none)').matches ||
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!isHome || off){ layer.innerHTML = ''; VID.built = false; return; }

  if(!VID.built){
    layer.innerHTML = FAMILIES.filter(f => f.video).map(f =>
      `<video data-fam="${esc(f.id)}" data-src="${esc(f.video)}" preload="none" muted playsinline loop></video>`).join('');
    VID.built = true;
  }

  document.querySelectorAll('.atl-fam-card').forEach(card => {
    const id = (card.getAttribute('href') || '').replace('#/', '');
    card.addEventListener('mouseenter', () => showFamilyVideo(id));
    card.addEventListener('mouseleave', hideFamilyVideo);
    card.addEventListener('focus', () => showFamilyVideo(id));
    card.addEventListener('blur', hideFamilyVideo);
  });
}

function showFamilyVideo(famId){
  clearTimeout(VID.timer);
  VID.timer = setTimeout(() => {
    const layer = document.getElementById('atl-famvid');
    /* the scrim rides with the clip, so a still page is never darkened */
    if(layer) layer.classList.toggle('is-active', FAMILIES.some(f => f.id === famId && f.video));
    document.querySelectorAll('#atl-famvid video').forEach(v => {
      if(v.dataset.fam !== famId){ v.classList.remove('is-on'); v.pause(); return; }
      /* first hover is the first byte requested */
      if(!v.src && v.dataset.src) v.src = v.dataset.src;
      v.classList.add('is-on');
      const p = v.play();
      if(p && p.catch) p.catch(() => {});   /* a blocked autoplay is not an error worth logging */
    });
  }, VID.delay);
}

function hideFamilyVideo(){
  clearTimeout(VID.timer);
  const layer = document.getElementById('atl-famvid');
  if(layer) layer.classList.remove('is-active');
  document.querySelectorAll('#atl-famvid video').forEach(v => v.classList.remove('is-on'));
}

function closeMenu(){
  const s = document.getElementById('atl-select');
  s.dataset.open = '0';
  document.getElementById('atl-select-btn').setAttribute('aria-expanded','false');
}

function observeFades(){
  const els = document.querySelectorAll('.atl-fade:not(.is-in)');
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    els.forEach(e => e.classList.add('is-in')); return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, {threshold:.08, rootMargin:'0px 0px -40px 0px'});
  els.forEach(e => io.observe(e));
}

/* --- wiring --- */
buildMenu();

/* Internal links are intercepted rather than navigated. Real hash URLs are kept
   in the markup so deep links still work once this is deployed on Cloudflare,
   but we only write to history when this is the top-level document. Inside an
   iframe (preview sandboxes, a Webflow embed) changing the URL is itself read as
   a navigation attempt and triggers a "leave this page?" prompt. */
const IN_FRAME = (() => { try { return window.self !== window.top; } catch(_){ return true; } })();

function navigate(path){
  const v = document.getElementById('atl-view');
  if(v && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    v.classList.add('is-leaving');
    setTimeout(() => { route(path); v.classList.remove('is-leaving'); }, 170);
  } else {
    route(path);
  }
  if(IN_FRAME) return;
  try { history.pushState({path}, '', '#' + path.replace(/^#?\/?/, '/')); } catch(_){ /* ignore */ }
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if(!a) return;
  e.preventDefault();
  navigate(a.getAttribute('href').slice(1) || '/');
});
window.addEventListener('popstate', e => {
  route((e.state && e.state.path) || location.hash.slice(1) || '/');
});

document.getElementById('atl-select-btn').addEventListener('click', e => {
  e.stopPropagation();
  const s = document.getElementById('atl-select');
  const open = s.dataset.open === '1';
  s.dataset.open = open ? '0' : '1';
  document.getElementById('atl-select-btn').setAttribute('aria-expanded', String(!open));
});
document.addEventListener('click', e => {
  if(!e.target.closest('#atl-select')) closeMenu();
});
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });


/* ============================================================================
   DEMO PLAYERS
   ----------------------------------------------------------------------------
   One Audio object for the whole page, reused across every clip, so only one
   can ever sound at a time and switching costs no extra memory. Nothing is
   fetched until a button is pressed. A demo without a src keeps its current
   inert appearance rather than throwing, because most instruments have no
   audio yet.
   ============================================================================ */
const PLAYER = { el:null, row:null, lit:-1 };

function demoAudio(){
  if(PLAYER.el) return PLAYER.el;
  const a = new Audio();
  a.preload = 'none';
  a.addEventListener('timeupdate', paintProgress);
  a.addEventListener('ended', () => stopDemo());
  a.addEventListener('error', () => {
    if(PLAYER.row) PLAYER.row.classList.add('is-missing');
    stopDemo();
  });
  /* the file is the authority on its own length, not the hardcoded string */
  a.addEventListener('loadedmetadata', () => {
    if(!PLAYER.row || !isFinite(a.duration)) return;
    const d = PLAYER.row.querySelector('.atl-demo-dur');
    if(d) d.textContent = `${Math.floor(a.duration/60)}:${String(Math.round(a.duration%60)).padStart(2,'0')}`;
  });
  PLAYER.el = a;
  return a;
}

/* Show progress on whatever the playing element happens to carry: an
   instrument row lights its waveform bars, a family pill grows the line under
   it. One player, two readouts, rather than two players. The bar version only
   touches the DOM when the number of lit bars changes. */
function paintProgress(){
  const a = PLAYER.el, row = PLAYER.row;
  if(!a || !row || !isFinite(a.duration) || !a.duration) return;
  const frac = a.currentTime / a.duration;
  const line = row.querySelector('.atl-fam-demo-prog');
  if(line){ line.style.transform = `scaleX(${frac})`; return; }
  const bars = row.querySelectorAll('.atl-wave i');
  if(!bars.length) return;
  const n = Math.round(frac * bars.length);
  if(n === PLAYER.lit) return;
  PLAYER.lit = n;
  bars.forEach((b, i) => b.classList.toggle('is-lit', i < n));
}

function stopDemo(){
  const a = PLAYER.el;
  if(a){ a.pause(); a.currentTime = 0; }
  if(PLAYER.row){
    PLAYER.row.classList.remove('is-playing');
    PLAYER.row.querySelectorAll('.atl-wave i').forEach(b => b.classList.remove('is-lit'));
    const line = PLAYER.row.querySelector('.atl-fam-demo-prog');
    if(line) line.style.transform = 'scaleX(0)';
  }
  PLAYER.row = null;
  PLAYER.lit = -1;
}

function playDemo(row){
  const src = row.dataset.src;
  if(!src) return;
  const a = demoAudio();
  if(PLAYER.row === row){
    /* a pill stops outright when you click the one that is playing; a row keeps
       its pause-and-resume, because it shows a position you can return to */
    if(row.classList.contains('atl-fam-demo')){ stopDemo(); return; }
    if(!a.paused){ a.pause(); row.classList.remove('is-playing'); return; }
    if(a.currentTime > 0){ row.classList.add('is-playing'); a.play().catch(() => {}); return; }
  }
  stopDemo();
  /* and the other way round: starting a clip pauses the studio dock */
  if(typeof window.atlasStudioPause === 'function') window.atlasStudioPause();
  PLAYER.row = row;
  row.classList.remove('is-missing');
  a.src = src;
  row.classList.add('is-playing');
  a.play().catch(() => { row.classList.remove('is-playing'); row.classList.add('is-missing'); });
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.atl-play, .atl-fam-demo');
  if(!btn) return;
  const row = btn.classList.contains('atl-fam-demo') ? btn : btn.closest('.atl-demo');
  if(!row) return;
  if(row.dataset.src){ playDemo(row); return; }
  const note = document.getElementById('atl-audio-note');
  if(note){ note.textContent = 'Audio connects in the next build. This button will play the clip.'; note.style.color = '#D4A04A'; }
});

const nav = document.getElementById('atl-nav');
window.addEventListener('scroll', () => nav.classList.toggle('is-stuck', window.scrollY > 20), {passive:true});

route((!IN_FRAME && location.hash.slice(1)) || '/');
