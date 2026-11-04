/* ============================================================================
   EVENANT · LISTEN GRID
   ----------------------------------------------------------------------------
   A grid of real recordings, each starting at the passage that makes the point.
   The Instrument Atlas's gallery, generalised: same card, plus a start time, a
   verification flag and an author mode for setting both by ear.

   ONE GLOBAL. EvListen.render(host, items, opts) returns { destroy }.

   NOTHING REACHES YOUTUBE UNTIL A CLICK. The card shows i.ytimg.com's
   thumbnail — one image, no script, no cookie — and swaps in the player only
   when someone asks for it. Outside author mode the player is a plain
   youtube-nocookie iframe; in author mode it is the IFrame API, because
   setting a start time means asking the player where it is.

   opts
     author   bool    show unverified and no-video cards, and the editing tools
     onPlay   fn()    called just before any video starts — the host stops its
                      own transport here, so two things never sound at once
     label    string  what the "Why it's …" link is about, e.g. 'Lydian'
     group    string  which key of `store` these items are, e.g. 'lydian'
     store    object  the whole data object, for Copy data (author only)
     name     string  the const name Copy data writes, default 'LISTEN'
     empty    string  what to say when there is nothing to show
     note     string  a footnote under the grid
     draftKey string  localStorage key for author edits

   AUTHOR EDITS ARE A DRAFT, NOT A SAVE. They live in memory and in
   localStorage; Copy data turns them into listen.js source to paste back. The
   page never writes to the repo and never posts anywhere.
   ============================================================================ */

