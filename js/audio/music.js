// Whale Road: procedural music. Original compositions, synthesised with Web Audio.
//
//   Music.init()          call from the first user gesture (iOS); safe to call twice
//   Music.play(theme)     crossfades (about 2 s) to a theme; one-shot themes (victory,
//                         defeat) play once, then return to the last calm theme
//   Music.setVolume(0..1) Music.stop()  Music.current()  Music.list()
//
// Each theme is written by hand: a mode, chords, and melodies in scale degrees with
// durations in beats, laid out as sections (intro, A, A', B, A', tail). The arranger adds
// drone, pad, arpeggio, bass and drums from per-theme patterns. Repeats bring small
// seeded variations (passing notes, turns, grace notes, a quieter pass every third cycle)
// so the loop never sounds identical and never sounds random.

import * as I from './instruments.js';

// ------------------------------------------------------------------ modes

const MODES = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  hijaz: [0, 1, 4, 5, 7, 8, 10],          // Phrygian dominant
  ukrdorian: [0, 2, 3, 6, 7, 9, 10],      // dorian with raised fourth
};

// ------------------------------------------------------------------ the themes
//
// Melody strings: "deg/beats" tokens, "r/beats" rests, "|" bar lines (ignored).
// A degree may carry # or b (chromatic) and ! (accent). Degrees count from the tonic of
// the mode (0), negative below, 7 = octave. Chords: [degree, beats, shape?], shape
// 5 = open fifth, s = sus2. Patterns: one character per step, steps spread evenly over a bar.
//   arp:   0-5 chord tone (0 root, 1 third, 2 fifth, 3 octave...), S strum, . rest
//   bass:  R root, F fifth, O octave, . rest
//   drums: X/x frame drum, O/o low tom, t tap, s shaker, . rest
// Section l: layers used (m melody, p pad, a arp, b bass, d drums); default all.

