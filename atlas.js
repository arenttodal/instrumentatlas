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
            <div class="count">${f.members.length} instruments · ${f.members.filter(m=>INSTRUMENTS[m]&&INSTRUMENTS[m].status==='live').length} ready</div>
          </a>`).join('')}
      </div>
    </div>
  </section>`;
}

function viewFamily(fam){
  const live = fam.members.filter(m => INSTRUMENTS[m] && INSTRUMENTS[m].status === 'live');
  return `
  <section class="atl-fampage">
    <div class="atl-wrap">
      <div class="atl-ovw">

        <div class="atl-fade">
          <div class="atl-page-head">
            <div class="atl-eyebrow">The Orchestra</div>
            <h1>${esc(fam.name)}</h1>
            <p class="lede">${esc(fam.lede)}</p>
          </div>

          <h3 class="atl-blockhead" style="margin-top:30px">What defines the family</h3>
          <ul class="atl-list">${fam.role.map(r => `<li>${r}</li>`).join('')}</ul>

          <div class="atl-striphead">
            <h3 class="atl-blockhead" style="margin:0">The instruments</h3>
            <div class="atl-label">${live.length} of ${fam.members.length} ready</div>
          </div>
          <div class="atl-strip" style="grid-template-columns:repeat(${Math.ceil(fam.members.length / 2)},minmax(0,1fr))">
            ${fam.members.map(id => {
              const it = INSTRUMENTS[id]; if(!it) return '';
              const on = it.status === 'live';
              const art = THUMBS[id] || `<svg viewBox="0 0 40 52" fill="none" stroke="#4B4D57" stroke-width="1.1"><rect x="12" y="10" width="16" height="32" rx="8"/></svg>`;
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
          <div class="atl-plate atl-fade" data-view="${it.model ? '3d' : '2d'}">
            ${it.model ? `
            <div class="atl-plate-switch" role="group" aria-label="Plate view">
              <button type="button" data-pv="2d" aria-pressed="false">2D</button>
              <button type="button" data-pv="3d" aria-pressed="true">3D</button>
            </div>` : ''}
            <div class="atl-plate-art">${PLATES[id] || ''}</div>
            ${it.model ? `
            <div class="atl-plate-3d">
              <iframe id="atl-plate-iframe" data-src="viewer/instruments.html?i=${esc(it.model)}&amp;embed=1"
                title="Interactive 3D ${esc(it.name)}" loading="lazy" allow="fullscreen"></iframe>
              <div class="atl-plate-3d-fail">The 3D viewer is not deployed yet.</div>
            </div>` : ''}
            <div class="atl-plate-cap">
              <div class="no">${esc(fam.name)} family</div>
              <div class="nm">${esc(it.latin)}</div>
              <div class="src atl-cap-2d">Placeholder line art. Final plate to be a public-domain engraving via <a href="https://www.metmuseum.org/hubs/open-access" target="_blank" rel="noopener">The Met (CC0)</a></div>
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
              ${it.demos.map(d => `
                <div class="atl-demo${d.src ? ' is-playable' : ''}"${d.src ? ` data-src="${esc(d.src)}"` : ''}>
                  <button class="atl-play" aria-label="Play ${esc(d.label)}"${d.src ? '' : ' aria-disabled="true"'}>
                    <svg class="ico-play" width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg>
                    <svg class="ico-pause" width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true"><rect x="0" y="0" width="4" height="14" rx="1"/><rect x="8" y="0" width="4" height="14" rx="1"/></svg>
                  </button>
                  <div class="atl-demo-meta"><b>${esc(d.label)}</b><span>${esc(d.note)}</span></div>
                  <div class="atl-wave">${bars(22)}</div>
                  <span class="atl-demo-dur">${esc(d.dur)}</span>
                </div>`).join('')}
              ${it.demos.some(d => d.src) ? '' :
                `<div class="atl-demo-note" id="atl-audio-note">Audio connects in the next build. Layout only for now.</div>`}
            </div>
          </div>
        </section>
      </div>

      <!-- TIMBRE -->
      <div class="atl-panel" data-panel="timbre">
        <div class="atl-timbre-head">
          <div>
            <h3 class="atl-blockhead">Range and tone colour, against the orchestra</h3>
            <p class="atl-timbre-lede">Horizontal is pitch. Vertical is brightness of tone colour: dark and
              covered at the bottom, bright and penetrating at the top. Every instrument in the collection is
              plotted, because the useful question is never how ${esc(it.name.toLowerCase())} sounds on its own,
              but what it sits next to.</p>
          </div>
          <div class="atl-timbre-stats">
            <div><span>Sounding range</span><b id="atl-t-range">–</b></div>
            <div><span>Span</span><b id="atl-t-span">–</b></div>
            <div><span>Brightness rank</span><b id="atl-t-rank">–</b></div>
          </div>
        </div>
        <div class="atl-timbre-chart"><svg id="atl-timbre-svg" role="img"
          aria-label="Range and timbre of every instrument, with ${esc(it.name)} highlighted"></svg></div>
        <div class="atl-timbre-key">
          <span><i style="background:#D4A04A"></i>${esc(it.name)}</span>
          ${FAMILIES.map(f => `<span><i style="background:${FAM_COLOR[f.id]};opacity:.6"></i>${esc(f.name)}</span>`).join('')}
        </div>
      </div>

      <!-- DETAILS -->
      <div class="atl-panel" data-panel="details">
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
            <h3 style="margin-top:34px">Blends well with</h3>
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
          <div class="atl-block">
            <h3>Limits &amp; common mistakes</h3>
            <ul class="atl-list atl-warn">${it.limits.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
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
                <span class="why">${esc(g.why)}</span>
                <span class="cred">${esc(g.chan)} · <a href="https://www.youtube.com/watch?v=${esc(g.v)}" target="_blank" rel="noopener">Watch on YouTube</a></span>
              </div>
            </div>`).join('')}
        </div>
        <p class="atl-gallery-note">Videos are embedded through YouTube's own player and remain hosted on the rights holders' channels, and nothing is copied or re-uploaded. Each card credits the performing orchestra, conductor and uploading channel, and links back to the source. Placeholder set for now; each instrument gets its own selection.</p>
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
   RANGE & TIMBRE MAP. Full page, on the instrument's Timbre tab.
   Horizontal axis is pitch, vertical axis is brightness of tone colour. Every
   instrument in the collection is plotted, so the point of the chart is the
   comparison: where this instrument sits relative to everything around it.
   ============================================================================ */