const EvListen = (() => {

  const DRAFT_KEY = 'evenant-listen-draft';
  const THUMB = id => 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
  const WATCH = id => 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);

  const KIND  = { film:'Film', tv:'TV', game:'Game', concert:'Concert', song:'Song' };
  const FOCUS = { melody:'Melody', harmony:'Harmony', both:'Both' };

  const esc = s => String(s == null ? '' : s)
    .replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* m:ss, the way a person reads a timestamp off a player. */
  function clock(sec){
    const n = Math.max(0, Math.round(Number(sec) || 0));
    return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
  }

  /* A pasted YouTube URL in any of its shapes, or a bare 11-character id. */
  function videoId(text){
    const s = String(text || '').trim();
    if(!s) return null;
    if(/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  /* ---------------------------------------------------------- the draft --- */
  /* try/catch everywhere: localStorage throws in a private window and comes
     back empty after a clear, and neither is a reason for the page to break. */
  function readDraft(key){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : {}; }
    catch(_){ return {}; }
  }
  function writeDraft(key, data){
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(_){}
  }
  function clearDraft(key){ try { localStorage.removeItem(key); } catch(_){} }

  /* ------------------------------------------------- the IFrame API ------- */
  /* Author mode only. One script tag for the whole page however many grids
     ask for it, and the API's single global callback fans out to all of them. */
  let apiState = 'none';
  const apiWaiting = [];
  function youtubeApi(){
    return new Promise(resolve => {
      if(apiState === 'ready') return resolve(window.YT);
      apiWaiting.push(resolve);
      if(apiState === 'loading') return;
      apiState = 'loading';
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        apiState = 'ready';
        if(typeof prev === 'function') try { prev(); } catch(_){}
        while(apiWaiting.length) apiWaiting.shift()(window.YT);
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      document.head.appendChild(s);
    });
  }

  /* --------------------------------------------------- Copy data ---------- */
  /* Writes the object back as listen.js source. One line per field group, in
     the order the data file has them, so a paste is a small diff rather than a
     reshuffle of the whole file. */
  const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  const val = v => v == null ? 'null' : typeof v === 'number' ? String(v)
                 : typeof v === 'boolean' ? String(v) : q(v);

  function source(store, name){
    const groups = Object.keys(store).map(key => {
      const rows = store[key].map(it =>
        "    { id: " + q(it.id) + ", title: " + q(it.title) + ", composer: " + q(it.composer) + ",\n" +
        "      source: " + q(it.source) + ", year: " + val(it.year) + ", kind: " + q(it.kind) +
          ", focus: " + q(it.focus) + ",\n" +
        "      listen: " + q(it.listen) + ",\n" +
        "      strength: " + q(it.strength) + ", why: " + val(it.why) + ",\n" +
        "      yt: " + val(it.yt) + ", start: " + val(it.start) + ", end: " + val(it.end) +
          ", official: " + val(it.official) + ", verified: " + val(it.verified) + " }"
      ).join(',\n');
      return '  ' + key + ': [\n' + rows + '\n  ]';
    }).join(',\n\n');
    return 'const ' + (name || 'LISTEN') + ' = {\n' + groups + '\n};\n';
  }

  /* ============================================================ render ==== */
  function render(host, items, opts){
    if(!host) return { destroy(){} };
    const o = opts || {};
    const author = !!o.author;
    const key = o.draftKey || DRAFT_KEY;
    const group = o.group || 'default';
    const name = o.name || 'LISTEN';

    /* The draft overlays the data rather than replacing it, so a field the
       author has not touched still tracks whatever the data file says. */
    const draft = author ? readDraft(key) : {};
    const patch = id => (draft[group] || {})[id] || {};
    const row = it => ({ ...it, ...patch(it.id) });

    const all = (items || []).map(row);
    const shown = author ? all : all.filter(it => it.verified && it.yt);

    host.classList.add('ev-listen');
    host.replaceChildren();

    let players = [];           /* author mode YT.Player instances */
    let playing = null;         /* the one frame that currently holds a player */
    let alive = true;

    /* ------------------------------------------------- empty state ------- */
    if(!shown.length){
      const p = document.createElement('p');
      p.className = 'evl-empty';
      p.textContent = o.empty || 'Examples coming soon.';
      host.appendChild(p);
      return { destroy(){ alive = false; host.replaceChildren(); } };
    }

    /* ---------------------------------------------- the author bar ------- */
    if(author){
      const bar = document.createElement('div');
      bar.className = 'evl-bar';
      bar.innerHTML =
        '<span class="evl-bar-note">Author mode · ' + shown.length + ' card' +
          (shown.length === 1 ? '' : 's') + ', ' +
          all.filter(it => it.verified).length + ' verified. Edits are a draft in this browser.</span>' +
        '<button class="evl-btn" data-copy type="button">Copy data</button>' +
        '<button class="evl-btn" data-discard type="button">Discard draft</button>';
      bar.querySelector('[data-copy]').addEventListener('click', async e => {
        const merged = {};
        for(const k of Object.keys(o.store || { [group]: items })){
          merged[k] = (o.store ? o.store[k] : items).map(it => ({ ...it, ...((draft[k] || {})[it.id] || {}) }));
        }
        const text = source(merged, name);
        let done = false;
        try { await navigator.clipboard.writeText(text); done = true; } catch(_){}
        if(!done){
          /* No clipboard permission, or an insecure origin. Still hand it over. */
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
          document.body.appendChild(ta); ta.select();
          try { done = document.execCommand('copy'); } catch(_){}
          ta.remove();
          if(!done) console.log(text);
        }
        e.target.textContent = done ? 'Copied' : 'In the console';
        setTimeout(() => { if(alive) e.target.textContent = 'Copy data'; }, 1600);
      });
      bar.querySelector('[data-discard]').addEventListener('click', () => {
        clearDraft(key);
        location.reload();
      });
      host.appendChild(bar);
    }

    /* ------------------------------------------------------ the grid ----- */
    const grid = document.createElement('div');
    grid.className = 'evl-grid';
    host.appendChild(grid);

    /* Stop whatever is playing — another card, or the host's own transport. */
    function stopOthers(except){
      players.forEach(p => { if(p.frame !== except){ try { p.player.pauseVideo(); } catch(_){} } });
      if(playing && playing !== except){
        playing.replaceChildren();
        playing.removeAttribute('data-on');
        paintThumb(playing);
      }
      playing = except || null;
    }

    function paintThumb(frame){
      const id = frame.dataset.yt;
      frame.innerHTML =
        '<img src="' + esc(THUMB(id)) + '" alt="" loading="lazy">' +
        '<span class="evl-disc"><i><svg width="15" height="17" viewBox="0 0 12 14" fill="#0A0C14" ' +
        'aria-hidden="true"><path d="M0 0l12 7-12 7z"/></svg></i></span>';
    }

    function embedUrl(it, api){
      const s = Math.max(0, Math.round(Number(it.start) || 0));
      const p = ['start=' + s, 'rel=0', 'modestbranding=1', 'autoplay=1'];
      if(it.end != null && Number(it.end) > s) p.push('end=' + Math.round(Number(it.end)));
      if(api) p.push('enablejsapi=1', 'origin=' + encodeURIComponent(location.origin));
      return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(it.yt) + '?' + p.join('&');
    }

    async function play(frame, it){
      if(!alive || !it.yt) return;
      if(typeof o.onPlay === 'function') try { o.onPlay(); } catch(_){}
      if(frame.dataset.on === '1') return;
      stopOthers(frame);
      frame.dataset.on = '1';

      if(!author){
        frame.innerHTML = '<iframe src="' + esc(embedUrl(it, false)) + '" title="' + esc(it.title) +
          '" allow="autoplay; encrypted-media; fullscreen" allowfullscreen loading="lazy"></iframe>';
        return;
      }

      /* Author mode: the API player, so Set start can ask where we are. */
      const mount = document.createElement('div');
      frame.replaceChildren(mount);
      const YT = await youtubeApi();
      if(!alive || frame.dataset.on !== '1') return;
      const player = new YT.Player(mount, {
        videoId: it.yt,
        playerVars: {
          start: Math.max(0, Math.round(Number(it.start) || 0)),
          ...(it.end != null ? { end: Math.round(Number(it.end)) } : {}),
          rel: 0, modestbranding: 1, autoplay: 1
        },
        host: 'https://www.youtube-nocookie.com'
      });
      players.push({ frame, player, id: it.id });
    }

    /* ------------------------------------------------------ the cards ---- */
    for(const it of shown){
      const card = document.createElement('div');
      card.className = 'evl-card';
      card.dataset.id = it.id;

      const by = [it.composer, it.source, it.year].filter(Boolean).join(' · ');
      const start = Math.max(0, Math.round(Number(it.start) || 0));

      card.innerHTML =
        (it.yt
          ? '<button class="evl-frame" type="button" data-yt="' + esc(it.yt) + '" aria-label="Play ' +
              esc(it.title) + '"></button>'
          : '<div class="evl-frame" data-empty>No video yet</div>') +
        '<div class="evl-meta">' +
          '<b class="evl-title">' + esc(it.title) + '</b>' +
          '<span class="evl-by">' + esc(by) + '</span>' +
          '<span class="evl-chips">' +
            '<span class="evl-chip">' + esc(KIND[it.kind] || it.kind || '') + '</span>' +
            '<span class="evl-chip" data-focus>' + esc(FOCUS[it.focus] || it.focus || '') + '</span>' +
            (author && !it.verified ? '<span class="evl-chip" data-flag="unverified">Unverified</span>' : '') +
            (author && !it.yt ? '<span class="evl-chip" data-flag="novideo">No video</span>' : '') +
          '</span>' +
          '<span class="evl-listen">' + esc(it.listen) + '</span>' +
          (it.why ? '<a class="evl-why" href="' + esc(it.why) + '" target="_blank" rel="noopener noreferrer">' +
            'Why it&rsquo;s ' + esc(o.label || 'this mode') + '</a>' : '') +
          '<span class="evl-go">' +
            (it.yt
              ? '<button class="evl-play" type="button" data-play>' +
                  '<svg width="9" height="11" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">' +
                  '<path d="M0 0l12 7-12 7z"/></svg>' +
                  (start ? 'Play from ' + clock(start) : 'Play') +
                '</button>' +
                '<span class="evl-src"><a href="' + esc(WATCH(it.yt)) + '" target="_blank" ' +
                  'rel="noopener noreferrer">YouTube</a></span>'
              : '') +
          '</span>' +
        '</div>';

      const frame = card.querySelector('.evl-frame');
      if(it.yt){
        paintThumb(frame);
        const go = () => play(frame, it);
        frame.addEventListener('click', go);
        card.querySelector('[data-play]').addEventListener('click', go);
      }

      if(author) authorTools(card, it);
      grid.appendChild(card);
    }

    /* ------------------------------------------------ author editing ----- */
    function authorTools(card, it){
      const tools = document.createElement('div');
      tools.className = 'evl-edit';
      tools.innerHTML =
        '<span class="evl-times" data-times></span>' +
        '<button class="evl-btn" type="button" data-set="start">Set start</button>' +
        '<button class="evl-btn" type="button" data-nudge="-1">&minus;1 s</button>' +
        '<button class="evl-btn" type="button" data-nudge="1">+1 s</button>' +
        '<button class="evl-btn" type="button" data-set="end">Set end</button>' +
        '<button class="evl-btn" type="button" data-clear="end">Clear end</button>' +
        '<button class="evl-btn" type="button" data-verify title="Toggles. A verified card is ' +
          'the only kind a reader sees.">Mark verified</button>' +
        '<input type="text" data-url placeholder="YouTube URL or id" spellcheck="false">';
      card.querySelector('.evl-meta').appendChild(tools);

      const times = tools.querySelector('[data-times]');
      const verify = tools.querySelector('[data-verify]');

      const paint = () => {
        times.innerHTML = 'start <b>' + (it.start == null ? '—' : clock(it.start) + ' (' + it.start + 's)') +
          '</b> · end <b>' + (it.end == null ? '—' : clock(it.end) + ' (' + it.end + 's)') +
          '</b> · ' + (it.verified ? 'verified' : 'unverified') +
          (it.yt ? ' · ' + it.yt : ' · no video');
        verify.textContent = it.verified ? 'Verified' : 'Mark verified';
        if(it.verified) verify.setAttribute('data-on', '1'); else verify.removeAttribute('data-on');
        const btn = card.querySelector('[data-play]');
        if(btn) btn.lastChild.textContent = it.start ? 'Play from ' + clock(it.start) : 'Play';
      };

      const save = change => {
        Object.assign(it, change);
        draft[group] = draft[group] || {};
        draft[group][it.id] = { ...(draft[group][it.id] || {}), ...change };
        writeDraft(key, draft);
        paint();
      };

      const now = () => {
        const p = players.find(x => x.id === it.id);
        if(!p) return null;
        try { return Math.round(p.player.getCurrentTime()); } catch(_){ return null; }
      };

      tools.addEventListener('click', e => {
        const b = e.target.closest('button');
        if(!b) return;
        if(b.dataset.set){
          const t = now();
          if(t == null){ times.textContent = 'Play the card first, then set a time.'; return; }
          save({ [b.dataset.set]: t });
        }
        else if(b.dataset.nudge){
          save({ start: Math.max(0, (Number(it.start) || 0) + Number(b.dataset.nudge)) });
        }
        else if(b.dataset.clear){ save({ end: null }); }
        else if(b.hasAttribute('data-verify')){ save({ verified: !it.verified }); }
      });

      const url = tools.querySelector('[data-url]');
      const take = () => {
        const id = videoId(url.value);
        if(!id){ url.value = ''; return; }
        save({ yt: id });
        url.value = '';
        location.hash = location.hash;   /* the frame is rebuilt on the next render */
        const frame = card.querySelector('.evl-frame');
        if(frame){
          frame.removeAttribute('data-empty');
          frame.dataset.yt = id;
          frame.removeAttribute('data-on');
          paintThumb(frame);
        }
      };
      url.addEventListener('change', take);
      url.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); take(); } });

      paint();
    }

    /* ------------------------------------------------------ the note ----- */
    if(o.note){
      const p = document.createElement('p');
      p.className = 'evl-note';
      p.textContent = o.note;
      host.appendChild(p);
    }

    return {
      destroy(){
        alive = false;
        players.forEach(p => { try { p.player.destroy(); } catch(_){} });
        players = [];
        playing = null;
        host.replaceChildren();
        host.classList.remove('ev-listen');
      }
    };
  }

  return { render, clock, videoId, source, DRAFT_KEY };
})();
