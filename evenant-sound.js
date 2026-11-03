/* ============================================================================
   EVENANT · SOUND
   ----------------------------------------------------------------------------
   The Voicing Atlas instruments, played on the Accelerator's clock.

   Voicing Atlas has the sounds — seventy-one instruments through smplr — and no
   transport: it plays a progression by working out absolute times in a loop.
   The Accelerator has a sample-accurate transport with looping, tempo, a
   playhead and replace() mid-loop, and nine instruments. Neither needed
   rewriting. They meet at AccelAudio.voices, which this file registers into:
   smplr decides what a note sounds like, the transport decides when it happens.

   ONE CONTEXT. Every instrument is constructed with AccelAudio.ctx() and
   destined for AccelAudio.master, so the transport's volume, pause, stop and
   playhead stay in charge of everything. A second context would be a second
   clock, which is the bug this whole arrangement exists to avoid.

   LOADED LAZILY, FROM A CDN. smplr arrives through a dynamic import() — which
   works from a classic script, so the suite's load order is untouched — and
   its samples come from smplr's own soundfont host. Both are network. When
   either is unreachable the voice falls back to the in-repo bank of the same
   family and says so, which is also what makes this work offline and in a
   test runner.

   Pinned to smplr 0.16.4, the version Voicing Atlas ships.
   ============================================================================ */

