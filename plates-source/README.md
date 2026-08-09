# Plate sources

One PNG per instrument, black line art on white paper, named by the
instrument's atlas id: `oboe.png`, `double-bass.png`. The id is what the
converter uses to name its output, so rename a file that does not match.

These are the masters. They stay here at full size and untouched so a plate
can be rebuilt at a different size or colour later without going back to the
generator. Only the converted `plates/*.png` are loaded by the site.

```
python3 tools/plates.py            # build everything that changed
python3 tools/plates.py oboe       # just one
python3 tools/plates.py --force    # rebuild regardless
```

Needs Pillow: `pip3 install Pillow`.
