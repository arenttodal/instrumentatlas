# Blend — spec for the rework

What Blend is now: four fixed answers, one of which you pick, about a horn with
optional doublings. What it becomes: **which instruments do you hear**, answered
by lighting up instruments in a grid, at three difficulties, the hardest of
which also asks how they sit against each other.

This is a spec, not a patch. Read §8 first if you only read one part — the
audio is the thing that decides how much of this can be built today.

---

## 1. The question

> **Which instruments do you hear?**

Multi-select. No option rows. A grid of instrument cards grouped by family, the
same card the atlas family pages use — thumbnail, name — which is already what
Layers draws. You click the ones you hear; they lift out of the grid into a
band above it. Click one up there to put it back.

The change in kind is worth naming: the present Blend gives you four candidate
*mixes* and you pick one. The new one gives you instruments and you build the
mix yourself. That is a harder and more honest question, because being unsure
whether the cello is in there is now something you have to commit to rather
than something the four options quietly resolve for you.

---

## 2. Levels

| | Name | Pool | Extra |
|---|---|---|---|
| 1 | Handful | 5–6 cards: everything sounding, plus confusable decoys | — |
| 2 | Orchestra | every instrument of every family the passage draws on | — |
| 3 | Placement | as level 2 | place what you selected on three registers |

**Level 2 does not mean all twenty.** A passage with no percussion shows no
percussion: six cards of timpani, cymbals, gong, snare, bass drum and celesta
against a string passage is a column of wasted space and a free point. The
passage declares which families it can contain and the grid is built from
those. That the percussion family is absent tells you there is no percussion,
which is a scope statement, not a giveaway about which of the shown cards sound.

**Decoys at level 1 come from `CONFUSIONS`,** the table belts already uses. A
flute sounding pulls piccolo and clarinet into the pool; it does not pull
timpani. The same rule that makes belt 2 teach rather than quiz.

**Level 3 tiers are relative, not absolute.** Three rows — above, same, below —
and what is checked is the *arrangement*, normalised: if the flute is an octave
over the horn, placing them in the top two rows and placing them in the bottom
two rows are both right, because both say the same thing about the music.
Instruments in unison share a row. Nothing is pre-placed and nothing is given
away.

> The alternative was to pre-place a reference instrument on the middle row and
> have you arrange the rest around it. It is easier to explain and it hands you
> one of the answers at the level where the question is hardest. Normalising is
> a dozen lines and costs nothing.

Three rows means the data may only use offsets of −1, 0 and +1. A render with a
two-octave spread needs either more rows or to be marked level-1-and-2 only.

---

## 3. The level selector

Top right of the bar, where **Browse instruments** sits in the atlas — same
pill, same chevron, same dropdown surface. Three rows, a tick on the current
one, exactly the module switcher's menu with a different list.

That is now the fourth dropdown in this codebase: the atlas instrument select,
the studio theme select, the module switcher, and this. `evenant-nav.js`
already has one that handles Escape, outside click, arrow keys, Home/End, focus
return and viewport-constrained fixed positioning. **Pull that behaviour out of
the switcher into a small shared helper and give this the same treatment**
rather than writing a fourth half-accessible dropdown.

### Changing level mid-question

It has to be free. Two rules:

- **The audio does not restart.** The passage keeps playing at the position it
  was at. The engine already makes this trivial — level changes touch no nodes.
- **Your answer is not reset.** Selections survive. Going 1 → 2 widens the pool
  and keeps what you picked. Going 3 → 2 hides the rows but remembers the
  placements, so going back restores them.

A level change on an *answered* question re-asks it at the new level rather
than re-marking it, because the score you just got was for a different question.

---

## 4. Data model

The passage gains per-voice octave offsets and a family scope; the answer stops
being an enumerated list and becomes the set of voices that sound.

```js
const BLEND_PASSAGES = {
  'theme-1': {
    base:'../audio/theme-1/',
    families:['woodwinds','brass','strings'],   // what level 2 may offer
    tiers:true,                                 // offsets are within ±1 octave
    voices:{
      flute:{ instrument:'flute', offset:+1, parts:{ '1':'flute_1' } },
      horn: { instrument:'horn',  offset: 0, parts:{ '1':'horn_1','4':'horn_4',
                                                     '6':'horn_6','12':'horn_12' },
              always:true },
      cello:{ instrument:'cello', offset:-1, parts:{ '1':'cello_1','ens':'cello_ens' } }
    }
  }
};
```

`always` marks a voice that is in every question from this passage — the horn
carries the tune and the passage is nothing without it. Everything else is
drawn per question.

A question is generated, not stored:

```js
{
  passage: 'theme-1',
  sounding: { horn:'6', flute:'1' },   // voice -> which render
  level: 2
}
```

and the answer is `Object.keys(sounding)` plus, at level 3, their offsets.

`BLEND_ANSWERS`, `mixFor()` and `BLEND_NOTES` go. The note under Next becomes a
verdict built from what you missed and what you added, which is more use than a
hand-written line and does not need writing four more of every time a passage
is added.

---

## 5. The board

Two regions, and it is the Layers board with different labels:

```
        [ heard ]              ← selected cards lift up here
                                  level 3: three rows, above / same / below

   WOODWINDS  [ ][ ][ ][ ][ ]  ← the pool, grouped by family,
   BRASS      [ ][ ][ ][ ]        family name in that family's colour
   STRINGS    [ ][ ][ ][ ][ ]     (STUDIO_FAM in atlas-data.js)
```

