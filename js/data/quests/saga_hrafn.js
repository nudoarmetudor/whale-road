// Hrafn Half-Rhyme: the saga that needs an ending. See docs/STORY.md.
import {N, H, CAST as C, sagaQuest} from './lines.js';

const q = sagaQuest('hrafn');

export const HRAFN = [
  q(1, {
    title: 'A Song Half-Sung',
    giver: {port: 'jorvik', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Osgar Coppergate',
    offer: [
      N('Hrafn Half-Rhyme, the skald who never finishes. My feast is in a week. I need a song and I need mead.'),
      H('My songs are complete! They simply end in a... mysterious... way.'),
      N('Bring honey for the mead. And pay your moneylender something before he starts writing songs about YOU.'),
    ],
    steps: [
      {do: 'pay', silver: 500, port: 'jorvik', building: 'moneylender', text: 'Pay 500 s to Ulfcetel Sharp, the moneylender.'},
      {do: 'deliver', good: 'honey', qty: 15, port: 'jorvik', building: 'hall', text: 'Deliver 15 honey to Reeve Osgar for the feast mead.'},
    ],
    done: [
      N('Honey for a sea of mead, and you\'ve paid a debt. Are you ill?'),
      H('Inspired. A grey stranger at the moneylender\'s paid in silver so cold it frosted his beard. There\'s a song in that.'),
      N('Chase it, then. The Viscount of Rúðuborg throws a better feast than mine. Tell him I said so, and that I lied.'),
    ],
    reward: {silver: 1500, renown: 5, unlockPorts: ['rudaborg']},
  }),
  q(2, {
    title: 'Wine and Verse',
    giver: {port: 'rudaborg', building: 'hall', npc: 'frank_count'}, npcName: 'Viscount Anseau',
    offer: [
      N('A Northern poet in Rúðuborg. My grandfather would have locked the gates. I only lock the wine cellar.'),
      H('Then let me earn the key, my lord. A verse for your feast.'),
      N('Berthe the vintner makes honeyed wine and her bees have sulked all summer. Bring her honey, then sing for your cup.'),
    ],
    steps: [
      {do: 'deliver', good: 'honey', qty: 20, port: 'rudaborg', building: 'market', text: 'Deliver 20 honey to Berthe the vintner.'},
      {do: 'visit', port: 'rudaborg', building: 'hall', text: 'Perform at the Viscount\'s feast.', say: [
        N('"O Seine, broad river, gleaming and..." And? AND? You stopped!', C.anseau),
        H('It\'s a mysterious ending, my lord.'),
        N('It\'s maddening. I love it. Do another.', C.anseau),
      ]},
    ],
    done: [
      N('Buy our wine, poet. I\'ll look away when you buy Frankish blades elsewhere. Just never sell them here.'),
      N('A grey-cloaked man left Hamwic in a temper last week, and left behind a riddle-stick. Ask the Saxons.'),
      H('A riddle! Finally, a story whose ending I can\'t ruin.'),
    ],
    reward: {silver: 2000, renown: 5, unlockGoods: ['wine', 'blades']},
  }),
  q(3, {
    title: 'The Grey Stranger\'s Riddle',
    giver: {port: 'hamwic', building: 'hall', npc: 'saxon_reeve'}, npcName: 'Reeve Wynflæd',
    requiresRenown: 8,
    offer: [
      N('Poet, a grey man came wanting our fishermen\'s debts. We refused. He left a stick of runes on my table, and a chill.'),
      H('May I see it?'),
      N('Wine for my husband\'s name-day first. Then Brother Eadmer has it at the mead hall. He won\'t have it near the church.'),
    ],
    steps: [
      {do: 'deliver', good: 'wine', qty: 15, port: 'hamwic', building: 'hall', text: 'Deliver 15 wine to Reeve Wynflæd.'},
      {do: 'collect', item: 'q_riddle_stick', port: 'hamwic', building: 'meadhall', text: 'Collect the riddle-stick from Brother Eadmer.', say: [
        N('Take it, please. It hums at night, and it hums off-key.', C.eadmer),
        H('Notches. Hundreds of them, like a tally... with names beside them.'),
      ]},
    ],
    done: [
      N('Heiðabýr has a rune-carver who reads anything carved. Reeve Wynflæd has written to the Danes for you.', C.eadmer),
      H('A tally that hums. Either it\'s haunted or it\'s a very dull song.'),
    ],
    reward: {silver: 3000, renown: 6, unlockPorts: ['heidaby']},
  }),
  q(4, {
    title: 'Runes Nobody Can Read',
    giver: {port: 'heidaby', building: 'runecarver', npc: 'runecarver'}, npcName: 'Védís the Rune-Carver',
    requiresRenown: 12,
    offer: [
      N('A skald with a tally-stick. You know these runes are carved backwards and upside down?'),
      H('I assumed I was holding it wrong.'),
      N('My fee this season goes to Auðun\'s herring fleet. Bring his hall salt, then I\'ll read it to you.'),
    ],
    steps: [
      {do: 'deliver', good: 'salt', qty: 25, port: 'heidaby', building: 'hall', text: 'Deliver 25 salt to Auðun\'s hall as Védís\'s fee.'},
      {do: 'bring', item: 'q_riddle_stick', port: 'heidaby', building: 'runecarver', text: 'Bring the riddle-stick to Védís.', say: [
        N('It\'s a ledger. "Svartkell, owed by: Hamwic, Jórvík, Kaupang..." And a mark like a knot. Old magic.', C.vedis),
        N('Svartkell the Tallyman. A coin-weigher once. They say he went into the sea and came out owning it.', C.vedis),
      ]},
    ],
    done: [
      N('Kaupang and Ravnfjord are on his list, so go north. And buy iron while you\'re here. You\'ll need it.'),
      H('"He went into the sea and came out owning it." That\'s a first line, at least.'),
    ],
    reward: {silver: 4000, renown: 8, unlockPorts: ['kaupang', 'ravnfjord'], unlockGoods: ['iron']},
  }),
  q(5, {
    title: 'Thinbeard\'s Feast',
    giver: {port: 'ravnfjord', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Hallvarð Thinbeard',
    requiresRenown: 16,
    offer: [
      N('A skald! My last skald fell off a cliff mid-verse. Not your problem. Unless you\'re bad.'),
      H('I\'ve never finished a verse long enough to fall off anything.'),
      N('Iron for my hall\'s new door, a word with Ása at the altar, and a purse worth singing about. Then sing at my feast.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 20, port: 'ravnfjord', building: 'hall', text: 'Deliver 20 iron to Jarl Hallvarð.'},
      {do: 'visit', port: 'ravnfjord', building: 'altar', text: 'Hear what Ása the Hof-Keeper has seen.', say: [
        N('Grey ships, rowing without wind, the drowned at the oars. They lifted a hoard right out of our fjord.', C.asa),
        H('Svartkell\'s tally has a knot on it. Is that what moves the drowned?'),
        N('A knot from Rán\'s own net. Gods help us all.', C.asa),
      ]},
      {do: 'networth', amount: 15000, text: 'Grow your net worth to 15 000 s.'},
    ],
    done: [
      N('Your verse ended on "and then". Cruellest thing I ever heard. Everyone\'s arguing about it. Wonderful.'),
      N('Take a busse from my yard, and letters for Hlaðir and Hálogaland. Walrus ivory and furs come from there.'),
      H('A ship, for half a song? Imagine what I\'d get for a whole one.'),
      N('I\'d rather not.'),
    ],
    reward: {silver: 6000, renown: 10, ship: 'busse', unlockPorts: ['hladir', 'halogaland'], unlockGoods: ['ivory', 'furs']},
  }),
  q(6, {
    title: 'North of the Story',
    giver: {port: 'orkney', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Arnkell Tidewatcher',
    requiresRenown: 22,
    offer: [
      N('Skald, the grey ships passed my islands, with storm crows on their masts. The crows stayed to hunt the North Sea.'),
      N('One crow took my second-best helmet. I want it back, or avenged.'),
      H('I\'ll avenge it in verse, and in arrows if the verse falls short.'),
      N('Bring furs too. My hall is draughtier than a skald\'s excuses.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['storm_crow', 'storm_crow'], at: {sea: 'north_sea'}, text: 'Hunt the storm crows over the North Sea.'},
      {do: 'deliver', good: 'furs', qty: 20, port: 'orkney', building: 'hall', text: 'Deliver 20 furs to Jarl Arnkell.'},
    ],
    done: [
      N('The helmet\'s gone, but so are the crows. A fair trade.'),
      N('Færeyjar and Ísland are open to you. Icelanders remember everything; maybe they remember Svartkell.'),
      H('A memory as long as an Icelandic winter. Just what my song needs.'),
    ],
    reward: {silver: 8000, renown: 10, unlockPorts: ['faereyjar', 'island']},
  }),
  q(7, {
    title: 'The Lawspeaker\'s Memory',
    giver: {port: 'heidaby', building: 'hall', npc: 'jarl'}, npcName: 'Harbour-Jarl Auðun Broadbelt',
    requiresRenown: 28,
    offer: [
      N('Védís says you\'re chasing Svartkell\'s story. Birka banished him, but their records burned in a kitchen fire.'),
      N('Ísland\'s Lawspeaker recites every case ever heard at the Althing. Bring me the verdict and the Baltic is yours.'),
      H('To the edge of the world for a verdict. Skalds have gone further for less.'),
    ],
    steps: [
      {do: 'collect', item: 'q_outlaw_verdict', port: 'island', building: 'hall', text: 'Hear the old verdict from the Lawspeaker of Ísland.', say: [
        N('Svartkell, outlawed nine winters past for shaving silver and lying to the scales. He laughed at the verdict.', C.hildigunn),
        N('He swore he\'d own the sea. Then he jumped into it. Everyone assumed that was the end.', C.hildigunn),
      ]},
      {do: 'deliver', good: 'grain', qty: 30, port: 'faereyjar', building: 'hall', text: 'On the way home, deliver 30 grain to Færeyjar\'s hungry sheep-folds.'},
      {do: 'bring', item: 'q_outlaw_verdict', port: 'heidaby', building: 'hall', text: 'Bring the verdict to Auðun.', say: [
        N('Outlawed, drowned, and back again. That\'s not a man. That\'s a bad coin.', C.audun),
      ]},
    ],
    done: [
      N('Birka, Gotland and Truso are open to you. Truso\'s elder sends amber and greetings.'),
      H('Jumped into the sea and came out owning it. So the middle of the story is underwater.'),
    ],
    reward: {silver: 10000, renown: 12, unlockPorts: ['birka', 'gotland', 'truso'], unlockGoods: ['amber']},
  }),
  q(8, {
    title: 'Mockery at the Gate',
    giver: {port: 'gotland', building: 'hall', npc: 'jarl'}, npcName: 'Chieftain Hegvald Ten-Hoards',
    requiresRenown: 34,
    offer: [
      N('Skald! The Tallyman\'s raiders sit in Jómsborg behind a gate as thick as my late father\'s head.'),
      H('I can\'t break a gate. But I can insult the men behind it until they open it to argue.'),
      N('Bring iron and we\'ll bring the ships. You bring the insults.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 30, port: 'gotland', building: 'hall', text: 'Deliver 30 iron to Chieftain Hegvald.'},
      {do: 'defeat', enemies: ['fortress_gate', 'fortress_tower', 'jomsviking_skeid', 'raider_karvi'], at: {port: 'jomsborg'}, text: 'Taunt open the gate of Jómsborg and storm it.'},
    ],
    done: [
      N('They opened the gate to chase you and forgot to close it. The Wends of Jómsborg are free!', C.dobromira),
      N('The Tallyman fled with his knot. He left hacksilver and a crate of ledgers. Very neat handwriting.', C.dobromira),
      H('"Here fell Jómsborg\'s gate, undone by a rhyme it couldn\'t bear to hear end." Hm. Close.'),
    ],
    reward: {silver: 15000, renown: 14, blessings: {odin: 2}, unlockPorts: ['jomsborg'], unlockGoods: ['hacksilver']},
  }),
  q(9, {
    title: 'Birka\'s Long Memory',
    giver: {port: 'birka', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Gunnvor Weighbeam',
    requiresRenown: 40,
    offer: [
      N('You want Svartkell\'s story? His old weighing-house is our bank now. The banker found his tally-book under the floor.'),
      N('Join our guild, poet. Guild members may read old floors.'),
      H('I\'ve joined worse clubs for worse reasons.'),
    ],
    steps: [
      {do: 'donate', silver: 3000, port: 'birka', text: 'Donate 3 000 s to Birka\'s guild.'},
      {do: 'collect', item: 'q_tally_book', port: 'birka', building: 'bank', text: 'Read Svartkell\'s tally-book at the Birka bank.', say: [
        N('Last entry: "Rán. Lost to me at counting waves. Paid: one knot." Below it: "Owed: everything."', C.folkvid),
      ]},
      {do: 'networth', amount: 50000, text: 'Grow your net worth to 50 000 s.'},
    ],
    done: [
      N('He cheated the sea goddess at counting waves. Of course he did. He\'d cheat a sundial.'),
      N('Aldeigjuborg and Hólmgarðr are open to you. Svartkell\'s silver flows east.'),
      H('The middle of the story! At last I\'m not underwater.'),
    ],
    reward: {silver: 20000, renown: 12, unlockPorts: ['aldeigja', 'holmgard']},
  }),
  q(10, {
    title: 'The Song the River Knows',
    giver: {port: 'holmgard', building: 'hall', npc: 'slav_prince'}, npcName: 'Posadnik Ratibor',
    requiresRenown: 46,
    offer: [
      N('Our river singers know a song about a grey man and a glowing knot. They sing it to make children behave.'),
      H('I\'d give a year\'s silver to hear it.'),
      N('Furs for the princes\' tribute will do. Then visit Aldeigjuborg\'s mead hall. The old singer there knows it all.'),
    ],
    steps: [
      {do: 'deliver', good: 'furs', qty: 30, port: 'holmgard', building: 'hall', text: 'Deliver 30 furs to Posadnik Ratibor.'},
      {do: 'visit', port: 'aldeigja', building: 'meadhall', text: 'Hear the river song in Aldeigjuborg\'s mead hall.', say: [
        N('"The grey man bought the river, the grey man bought the sea, but the grey man bought no ending..." That\'s all.', C.dragomir),
        H('No ending? Then I\'ll write one.'),
      ]},
    ],
    done: [
      N('Kænugarðr and Miklagarðr are open to you. The Greeks keep a library of every story ever written.', C.dragomir),
      N('Maybe even his. Maybe even yours.', C.dragomir),
      H('A library of endings. I\'ve dreamed of such a place.'),
    ],
    reward: {silver: 25000, renown: 12, unlockPorts: ['kaenugard', 'miklagard'], unlockGoods: ['silk']},
  }),
  q(11, {
    title: 'The Last Verse',
    giver: {port: 'miklagard', building: 'hall', npc: 'byzantine_official'}, npcName: 'Magistra Eudokia',
    requiresRenown: 52,
    offer: [
      N('The skald who never finishes? Interesting. Our library has a scroll that ends: "the knot must be sung home".'),
      H('Sung? Like a lullaby?'),
      N('Like a farewell for the drowned. You must sing it all. Every word. Even the last one.'),
      H('...Every word.'),
    ],
    steps: [
      {do: 'collect', item: 'q_last_verse', port: 'miklagard', building: 'hall', text: 'Collect the old song from Magistra Eudokia.', say: [
        N('Learn it on the voyage. And do not mumble the ending.', C.eudokia),
      ]},
      {do: 'networth', amount: 120000, text: 'Grow your net worth to 120 000 s to outfit a fleet for the last voyage.'},
      {do: 'defeat', enemies: ['draugr_ship', 'draugr_ship', 'draugr_ship', 'storm_crow'], at: {sea: 'north_sea'}, weather: 'fog', text: 'Sing the drowned fleet home in the North Sea.'},
    ],
    done: [
      N('You can\'t stop me with poetry! Nobody has ever been stopped by poetry!', C.svartkell),
      H('"...and the grey man, counting, found the sea had counted him." The end.'),
      N('The END? You finished it? No! The knot... the knot listens to endings!', C.svartkell),
      H('Home it goes. The drowned can rest, Tallyman. Rán has waves for you to count.'),
      N('Hrafn! They\'re already singing it in Jórvík. All of it. Even the end.', C.osgar),
      H('Finally. Now, does anyone know a rhyme for "Tallyman"?'),
    ],
    reward: {silver: 80000, renown: 40, flag: 'saga_done_hrafn'},
  }),
];
