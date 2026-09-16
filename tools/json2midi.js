#!/usr/bin/env node
/* ============================================================================
   json2midi — note data back out to a .mid
   ----------------------------------------------------------------------------
   HANDOFF §6 describes tools/midi2json.py, which turns a DAW export into the
   `notes` arrays the studio dock and the score view draw from. That script is
   not in this repository and neither is a single .mid — not in the working
   tree and not anywhere in the history. The MIDI for both the studio passage
   and Valley Sunrise lived in the DAW projects and never came with them.

   What did come with them is the note data itself, which is lossless for
   pitch, position and length. This goes the other way: PASSAGES or a
   score.json back to a standard MIDI file you can drop into a session.

   What it recovers exactly:  pitch, start, length, tempo, time signature.
   What it cannot recover:    velocity, CC, articulation keyswitches, and any
                              tempo change after the first — the JSON never
                              held them. Every note is written at one velocity.

   Usage
     node tools/json2midi.js theme-1                       -> theme-1.mid
     node tools/json2midi.js theme-1 -o phrase.mid
     node tools/json2midi.js --score valley-sunrise-app/score.json
     node tools/json2midi.js theme-1 --list                 (print, write nothing)

   No dependencies: it writes the bytes.
   ============================================================================ */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const PPQ = 480;
const VELOCITY = 80;

/* ---- the smallest MIDI writer that is still correct ---- */
const vlq = n => {
  const out = [n & 0x7f];
  n >>>= 7;
  while(n > 0){ out.unshift((n & 0x7f) | 0x80); n >>>= 7; }
  return Buffer.from(out);
};
const chunk = (tag, body) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length);
  return Buffer.concat([Buffer.from(tag, 'ascii'), len, body]);
};
const meta = (type, data) => Buffer.concat([Buffer.from([0xff, type]), vlq(data.length), data]);
const text = s => Buffer.from(s, 'latin1');

function trackChunk(events, name){
  /* events: {tick, bytes}. Note-offs sort before note-ons at the same tick, or
     a repeated pitch is switched off by its own successor. */
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const parts = [];
  if(name) parts.push(vlq(0), meta(0x03, text(name)));
  let last = 0;
  for(const e of events){
    parts.push(vlq(Math.max(0, e.tick - last)), e.bytes);
    last = e.tick;
  }
  parts.push(vlq(0), meta(0x2f, Buffer.alloc(0)));
  return chunk('MTrk', Buffer.concat(parts));
}

function write(file, passage){
  const { title, tempo, beats, tracks } = passage;
  const uspq = Math.round(60000000 / tempo);

  /* track 0 carries tempo and metre, as a format-1 file wants */
  const conductor = trackChunk([
    { tick:0, order:0, bytes: meta(0x51, Buffer.from([uspq >> 16 & 0xff, uspq >> 8 & 0xff, uspq & 0xff])) },
    { tick:0, order:1, bytes: meta(0x58, Buffer.from([beats, 2, 24, 8])) }
  ], title);

  const parts = tracks.map((t, i) => {
    const ch = i % 16;
    const events = [];
    (t.notes || []).forEach(([start, len, midi]) => {
      const on  = Math.round(start * PPQ);
      const off = Math.round((start + len) * PPQ);
      events.push({ tick:on,  order:1, bytes: Buffer.from([0x90 | ch, midi & 0x7f, VELOCITY]) });
      events.push({ tick:off, order:0, bytes: Buffer.from([0x80 | ch, midi & 0x7f, 0]) });
    });
    return trackChunk(events, t.name || t.id);
  });

  const head = Buffer.alloc(6);
  head.writeUInt16BE(1, 0);                  // format 1
  head.writeUInt16BE(parts.length + 1, 2);   // conductor + one per instrument
  head.writeUInt16BE(PPQ, 4);
  fs.writeFileSync(file, Buffer.concat([chunk('MThd', head), conductor, ...parts]));
}

/* ---- where the notes come from ---- */
function fromAtlas(id){
  const sb = {};
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'atlas-data.js'), 'utf8') +
    ';globalThis.__x = { PASSAGES };', sb);
  const p = sb.__x.PASSAGES[id];
  if(!p) throw new Error(`no passage "${id}" in atlas-data.js — have: ${Object.keys(sb.__x.PASSAGES).join(', ')}`);
  return { title:p.title, tempo:p.tempo, beats:p.beats, bars:p.bars,
           tracks:p.tracks.map(t => ({ id:t.id, name:t.instrument || t.id, notes:t.notes })) };
}
function fromScore(file){
  const s = JSON.parse(fs.readFileSync(file, 'utf8'));
  return { title:s.title, tempo:s.tempo, beats:s.beats, bars:s.bars,
           tracks:s.tracks.map(t => ({ id:t.id, name:t.name || t.id, notes:t.notes })) };
}

/* ---- cli ---- */
const argv = process.argv.slice(2);
if(!argv.length){ console.error('usage: node tools/json2midi.js <passage-id | --score file.json> [-o out.mid] [--list]'); process.exit(1); }

const out   = argv.includes('-o') ? argv[argv.indexOf('-o') + 1] : null;
const list  = argv.includes('--list');
const score = argv.includes('--score') ? argv[argv.indexOf('--score') + 1] : null;
const id    = argv.find(a => !a.startsWith('-') && a !== out && a !== score);

const p = score ? fromScore(score) : fromAtlas(id);
const total = p.bars * p.beats * 60 / p.tempo;
const NOTE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const nm = m => NOTE[m % 12] + (Math.floor(m / 12) - 1);

console.log(`${p.title} — ${p.bars} bars, ${p.tempo} bpm, ${p.beats}/4, ${total.toFixed(2)}s`);
p.tracks.forEach(t => {
  const n = (t.notes || []).length;
  const pitches = (t.notes || []).map(x => x[2]);
  console.log(`  ${t.name.padEnd(18)} ${String(n).padStart(4)} notes` +
    (n ? `  ${nm(Math.min(...pitches))} – ${nm(Math.max(...pitches))}` : ''));
});

if(list) process.exit(0);
const file = out || `${score ? path.basename(score, '.json') : id}.mid`;
write(file, p);
console.log(`\nwrote ${file} — format 1, ${p.tracks.length + 1} tracks, ${PPQ} ppq, velocity fixed at ${VELOCITY}`);
console.log('pitch, position and length are exact; velocity and CC were never in the JSON to recover.');