Layers already has the card, the tray, the zones, drag-and-drop for the mouse,
tap-a-card-then-tap-a-zone for touch and Enter-then-1-2-3 for the keyboard.
**Extract that into `dojo/board.js`** the way the audio engine was extracted
into `dojo/audio.js`, and let Blend be a different set of zones over it.
Otherwise this is the second copy of a drag board and the third copy of a card.

Two things the board does not do yet and will need:

- **Grouped pool.** Layers' tray is flat. Blend wants family rows with a label.
  A `groups` option on the tray, null for Layers.
- **A compact card.** Fourteen cards at Layers' 108px across three family rows
  is taller than a laptop screen once the heard band is above it. Level 2 and 3
  want a denser card — icon and name on one line, roughly 40px tall.

### Nothing moves, again

The heard band is reserved at its full height from the start, so the pool does
not jump when the first card lands in it. The lesson from the belts result
block and the Layers tray, applied a third time: reserve the space, do not
collapse it.

Selecting a card does move that card, which is direct manipulation and fine.
What must not move is everything else.

---

## 6. Marking

Per instrument rather than per question, because "which instruments" has four
possible outcomes per card, not two:

| | selected | not selected |
|---|---|---|
| **sounding** | hit | miss |
| **silent** | false alarm | correct rejection, shown as nothing |

The score line says both halves: `2 of 3 heard · 1 that was not there`. A
level-3 card can also be a hit on the wrong row, which is its own state —
right instrument, wrong register — and should read differently from a miss.

### The A/B, which gets better

The present A/B compares the answer's mix against the mix you picked. That
survives and improves: **your selection is now a mix too**, so the comparison
becomes *what was playing* against *what you said you heard*. The difference
you hear is exactly your misses and your false alarms. The engine does this
already — one scheduled start over the union of both sets, a gain ramp to
switch, shared voices holding their level and never dipping.

One case needs an honest answer rather than a fudge: a false alarm on an
instrument that has **no render in this passage at all** cannot be played.
Nothing is faked and no substitute is found — your mix is built from the voices
that exist, and the card is marked with "not in this passage". Inventing a
flute part so the A/B sounds complete would be teaching the wrong thing.

---

## 7. What does not change

- The engine. `dojo/audio.js` already does everything this needs: one scheduled
  start, gain ramps rather than restarts, the node registry, generation tokens.
  No new audio code.
- The shell, the bar, the breadcrumb, the play control, the result block.
- The no-jump discipline, which now has three precedents and should be checked
  by measurement rather than by eye.

---

## 8. The audio, which is the real constraint

Read this before scheduling anything. **The level that needs the most
instruments has the least audio, and the level that needs octave data is
supported by only one passage.**

| Level | On `theme-1` | On Valley Sunrise | Verdict |
|---|---|---|---|
| 1 Handful | 3 voices + decoys | 4–5 per section | **Buildable today** |
| 2 Orchestra | 3 voices in a 14-card pool | stems are *groups* | **Thin today** |
| 3 Placement | flute +1 / horn 0 / cello −1 | no octave data | **theme-1 only** |

Three specific problems:

1. **`theme-1` has three instruments.** A level-2 pool of fourteen cards over a
   three-instrument passage is a rejection exercise: you spend it saying no
   twelve times. That is a real skill and not a useless one, but it is not what
   "all the instruments of the orchestra" promises.

2. **Valley Sunrise stems are groups, not instruments.** `reeds` is "Oboe &
   Clarinet", `lowbrass` is "Trombones & Tuba", `strings` is "String beds". A
   grid of instrument cards cannot be answered from them without either
   splitting the stems or making the cards groups — and group cards break the
   thing that makes this design good, which is that an instrument looks the same
   here as it does on its atlas page.

3. **Nothing records octave relationships** except `theme-1`, where it is in the
   track roles by luck. `annotations.json` records what a stem is *doing*, not
   where it sits. Level 3 needs an `offset` per voice, and adding it to Valley
   Sunrise is an authoring pass, not a code change.

### What unlocks it properly

The renders in the original dojo brief, §6: `audio/dojo/melody/` — the same
eight-bar passage played by flute, oboe, clarinet, bassoon, horn, trumpet,
violin and cello, one instrument per file, aligned. Eight per-instrument voices
from one project is exactly what a real level 2 needs, and pitching some of them
an octave apart gives level 3 a second passage. That render session was already
the plan; this mode is another reason for it.

### What to do in the meantime

Ship levels 1 and 3 on `theme-1`, where both are honest, and let level 2 be
what it can be — the woodwind, brass and string families over a three-voice
passage — with the pool widening the moment there is more to hear. Do not pad
it with instruments that could never sound: a decoy that is not confusable with
anything present is the free point this whole section is built to avoid.

---

## 9. Build order

1. **The board, extracted.** `dojo/board.js` out of Layers: card, pool, zones,
   drag, tap, keyboard. Layers keeps working, verified by its own tests.
2. **Blend levels 1 and 2** on the new board, on `theme-1`, marking per
   instrument, the A/B rebuilt over selection sets.
3. **The level selector**, with the dropdown behaviour pulled out of
   `evenant-nav.js` so it is not written a fourth time.
4. **Level 3** on `theme-1`, tiers relative and normalised.
5. **The §6 renders**, and then level 2 becomes what it says on the tin.

Steps 1–4 are a session each and need no new audio. Step 5 is a render session
and is the one that decides whether this mode is a demonstration or a tool.