/* family colours, following the convention of printed orchestra seating charts:
   strings violet, woodwinds green, brass blue, percussion amber. Gold is reserved
   for the instrument you are reading, so no family uses it. */
/* The timbre chart's palette, which is not the dock's: see STUDIO_FAM in
   atlas-data.js for why the two are deliberately different. */
const FAM_COLOR = {
  strings:'#9B8FD4', woodwinds:'#5FB89A', brass:'#6C9BD8', percussion:'#C9834F'
};

function renderTimbre(id){
  const svg = document.getElementById('atl-timbre-svg');
  if(!svg) return;
  const it = INSTRUMENTS[id], fam = it.family;
  const W = 1000, H = 470, L = 54, R = 26, T = 36, B = 54;
  const px = m => L + (m - PITCH_LO) / (PITCH_HI - PITCH_LO) * (W - L - R);
  const py = t => (H - B) - t * (H - B - T);

  let grid = '';
  [24,36,48,60,72,84,96,108].forEach(m => {
    const x = px(m).toFixed(1);
    grid += `<line x1="${x}" y1="${T-12}" x2="${x}" y2="${H-B}" stroke="#fff"
      stroke-opacity="${m===60?'.13':'.05'}" stroke-width="1"/>
      <text x="${x}" y="${H-B+22}" fill="${m===60?'#9A9CA4':'#4E505A'}" font-size="11"
      font-family="DM Sans,sans-serif" text-anchor="middle" letter-spacing=".6">${midiName(m)}</text>`;
  });
  [0,.25,.5,.75,1].forEach(t => {
    grid += `<line x1="${L}" y1="${py(t).toFixed(1)}" x2="${W-R}" y2="${py(t).toFixed(1)}"
      stroke="#fff" stroke-opacity=".035" stroke-width="1"/>`;
  });

  /* ---- lay out every instrument, then resolve label collisions ---- */
  const items = Object.keys(INSTRUMENTS).map(k => {
    const o = INSTRUMENTS[k];
    return { k, o, sel:k === id, y:py(o.timbre), x0:px(o.range.lo), x1:px(o.range.hi) };
  });

  /* labels sit to the right of the line, unless that would run off the plot */
  items.forEach(d => {
    d.right = d.x1 < W - R - 96;
    d.lx = d.right ? d.x1 + 9 : d.x0 - 9;
    d.ly = d.y + 3.5;
  });

  /* push overlapping labels apart, per side, keeping them near their line */
  [true,false].forEach(side => {
    const col = items.filter(d => d.right === side).sort((m,n) => m.ly - n.ly);
    const MIN = 13.5;
    for(let i = 1; i < col.length; i++){
      if(col[i].ly - col[i-1].ly < MIN) col[i].ly = col[i-1].ly + MIN;
    }
    /* if the stack ran past the bottom, walk it back up */
    for(let i = col.length - 1; i > 0; i--){
      if(col[i].ly > H - B - 4) col[i].ly = H - B - 4;
      if(col[i].ly - col[i-1].ly < MIN) col[i-1].ly = col[i].ly - MIN;
    }
  });

  /* dimmest first so the selected instrument always draws on top */
  items.sort((m,n) => (m.sel ? 1 : 0) - (n.sel ? 1 : 0));

  const body = items.map(d => {
    const col = d.sel ? '#D4A04A' : FAM_COLOR[d.o.family];
    const lineOp = d.sel ? 1 : 0.5;
    const textOp = d.sel ? 1 : 0.78;
    /* a leader line when the label had to be nudged away from its bar */
    const drift = Math.abs(d.ly - (d.y + 3.5)) > 2.5
      ? `<line x1="${(d.right ? d.x1 + 3 : d.x0 - 3).toFixed(1)}" y1="${d.y.toFixed(1)}"
           x2="${(d.right ? d.lx - 2 : d.lx + 2).toFixed(1)}" y2="${(d.ly - 3.5).toFixed(1)}"
           stroke="${col}" stroke-opacity=".3" stroke-width="1"/>` : '';
    return `<g>
      <line x1="${d.x0.toFixed(1)}" y1="${d.y.toFixed(1)}" x2="${d.x1.toFixed(1)}" y2="${d.y.toFixed(1)}"
        stroke="${col}" stroke-opacity="${lineOp}" stroke-width="${d.sel?5:3}" stroke-linecap="round"/>
      ${drift}
      <text x="${d.lx.toFixed(1)}" y="${d.ly.toFixed(1)}" fill="${d.sel ? '#fff' : col}"
        fill-opacity="${textOp}" font-size="${d.sel?13:10.5}" font-family="DM Sans,sans-serif"
        font-weight="${d.sel?600:400}" text-anchor="${d.right?'start':'end'}">${esc(d.o.name)}</text>
    </g>`;
  }).join('');

  const axes = `<text x="${L}" y="${T-18}" fill="#7E808A" font-size="10" font-weight="700"
      font-family="DM Sans,sans-serif" letter-spacing="2">BRIGHT</text>
    <text x="${L}" y="${H-B-6}" fill="#7E808A" font-size="10" font-weight="700"
      font-family="DM Sans,sans-serif" letter-spacing="2">DARK</text>`;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = grid + body + axes;

  const brighter = Object.keys(INSTRUMENTS).filter(k => INSTRUMENTS[k].timbre > it.timbre).length;
  const total = Object.keys(INSTRUMENTS).length;
  const setTxt = (el,v) => { const n = document.getElementById(el); if(n) n.textContent = v; };
  setTxt('atl-t-range', `${midiName(it.range.lo)} – ${midiName(it.range.hi)}`);
  setTxt('atl-t-span', `${it.range.hi - it.range.lo} semitones`);
  setTxt('atl-t-rank', `${brighter + 1} of ${total}`);
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
  /* the demo rows the player was pointing at have just been destroyed */
  if(typeof stopDemo === 'function') stopDemo();
}

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
  a.addEventListener('timeupdate', paintWave);
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