const EvSound = (() => {

  const SMPLR_URL = 'https://unpkg.com/smplr@0.16.4/dist/index.mjs';

  /* ---------------------------------------------------------------- level ---
     smplr's gain for a note is (volume/127)² × (velocity/127)² — its
     midiVelToGain is vel²/16129. Instruments are built at volume 127, so a
     note asking for linear gain g wants velocity 127·√(g·TRIM).

     TRIM is the one number here that cannot be derived. It is the difference
     in recorded loudness between the FluidR3 soundfonts and this repo's own
     samples — the in-repo path already level-matches itself from each file's
     RMS, and the soundfonts do not — so it has to be heard.

     It ships at 1, which is no trim at all: a neutral starting point that uses
     the whole velocity range rather than a guess that would clip half of it.
     Run EvSound.calibrate() in a browser with network. It plays one note
     through the Voicing Atlas instrument and the same note through this site's
     bank, measures both off the transport's analyser, and reports the factor
     that matches them. Put that number here. */
  let TRIM = 1;

  const velocityFor = gain => {
    const v = 127 * Math.sqrt(Math.max(0, gain) * TRIM);
    if(v > 127 && !velocityFor.warned){ velocityFor.warned = true;
      console.warn('[EvSound] gain ' + gain + ' with trim ' + TRIM + ' clips at full velocity; lower TRIM.'); }
    return Math.max(1, Math.min(127, Math.round(v)));
  };

  /* ---------------------------------------------------- the smplr module ---
     Imported once, on first use. A failure is remembered so a page with no
     network does not retry on every note. */
  let smplr = null, smplrError = null, smplrPending = null;
  function lib(){
    if(smplr) return Promise.resolve(smplr);
    if(smplrError) return Promise.reject(smplrError);
    if(!smplrPending) smplrPending = import(/* webpackIgnore: true */ SMPLR_URL)
      .then(m => (smplr = m))
      .catch(e => { smplrError = e; smplrPending = null; throw e; });
    return smplrPending;
  }

  /* ------------------------------------------------------------ registry ---
     Voicing Atlas's own table, extracted from its index.html rather than
     retyped: the same seventy-one instruments, the same ids, the same
     General MIDI keys, the same categories and the same order. The only
     addition is the first row — VA's SplendidGrandPiano, which VA builds
     as its default rather than listing, and which is the piano anyone who
     has used Voicing Atlas already knows. */
  const INSTRUMENTS = [
    /* Pianos & Keys */
    { id:'splendid',          type:'splendid',   key:'SplendidGrandPiano',                                           name:'Steinway Grand',    category:'pianos',     icon:'🎹' },
    { id:'sf-acoustic',     type:'soundfont',  key:'acoustic_grand_piano',                                            name:'Acoustic Grand',        category:'pianos',      icon:'🎹' },
    { id:'sf-rhodes',       type:'soundfont',  key:'electric_piano_1',                                                name:'Rhodes (EP1)',          category:'pianos',      icon:'🎹' },
    /* Strings */
    { id:'sf-violin',       type:'soundfont',  key:'violin',                                                          name:'Violin',                category:'strings',     icon:'🎻' },
    { id:'sf-viola',        type:'soundfont',  key:'viola',                                                           name:'Viola',                 category:'strings',     icon:'🎻' },
    { id:'sf-cello',        type:'soundfont',  key:'cello',                                                           name:'Cello',                 category:'strings',     icon:'🎻' },
    { id:'sf-contrabass',   type:'soundfont',  key:'contrabass',                                                      name:'Contrabass',            category:'strings',     icon:'🎻' },
    { id:'sf-tremolo',      type:'soundfont',  key:'tremolo_strings',                                                 name:'Tremolo Strings',       category:'strings',     icon:'🎻' },
    { id:'sf-pizzicato',    type:'soundfont',  key:'pizzicato_strings',                                               name:'Pizzicato Strings',     category:'strings',     icon:'🎻' },
    { id:'sf-harp',         type:'soundfont',  key:'orchestral_harp',                                                 name:'Orchestral Harp',       category:'strings',     icon:'🎻' },
    /* Ensemble & Choir */
    { id:'sf-strings1',     type:'soundfont',  key:'string_ensemble_1',                                               name:'String Ensemble 1',     category:'ensemble',    icon:'🎼' },
    { id:'sf-strings2',     type:'soundfont',  key:'string_ensemble_2',                                               name:'String Ensemble 2',     category:'ensemble',    icon:'🎼' },
    { id:'sf-synthstrings1', type:'soundfont',  key:'synth_strings_1',                                                 name:'Synth Strings 1',       category:'ensemble',    icon:'🎼' },
    { id:'sf-synthstrings2', type:'soundfont',  key:'synth_strings_2',                                                 name:'Synth Strings 2',       category:'ensemble',    icon:'🎼' },
    { id:'sf-choir',        type:'soundfont',  key:'choir_aahs',                                                      name:'Choir Aahs',            category:'ensemble',    icon:'🎼' },
    { id:'sf-voice-oohs',   type:'soundfont',  key:'voice_oohs',                                                      name:'Voice Oohs',            category:'ensemble',    icon:'🎼' },
    /* Brass */
    { id:'sf-trumpet',      type:'soundfont',  key:'trumpet',                                                         name:'Trumpet',               category:'brass',       icon:'🎺' },
    { id:'sf-trombone',     type:'soundfont',  key:'trombone',                                                        name:'Trombone',              category:'brass',       icon:'🎺' },
    { id:'sf-tuba',         type:'soundfont',  key:'tuba',                                                            name:'Tuba',                  category:'brass',       icon:'🎺' },
    { id:'sf-muted-trumpet', type:'soundfont',  key:'muted_trumpet',                                                   name:'Muted Trumpet',         category:'brass',       icon:'🎺' },
    { id:'sf-french-horn',  type:'soundfont',  key:'french_horn',                                                     name:'French Horn',           category:'brass',       icon:'🎺' },
    { id:'sf-synthbrass1',  type:'soundfont',  key:'synth_brass_1',                                                   name:'Synth Brass 1',         category:'brass',       icon:'🎺' },
    { id:'sf-synthbrass2',  type:'soundfont',  key:'synth_brass_2',                                                   name:'Synth Brass 2',         category:'brass',       icon:'🎺' },
    /* Woodwinds */
    { id:'sf-alto-sax',     type:'soundfont',  key:'alto_sax',                                                        name:'Alto Sax',              category:'woodwinds',   icon:'🎷' },
    { id:'sf-tenor-sax',    type:'soundfont',  key:'tenor_sax',                                                       name:'Tenor Sax',             category:'woodwinds',   icon:'🎷' },
    { id:'sf-bari-sax',     type:'soundfont',  key:'baritone_sax',                                                    name:'Baritone Sax',          category:'woodwinds',   icon:'🎷' },
    { id:'sf-oboe',         type:'soundfont',  key:'oboe',                                                            name:'Oboe',                  category:'woodwinds',   icon:'🪈' },
    { id:'sf-english-horn', type:'soundfont',  key:'english_horn',                                                    name:'English Horn',          category:'woodwinds',   icon:'🪈' },
    { id:'sf-bassoon',      type:'soundfont',  key:'bassoon',                                                         name:'Bassoon',               category:'woodwinds',   icon:'🪈' },
    { id:'sf-clarinet',     type:'soundfont',  key:'clarinet',                                                        name:'Clarinet',              category:'woodwinds',   icon:'🪈' },
    { id:'sf-piccolo',      type:'soundfont',  key:'piccolo',                                                         name:'Piccolo',               category:'woodwinds',   icon:'🪈' },
    { id:'sf-flute',        type:'soundfont',  key:'flute',                                                           name:'Flute',                 category:'woodwinds',   icon:'🪈' },
    { id:'sf-recorder',     type:'soundfont',  key:'recorder',                                                        name:'Recorder',              category:'woodwinds',   icon:'🪈' },
    { id:'sf-shakuhachi',   type:'soundfont',  key:'shakuhachi',                                                      name:'Shakuhachi',            category:'woodwinds',   icon:'🪈' },
    { id:'sf-ocarina',      type:'soundfont',  key:'ocarina',                                                         name:'Ocarina',               category:'woodwinds',   icon:'🪈' },
    /* Synth Leads */
    { id:'sf-lead-square',  type:'soundfont',  key:'lead_1_square',                                                   name:'Square Lead',           category:'synth-leads', icon:'🎛️' },
    { id:'sf-lead-saw',     type:'soundfont',  key:'lead_2_sawtooth',                                                 name:'Sawtooth Lead',         category:'synth-leads', icon:'🎛️' },
    { id:'sf-lead-calliope', type:'soundfont',  key:'lead_3_calliope',                                                 name:'Calliope Lead',         category:'synth-leads', icon:'🎛️' },
    { id:'sf-lead-chiff',   type:'soundfont',  key:'lead_4_chiff',                                                    name:'Chiff Lead',            category:'synth-leads', icon:'🎛️' },
    { id:'sf-lead-charang', type:'soundfont',  key:'lead_5_charang',                                                  name:'Charang Lead',          category:'synth-leads', icon:'🎛️' },
    { id:'sf-lead-voice',   type:'soundfont',  key:'lead_6_voice',                                                    name:'Voice Lead',            category:'synth-leads', icon:'🎛️' },
    { id:'sf-lead-fifths',  type:'soundfont',  key:'lead_7_fifths',                                                   name:'Fifths Lead',           category:'synth-leads', icon:'🎛️' },
    { id:'sf-lead-basslead', type:'soundfont',  key:'lead_8_bass_lead',                                                name:'Bass + Lead',           category:'synth-leads', icon:'🎛️' },
    { id:'sf2-supersaw',    type:'sf2',        key:'https://smpldsnds.github.io/soundfonts/supersaw-collection.sf2',  name:'Supersaw',              category:'synth-leads', icon:'🎛️' },
    /* Synth Pads */
    { id:'sf-pad-newage',   type:'soundfont',  key:'pad_1_new_age',                                                   name:'New Age Pad',           category:'synth-pads',  icon:'🌊' },
    { id:'sf-pad-warm',     type:'soundfont',  key:'pad_2_warm',                                                      name:'Warm Pad',              category:'synth-pads',  icon:'🌊' },
    { id:'sf-pad-polysynth', type:'soundfont',  key:'pad_3_polysynth',                                                 name:'Polysynth Pad',         category:'synth-pads',  icon:'🌊' },
    { id:'sf-pad-choir',    type:'soundfont',  key:'pad_4_choir',                                                     name:'Choir Pad',             category:'synth-pads',  icon:'🌊' },
    { id:'sf-pad-bowed',    type:'soundfont',  key:'pad_5_bowed',                                                     name:'Bowed Pad',             category:'synth-pads',  icon:'🌊' },
    { id:'sf-pad-metallic', type:'soundfont',  key:'pad_6_metallic',                                                  name:'Metallic Pad',          category:'synth-pads',  icon:'🌊' },
    { id:'sf-pad-halo',     type:'soundfont',  key:'pad_7_halo',                                                      name:'Halo Pad',              category:'synth-pads',  icon:'🌊' },
    { id:'sf-pad-sweep',    type:'soundfont',  key:'pad_8_sweep',                                                     name:'Sweep Pad',             category:'synth-pads',  icon:'🌊' },
    /* Organs */
    { id:'sf-drawbar',      type:'soundfont',  key:'drawbar_organ',                                                   name:'Drawbar Organ',         category:'organs',      icon:'⛪' },
    { id:'sf-perc-organ',   type:'soundfont',  key:'percussive_organ',                                                name:'Percussive Organ',      category:'organs',      icon:'⛪' },
    { id:'sf-rock-organ',   type:'soundfont',  key:'rock_organ',                                                      name:'Rock Organ',            category:'organs',      icon:'⛪' },
    { id:'sf-church-organ', type:'soundfont',  key:'church_organ',                                                    name:'Church Organ',          category:'organs',      icon:'⛪' },
    { id:'sf-reed-organ',   type:'soundfont',  key:'reed_organ',                                                      name:'Reed Organ',            category:'organs',      icon:'⛪' },
    { id:'sf-accordion',    type:'soundfont',  key:'accordion',                                                       name:'Accordion',             category:'organs',      icon:'⛪' },
    { id:'sf-harmonica',    type:'soundfont',  key:'harmonica',                                                       name:'Harmonica',             category:'organs',      icon:'⛪' },
    /* Mellotron */
    { id:'mel-mk2flute',    type:'mellotron',  key:'MK2Flute',                                                        name:'Mellotron Flute',       category:'mellotron',   icon:'📼' },
    { id:'mel-mk2violins',  type:'mellotron',  key:'MK2Violins',                                                      name:'Mellotron Violins',     category:'mellotron',   icon:'📼' },
    { id:'mel-mk2cello',    type:'mellotron',  key:'MK2Cello',                                                        name:'Mellotron Cello',       category:'mellotron',   icon:'📼' },
    { id:'mel-m300a',       type:'mellotron',  key:'M300A',                                                           name:'Mellotron M300A',       category:'mellotron',   icon:'📼' },
    { id:'mel-m300b',       type:'mellotron',  key:'M300B',                                                           name:'Mellotron M300B',       category:'mellotron',   icon:'📼' },
    /* World & Ethnic */
    { id:'sf-sitar',        type:'soundfont',  key:'sitar',                                                           name:'Sitar',                 category:'world',       icon:'🌍' },
    { id:'sf-banjo',        type:'soundfont',  key:'banjo',                                                           name:'Banjo',                 category:'world',       icon:'🌍' },
    { id:'sf-shamisen',     type:'soundfont',  key:'shamisen',                                                        name:'Shamisen',              category:'world',       icon:'🌍' },
    { id:'sf-koto',         type:'soundfont',  key:'koto',                                                            name:'Koto',                  category:'world',       icon:'🌍' },
    { id:'sf-bagpipe',      type:'soundfont',  key:'bag_pipe',                                                        name:'Bagpipe',               category:'world',       icon:'🌍' },
    { id:'sf-fiddle',       type:'soundfont',  key:'fiddle',                                                          name:'Fiddle',                category:'world',       icon:'🌍' },
    { id:'sf-shanai',       type:'soundfont',  key:'shanai',                                                          name:'Shanai',                category:'world',       icon:'🌍' },
    { id:'sf-taiko',        type:'soundfont',  key:'taiko_drum',                                                      name:'Taiko Drum',            category:'world',       icon:'🌍' },  ];

  const CATEGORIES = [
    { id:'pianos',       name:'Pianos & Keys',       icon:'🎹' },
    { id:'strings',      name:'Strings',             icon:'🎻' },
    { id:'ensemble',     name:'Ensemble & Choir',    icon:'🎼' },
    { id:'brass',        name:'Brass',               icon:'🎺' },
    { id:'woodwinds',    name:'Woodwinds',           icon:'🪈' },
    { id:'synth-leads',  name:'Synth Leads',         icon:'🎛️' },
    { id:'synth-pads',   name:'Synth Pads',          icon:'🌊' },
    { id:'organs',       name:'Organs',              icon:'⛪' },
    { id:'mellotron',    name:'Mellotron',           icon:'📼' },
    { id:'world',        name:'World & Ethnic',      icon:'🌍' },  ];

  /* ------------------------------------------------------------ fallbacks ---
     When the CDN cannot be reached, a voice plays on the in-repo bank closest
     to it. Those are the nine instruments in accelerator/audio/, which ship
     with the site and need no network. Nothing matches a mellotron, so the
     whole category falls back to the piano and the read-out says so. */
  const FALLBACK = {
    pianos:'piano', strings:'violin', ensemble:'violin', brass:'horn',
    woodwinds:'flute', 'synth-leads':'piano', 'synth-pads':'violin',
    organs:'piano', mellotron:'piano', world:'piano'
  };
  const fallbackFor = entry => {
    if(!entry) return 'piano';
    /* lower-cased, because the mellotron keys are written MK2Flute and
       MK2Violins and would otherwise all land on the piano */
    const k = String(entry.key).toLowerCase() + ' ' + String(entry.name).toLowerCase();
    if(/cello|contrabass|bassoon/.test(k)) return 'cello';
    if(/viola/.test(k)) return 'viola';
    if(/oboe|english_horn|english horn/.test(k)) return 'oboe';
    if(/clarinet/.test(k)) return 'clarinet';
    if(/trumpet/.test(k)) return 'trumpet';
    if(/horn/.test(k)) return 'horn';
    if(/violin|fiddle|string/.test(k)) return 'violin';
    if(/flute|piccolo|recorder/.test(k)) return 'flute';
    return FALLBACK[entry.category] || 'piano';
  };

  const byId = {}; INSTRUMENTS.forEach(i => { byId[i.id] = i; });
  const VOICE = id => 'va:' + id;                 // the id the transport knows
  const entryOf = voiceId => byId[String(voiceId).replace(/^va:/, '')] || null;

  /* ------------------------------------------------------------- building ---
     Voicing Atlas's loadInstrumentByEntry, as a constructor: the same classes
     for the same entry types, at the same volume, with the same reverb send. */
  async function build(entry, ctx, destination){
    const S = await lib();
    const common = { volume: 127, destination };
    let inst;
    switch(entry.type){
      case 'splendid':  inst = new S.SplendidGrandPiano(ctx, { volume: 95, destination }); break;
      case 'electric':  inst = new S.ElectricPiano(ctx, { instrument: entry.key, ...common }); break;
      case 'sf2':       inst = new S.Soundfont2Sampler(ctx, { url: entry.key, destination }); break;
      case 'mellotron': inst = new S.Mellotron(ctx, { instrument: entry.key, ...common }); break;
      case 'mallet':    inst = new S.Mallet(ctx, { instrument: entry.key, ...common }); break;
      default:          inst = new S.Soundfont(ctx, { instrument: entry.key, ...common });
    }
    await inst.load;
    /* VA's send, at VA's mix */
    try { inst.output.addEffect('reverb', new S.Reverb(ctx), 0.15); } catch(_){}
    return inst;
  }

  /* --------------------------------------------------------------- voices ---
     One per instrument. The transport calls load() once, start() per note and
     stopAll() whenever it pauses or stops.

     A voice that cannot load does not fail the phrase: it keeps a note of why
     and plays the in-repo bank instead, so a lesson still makes a sound on a
     train. `status` is what the read-out shows. */
  const status = new Map();          // voice id -> 'loading' | 'ready' | 'fallback'
  const reasons = new Map();
  const live = new Map();            // voice id -> smplr instrument

  function register(target){
    const audio = target || (typeof AccelAudio !== 'undefined' ? AccelAudio : null);
    if(!audio || !audio.voices) return 0;
    INSTRUMENTS.forEach(entry => {
      const id = VOICE(entry.id);
      audio.voices.register(id, {
        async load(ctx, destination){
          status.set(id, 'loading');
          try {
            const inst = await build(entry, ctx, destination);
            live.set(id, inst); status.set(id, 'ready'); reasons.delete(id);
            return inst;
          } catch(e){
            status.set(id, 'fallback');
            reasons.set(id, navigator.onLine === false
              ? 'Offline, so ' + entry.name + ' is standing in as the ' + fallbackFor(entry) + ' from this site.'
              : entry.name + ' could not be fetched, so the ' + fallbackFor(entry) + ' from this site is standing in.');
            return null;              // resolve: a missing instrument is not a broken phrase
          }
        },
        start(note){
          const inst = live.get(id);
          if(!inst) return null;      // fell back; the transport's own path plays it
          return inst.start({
            note: note.m, time: note.time, duration: note.dur,
            velocity: velocityFor(note.gain)
          });
        },
        stopAll(){ const inst = live.get(id); if(inst) try { inst.stop(); } catch(_){} }
      });
    });
    return INSTRUMENTS.length;
  }

  /* An event array with its instrument resolved: a VA voice where one loaded,
     the in-repo bank where it did not. Widgets call this instead of writing the
     instrument name themselves, so the fallback is automatic. */
  function voice(id){
    if(!id || id === 'synth') return { instrument: id || 'piano', fallback: false, note: '' };
    const entry = entryOf(id);
    if(!entry) return { instrument: id, fallback: false, note: '' };
    const vid = VOICE(entry.id);
    const fell = status.get(vid) === 'fallback';
    return {
      instrument: fell ? fallbackFor(entry) : vid,
      fallback: fell, note: fell ? (reasons.get(vid) || '') : '',
      name: entry.name
    };
  }
  const apply = (events, id) => {
    const v = voice(id);
    return (events || []).map(e => ({ ...e, instrument: e.instrument === 'synth' ? 'synth' : v.instrument }));
  };

  /* ------------------------------------------------------------- the pick ---
     A select, grouped the way Voicing Atlas groups them, with this site's own
     banks at the bottom under Offline. The choice is remembered. */
  const KEY = 'evenant-instrument';
  const OFFLINE = [
    { id:'piano', name:'Piano' }, { id:'violin', name:'Violin' }, { id:'viola', name:'Viola' },
    { id:'cello', name:'Cello' }, { id:'flute', name:'Flute' }, { id:'oboe', name:'Oboe' },
    { id:'clarinet', name:'Clarinet' }, { id:'horn', name:'Horn' }, { id:'trumpet', name:'Trumpet' }
  ];
  const remembered = () => { try { return localStorage.getItem(KEY) || 'splendid'; } catch(_){ return 'splendid'; } };
  const remember = id => { try { localStorage.setItem(KEY, id); } catch(_){} };

  function options(){
    const out = [];
    CATEGORIES.forEach(c => {
      const members = INSTRUMENTS.filter(i => i.category === c.id);
      if(members.length) out.push({ group: c.name, items: members.map(i => ({ value: i.id, label: i.name })) });
    });
    out.push({ group: 'Offline · from this site', items: OFFLINE.map(i => ({ value: i.id, label: i.name })) });
    return out;
  }

  /* A <select> built into `host`, grouped, remembering its choice. */
  function picker(host, value, onchange){
    const label = document.createElement('label');
    label.className = 'ac-field';
    label.append(document.createTextNode('Instrument'));
    const sel = document.createElement('select');
    options().forEach(g => {
      const og = document.createElement('optgroup'); og.label = g.group;
      g.items.forEach(it => { const o = document.createElement('option'); o.value = it.value; o.textContent = it.label; og.append(o); });
      sel.append(og);
    });
    sel.value = value || remembered();
    if(!sel.value) sel.value = 'splendid';
    sel.onchange = () => { remember(sel.value); onchange(sel.value); };
    label.append(sel);
    host.append(label);
    return sel;
  }

  /* ----------------------------------------------------------- calibration ---
     Plays one note through the Voicing Atlas instrument and the same note
     through this site's bank, measures both off the transport's analyser, and
     reports the TRIM that would match them. Needs network and a gesture. Run it
     once, read the number, put it in TRIM above. */
  async function calibrate(id, midi){
    const A = typeof AccelAudio !== 'undefined' ? AccelAudio : null;
    if(!A) throw Error('AccelAudio is not on this page.');
    const m = midi || 60, entry = entryOf(id || 'splendid');
    const peak = async instrument => {
      const t = await A.preview([{ m, s:0, d:1.5, instrument, gain:.5 }], 60, 2);
      let best = 0;
      for(let i = 0; i < 90; i++){
        await new Promise(r => setTimeout(r, 20));
        const bins = A.spectrum(); if(!bins) continue;
        let sum = 0; for(const b of bins) sum += b * b;
        best = Math.max(best, Math.sqrt(sum / bins.length));
      }
      t.stop();
      return best;
    };
    const va = await peak(VOICE(entry.id));
    const here = await peak(fallbackFor(entry));
    const factor = va > 0 ? TRIM * (here / va) ** 2 : null;
    return { va, here, trim: TRIM, suggested: factor && Math.round(factor * 100) / 100 };
  }

  return {
    INSTRUMENTS, CATEGORIES, OFFLINE, SMPLR_URL,
    register, voice, apply, options, picker, calibrate,
    velocityFor, entryOf, fallbackFor,
    id: VOICE,
    status: id => status.get(VOICE(String(id).replace(/^va:/, ''))) || 'idle',
    reason: id => reasons.get(VOICE(String(id).replace(/^va:/, ''))) || '',
    remembered, remember,
    get trim(){ return TRIM; }, set trim(v){ TRIM = Number(v) || TRIM; }
  };
})();

if(typeof module !== 'undefined' && module.exports) module.exports = EvSound;