const THEMES = {
  title: {
    bpm: 64, bar: 4, root: 62, mode: 'aeolian', wet: 0.42,
    drone: {k: 'gurdy', n: [-24, -17], g: 0.085},
    pad: {k: 'choir', g: 0.12, vowel: 'a'},
    arp: {i: 'harp', p: ['0...1...2...3...', '0...2...3...1...'], g: 0.5},
    bass: {i: 'bass', p: 'R...............', g: 0.55},
    drums: {p: ['O...........o...'], g: 0.5},
    mel: {i: 'flute', g: 0.32},
    amb: [['wind', 0.05], ['sea', 0.05]],
    sec: {
      I: {m: '0/1.5 4/0.5 7/2 | r/1 4/1 7/1 9/1 | 7/3 4/1 | 7/4', c: [[0, 8], [6, 4], [0, 4]], i: 'horn', l: 'mp'},
      A: {m: '4/1.5 3/0.5 2/1 0/1 | 2/1.5 0/0.5 -2/2 | 4/1 6/1 7/1.5 6/0.5 | 4/1 3/1 1/2', c: [[0, 4], [5, 4], [2, 4], [6, 4]]},
      A2: {m: '4/1.5 3/0.5 2/1 0/1 | 2/1.5 0/0.5 -2/2 | 1/1 3/1 4/1 6/1 | 7/4', c: [[0, 4], [5, 4], [6, 4], [0, 4]]},
      B: {m: '9/2 7/1 6/1 | 8/2 6/1 4/1 | 7/1.5 5/0.5 4/1 2/1 | 3/2 4/1 6/1', c: [[2, 4], [6, 4], [5, 4], [6, 4]], i: 'horn', h: -2, o: 12, v: 1.1},
      T: {m: 'r/8 0/1.5 4/0.5 7/4 r/2', c: [[0, 8], [5, 4], [0, 4]], i: 'horn', l: 'mpa', v: 0.8},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1,
  },

  norse: { // home fjord: lyre and bone flute, 3/4, E dorian
    bpm: 100, bar: 3, root: 64, mode: 'dorian', wet: 0.33,
    drone: {k: 'soft', n: [-24, -17], g: 0.07},
    pad: {k: 'soft', g: 0.11},
    arp: {i: 'lyre', p: ['0.2.32', '0.2.3.'], g: 0.5},
    bass: {i: 'bass', p: 'R.....', g: 0.45},
    drums: {p: ['x.....', 'x...t.'], g: 0.48},
    mel: {i: ['flute', 'kantele'], g: 0.3},
    amb: [['sea', 0.08], ['gulls', 0.05]],
    sec: {
      I: {c: [[0, 6], [6, 6]], l: 'ap'},
      A: {m: '4/1.5 3/0.5 4/1 | 2/1 0/1 1/1 | 2/1.5 3/0.5 5/1 | 4/2 3/1 | 4/1 6/1 7/1 | 6/1.5 5/0.5 3/1 | 4/1 3/1 2/1 | 1/3',
        c: [[0, 6], [3, 6], [0, 3], [6, 3], [0, 3], [6, 3]], l: 'mapb'},
      A2: {m: '4/1.5 3/0.5 4/1 | 2/1 0/1 1/1 | 2/1.5 3/0.5 5/1 | 4/2 3/1 | 4/1 6/1 7/1 | 6/1.5 5/0.5 3/1 | 4/1 6/0.5 4/0.5 1/1 | 0/3',
        c: [[0, 6], [3, 6], [0, 3], [6, 3], [4, 3], [0, 3]]},
      B: {m: '9/2 7/1 | 6/1 7/1 9/1 | 8/2 6/1 | 3/1 5/1 6/1 | 7/1.5 6/0.5 5/1 | 3/3 | 4/1 6/1 8/1 | 6/1.5 5/0.5 3/1',
        c: [[2, 6], [6, 6], [3, 6], [4, 3], [6, 3]], i: 'flute', v: 1.08},
      T: {c: [[0, 6], [6, 3], [0, 3]], l: 'ap', v: 0.8},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1,
  },

  dane: { // Heiðabýr market: bright D mixolydian, bustling
    bpm: 108, bar: 4, root: 62, mode: 'mixolydian', wet: 0.28,
    drone: {k: 'gurdy', n: [-24, -17], g: 0.06},
    arp: {i: 'lyre', p: ['0.2.3.2.0.2.3.2.', '0.2.3.2.1.2.3.2.'], g: 0.42},
    bass: {i: 'bass', p: 'R.......F.......', g: 0.4},
    drums: {p: ['x...t...x.x.t...', '....s.......s.s.'], g: 0.42},
    pad: {k: 'soft', g: 0.07},
    mel: {i: ['flute', 'flute', 'lyre'], g: 0.3},
    amb: [['murmur', 0.035], ['gulls', 0.045], ['sea', 0.04]],
    sec: {
      I: {c: [[0, 4], [6, 4]], l: 'abd'},
      A: {m: '0/0.5 2/0.5 4/1 4/0.5 5/0.5 4/1 | 6/1.5 4/0.5 3/1 1/1 | 2/1 4/1 7/1.5 6/0.5 | 4/0.5 3/0.5 1/1 0/2',
        c: [[0, 4], [6, 4], [0, 4], [6, 2], [0, 2]]},
      A2: {m: '0/0.5 2/0.5 4/1 4/0.5 5/0.5 4/1 | 6/1.5 4/0.5 3/1 1/1 | 2/1 4/1 5/1 6/1 | 7/3 r/1',
        c: [[0, 4], [6, 4], [3, 4], [0, 4]]},
      B: {m: '5/1.5 3/0.5 5/1 7/1 | 4/1.5 2/0.5 4/2 | 3/0.5 4/0.5 5/1 7/1 5/1 | 4/1 6/1 3/2',
        c: [[3, 4], [0, 4], [3, 4], [4, 2], [6, 2]], v: 1.06},
      T: {c: [[0, 4], [6, 2], [0, 2]], l: 'abd', v: 0.85},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1,
  },

  east: { // Birka and the Baltic: misty A aeolian, tagelharpa drone, harp, low flute
    bpm: 72, bar: 4, root: 57, mode: 'aeolian', wet: 0.45,
    drone: {k: 'tagel', n: [-12, -5], g: 0.09},
    pad: {k: 'soft', g: 0.09},
    arp: {i: 'harp', p: ['0.....2.....3...', '0.....2...1.2...'], g: 0.5},
    drums: {p: ['o.......o.o.....'], g: 0.38},
    mel: {i: ['flute', 'harp'], g: 0.3, o: 0},
    amb: [['wind', 0.05], ['river', 0.06]],
    sec: {
      I: {c: [[0, 8]], l: 'ap'},
      A: {m: '4/2 3/1 2/1 | 0/3 r/1 | 2/1 3/1 4/1 6/1 | 4/4', c: [[0, 8], [6, 4], [0, 4]]},
      A2: {m: '4/2 3/1 2/1 | 0/3 r/1 | 6/1 4/1 3/1 2/1 | 0/4', c: [[0, 8], [6, 4], [0, 4]]},
      B: {m: '7/2 6/1 4/1 | 6/3 4/1 | 9/2 7/1 6/1 | 4/2 3/1 6/1', c: [[5, 4], [6, 4], [2, 4], [6, 4]], v: 1.08},
      T: {c: [[0, 4], [6, 4]], l: 'ap', v: 0.8},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1,
  },

  slav: { // the river road: G with raised fourth, gurdy drone, quick dance
    bpm: 132, bar: 4, root: 55, mode: 'ukrdorian', wet: 0.27,
    drone: {k: 'gurdy', n: [-12, -5], g: 0.075},
    bass: {i: 'bass', p: 'R.F.R.F.', g: 0.32},
    drums: {p: ['X.tx.xt.', '....s.s.'], g: 0.45},
    arp: {i: 'lyre', p: ['S.......', 'S...S...'], g: 0.34},
    mel: {i: ['flute', 'kantele'], g: 0.3},
    amb: [['wind', 0.03], ['river', 0.045]],
    sec: {
      I: {c: [[0, 8]], l: 'bd'},
      A: {m: '4/0.5 3/0.5 4/0.5 5/0.5 4/0.5 3/0.5 2/0.5 1/0.5 | 2/0.5 1/0.5 0/1 -3/1 0/1 | 1/0.5 3/0.5 5/0.5 3/0.5 1/1 3/1 | 4/0.5 3/0.5 2/0.5 1/0.5 0/2',
        c: [[0, 8], [1, 4], [0, 4]]},
      A2: {m: '4/0.5 3/0.5 4/0.5 5/0.5 4/0.5 3/0.5 2/0.5 1/0.5 | 2/0.5 1/0.5 0/1 -3/1 0/1 | 2/0.5 4/0.5 6/0.5 4/0.5 2/1 1/1 | 4/1 3/1 0/2',
        c: [[0, 8], [2, 4], [4, 2], [0, 2]]},
      B: {m: '7/0.5 6/0.5 7/0.5 9/0.5 7/1 6/0.5 4/0.5 | 5/0.5 3/0.5 5/0.5 6/0.5 5/1 3/1 | 6/0.5 7/0.5 9/0.5 7/0.5 6/0.5 4/0.5 2/1 | 3/0.5 5/0.5 3/0.5 1/0.5 3/2',
        c: [[2, 4], [1, 4], [2, 4], [1, 4]], i: 'flute', v: 1.1},
      T: {c: [[0, 4], [1, 2], [0, 2]], l: 'bd', v: 0.85},
    },
    form: ['I', 'A', 'A2', 'B', 'B', 'A2', 'T'], loopFrom: 1, orn: 1.3,
  },

  byzantine: { // Miklagarðr: hijaz mode, oud, frame drum, choir ison
    bpm: 92, bar: 4, root: 62, mode: 'hijaz', wet: 0.4,
    drone: {k: 'ison', n: [-12], g: 0.12},
    drums: {p: ['O.t.tO.t', '.......s'], g: 0.3},
    arp: {i: 'oud', p: ['0.......2...1...', '0...2.......3...'], g: 0.38},
    bass: {i: 'bass', p: 'R.......R...F...', g: 0.26},
    mel: {i: 'oud', g: 0.46, o: 0},
    amb: [['murmur', 0.025], ['sea', 0.035]],
    sec: {
      I: {c: [[0, 8]], l: 'd'},
      A: {m: '4/1 3/0.5 2/0.5 1/1 0/1 | 1/0.5 2/0.5 3/1 2/2 | 3/0.5 4/0.5 5/0.5 4/0.5 3/1 2/0.5 1/0.5 | 0/4', c: [[0, 8], [1, 4], [0, 4]]},
      A2: {m: '4/1 3/0.5 2/0.5 1/1 0/1 | 1/0.5 2/0.5 3/1 2/2 | 5/0.5 4/0.5 3/0.5 4/0.5 5/1 6/1 | 4/1 2/1 1/0.5 2/0.5 0/1', c: [[0, 8], [3, 4], [0, 4]]},
      B: {m: '8/1.5 7/0.5 6/1 5/1 | 5/1 4/0.5 3/0.5 4/2 | 5/0.5 4/0.5 3/0.5 2/0.5 1/1 2/1 | 0/2 r/2', c: [[6, 4], [3, 4], [1, 4], [0, 4]], i: ['chant', 'oud'], v: 1.05},
      T: {c: [[0, 8]], l: 'da', v: 0.85},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1, orn: 1.4,
  },

  west: { // Saxon and Gael lands: G major, lilting 6/8, harp and whistle-like flute
    bpm: 168, bar: 6, root: 55, mode: 'ionian', wet: 0.34,
    drone: {k: 'soft', n: [-12, -5], g: 0.055},
    pad: {k: 'soft', g: 0.08},
    arp: {i: 'harp', p: ['02.32.', '0.2.3.'], g: 0.48},
    bass: {i: 'bass', p: 'R.....', g: 0.45},
    drums: {p: ['X.xx.x'], g: 0.33},
    mel: {i: ['flute', 'harp'], g: 0.3},
    amb: [['sea', 0.05], ['gulls', 0.04]],
    sec: {
      I: {c: [[0, 6], [4, 6]], l: 'ap'},
      A: {m: '4/2 2/1 4/2 7/1 | 5/2 7/1 5/2 3/1 | 4/2 2/1 1/2 0/1 | 1/2 -1/1 1/3', c: [[0, 6], [3, 6], [0, 6], [4, 6]]},
      A2: {m: '4/2 2/1 4/2 7/1 | 5/2 7/1 5/2 3/1 | 4/2 6/1 8/2 6/1 | 7/5 r/1', c: [[0, 6], [3, 6], [4, 6], [0, 6]]},
      B: {m: '9/2 8/1 7/2 5/1 | 8/2 6/1 4/2 6/1 | 7/2 5/1 3/2 5/1 | 4/2 5/1 6/2 4/1', c: [[5, 6], [4, 6], [3, 6], [4, 6]], i: 'flute', v: 1.08},
      T: {c: [[0, 6], [3, 3], [0, 3]], l: 'ap', v: 0.8},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1, orn: 1.5,
  },

  frank: { // Frankish abbey: D dorian chant, bell, lyre
    bpm: 66, bar: 4, root: 62, mode: 'dorian', wet: 0.5,
    drone: {k: 'ison', n: [-24, -17], g: 0.08},
    pad: {k: 'choir', g: 0.08, vowel: 'o'},
    arp: {i: 'lyre', p: ['0...2...3...2...'], g: 0.36},
    drums: {p: ['o...............'], g: 0.28},
    mel: {i: ['chant', 'flute'], g: 0.34},
    bells: {n: [-12, -5], every: 'section', g: 0.5},
    amb: [['wind', 0.03]],
    sec: {
      I: {c: [[0, 8]], l: 'p'},
      A: {m: '0/1 1/1 2/2 | 3/1 2/1 1/1 2/1 | 3/2 4/1 3/1 | 2/2 1/1 0/1', c: [[0, 8], [3, 4], [0, 4]]},
      A2: {m: '0/1 1/1 2/2 | 3/1 4/1 5/2 | 4/1 3/1 2/1 1/1 | 0/4', c: [[0, 4], [3, 4], [6, 4], [0, 4]]},
      B: {m: '4/2 5/1 6/1 | 6/2 5/1 4/1 | 3/1 4/1 5/2 | 4/3 2/1', c: [[2, 4], [6, 4], [3, 4], [4, 4]], v: 1.06},
      T: {c: [[0, 8]], l: 'pa', v: 0.8},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1, orn: 0.3,
  },

  island: { // Iceland and the Faroes: sparse, windy, cold
    bpm: 58, bar: 4, root: 64, mode: 'aeolian', wet: 0.55,
    drone: {k: 'cold', n: [-12, -5, 7], g: 0.05},
    pad: {k: 'cold', g: 0.08},
    arp: {i: 'harp', p: ['0.......3.......', '0...........2...'], g: 0.42},
    mel: {i: ['flute', 'harp'], g: 0.27},
    amb: [['wind', 0.13], ['sea', 0.04]],
    sec: {
      I: {c: [[0, 8, 5]], l: 'p'},
      A: {m: '4/3 3/1 | 4/4 | r/2 7/1 6/1 | 4/4', c: [[0, 8, 5], [5, 8, 's']]},
      A2: {m: '4/3 3/1 | 2/2 0/2 | r/2 1/1 2/1 | 0/4', c: [[0, 8, 5], [6, 4, 's'], [0, 4, 5]]},
      B: {m: 'r/2 9/2 | 7/3 6/1 | 4/4 | r/4', c: [[3, 8], [0, 8, 5]], v: 0.95},
      T: {c: [[0, 8, 5]], l: 'p', v: 0.8},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1, orn: 0.4,
  },

  sea: { // open water: rocking 6/8, D dorian, waves
    bpm: 132, bar: 6, root: 62, mode: 'dorian', wet: 0.42,
    drone: {k: 'soft', n: [-24, -17], g: 0.065},
    pad: {k: 'soft', g: 0.1},
    arp: {i: 'harp', p: ['023202', '0.2.3.'], g: 0.38},
    bass: {i: 'bass', p: 'R.....', g: 0.38},
    mel: {i: ['flute', 'kantele', 'flute'], g: 0.28},
    amb: [['sea', 0.16], ['wind', 0.04], ['gulls', 0.03]],
    sec: {
      I: {c: [[0, 12]], l: 'ap'},
      A: {m: '4/3 3/2 2/1 | 0/6 | 2/3 3/2 4/1 | 5/6', c: [[0, 12], [3, 12]]},
      A2: {m: '4/3 3/2 2/1 | 0/6 | 2/3 4/2 6/1 | 7/6', c: [[0, 12], [6, 6], [0, 6]]},
      B: {m: '9/4 7/2 | 8/3 6/3 | 7/2 6/1 5/3 | 4/6', c: [[2, 6], [6, 6], [3, 6], [4, 6]], v: 1.05},
      T: {c: [[0, 6], [6, 6]], l: 'ap', v: 0.8},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'T'], loopFrom: 1,
  },

  storm: { // low drones, toms, rain and thunder; a low horn now and then
    bpm: 70, bar: 4, root: 48, mode: 'phrygian', wet: 0.4,
    drone: {k: 'dark', n: [-12, -5, 1], g: 0.13},
    pad: {k: 'dark', g: 0.16},
    drums: {p: ['o.....o.o...o...', 'O.......o.....o.'], g: 0.55},
    mel: {i: 'horn', g: 0.26, o: 12},
    amb: [['rain', 0.09], ['wind', 0.11], ['sea', 0.1], ['thunder', 0.5]],
    sec: {
      A: {m: '0/3 1/1 | 0/4 | -2/2 -1/2 | 0/4', c: [[0, 8], [1, 8]]},
      B: {m: 'r/16', c: [[5, 8], [1, 8]], l: 'pd'},
      C: {m: '4/3 5/1 | 4/4 | 1/2 2/2 | 0/4', c: [[0, 8], [1, 4], [0, 4]]},
      D: {m: 'r/16', c: [[0, 8], [6, 8]], l: 'p'},
    },
    form: ['B', 'A', 'D', 'C'], loopFrom: 0, orn: 0,
  },

  battle: { // driving drums, horn, urgent A aeolian
    bpm: 138, bar: 4, root: 57, mode: 'aeolian', wet: 0.24,
    drone: {k: 'gurdy', n: [-24, -17], g: 0.08},
    bass: {i: 'bass', p: 'R.R.F.R.R.R.F.R.', g: 0.36},
    drums: {p: ['O...O...O...O...', '..x...x...x.x.xx', 's.s.s.s.s.s.s.ss'], g: 0.5},
    pad: {k: 'dark', g: 0.1},
    mel: {i: 'horn', g: 0.3, o: 12},
    amb: [['sea', 0.05]],
    sec: {
      I: {c: [[0, 8]], l: 'bd'},
      A: {m: '0/1.5 0/0.5 4/2 | 3/1 2/1 3/1 4/1 | 0/1.5 0/0.5 6/1 5/1 | 4/4', c: [[0, 4], [6, 4], [0, 4], [4, 4]]},
      A2: {m: '0/1.5 0/0.5 4/2 | 3/1 2/1 3/1 4/1 | 5/1.5 4/0.5 3/1 2/1 | 0/4', c: [[0, 4], [6, 4], [5, 4], [0, 4]]},
      B: {m: '7/1 5/1 7/1 9/1 | 8/2 6/2 | 7/1 6/1 4/1 6/1 | 4/2 1/2', c: [[5, 4], [6, 4], [0, 4], [4, 4]], i: 'horn', h: -2, v: 1.08},
      D: {c: [[0, 4], [6, 4]], l: 'bdp'},
    },
    form: ['I', 'A', 'A2', 'B', 'A2', 'D'], loopFrom: 1, orn: 0.4,
  },

  victory: { // short fanfare, then back to the last calm theme
    bpm: 100, bar: 4, root: 62, mode: 'mixolydian', wet: 0.4, oneShot: true,
    drone: {k: 'gurdy', n: [-24, -17], g: 0.07},
    pad: {k: 'choir', g: 0.12, vowel: 'a', att: 0.4},
    drums: {p: ['X..xX..xX.xxXxxx', 'O...............'], g: 0.4},
    mel: {i: 'horn', g: 0.4, o: 12},
    sec: {
      A: {m: '0/0.5 0/0.5 4/1 4/0.5 4/0.5 7/1 | 6/0.5 7/0.5 9/1 7/2 | 7/4', c: [[0, 4], [6, 2], [0, 2], [0, 4]], h: -2, l: 'mpd'},
      T: {c: [[0, 4]], l: 'p', v: 0.7},
    },
    form: ['A', 'T'],
  },

  defeat: { // short lament
    bpm: 66, bar: 4, root: 57, mode: 'aeolian', wet: 0.5, oneShot: true,
    drone: {k: 'tagel', n: [-12, -5], g: 0.08},
    pad: {k: 'soft', g: 0.12},
    drums: {p: ['o...............'], g: 0.4},
    mel: {i: 'flute', g: 0.3},
    sec: {
      A: {m: '4/2 3/1 2/1 | 1/1.5 0/0.5 -1/2 | 0/4', c: [[0, 4], [5, 2], [6, 2], [0, 4]]},
      T: {c: [[0, 4]], l: 'p', v: 0.7},
    },
    form: ['A', 'T'], orn: 0,
  },

  tavern: { // lively 6/8 jig in A mixolydian, crowd and hearth
    bpm: 264, bar: 6, root: 57, mode: 'mixolydian', wet: 0.22,
    drone: {k: 'gurdy', n: [-12, -5], g: 0.045},
    arp: {i: 'lyre', p: ['S..S..', 'S..S.S'], g: 0.36},
    bass: {i: 'bass', p: 'R..F..', g: 0.34},
    drums: {p: ['X.xX.x', 't.....'], g: 0.34},
    mel: {i: ['flute', 'flute', 'kantele'], g: 0.28},
    amb: [['murmur', 0.07], ['hearth', 0.07], ['clinks', 0.35]],
    sec: {
      I: {c: [[0, 6], [6, 6]], l: 'abd'},
      A: {m: '4/1 2/1 4/1 7/2 4/1 | 6/2 5/1 3/2 1/1 | 0/1 2/1 4/1 7/1 6/1 7/1 | 6/1 5/1 3/1 4/3', c: [[0, 6], [6, 6], [0, 6], [6, 3], [0, 3]]},
      A2: {m: '4/1 2/1 4/1 7/2 4/1 | 6/2 5/1 3/2 1/1 | 0/1 2/1 4/1 7/1 6/1 7/1 | 3/1 1/1 -1/1 0/3', c: [[0, 6], [6, 6], [0, 6], [6, 3], [0, 3]]},
      B: {m: '5/1 7/1 5/1 3/2 5/1 | 4/1 2/1 4/1 0/2 2/1 | 3/1 5/1 7/1 8/2 7/1 | 6/1 5/1 3/1 4/2 6/1', c: [[3, 6], [0, 6], [3, 6], [6, 3], [4, 3]], v: 1.06},
    },
    form: ['I', 'A', 'A2', 'B', 'B', 'A', 'A2'], loopFrom: 1, orn: 1.2,
  },
};

// mix: gain, pan, reverb send per instrument
const MIX = {
  flute: [1, 0.12, 0.38], kantele: [1, 0.1, 0.4], horn: [1, -0.12, 0.45], chant: [1, 0, 0.55],
  lyre: [1, -0.28, 0.3], harp: [1, -0.22, 0.42], oud: [1, 0.05, 0.3], bass: [1.35, 0, 0.12],
  pad: [1.6, 0, 0.5], drone: [1.9, 0, 0.25], drums: [1, 0.08, 0.16], bell: [1, 0.2, 0.7], amb: [1.8, 0, 0.12],
};
const INST_OCT = {flute: 12, kantele: 12, horn: -12, chant: -12, lyre: 12, harp: 12, oud: 0};
const MEL_LVL = {flute: 0.62, kantele: 1.2, horn: 0.85, chant: 1.4, lyre: 1.2, harp: 1.2, oud: 2.1};
const PLUCKS = new Set(['lyre', 'harp', 'oud', 'kantele', 'bass']);

// ------------------------------------------------------------------ parsing helpers

function parseMel(str) {
  if (!str) return [];
  return str.split(/\s+/).filter(t => t && t !== '|').map(tok => {
    const [d, l] = tok.split('/');
    const dur = parseFloat(l);
    if (d === 'r') return {rest: true, dur};
    const m = /^(-?\d+)([#b]?)(!?)$/.exec(d);
    if (!m) throw new Error('bad melody token ' + tok);
    return {deg: +m[1], acc: m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, acc2: !!m[3], dur};
  });
}
const sum = arr => arr.reduce((a, n) => a + (n.dur ?? n[1]), 0);
function degMidi(scale, base, deg, acc = 0) {
  const n = scale.length, oct = Math.floor(deg / n), idx = deg - oct * n;
  return base + oct * 12 + scale[idx] + acc;
}
function chordDegs(deg, shape) {
  if (shape === 5) return [deg, deg + 4, deg + 7];
  if (shape === 's') return [deg, deg + 1, deg + 4];
  return [deg, deg + 2, deg + 4];
}
const wrap = (m, lo) => { while (m < lo) m += 12; while (m >= lo + 12) m -= 12; return m; };

/** Variation pass for repeats: passing tones, turns, grace notes. Keeps total duration. */
function vary(notes, rnd, amount) {
  if (amount <= 0) return notes.map(n => ({...n}));
  const out = [];
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (n.rest) { out.push({...n}); continue; }
    const nx = notes.slice(i + 1).find(x => !x.rest);
    const r = rnd();
    if (nx && n.dur >= 1 && Math.abs(nx.deg - n.deg) === 2 && r < 0.28 * amount) {
      out.push({...n, dur: n.dur / 2}, {deg: (n.deg + nx.deg) / 2, acc: 0, dur: n.dur / 2, soft: true});
    } else if (n.dur >= 1.5 && r < 0.4 * amount) {
      out.push({...n, dur: n.dur - 0.5}, {deg: n.deg + 1, acc: 0, dur: 0.25, soft: true}, {deg: n.deg, acc: n.acc, dur: 0.25, soft: true});
    } else {
      out.push({...n, grace: n.dur >= 1 && rnd() < 0.22 * amount});
    }
  }
  return out;
}

// ------------------------------------------------------------------ engine

class Engine {
  constructor(ctx) {
    this.ctx = ctx;
    this.voices = [];
    this.players = [];
    const master = I.gainNode(ctx, 1);
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    const trim = I.gainNode(ctx, 0.9);
    master.connect(lim); lim.connect(trim); trim.connect(ctx.destination);
    this.master = master;
    // music bus: glue compressor
    this.musicVol = I.gainNode(ctx, 0.5);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.3;
    this.musicBus = I.gainNode(ctx, 1);
    this.musicBus.connect(comp); comp.connect(this.musicVol); this.musicVol.connect(master);
    // reverb fed in mono: half the convolution work of a true-stereo input
    this.reverbIn = I.gainNode(ctx, 1);
    this.reverbIn.channelCount = 1; this.reverbIn.channelCountMode = 'explicit';
    const rev = ctx.createConvolver();
    rev.buffer = I.impulse(ctx, 1.9, 0.8);
    this.reverbIn.connect(rev); rev.connect(this.musicBus);
    // effects bus with its own short room
    this.sfxVol = I.gainNode(ctx, 0.64);
    this.sfxBus = I.gainNode(ctx, 1);
    this.sfxWet = I.gainNode(ctx, 1);
    this.sfxWet.channelCount = 1; this.sfxWet.channelCountMode = 'explicit';
    const room = ctx.createConvolver();
    room.buffer = I.impulse(ctx, 1.1, 0.7);
    this.sfxWet.connect(room); room.connect(this.sfxVol);
    this.sfxBus.connect(this.sfxVol); this.sfxVol.connect(master);
  }
  /** Voice budget: prio 0 melody always plays; 1 rhythm; 2 accompaniment. */
  voiceOK(t, end, prio) {
    this.voices = this.voices.filter(e => e > t);
    const n = this.voices.length;
    if ((prio === 2 && n >= 30) || (prio === 1 && n >= 40)) return false;
    this.voices.push(end);
    return true;
  }
  tick(horizon) {
    for (const p of this.players) p.schedule(horizon);
    const now = this.ctx.currentTime;
    this.players = this.players.filter(p => {
      if (p.dead && now > p.dead) { p.dispose(); return false; }
      return true;
    });
  }
}

class Player {
  constructor(eng, name, t0, fade, only = null) {
    const ctx = eng.ctx, d = THEMES[name];
    this.only = only; // test hook: render only some layers, e.g. 'm', 'p', 'drone', 'amb'
    this.eng = eng; this.ctx = ctx; this.name = name; this.def = d;
    this.scale = MODES[d.mode];
    this.beat = 60 / d.bpm;
    this.outDry = ctx.createGain(); this.outWet = ctx.createGain();
    for (const g of [this.outDry, this.outWet]) {
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(1, t0 + fade);
    }
    this.outDry.connect(eng.musicBus);
    this.wetLvl = I.gainNode(ctx, d.wet ?? 0.35);
    this.outWet.connect(this.wetLvl); this.wetLvl.connect(eng.reverbIn);
    this.ch = {};
    this.cycle = 0; this.formIdx = 0;
    this.nextSec = t0 + 0.05;
    this.queue = [];
    this.cutoff = Infinity; this.dead = 0; this.endTime = Infinity;
    this.seed = I.hash(name);
    this.cont = [];
    const want = k => !only || only.includes(k);
    if (d.drone && want('drone')) this.cont.push(I.drone(ctx, this.chan('drone'), t0, d.drone.n.map(n => d.root + n), d.drone.k, d.drone.g));
    (want('amb') ? d.amb || [] : []).forEach(([k, g], i) => {
      const a = I.ambience(ctx, this.chan('amb'), t0, k, g, this.seed + i * 101);
      this.cont.push(a);
    });
  }
  chan(name) {
    if (this.ch[name]) return this.ch[name];
    const ctx = this.ctx, [g, pan, rev] = MIX[name] || [1, 0, 0.3];
    const input = I.gainNode(ctx, g), p = I.panNode(ctx, pan), send = I.gainNode(ctx, rev);
    input.connect(p); p.connect(this.outDry); p.connect(send); send.connect(this.outWet);
    this.ch[name] = input;
    return input;
  }
  stop(t, fade) {
    for (const g of [this.outDry, this.outWet]) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + fade);
    }
    this.cutoff = t + fade;
    this.cont.forEach(c => c.stop(t + fade * 0.6));
    this.dead = t + fade + 3.5;
  }
  dispose() {
    try { this.outDry.disconnect(); this.outWet.disconnect(); this.wetLvl.disconnect(); } catch { /* gone */ }
  }
  at(t, prio, fn) { this.queue.push({t, prio, fn}); }
  schedule(horizon) {
    while (this.nextSec < horizon + 0.2 && this.nextSec < this.cutoff && this.endTime === Infinity) this.genSection();
    if (this.queue.length) {
      this.queue.sort((a, b) => a.t - b.t);
      let i = 0;
      for (; i < this.queue.length && this.queue[i].t < horizon; i++) {
        const e = this.queue[i];
        if (e.t < this.cutoff) e.fn(e.t);
      }
      if (i) this.queue.splice(0, i);
    }
    if (this.cutoff === Infinity) this.cont.forEach(c => c.schedule && c.schedule(horizon + 0.5));
  }

  // --- voices -------------------------------------------------------------------
  voice(inst, t, midi, dur, vel, prio) {
    const ctx = this.ctx, eng = this.eng;
    let est = t + dur + 0.5;
    if (PLUCKS.has(inst)) est = t + Math.min(2.5, dur + 1.5);
    if (inst === 'chant') est = t + dur + 1;
    if (!eng.voiceOK(t, est, prio)) return;
    const out = this.chan(inst);
    switch (inst) {
      case 'flute': I.flute(ctx, out, t, midi, dur, vel); break;
      case 'horn': I.horn(ctx, out, t, midi, dur, vel); break;
      case 'chant': I.choir(ctx, out, t, [midi], dur, vel, {att: 0.12, rel: 0.35, vowel: 'o', vib: 6}); break;
      default: I.pluck(ctx, out, t, midi, vel, inst, PLUCKS.has(inst) && dur > 2.4 ? 0 : Math.max(dur * 1.6, 0.6));
    }
  }

  genSection() {
    const d = this.def, name = d.form[this.formIdx], s = d.sec[name];
    const t0 = this.nextSec, beat = this.beat, bar = d.bar, sc = this.scale, root = d.root;
    const rnd = I.rng(this.seed + this.cycle * 1013 + this.formIdx * 31 + 7);
    let layers = s.l || 'mpabd';
    if (this.only) layers = [...layers].filter(c => this.only.includes(c)).join('');
    const quiet = !d.oneShot && this.cycle % 3 === 2;
    const vol = (s.v ?? 1) * (quiet ? 0.82 : 1);
    const mel = parseMel(s.m);
    const chords = s.c || d.sec.A.c;
    const lenBeats = Math.ceil(Math.max(sum(mel), sum(chords)) / bar - 1e-6) * bar;
    // chord timeline
    const tl = [];
    let cb = 0;
    while (cb < lenBeats) for (const c of chords) { if (cb >= lenBeats) break; tl.push({b: cb, e: cb + c[1], deg: c[0], shape: c[2]}); cb += c[1]; }
    const chordAt = b => tl.find(c => b >= c.b - 1e-6 && b < c.e - 1e-6) || tl[tl.length - 1];
    const T = b => t0 + b * beat;

    // melody
    if (mel.length && layers.includes('m') && d.mel) {
      const pick = v => Array.isArray(v) ? v[this.cycle % v.length] : v;
      const inst = pick(s.i || d.mel.i);
      const off = (INST_OCT[inst] ?? 0) + (s.o ?? d.mel.o ?? 0);
      const amt = this.cycle === 0 ? 0 : (d.orn ?? 1);
      const notes = vary(mel, rnd, amt);
      const total = sum(notes);
      const g = d.mel.g * (MEL_LVL[inst] ?? 1) * vol * (quiet ? 0.85 : 1);
      let b = 0;
      notes.forEach(n => {
        if (!n.rest) {
          const midi = Math.round(degMidi(sc, root + off, Math.floor(n.deg), n.acc) + (n.deg % 1 ? 1 : 0));
          const pos = b / total;
          let vel = g * (0.82 + 0.18 * Math.sin(Math.PI * pos)) * (n.soft ? 0.8 : 1) * (n.acc2 ? 1.15 : 1);
          if (Math.abs(b % bar) < 1e-6) vel *= 1.08;
          vel *= 0.94 + rnd() * 0.1;
          const t = T(b) + (rnd() - 0.5) * 0.012;
          const dur = n.dur * beat * (PLUCKS.has(inst) ? 1 : 0.94);
          if (n.grace && (inst === 'flute' || inst === 'oud' || inst === 'kantele')) {
            const gm = degMidi(sc, root + off, Math.floor(n.deg) + 1);
            this.at(t - 0.07, 0, tt => this.voice(inst, tt, gm, 0.06, vel * 0.7, 0));
          }
          this.at(t, 0, tt => this.voice(inst, tt, midi, dur, vel, 0));
          if (s.h) {
            const hm = degMidi(sc, root + off, Math.floor(n.deg) + s.h, 0);
            this.at(t + 0.004, 0, tt => this.voice(inst, tt, hm, dur, vel * 0.55, 0));
          }
        }
        b += n.dur;
      });
    }

    // pad chords
    if (d.pad && layers.includes('p')) {
      let prev = null;
      tl.forEach(c => {
        const lo = root - 7;
        const ms = chordDegs(c.deg, c.shape).map(x => wrap(degMidi(sc, root, x), lo));
        if (c.shape === 5) ms.push(wrap(degMidi(sc, root, c.deg), lo) + 12);
        const dur = (c.e - c.b) * beat;
        const g = d.pad.g * vol * (prev === c.deg ? 0.9 : 1);
        prev = c.deg;
        this.at(T(c.b), 2, tt => {
          if (!this.eng.voiceOK(tt, tt + dur + 2, 2)) return;
          if (d.pad.k === 'choir') I.choir(this.ctx, this.chan('pad'), tt, ms, dur + 0.3, g, {vowel: d.pad.vowel, att: d.pad.att});
          else I.pad(this.ctx, this.chan('pad'), tt, ms, dur + 0.3, g, {kind: d.pad.k});
        });
      });
    }

    // arpeggio / strum, bass, drums: bar by bar
    const bars = lenBeats / bar;
    for (let k = 0; k < bars; k++) {
      const barB = k * bar;
      if (d.arp && layers.includes('a')) {
        const pats = Array.isArray(d.arp.p) ? d.arp.p : [d.arp.p];
        const pat = pats[(k + this.cycle) % pats.length], step = bar / pat.length;
        [...pat].forEach((ch, i) => {
          if (ch === '.') return;
          const b = barB + i * step, c = chordAt(b);
          const lo = root - 12 + (d.arp.o ?? 0);
          const base = wrap(degMidi(sc, root, c.deg), lo);
          const degs = chordDegs(c.deg, c.shape);
          const toneOf = idx => base + (degMidi(sc, root, degs[idx % 3]) - degMidi(sc, root, degs[0])) + 12 * Math.floor(idx / 3);
          const vel = d.arp.g * vol * (i === 0 ? 1 : 0.78) * (0.9 + rnd() * 0.15);
          if (ch === 'S') {
            [0, 1, 2, 3].forEach((idx, j) => this.at(T(b) + j * 0.022, 2, tt => this.voice(d.arp.i, tt, toneOf(idx), step * beat * 2, vel * 0.7, 2)));
          } else {
            const m = toneOf(+ch);
            this.at(T(b) + (rnd() - 0.5) * 0.01, 2, tt => this.voice(d.arp.i, tt, m, step * beat * 3, vel, 2));
          }
        });
      }
      if (d.bass && layers.includes('b')) {
        const pat = d.bass.p, step = bar / pat.length;
        [...pat].forEach((ch, i) => {
          if (ch === '.') return;
          const b = barB + i * step, c = chordAt(b);
          const r = wrap(degMidi(sc, root, c.deg), root - 26);
          const m = ch === 'F' ? r + (degMidi(sc, root, c.deg + 4) - degMidi(sc, root, c.deg)) : ch === 'O' ? r + 12 : r;
          const vel = d.bass.g * vol * (i === 0 ? 1 : 0.8);
          this.at(T(b), 1, tt => this.voice('bass', tt, m, step * beat * 1.8, vel, 1));
        });
      }
      if (d.drums && layers.includes('d')) {
        const dv = d.drums.g * vol * (quiet ? 0.6 : 1);
        d.drums.p.forEach(pat => {
          const step = bar / pat.length;
          [...pat].forEach((ch, i) => {
            if (ch === '.') return;
            const t = T(barB + i * step) + (rnd() - 0.5) * 0.008;
            const v = dv * (0.88 + rnd() * 0.18);
            this.at(t, 1, tt => {
              if (!this.eng.voiceOK(tt, tt + 0.5, 1)) return;
              const out = this.chan('drums');
              switch (ch) {
                case 'X': I.frame(this.ctx, out, tt, v); break;
                case 'x': I.frame(this.ctx, out, tt, v * 0.6, {hi: true}); break;
                case 'O': I.tom(this.ctx, out, tt, v * 1.1); break;
                case 'o': I.tom(this.ctx, out, tt, v * 0.7, {lo: true}); break;
                case 't': I.tap(this.ctx, out, tt, v * 0.5); break;
                case 's': I.shaker(this.ctx, out, tt, v * 0.4); break;
              }
            });
          });
        });
      }
    }
    // bells at section starts (frank)
    if (d.bells && (name === 'A' || name === 'I' || name === 'B')) {
      d.bells.n.forEach((n, j) => this.at(t0 + j * beat * 2, 1, tt => {
        if (this.eng.voiceOK(tt, tt + 4, 1)) I.bell(this.ctx, this.chan('bell'), tt, root + n, d.bells.g * vol);
      }));
    }

    this.nextSec = t0 + lenBeats * beat;
    this.formIdx++;
    if (this.formIdx >= d.form.length) {
      if (d.oneShot) this.endTime = this.nextSec;
      else { this.formIdx = d.loopFrom ?? 0; this.cycle++; }
    }
  }
}

// ------------------------------------------------------------------ public API

let eng = null, cur = null, curName = null, lastCalm = null, queued = null;
let volume = 0.7, pending = null, timer = null;
const FADE = 2.0;
const TICK_MS = 50, AHEAD = 0.35;

const volCurve = v => 0.62 * Math.pow(I.clamp(+v || 0, 0, 1), 1.6);

function tick() {
  if (!eng) return;
  const ctx = eng.ctx;
  if (ctx.state !== 'running') return;
  eng.tick(ctx.currentTime + AHEAD);
  // one-shot finished: return to the queued or last calm theme
  if (cur && cur.def.oneShot && ctx.currentTime > cur.endTime - 1.2) {
    const next = queued || lastCalm;
    queued = null;
    if (next) start(next, 2.5);
    else { cur.stop(ctx.currentTime, 2.5); cur = null; curName = null; }
  }
}

function start(name, fade = FADE) {
  const ctx = eng.ctx, t = ctx.currentTime + 0.03;
  if (cur) cur.stop(t, fade);
  cur = new Player(eng, name, t, fade);
  eng.players.push(cur);
  curName = name;
  if (!THEMES[name].oneShot && name !== 'battle') lastCalm = name;
  eng.tick(ctx.currentTime + AHEAD);
}

function resume() {
  if (eng && eng.ctx.state !== 'running' && eng.ctx.state !== 'closed' && !document.hidden) {
    eng.ctx.resume().catch(() => {});
  }
}

/** Create the audio graph. Call from a user gesture (tap/click); safe to call again. */
export function init() {
  if (eng) { resume(); return; }
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return;
  let ctx;
  try { ctx = new AC({latencyHint: 'balanced'}); } catch { ctx = new AC(); }
  eng = new Engine(ctx);
  eng.musicVol.gain.value = volCurve(volume);
  eng.sfxVol.gain.value = sfxVolume;
  // iOS unlock: a silent buffer played inside the gesture
  try { const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0); } catch { /* fine */ }
  resume();
  const unlock = () => resume();
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, {passive: true}));
  document.addEventListener('visibilitychange', () => {
    if (!eng) return;
    if (document.hidden) { eng.ctx.suspend().catch(() => {}); clearInterval(timer); timer = null; }
    else { resume(); if (!timer) timer = setInterval(tick, TICK_MS); }
  });
  timer = setInterval(tick, TICK_MS);
  if (pending) { const p = pending; pending = null; play(p); }
}

/** Crossfade to a theme. Unknown names are ignored. */
export function play(theme) {
  if (!THEMES[theme]) return;
  if (!eng) { pending = theme; return; }
  resume();
  if (curName === theme && cur) return;
  // let a fanfare or lament finish; the requested theme follows it
  if (cur && cur.def.oneShot && !THEMES[theme].oneShot) { queued = theme; return; }
  queued = null;
  start(theme);
}

export function stop() {
  pending = null; queued = null;
  if (!eng || !cur) { curName = null; return; }
  cur.stop(eng.ctx.currentTime + 0.02, 1.5);
  cur = null; curName = null;
}

export function setVolume(v) {
  volume = I.clamp(+v || 0, 0, 1);
  if (eng) eng.musicVol.gain.setTargetAtTime(volCurve(volume), eng.ctx.currentTime, 0.08);
}

export const current = () => curName || pending;
export const list = () => Object.keys(THEMES);

// --- shared with sfx.js ---------------------------------------------------------
let sfxVolume = 0.64;
/** The shared context and effect buses, or null before init(). */
export function _bus() { return eng ? {ctx: eng.ctx, out: eng.sfxBus, wet: eng.sfxWet, vol: eng.sfxVol} : null; }
export function _setSfxVolume(v) {
  sfxVolume = v;
  if (eng) eng.sfxVol.gain.setTargetAtTime(v, eng.ctx.currentTime, 0.05);
}
export { Engine as _Engine };

// --- test helpers ---------------------------------------------------------------
/** Render `secs` of a theme into an OfflineAudioContext. Resolves to an AudioBuffer. */
export async function _renderOffline(theme, secs = 20, sampleRate = 44100, only = null) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OAC(2, Math.floor(secs * sampleRate), sampleRate);
  const e = new Engine(ctx);
  e.musicVol.gain.value = volCurve(1);
  const p = new Player(e, theme, 0, 0.05, only);
  e.players.push(p);
  // schedule while rendering (suspend/resume), like the live lookahead scheduler, so the
  // graph holds only the voices a real session would hold
  const step = 0.2;
  p.schedule(AHEAD);
  for (let t = step; t < secs - step; t += step) {
    const tt = Math.round(t * sampleRate / 128) * 128 / sampleRate;
    ctx.suspend(tt).then(() => { e.tick(tt + AHEAD); ctx.resume(); });
  }
  return ctx.startRendering();
}
/** Check every theme: melody and chord lengths per section must agree in whole bars. */
export function _validate() {
  const issues = [];
  for (const [name, d] of Object.entries(THEMES)) {
    if (!MODES[d.mode]) issues.push(`${name}: unknown mode`);
    for (const [k, s] of Object.entries(d.sec)) {
      const m = sum(parseMel(s.m)), c = sum(s.c || d.sec.A.c);
      if (m && Math.abs(m - c) > 1e-6) issues.push(`${name}.${k}: melody ${m} beats, chords ${c}`);
      if (Math.abs(c / d.bar - Math.round(c / d.bar)) > 1e-6) issues.push(`${name}.${k}: ${c} beats not whole bars of ${d.bar}`);
      // melody bar lines
      if (s.m) s.m.split('|').forEach((b, i, all) => { const l = sum(parseMel(b)); if (all.length > 1 && Math.abs(l - d.bar) > 1e-6) issues.push(`${name}.${k}: bar ${i + 1} has ${l} beats`); });
    }
    d.form.forEach(f => { if (!d.sec[f]) issues.push(`${name}: form uses missing section ${f}`); });
  }
  return issues;
}
