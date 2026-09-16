const MODULES = [
  { id:'foundations', n:1, title:'Foundations',
    subtitle:'The core pillars',
    lede:'The concepts everything else rests on. Each one is demonstrated before it is explained : you will hear the difference before you read why it happens.' },
  { id:'composition', n:2, title:'Composition',
    subtitle:'Building material that goes somewhere',
    lede:'How a single short idea becomes a phrase, and how phrases become music that moves. Everything in this module is built from one motif at a time : including the one you write.' }
  /* form, orchestration and production follow */
];

const LESSONS = [

/* ---------------------------------------------------------------- 1 ------ */
{
  id:'overtones', module:'foundations', n:1,
  title:'Overtones',
  short:'Why one note is never one note, and what follows from that.',
  claim:'Many pitched sounds contain harmonics above a fundamental. Their balance helps explain tone colour and suggests starting points for voicing.',
  demo:'overtones',
  demoNote:'Click any bar to silence that partial. The fundamental alone is a bare sine wave. Everything that makes it sound like an instrument is sitting above it.',
  source:'Core Pillars of Music : Overtones / A Look At The Overtones',
  beats:[
    {t:'One note is never one note',p:[0]},
    {t:'The string vibrates in halves, thirds, quarters',p:[1]},
    {t:'Wide at the bottom, tight at the top',p:[2]},
    {t:'The two rules that follow',p:[3]}
  ],
  body:[
    'Most sounds are more complex than they appear. When you pluck a guitar string you hear a note, but inside that note is a rainbow of overtones, and they are what create the timbre and the character of the sound.',
    'The fundamental is the root frequency. The rate at which the string vibrates determines the pitch : an A at 110Hz is a string vibrating 110 times a second. But the string does not only vibrate along its whole length. It also vibrates in halves, thirds, quarters and so on, and each division produces its own pitch. The first overtone is the fundamental doubled, an octave above at 220Hz. The next is the fundamental tripled, at 330Hz. Then 440, then 550.',
    'Written out from a low C, the first eight harmonics, including the fundamental give you C, then C an octave up, then G, then C, then E, G, B♭ and another C : and after that the steps get closer and closer together until the top of the series is almost a scale. <strong>The intervals start wide at the bottom and tighten as they rise.</strong>',
    'There are only two things to take from this, and between them they are about 80% of what you need. <strong>First: follow that spacing in your own chords.</strong> Spacious, octave- and fifth-based voicings in the low end, then tighter voicings as you go up. <strong>Second: double the root most, then the fifth, then the third, and sevenths and ninths least of all.</strong> The root appears four times in the series, the fifth twice, the third once. Use that proportion as one possible starting point, then adjust for register, instrumentation and harmonic function.'
  ],
  ex:{
    beginner:'Play a low C on a piano or in your DAW. Sing the C an octave above it, then the G above that. Both are already sounding inside the note you played.',
    intermediate:'Voice a C major triad three ways : closed in the low register, spread following the overtone series, and closed in the high register. Note which one sounds clearest and why.',
    advanced:'Take a chord from something you have written. Count how many times you doubled the root, the fifth and the third. Re-voice it to roughly 4:2:1 and compare the two.'
  },
  quiz:[
    { q:'Which note appears most often in the first eight harmonics, including the fundamental?',
      o:['The third','The fifth','The root','The seventh'], a:2,
      why:'The root appears four times, the fifth twice, the third once : which suggests a starting point for doubling rather than a required ratio.' },
    { q:'The overtone series spaces intervals widely at the bottom and closely at the top. What should you do with chord voicings?',
      o:['The same : wide low, tight high','The opposite : tight low, wide high','Space everything evenly','Spacing does not affect clarity'], a:0,
      why:'Following the series gives clarity and balance. Fighting it is the most common cause of a muddy low end.' }
  ]
},

/* ---------------------------------------------------------------- 2 ------ */
{
  id:'perspective', module:'foundations', n:2,
  title:'Musical perspective',
  short:'Foreground, middleground, background : and the three dials that decide which is which.',
  claim:'A clear focal element helps listeners follow a busy arrangement. Perspective lets you shape that focus.',
  demo:'perspective',
  demoNote:'Three layers, one phrase. Move any layer forward or back on the three dials and notice how fast your attention follows.',
  source:'Musical Perspective: Foreground, Middleground & Background',
  body:[
    'Look at a painting and you take in the whole thing first, then you notice it has layers : a figure in the foreground, sharply detailed and drawing the eye; other shapes in the middleground giving context and movement; and a background that sets the scene. Each layer has a purpose, and together they create depth and focus.',
    'Sound works the same way, and for a practical reason. We are bombarded with sound sources constantly, and to avoid sensory overload the brain filters and prioritises : <strong>giving priority to what is dynamic and unpredictable.</strong> Historically a sudden or unpredictable noise demanded attention and might mean danger. Complex sources like speech take far more attention than the monotony of rain.',
    'In music that becomes a hierarchy of focus, and three parameters do almost all the work. <strong>Loudness</strong> : louder elements move to the front. <strong>Rhythmic activity</strong> : rhythmically dynamic parts attract attention; an ostinato sticks out more than a drone. <strong>Variation and predictability</strong> : elements that change or surprise stand out, while static and repetitive layers stay back.',
    'So the foreground is melodies, surprise swells, effects, big stabs, vocal lines. The middleground is supporting harmony, rhythmic ostinatos, accompanying countermelodies. The background is drones, predictable ostinatos and atmospheric textures. <strong>These are not rigid categories but a sliding scale</strong> : a drone that swells steps forward; a melody that repeats recedes.',
    'Two things to get right. Make sure the foreground is clear and that one main element is in focus. And make sure the middleground and background support it without stealing attention : exactly as they would in a painting. Get this wrong and the track becomes chaotic, because the listener never knows what to follow.'
  ],
  ex:{
    beginner:'Take a track you like and name the foreground, middleground and background in the first sixteen bars.',
    intermediate:'Take one of your own tracks. Decide which layer should be the foreground, then check whether it actually is on all three parameters.',
    advanced:'Rewrite a section so the foreground changes hands twice without either handover being obvious.'
  },
  quiz:[
    { q:'A sustained drone swells and gets louder. What happens to it?',
      o:['Nothing : drones are always background','It moves toward the foreground','It becomes harmony','It masks the melody'], a:1,
      why:'Loudness is one of the three dials, and the categories are a sliding scale. A background element that changes stops being background.' },
    { q:'Which is most likely to sit in the middleground?',
      o:['A solo melody with wide leaps','A repeating rhythmic ostinato','A static atmospheric pad','A sudden cymbal crash'], a:1,
      why:'Rhythmically active but predictable : it supplies motion and support without demanding attention.' }
  ]
},

/* ---------------------------------------------------------------- 3 ------ */
{
  id:'separation', module:'foundations', n:3,
  title:'Separation of elements',
  short:'Four tools for stopping layers from swallowing each other.',
  claim:'When independent ideas overlap in register, rhythm and colour, try separating one property at a time.',
  demo:'separation',
  demoNote:'The same four bars, three ways. Switch while it plays : the notes never change, only how separated the layers are.',
  source:'Separation Of Elements / Music With Two Layers / Three Or More Layers',
  body:[
    'Whenever you have more than one layer, there has to be enough separation between them. Without it everything becomes a confusing mess. Separation is what lets each musical idea stand out, whether it is a foreground or a background element.',
    'At the simplest level there is homophonic music : from the Greek <em>homos</em>, same, and <em>phone</em>, sound. All the instruments play identical or very similar rhythms even when they are playing different notes, so the listener perceives them as one unified thing. That is useful deliberately: to introduce a theme clearly, as a tutti climax after a complex build, or to close a piece.',
    'Once you have two layers you have a foreground and a background, and you need two things: <strong>separation</strong>, so the layers are distinct, and <strong>balance</strong>, so attention lands on the foreground. There are four tools. <strong>Rhythm</strong> : a moving melody against sustained chords. <strong>Articulation</strong> : pizzicato chords under a sustained melody. <strong>Tone colour</strong> : strings and harp behind a solo oboe. <strong>Pitch</strong> : melody high, chords in the mid-to-low range.',
    'Mars from The Planets is the textbook case. The background is a rhythmic col legno pattern in strings, harp and timpani; the foreground is a dark sustained melody in brass and woodwinds. They are separated by rhythm : short and driving against long and sustained : by tone colour, sharp and percussive against dark and ominous, and by articulation. Three tools at once, and the hierarchy is completely clear.',
    'With three or more layers there will be overlap, and that is fine as long as something separates each pair. A quick woodwind ostinato can share a register with a soaring violin melody because the tone colour and the rate of movement differ. A horn countermelody can overlap string chords because it moves faster and sounds different. <strong>Always assign clear roles and avoid redundancy.</strong>'
  ],
  ex:{
    beginner:'Write a melody and a chord bed that differ only in register. Then change the rhythm of one of them and listen to what improves.',
    intermediate:'Take a passage where two lines fight each other. Fix it using tone colour alone : do not move a single note.',
    advanced:'Write four simultaneous layers that all stay individually audible, and name which of the four tools separates each pair.'
  },
  quiz:[
    { q:'Which tools separate the two layers in Holst\'s Mars?',
      o:['Register and dynamics','Rhythm, tone colour and articulation','Tempo and key','Panning and reverb'], a:1,
      why:'Short driving col legno against long sustained brass : different rhythm, different colour, different articulation.' },
    { q:'A woodwind ostinato and a violin melody share the same register. Why does it still work?',
      o:['It does not : one must move','The ostinato is quicker and a different tone colour','Woodwinds are always quieter','The listener cannot hear that high'], a:1,
      why:'Sharing one parameter is fine as long as others separate them. Rate of movement and tone colour are doing the work.' }
  ]
},

/* ---------------------------------------------------------------- 4 ------ */
{
  id:'tone-colour', module:'foundations', n:4,
  title:'Tone colour and timbre',
  short:'What makes a flute a flute : and how to blend or separate with it.',
  claim:'Timbre includes harmonic balance, noise, attack and change over time. Compare the same notes on different sampled instruments.',
  demo:'timbre',
  demoNote:'The same pitch, six different overtone balances, with the spectrum drawn live. The shape you see is the difference you hear.',
  source:'Tone Color & Timbre',
  body:[
    'The overtone series permeates everything, and it is what determines the tone colour of an instrument. It is why a middle C on an oboe sounds distinctly different from the same note on a violin, a synth, or a human voice. Even the uniqueness of individual voices comes down to their overtone content.',
    'Timbre is influenced by countless small factors : the instrument itself and how it is played. Picking versus fingerstyle on a guitar. Bow pressure and the age of the strings. The specific wood and construction. No two real instruments of the same kind, played by different musicians, sound exactly alike, and that variability is both the challenge and the tool.',
    '<strong>Dynamics change timbre as much as instrument choice does.</strong> A horn in its soft range produces few high overtones and sounds velvety; at full force it becomes rich and vibrant. A flute adds high-end overtones as air pressure increases, though its dynamic contrast is more subtle. Violins gain brilliance and loudness at higher dynamics, but that can also introduce harshness. You are never choosing an instrument : you are choosing an instrument at a dynamic.',
    'That gives you four uses. <strong>Enhancing emotion</strong> : darker, velvety tones for solemn or introspective moods, brighter ones for triumph or heroism. <strong>Blending</strong> : layer timbres for nuance, adding airiness to a violin line with a flute, or warmth to a horn melody with a cello. <strong>Creating separation</strong> : pair a bright trumpet melody with warm string chords so each stays distinct. <strong>Supporting layers</strong> : reinforce a quiet element with a similar timbre, doubling an oboe with a bassoon an octave below for depth.',
    'Which reduces to two rules. <strong>To blend, use instruments with similar timbres</strong> : French horn and cello. <strong>To separate, use contrasting ones</strong> : trumpet against flute.'
  ],
  ex:{
    beginner:'Play the same note on four different patches at the same dynamic. Describe each one in three words.',
    intermediate:'Take a melody and double it three ways : for warmth, for brightness, and for edge. Keep the notes identical.',
    advanced:'Spend time exploring how each instrument\'s EQ changes with articulation, dynamic level and playing style. Then build a blend that produces a colour neither instrument has alone.'
  },
  quiz:[
    { q:'You want a horn melody warmer and fuller without changing the notes. What do you double it with?',
      o:['Piccolo','Cello','Trumpet','Snare drum'], a:1,
      why:'The horn is conical and mellow, and the cello has a similar overtone balance : so the two fuse rather than clash.' },
    { q:'What happens to a horn\'s overtones as it plays louder?',
      o:['They disappear','More high-end overtones appear','They shift down an octave','Nothing changes'], a:1,
      why:'Brightness is a dynamic, not only an instrument. Soft horn is velvety; at full force it is rich and vibrant.' }
  ]
},

/* ---------------------------------------------------------------- 5 ------ */
{
  id:'voicing', module:'foundations', n:5,
  title:'Chord voicing',
  short:'Spacing and doubling : the difference between a rich chord and a muddy one.',
  claim:'The overtone series already showed you how to space a chord. Follow it and chords ring; ignore it and they smear.',
  demo:'voicing',
  demoNote:'Drag any notehead. The checks update as you go. Try cramming the bottom two voices together, then press Fix it.',
  source:'Chord Voicing : The Role Of The Overtone Series / Doubling Notes In Chords',
  body:[
    'The orchestra can produce incredibly rich and lush chordal passages, but that takes careful attention to voicing. The overtone series is the natural guide, and it tells you two things.',
    '<strong>Spacing.</strong> Look at how the first overtones from a root note actually form a chord, and notice how it is built. The low range is spacious, with an octave between the lowest notes. Then the spacing gets closer as you climb. That is a very important guideline, and it is why voices crammed together in the lower range sound muddy.',
    '<strong>Doubling.</strong> When you orchestrate for ensembles with multiple parts, doubling becomes unavoidable, so the question is which notes to prioritise. The root is most prominent : it appears four times in the series, so double the root most often. The fifth appears twice, so double it less frequently. The third appears only once, so avoid doubling it if you can, because it changes the chord\'s balance.',
    'In practice, for a C major triad with four voices: double the C, add the G once, add the E once. If you expand to more voices, keep roughly those proportions. Chords with sevenths and ninths : treat those notes like the third.',
    'So a bad voicing is one where the voices are too close in the lower range, creating mud, and where the doubling is inconsistent : the third doubled more than the root. A good voicing spaces the lower notes widely and the higher notes closer together, and doubles by the overtone proportions. <strong>Everything here is a guideline rather than a law</strong>, and when your ear disagrees your ear wins. But if a chord sounds muddy and you cannot say why, it is almost always one of these two.'
  ],
  ex:{
    beginner:'Voice a C major triad for four voices following the doubling proportions. Play it, then double the third instead and compare.',
    intermediate:'Take four chords from something you have written and check each one for spacing and doubling. Fix the worst.',
    advanced:'Voice the same progression twice : once by the rules, once deliberately breaking them for effect. Be able to justify the second.'
  },
  quiz:[
    { q:'In a four-voice C major chord, which note should appear twice?',
      o:['E','G','C','Any of them'], a:2,
      why:'The root. It appears most often in the overtone series, so doubling it reinforces what the chord is already doing.' },
    { q:'Why do two voices a second apart in the bass register sound muddy?',
      o:['Seconds are always dissonant','It contradicts the wide spacing of the overtone series down there','The instruments are out of tune','It is too quiet to hear'], a:1,
      why:'The series is spacious at the bottom : an octave between the lowest notes. Cramming notes together down there fights the physics.' }
  ]
},

/* ---------------------------------------------------------------- 6 ------ */
{
  id:'voice-leading', module:'foundations', n:6,
  title:'Voice leading',
  short:'Turning chords into four melodies that happen to agree.',
  claim:'The orchestra is not a keyboard patch. Four voices moving individually sound like an ensemble; four voices moving in parallel sound like one hand.',
  demo:'voiceleading',
  demoNote:'The same progression three ways : block keyboard voicings, proper voice leading, then split across individual instruments.',
  source:'Voicing Harmonic Material Across Time / The Orchestra Is Not a Keyboard',
  body:[
    'The first thing to be aware of is that the orchestra is not a keyboard patch and should not be treated as one. A string section is several instrumental sections : Violin I, Violin II, Viola, Cello, Basses : and all of them are playing individual score parts that together make up the chords you hear.',
    'So the job is to turn your chords into four-part arrangements with individual melody lines that sound like what an orchestral section would actually play. These principles go back to Bach\'s era, and while being bound to strict rules is no fun, these particular ones will make your harmonic material a great deal better.',
    'Four guidelines. <strong>Minimise motion</strong> : each voice should move as little as possible to the next chord, taking the closest route to its next note. <strong>Avoid parallel fifths and octaves</strong> : create contrary or oblique motion instead, so some notes move up, some down, and some stay where they are. Thirds and sixths in parallel are fine. <strong>Proper spacing</strong> : lower voices wide, upper voices closer. <strong>Follow the doubling rules</strong> : root first, then fifth, and avoid doubling the third.',
    'Take Am, F, C, G. Voice it badly and every voice moves in the same parallel direction, exactly as a hand does on a keyboard : and it will sound like somebody playing chords with a string patch rather than four individual string voices. Voice it well and each voice moves in a different direction or stays put, moving just one step at a time to the closest note in the next chord. Try singing each voice; each one should feel natural to sing and play, and they should all be different. That is what makes them feel like an ensemble.',
    '<strong>Then add inner movement.</strong> Introduce a subtle sustained note across a chord change : a voice that resolves from the second step to the root and is held into the next chord, giving you a sus4 that resolves into the third of the following chord. It also guarantees you avoid parallel movement, because something is always either moving in the opposite direction or sustaining across. It is a very simple and very effective way to breathe life into a chordal arrangement.',
    'The last step is to split it out of an ensemble patch into individual legato instruments : Violin I and II on the top voices, viola on the third, cello doubling the basses in octaves. Notice that this also follows the overtone recommendations: octaves in the bass, tighter as you go up, three root notes and only one third.'
  ],
  ex:{
    beginner:'Take Am–F–C–G and voice it so that no voice moves more than two steps between chords.',
    intermediate:'Voice the same progression with at least one sustained common tone across every chord change.',
    advanced:'Split it across Violin I, Violin II, viola and cello as individual legato lines. Sing each part to check it is natural to play.'
  },
  quiz:[
    { q:'What is the main problem with all voices moving in parallel?',
      o:['It is dissonant','The voices stop sounding independent : it becomes the keyboard sound','It is hard to play','It changes the key'], a:1,
      why:'Four voices moving identically read as one thickened line, not as an ensemble of individual players.' },
    { q:'A voice holds a G while the chord changes. What have you created?',
      o:['A parallel fifth','A suspension that resolves into the next chord','A modulation','A doubling error'], a:1,
      why:'The held note becomes a sus4 over the new chord and resolves into it : inner movement for free, and check the other voices too; a held note does not prevent parallels elsewhere.' }
  ]
}
,

/* ====================== MODULE 2 : COMPOSITION ============================ */

/* ---------------------------------------------------------------- 1 ------ */
{
  id:'motifs', module:'composition', n:1,
  title:'Motifs',
  short:'The short fragment everything else is built from : and how to choose one.',
  claim:'A weak melody will sink a well-produced track, and a strong one will carry a thin one. It starts with a fragment short enough to remember.',
  demo:'motif',
  demoNote:'Click any interval to hear a motif built on it. The rhythm and the shape stay put, so the only thing changing is the leap : which is the book\'s point about intervals. Then change the rhythm with the interval fixed, and hear the other half of the job. Motif of fate sets all three to Beethoven\'s.',
  source:'The Composition : Using Motifs to Build a Melody / Composing Your Own Motif',
  body:[
    '<strong>Melody is king.</strong> It is the element that lingers after the final note fades. A perfectly crafted snare or synth pluck catches attention for a moment; the melody is what makes music memorable. Think of the endless four-chord songs that share a progression and are told apart entirely by their tunes.',
    'This matters more than it sounds. <strong>A weak melody compromises an otherwise well-produced track</strong> : music recorded and produced by extraordinarily talented people can still feel like something is missing, and often that missing thing is a memorable melody. It works in the other direction too: a powerful melody lifts a simple, minimal production.',
    'At the heart of most great melodies is a <strong>motif</strong> : a short, distinctive fragment that carries much of the piece\'s identity. Motifs are the building blocks of themes and phrases, which build sections, which build the piece. The famous one is Beethoven\'s Fifth: four notes, G–G–G–E♭, the motif of fate, repeated, varied and developed across the whole first movement. <strong>Deceptively simple and enormously powerful.</strong> That is the standard to aim at, and note what it is not : it is not clever, and it is not long.',
    'A motif does three jobs. It <strong>gives your music identity</strong>, a signature sound. It <strong>unifies the composition</strong>, because repeating and developing one idea creates cohesion. And it <strong>gets you unstuck</strong> : starting from a motif beats staring at an empty bar.',
    'There are three ways in, and they are all cheap to try. <strong>Start with an interval.</strong> An interval is the distance between two notes, and different distances carry different feelings: a perfect fifth is heroic and grand, a minor seventh introspective and mysterious, an augmented fourth full of tension and intrigue. Choose the interval and you have already set the emotional tone. <strong>Start with a rhythm.</strong> Rhythm alone evokes emotion : try a mix of shorter and longer notes, sing it, clap it, and add pitches afterwards. Or the reverse. <strong>Start with your surroundings.</strong> Birds, conversations, machinery: rhythmic and melodic ideas turn up in unexpected places.',
    '<strong>Do not reach for complexity.</strong> Compare a melody that is disjointed and hard to hum with one that is simple and cohesive, and most listeners pick the simple one every time : it is more recognisable, more memorable, and it has a stronger arc. A memorable melody is not harder to write than a forgettable one. It is the same work, aimed better.'
  ],
  ex:{
    beginner:'Compose a simple motif using an interval or rhythm.',
    intermediate:'Create three motifs. Choose your favourite to develop further.',
    advanced:'Set a timer for 30 seconds and compose three motifs within the time limit. For added challenge, work in an unfamiliar key : A♭, F♯, or B minor. Select your best motif to develop into a full melody.'
  },
  quiz:[
    { q:'What makes Beethoven\'s motif of fate effective?',
      o:['It is harmonically sophisticated','It is four notes, simple enough to develop across a movement','It uses an unusual scale','It is played by the whole orchestra'], a:1,
      why:'G–G–G–E♭. Deceptively simple, and that simplicity is what lets it be repeated, varied and developed throughout the first movement.' },
    { q:'You want a motif that sounds heroic and grand. Which interval does the book point you at?',
      o:['A minor second','A perfect fifth','A minor seventh','An augmented fourth'], a:1,
      why:'The perfect fifth. The minor seventh is introspective and mysterious; the augmented fourth adds tension and intrigue.' }
  ]
},

/* ---------------------------------------------------------------- 2 ------ */
{
  id:'prevade', module:'composition', n:2,
  title:'The PReVaDe method',
  short:'Presentation, Repetition, Variation, Destruction : how one motif becomes a phrase.',
  claim:'Random notes confuse the listener and one motif on repeat bores them. PReVaDe is the structure that sits between the two failures.',
  demo:'prevade',
  demoNote:'Write a motif in the top grid : click any cell, click it again to clear it. It starts on the Heart Of Courage motif from the book: a rest, then three notes up the bottom of A minor. The four slots fill themselves from what you write : except Destruction, which is new material by design. Reorder the slots with the arrows and watch the top point move.',
  source:'The Composition : The PReVaDe Method / Top Point: Creating a Climax',
  body:[
    'This method did not come from a conservatoire. It came from a high school guitar teacher in a blues improvisation class, and it solves a problem you can hear in two directions. Play random notes from the pentatonic scale and the result is chaotic and confusing for the listener. Repeat the same short bending motif over and over : the intro to <em>Johnny B. Goode</em> : and it turns monotonous. <strong>The method is the balance between those two failures:</strong> familiar enough to follow, new enough to stay interesting.',
    '<strong>Presentation.</strong> Introduce your motif. Play it clearly and with intention. <strong>Repetition.</strong> Play it again, to fix it in the listener\'s mind. <strong>Variation.</strong> Alter it slightly to keep interest : change the rhythm, the pitch, or the direction of the notes. <strong>Destruction.</strong> Finish with something entirely new.',
    '<strong>Destruction is the step that gets misread.</strong> It does not mean fragmenting the motif or grinding it down. It means a completely new ending, unrelated to the motif, that still feels natural and cohesive where it sits. In the book\'s worked example bar four is simply new material that rounds the phrase off. That surprise is the whole point of the step : and it is the best place in a phrase to put a climax or a dramatic shift.',
    '<strong>The order is not fixed.</strong> Presentation, Variation, Destruction, Repetition works. So does opening with the destruction. The book\'s own worked example runs Presentation, Variation, Repetition, Destruction : the variation arrives in bar two keeping the rhythm but turning the notes downward instead of upward, and bar three brings the motif back with two leading notes that carry it into the last bar.',
    'Then there is the <strong>top point</strong>. A melody wants a clear climax, a high moment that captures attention, and <strong>without one it risks sounding aimless or flat.</strong> In <em>Heart Of Courage</em> the motif is three notes climbing the bottom of the A minor scale, repeated three times with slight changes of pitch, then destroyed in the final bar by a new idea : a four-note downward scale. The highest note in the whole theme, an F, lands in that last bar. The climax and the destruction are the same moment, and that is not a coincidence.',
    'Two things keep it working. <strong>Keep it simple</strong>, because overly complex phrases confuse rather than captivate. And <strong>think of the phrase as a journey</strong> with peaks, contrasts and a clear resolution. These are guidelines to spark ideas, not laws : adjust the structure to suit your motif and the story you want to tell.'
  ],
  ex:{
    beginner:'Use your motif to write a melody with the PRVD or PVRD structure.',
    intermediate:'Write three melodies using different variations of the PRVD order.',
    advanced:'Break all the rules. Create a new structure using your motif that balances repetition and contrast. Or improvise one : sing or play it from beginning to end without stopping to think, and write down the best idea that emerges.'
  },
  quiz:[
    { q:'What does the Destruction step actually ask for?',
      o:['The motif broken into fragments and hammered','Something entirely new, unrelated to the motif','The motif played backwards','The motif at half speed'], a:1,
      why:'A completely new ending that rounds the phrase off : unrelated to the motif, but still natural and cohesive. It is also the best place in the phrase for a climax.' },
    { q:'A melody has no clear high point. What goes wrong?',
      o:['It sounds dissonant','It sounds aimless or flat','It sounds too short','It drifts out of key'], a:1,
      why:'The top point is the moment that captures attention. In Heart Of Courage the highest note of the theme lands in the final bar, on the destruction.' }
  ]
}
,

/* ---------------------------------------------------------------- 3 ------ */
{
  id:'question-answer', module:'composition', n:3,
  title:'Question and answer',
  short:'Two phrases in dialogue : one that asks, one that settles it.',
  claim:'Play your theme twice and it is a repeat. Change the note it lands on and it becomes a conversation.',
  demo:'qanda',
  demoNote:'The same theme twice. Click any note in the two strips to change where each phrase lands : the strips outline the notes each role is aiming at, and the tags under each letter show which of the three main chords it belongs to. Try landing both on C, then both on D, and hear what breaks.',
  source:'The Composition : Question & Answer: Using Question and Answer Roles / Applying Question and Answer Roles',
  body:[
    'You have a phrase. The next job is to expand it into a whole section : the opening of an orchestral piece, a verse, whatever you are building. The cheapest way to do that is not to write more material. It is to <strong>play what you have twice and give the two halves different jobs.</strong>',
    'A lot of great music runs on <strong>question and answer roles</strong>: one phrase asks, the next replies. It creates dialogue, and dialogue keeps a listener with you. All it takes is deciding where each phrase lands.',
    'The mechanism is tension and resolution, and it comes from two facts about a major scale. First, the <strong>leading tone</strong>: play C up to B and stop, and you can feel the B wanting to rise to C. The 7th step creates tension that resolves to the tonic. Second, the <strong>three main chords</strong> : in C major those are the tonic C major (C, E, G), the subdominant F major (F, A, C), and the dominant G major (G, B, D). Play G major and then C major and you hear the same thing at chord scale: the dominant creates tension, the tonic releases it.',
    'So: <strong>land the questioning phrase on a note from the dominant chord</strong> : G, B or D : and it hangs, unresolved. <strong>Land the answering phrase on a note from the tonic chord</strong> : C, E or G : and it closes. In the book\'s worked example the same theme appears twice, ending first on D and then on C. In a suitable harmonic context, that landing note can help turn a repeat into a conversation.',
    '<strong>What goes wrong is landing both phrases in the same place.</strong> End both on the tonic and the question answers itself, so the second phrase has nothing to do and the section sits still. End both on the dominant and nothing ever closes, which is exhausting rather than interesting. Other phrase designs also work; listen in the actual harmonic context.',
    'These are timeless techniques : you will find them in Mozart and Beethoven and in modern writing alike : and they are guidelines rather than rules. The summary of everything so far is short: build from motifs, balance repetition with variation, aim for a top point, and give your phrases question and answer roles.'
  ],
  ex:{
    beginner:'Take your phrase and land it on a note from the dominant chord : G, B or D. Then write the answer, landing on C, E or G.',
    intermediate:'In the questioning phrase, aim to land on a note from G major. In the answering phrase, resolve to a note from C major. Play around with the roles until you find a combination that feels satisfying.',
    advanced:'Build a full section by chaining two question-and-answer pairs, so the first pair\'s answer is itself a question for the second.'
  },
  quiz:[
    { q:'Which notes should a questioning phrase land on, in C major?',
      o:['C, E or G : the tonic chord','G, B or D : the dominant chord','F, A or C : the subdominant chord','Any note outside the scale'], a:1,
      why:'The dominant creates the tension. The answering phrase then resolves to a note of the tonic chord : C, E or G.' },
    { q:'Why is B the sharpest note to leave a question hanging on?',
      o:['It is the highest note in the scale','It is the leading tone, the 7th step that pulls back to the tonic','It is dissonant against every chord','It is outside the key'], a:1,
      why:'Play C up to B and stop, and you feel the B wanting to resolve to C. It is also a note of the dominant chord, so it does both jobs at once.' }
  ]
},

/* ---------------------------------------------------------------- 4 ------ */
{
  id:'harmony', module:'composition', n:4,
  title:'Harmony',
  short:'Choosing the chords that sit under a melody you have already written.',
  claim:'You do not guess at chords. You look at the notes you already wrote and find the chord that contains them.',
  demo:'harmony',
  demoNote:'Each cell shows how many of that bar\'s melody notes the chord actually contains : which is the chapter\'s method, done for you. Click any cell to set that bar\'s chord. Start from the primary chords, then swap in the substitutes and hear what changes.',
  source:'The Composition : Harmony: Choosing Chords / Substitutions and Tweaks',
  body:[
    'Melody first or harmony first? <strong>It genuinely does not matter</strong> : it is down to how you work. The author\'s own preference is melody first, on the grounds that building chords around a strong melodic idea is easier than squeezing a compelling melody out of a progression. Try both and find out which way round your brain works.',
    'At the core there are two kinds of chord. <strong>Major</strong> : happy, joyful, uplifting. <strong>Minor</strong> : sad, melancholic, introspective. Since you have already written the melody you already know the emotional tone you are after, so the first question is just whether the melody is in a major or a minor key.',
    'Then the method, and it is more mechanical than people expect. <strong>Look at the notes in your melody and identify which ones align with the notes in each chord.</strong> In C major, start with the primary chords : C (I), F (IV) and G (V) : and place them where they fit. The chapter\'s own worked example: the opening notes were C and G, so C major, because it contains both. The next three were F, G and A, so F major, because it contains F and A. The final note resolved back to C major for a strong sense of closure. That is the whole technique.',
    'If you are new to this, write the melody into your DAW and use the piano roll to line the notes up against the chords you are considering. Seeing it is much faster than hearing it.',
    'Then the <strong>substitutions</strong>, which is where the colour lives. Each primary chord has a minor relative that shares two of its three notes. <strong>D minor (ii) substitutes for F major</strong>, sharing F and A. <strong>A minor (vi) substitutes for C major</strong>, sharing C and E. <strong>E minor (iii) substitutes for G major</strong>, sharing G and B. Shared notes can smooth a substitution, but do not guarantee the same harmonic function. In particular, iii does not automatically preserve the dominant pull of V. Replacing F major with D minor shifts a passage from uplifting to bittersweet : <strong>and that works particularly well at a climactic moment, like the top point of your melody.</strong>',
    'In a minor key the same chords are available, but the root chord becomes the minor tonic : A minor (i) in A minor : and the fourth and fifth work differently. To get a proper dominant function you <strong>raise the third of E minor to make E major</strong> (E, G♯, B). That G♯ is the leading tone, and it is what gives you a strong resolution back to A minor, exactly as the question-and-answer lesson described.',
    'Experimentation is the whole job here. Try combinations, try substitutions, and trust your ear : there is no right or wrong as long as it sounds good to you.'
  ],
  ex:{
    beginner:'Write a chord progression using tonic, subdominant and dominant chords. In C major: C, F, G.',
    intermediate:'Create a progression using tonic, subdominant and dominant, but also include ii and vi : D minor and A minor in C major.',
    advanced:'Write two or three progressions: one using only tonic, subdominant and dominant, and the others adding chords like ii and vi. Listen to how each alters the melody\'s emotional tone. Then experiment with ♭II, ♭VI and ♭VII : D♭, A♭ and B♭ in C major : and watch the emotional impact shift.'
  },
  quiz:[
    { q:'How does the chapter say to pick the chord for a bar?',
      o:['Follow a standard progression','Match the bar\'s melody notes against the notes in each chord','Always alternate tonic and dominant','Pick whichever chord sounds loudest'], a:1,
      why:'Look at the notes you already wrote and find the chord that contains them. The worked example picks C major for a bar of C and G, then F major for a bar containing F and A.' },
    { q:'Why can D minor stand in for F major?',
      o:['They share two notes, F and A','They are both minor chords','They have the same root','They are both dominant chords'], a:0,
      why:'Sharing two notes can smooth the change while giving a different colour : uplifting becomes bittersweet, which works well at a climax.' }
  ]
},

/* ---------------------------------------------------------------- 5 ------ */
{
  id:'countermelody', module:'composition', n:5,
  title:'Countermelody',
  short:'A second line that supports the theme instead of fighting it.',
  claim:'A countermelody is a second line with a supporting role. Choose when it answers, overlaps or briefly takes the lead.',
  demo:'countermelody',
  demoNote:'The same two lines, separated three ways. Switch versions while it loops : the theme never changes, only what the second line does around it.',
  source:'The Composition : Countermelodies: How to Create a Countermelody',
  body:[
    'You have a theme. A good next move is a countermelody : but be clear about what that is. <strong>It is not a second melody competing for the listener\'s attention.</strong> It is a supporting element, there to add movement and interest to the main melody without overshadowing it. Get that distinction wrong and you have written two foreground parts, which may obscure the intended hierarchy.',
    '<strong>Rhythm and range do most of the work.</strong> The rule is simple and almost mechanical: when the main theme is active, let the countermelody rest; when the main theme rests, let the countermelody take over. You are filling the gaps, not the spaces that are already full. On top of that, put the two lines in different ranges : the more separation the better.',
    '<strong>Then tone colour.</strong> Give the countermelody a different colour from the theme. If the melody is the full, warm sound of flutes and violins, the countermelody might take the bright, characteristic tone of an oboe or a bassoon. A heroic horn theme is well answered by strings. You can use similar colours : strings throughout, say : but then you are leaning entirely on rhythm, range and articulation to keep them apart, so you have to be stricter about all three.',
    'Two shapes worth knowing. A <strong>call and response</strong>, where a string theme and a horn countermelody trade phrases. And an <strong>echo</strong>, where the countermelody restates the main theme in a simpler form, filling the gaps without ever competing.',
    '<strong>Reuse the motif.</strong> Take part of your main motif into the countermelody in a simplified form : the same leap, fewer notes. It keeps the whole thing cohesive while still giving you variety, which is the balance the entire module runs on.'
  ],
  ex:{
    beginner:'Try creating a simple countermelody for your theme. Keep it straightforward.',
    intermediate:'Take the same countermelody and experiment with tone colours, rhythms and ranges until the theme clearly stays in front.',
    advanced:'Write one countermelody as a call and response with the theme, and another that echoes the theme in simplified form. Use part of your main motif in both.'
  },
  quiz:[
    { q:'When should a countermelody move?',
      o:['At the same time as the theme, in harmony','While the theme rests','Only at the end of a phrase','Continuously, throughout'], a:1,
      why:'When the theme is active the countermelody rests, and when the theme rests the countermelody takes over. That alternation is what stops the two lines competing.' },
    { q:'Your theme and countermelody are both in the strings. What follows?',
      o:['It cannot work : change one instrument','You have to lean harder on rhythm, range and articulation','Double the countermelody to make it louder','Put them in the same register for blend'], a:1,
      why:'Similar tone colours are allowed, but then colour is not doing any separating, so the other tools have to work harder.' }
  ]
},

/* ---------------------------------------------------------------- 6 ------ */
{
  id:'ostinato', module:'composition', n:6,
  title:'Ostinatos and textures',
  short:'A repeating pattern that drives the music without stealing it.',
  claim:'An ostinato supplies recurring motion. Its rhythm, register and level determine how much attention it attracts.',
  demo:'ostinato',
  demoNote:'Change what the pattern is made of and how much it moves, with the melody on top. Turn the melody off to hear the pattern alone, then back on to judge whether it is still supporting or has started competing.',
  source:'The Composition : Making Ostinatos & Textures: What Is an Ostinato?',
  body:[
    'Another way to add flair and drive is an ostinato. <strong>An ostinato is a melodic pattern that repeats over and over</strong> : the driving figures in <em>The Dark Knight</em>, the pattern that runs through Ravel\'s <em>Boléro</em>, riffs like The Who\'s <em>Baba O\'Riley</em>. The repetition is the point, not a limitation.',
    'For the material, stay close to what is already there. <strong>Use parts of scales</strong> : the first few notes of a major or minor scale, repeated in a pattern. <strong>Arpeggios work well</strong> as a foundation, being a chord played one note at a time. <strong>A safe bet is the tonic chord</strong> : C major in a C major track.',
    '<strong>And a specific trick worth remembering: to make an ostinato more neutral, use only octaves and fifths and leave out the third.</strong> The third is what commits a chord to major or minor, so dropping it gives you a pattern that can support major or minor, but still needs checking against the actual harmony.',
    'Then the part people get wrong. <strong>Shake up the rhythmic pattern to make it more exciting : but keep it simple and repetitive, so it does not take attention from the melody.</strong> Those pull against each other on purpose. Extra movement and unpredictability can draw attention toward the ostinato, and the foreground already has a tenant. Make sure it is clearly separated from the other layers, and when in doubt, make it duller.'
  ],
  ex:{
    beginner:'Build an ostinato from the first notes of your track\'s scale, and loop it under your theme.',
    intermediate:'Write the same ostinato three ways : as a scale fragment, as a tonic arpeggio, and as octaves and fifths with no third. Keep the one that gets out of the way best.',
    advanced:'Shake up the rhythm until the ostinato is genuinely exciting on its own, then put the melody back and cut it back until the melody clearly leads again.'
  },
  quiz:[
    { q:'Why leave the third out of an ostinato?',
      o:['It is hard to play quickly','It makes the pattern neutral, since the third is what commits it to major or minor','Thirds are dissonant','It makes the ostinato louder'], a:1,
      why:'Octaves and fifths only. Without the third the pattern does not commit to major or minor, but it can still clash with the harmony above it.' },
    { q:'You make your ostinato rhythmically more interesting. What is the risk?',
      o:['It will clash harmonically','It starts taking attention from the melody','It will be too quiet','It will shorten the loop'], a:1,
      why:'The chapter asks for both at once : shake it up, but keep it simple and repetitive so it does not pull focus. Extra movement always costs you foreground.' }
  ]
}

];

