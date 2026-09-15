# Accelerator audio

The 33 MP3 files in `audio/` are FluidR3 GM instrument samples distributed by Benjamin Gleitzman's [MIDI.js Soundfonts](https://github.com/gleitz/midi-js-soundfonts), pinned to commit `044fab8e1456bfafc5776e86dfd6bb8697149aef`. The samples are licensed under [Creative Commons Attribution 3.0 United States](https://creativecommons.org/licenses/by/3.0/us/). The upstream software MIT license does not replace the samples' license.

Source paths: `FluidR3_GM/<instrument>-mp3/<note>.mp3`. Piano uses `acoustic_grand_piano`, horn uses `french_horn`; the other folder names match their instruments. MP3 files are unchanged. Playback transposes the nearest sampled note, applies envelopes and adjusts gain.

Piano anchors: C2, G2, C3, G3, C4, G4, C5, G5, C6. Flute, oboe, clarinet, horn, trumpet, violin and viola: C3, C4, C5. Cello: C2, C3, C4.

These are sampled instruments at one recorded dynamic. Gain changes do not reproduce acoustic dynamic layers. Short envelopes do not reproduce real pizzicato or staccato; connected notes do not reproduce recorded legato transitions. Optional level matching uses bounded RMS gain, not perceptual or LUFS normalization.

The Overtones activity deliberately uses harmonic synthesis. Its bars describe oscillator amplitudes. The timbre spectrum measures the actual playback analyser output. Existing instrument recordings are offered separately as performance references, with their original files and provenance retained in the main project. They are not controlled, identical-phrase comparisons.

A future performance pack needs independently recorded, licensed takes of identical musical passages at multiple dynamics and articulations. This implementation does not claim to supply those recordings.