/* light the waveform bars up to the current position, touching the DOM only
   when the number of lit bars actually changes */
function paintWave(){
  const a = PLAYER.el, row = PLAYER.row;
  if(!a || !row || !isFinite(a.duration) || !a.duration) return;
  const bars = row.querySelectorAll('.atl-wave i');
  const n = Math.round((a.currentTime / a.duration) * bars.length);
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
  }
  PLAYER.row = null;
  PLAYER.lit = -1;
}

function playDemo(row){
  const src = row.dataset.src;
  if(!src) return;
  const a = demoAudio();
  if(PLAYER.row === row && !a.paused){ a.pause(); row.classList.remove('is-playing'); return; }
  if(PLAYER.row === row && a.paused && a.currentTime > 0){
    row.classList.add('is-playing');
    a.play().catch(() => {});
    return;
  }
  stopDemo();
  PLAYER.row = row;
  row.classList.remove('is-missing');
  a.src = src;
  row.classList.add('is-playing');
  a.play().catch(() => { row.classList.remove('is-playing'); row.classList.add('is-missing'); });
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.atl-play');
  if(!btn) return;
  const row = btn.closest('.atl-demo');
  if(!row) return;
  if(row.dataset.src){ playDemo(row); return; }
  const note = document.getElementById('atl-audio-note');
  if(note){ note.textContent = 'Audio connects in the next build. This button will play the clip.'; note.style.color = '#D4A04A'; }
});

const nav = document.getElementById('atl-nav');
window.addEventListener('scroll', () => nav.classList.toggle('is-stuck', window.scrollY > 20), {passive:true});

route((!IN_FRAME && location.hash.slice(1)) || '/');