/* Contextual teaching corrections and action-first captions. */
const lessonById = id => LESSONS.find(l=>l.id===id);
const CAPTIONS = {
 overtones:'Play a sustained tone. Change one harmonic amplitude and compare the same sound. Ratios are exact; note names are approximate.',
 perspective:'Play, solo a layer, then change its level, activity or variation. The focus estimate is an explanatory model, not a measurement of attention.',
 separation:'Keep the same source notes and change register, rhythm, articulation or sampled instrument independently.',
 'tone-colour':'Compare the same pitch or phrase on six sampled instruments. The spectrum measures the playing audio. Performance references use different passages.',
 voicing:'Move a note with its selector or arrow keys. Retain C, E and G, try wider low spacing, then compare your result with A.',
 'voice-leading':'Follow each voice through four bars of Am, F, C and G. Solo a line, edit its notes, then compare block chords with smaller movements.',
 motifs:'Write notes, rests and durations. Save your motif so the following five lessons can develop the same sketch.',
 prevade:'Develop your saved motif. Reorder phrase slots, vary the material, and write an independent new ending. Keep two versions to compare.',
 'question-answer':'Change the ending of each phrase. Compare melody alone, question alone and answer alone, then listen over V and I.',
 harmony:'Choose a chord for each four-beat bar. Give sustained and accented melody notes particular attention, then compare harmonisations.',
 countermelody:'Write a supporting line, solo it, then restore the theme. Try filling rests and deliberately overlapping before judging the result.',
 ostinato:'Edit a repeating pattern, its rests, lengths and accents. Toggle the melody to hear whether the pattern supports it.'
};
LESSONS.forEach(l=>l.demoNote=CAPTIONS[l.id]);
lessonById('voice-leading').body[4]='Then add inner movement. A suspension has a preparation, dissonance against the new harmony, and resolution. For example, hold G into a D major chord, then resolve it down to F♯. A common tone that stays consonant is not automatically a suspension. Check the motion of every voice.';
lessonById('voice-leading').quiz[1]={q:'A prepared G is held over D major, then resolves down to F♯. What does this demonstrate?',o:['A 4–3 suspension','A modulation','A parallel octave','A tempo change'],a:0,why:'G becomes a dissonant fourth over D, then resolves down to the chord third. A held note alone is not enough to identify a suspension.'};
lessonById('question-answer').body.push('These are starting points for this exercise. A non-chord ending may create more tension, not less. Rhythm, metre, bass and the surrounding harmony all affect closure.');
lessonById('countermelody').quiz[0]={q:'For a first call-and-response exercise, where is a useful place for the response?',o:['In a rest in the theme','On every theme note','Always above the theme','Always at full volume'],a:0,why:'A rest leaves space for a clear response. Overlapping countermelodies can also work when their roles remain clear.'};
lessonById('prevade').quiz[1]={q:'How can a late high note help shape this exercise?',o:['It can create a point of arrival','It guarantees a good melody','It makes every chord consonant','It is required in every style'],a:0,why:'A late high note is one way to shape an arc. Dynamics, rhythm and harmony can also create a climax.'};
lessonById('harmony').body.push('A note-count match is a clue, not a musical quality score. Sustained notes, strong beats, bass motion and harmonic direction all matter.');
lessonById('voicing').body.push('The checks evaluate this C-major exercise, not every valid chord or style. Close upper voices may sound clear while the same intervals lower down sound dense.');
