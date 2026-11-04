/* accelerator/model.js reads LESSONS at load, to migrate legacy progress and to
   validate an imported backup. A page that uses the store without using the
   lesson engine — the Scales & Modes ear quiz — has no LESSONS, so this
   declares an empty one.

   It must load BEFORE model.js and must not be loaded on a page that has a
   real LESSONS: a second top-level const of the same name is a syntax error,
   which is the price of this repo's module system and the reason this file
   exists rather than model.js guarding for it. */
const MODULES = [];
const LESSONS = [];
