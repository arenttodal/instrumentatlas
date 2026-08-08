# Instrument Atlas

A reference for composers writing for the orchestra — what each instrument sounds
like, where it sits, what it blends with, and where it stops. Plus an interactive
3D viewer with annotated hotspots.

Static files. No build step, no dependencies, no npm.

```
├── index.html        page shell
├── atlas.css         all styles
├── atlas-data.js     ← the file you edit: families, instruments, ensembles, gallery
├── atlas.js          rendering, router, seating map, timbre chart
├── _headers          Cloudflare caching + framing rules
└── viewer/
    ├── instruments.html
    ├── models/       cello, horn, trumpet, violin (.glb)
    └── vendor/       three.js r170
```

---

## Running it locally

Both pages fetch files relative to themselves, so `file://` will not work.

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

---

## Deploying

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Instrument Atlas: initial"
git branch -M main
git remote add origin git@github.com:<you>/instrument-atlas.git
git push -u origin main
```

### 2. Connect Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the repo
3. **Build command:** leave empty · **Output directory:** leave empty (or `/`)
4. Deploy → you get `<project>.pages.dev`
5. **Custom domains** → add e.g. `atlas.evenant.com`

That is the whole setup. Every push to `main` redeploys in about twenty seconds.
Pushing any other branch produces a preview URL, which is how to try something
risky without touching the live page.

### 3. Point Webflow at it

Link your nav straight to the subdomain. The atlas is better as its own page than
as an embed — `atlas.evenant.com/#/brass/horn` is linkable, shareable and
indexable, and an iframe throws all three away.

If you do want it inside Webflow chrome:

```html
<iframe src="https://atlas.evenant.com/" style="width:100%;height:100vh;border:0"
        loading="lazy" title="Instrument Atlas"></iframe>
```

---

## The edit loop

```bash
# make a change
git add -A && git commit -m "Add oboe" && git push
# live in ~20s
```

**Claude Code, in this repo,** for anything concrete — content, new instruments,
fixes, refactors. It edits in place and pushes.

**Chat** for design exploration where you want to see options before choosing.
Paste in the relevant file, not all four.

---

## Adding an instrument

Everything is in `atlas-data.js`.

1. Find the instrument's stub in `INSTRUMENTS` (they all exist already with
   `status:'plan'`), and fill it out following `flute`, `horn` or `cello` as the
   model — `summary`, `range`, `timbre`, `facts`, `registers`, `characteristics`,
   `articulations`, `blends`, `limits`, `demos`, `prev`/`next`
2. Change `status:'plan'` to `status:'live'`
3. Add plate artwork to `PLATES` and a small icon to `THUMBS`, both keyed by id

It appears in the menu, the family page and the timbre chart automatically. The
counts on the home page and family pages are computed, not typed.

### Giving it a 3D model

1. Drop the `.glb` in `viewer/models/`
2. Add it to `INSTRUMENTS` inside `viewer/instruments.html`, with hotspots
3. Add `model: '<id>'` to that instrument in `atlas-data.js`

A **3D Model** tab appears on its page, iframing the viewer and loading only when
opened. Currently wired for `cello` and `horn`.

Hotspot coordinates for the horn, trumpet and violin are estimates. Fix them with
author mode — `viewer/instruments.html?i=horn&author=1`, double-click each part,
paste the printed coordinates over the existing values. Ten minutes each.

---

## Things that will silently break it

- **Never minify or bundle `viewer/vendor/`.** It is already built.
- **Never run `viewer/models/*.glb` through an image or asset optimiser.** They are
  binary and most tools will corrupt them.
- **`_headers` only works from the root of the deploy output.** It does nothing in
  a subfolder.
- **`atlas-data.js` must load before `atlas.js`.** Both are `defer`, which
  guarantees document order — do not change one to `async`.
- **The CC BY credits in the viewer must stay visible.** Four models, four
  attributions, legally required:

| Model | Title | Author | Source |
|---|---|---|---|
| cello | Cello Sketchfab | Limpskin | https://skfb.ly/pICFS |
| horn | French Horn | Bethanycrandallart | https://skfb.ly/6TxEP |
| trumpet | B♭ Trumpet Model | Pakaku | https://skfb.ly/otwwn |
| violin | Violin Texturing | ilushandro | https://skfb.ly/oAVFz |

All CC BY 4.0 — commercial use permitted, attribution required.

---

## Still to do

- Audio demos are UI only; the players are not connected yet
- Plate artwork is placeholder line art, to be replaced with public-domain engravings
- Gallery videos are a shared placeholder set; each instrument should get its own
- 17 of 20 instruments still need their content written
