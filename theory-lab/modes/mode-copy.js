/* ============================================================================
   SCALES & MODES · THE OWNER'S WORDS
   ----------------------------------------------------------------------------
   How Arn describes each of the five colour modes. THIS FILE IS THE SOURCE.
   Nothing else in the module restates a mode in prose: data.js points its
   `short` at oneNote, the module home reads tagline and oneNote from here, and
   the lesson page's heading line and Overview opening are built from tagline,
   about and useFor.

   Ionian and Aeolian are absent on purpose: they are the two reference points
   every other mode is defined against, so there is nothing to describe.

   `oneNote` is the same sentence as EvTheory.mode(id).defined, deliberately —
   the theory layer needs it for the widgets and the ear quiz, including for
   the two reference modes, and it has to run in Node with no DOM. The module
   suite asserts the two agree, so neither can drift without a test failing.

   EDITING: change the words here and nowhere else. Keep the typographic
   apostrophes (’), which is what the rest of the suite uses.
   ============================================================================ */

const MODE_COPY = {
  lydian: {
    name: 'Lydian',
    tagline: 'Hope and new beginnings.',
    oneNote: 'Major with a raised 4th',
    about: [
      'Lydian is one of the more special modes. It’s very similar to the major scale, but the fourth step is raised a half step, which turns it into a tritone above the root.',
      'That one note gives it a very uplifting, hopeful and fantastical sound. It’s common in Norwegian folk music, and it’s a great choice whenever you want a sense of hope and new beginnings.'
    ],
    useFor: ['Wonder', 'Hope', 'Flying', 'Fantasy', 'New beginnings']
  },

  mixolydian: {
    name: 'Mixolydian',
    tagline: 'Adventure and folklore.',
    oneNote: 'Major with a lowered 7th',
    about: [
      'Mixolydian has a real sense of adventure. It’s bold, open, heroic and a little rough around the edges.',
      'It’s just one note different from the major scale: the seventh step is changed from a major seventh to a minor seventh. That takes away the strong pull back home and gives you an open, folky sound, which makes it a great fit for adventurous themes and anything with a sense of folklore.',
      'In a way, it’s the major version of Dorian. The two of them are the more mystical, adventurous, folky brothers of the major and minor scales we all know.'
    ],
    useFor: ['Adventure', 'Heroes', 'Journeys', 'Folklore', 'Celebration']
  },

  dorian: {
    name: 'Dorian',
    tagline: 'Magic, longing and otherworldliness.',
    oneNote: 'Minor with a raised 6th',
    about: [
      'Dorian is a mystical and beautiful scale that feels like a more fantastical cousin of the usual minor scale we all know.',
      'It’s one note different from minor: the sixth step is raised a half step. That small change can evoke a sense of magic, longing and otherworldliness, while still keeping some of the sorrow of minor.',
      'Think of it as the minor-side partner of Mixolydian: both are the mystical, folky siblings of the scales we use every day.'
    ],
    useFor: ['Magic', 'Mystery', 'Longing', 'Folk', 'Bittersweet']
  },

  phrygian: {
    name: 'Phrygian',
    tagline: 'Tension and danger.',
    oneNote: 'Minor with a lowered 2nd',
    about: [
      'Phrygian is the scale you get from playing the white keys from E to E.',
      'It’s closely related to the minor scale, but with a minor second: the second step sits just a half step above the root. That half step pulls hard back down onto the tonic and gives a greater sense of tension and danger, which makes it less stable than the minor scale.'
    ],
    useFor: ['Danger', 'Menace', 'Villains', 'Desert', 'Ancient worlds']
  },

  locrian: {
    name: 'Locrian',
    tagline: 'Tension and unrest.',
    oneNote: 'Phrygian with a lowered 5th',
    about: [
      'Locrian is the darkest and least stable of the modes.',
      'On top of Phrygian’s minor second, it lowers the fifth, so the chord built on the root is diminished and never quite feels like home. That makes it all about tension and unrest.'
    ],
    useFor: ['Dread', 'Unease', 'Horror', 'Instability']
  }
};

/* Node, for the test that pins oneNote to the theory layer. */
if(typeof module !== 'undefined' && module.exports) module.exports = MODE_COPY;
