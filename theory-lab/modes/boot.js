/* Registers the Voicing Atlas instruments as transport voices, before the app
   routes. One line, but it has to run after audio.js and before the first
   widget mounts, which is what this file is for. */
(() => { if(typeof EvSound !== 'undefined' && typeof AccelAudio !== 'undefined') EvSound.register(AccelAudio); })();
