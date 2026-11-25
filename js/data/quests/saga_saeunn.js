// Sæunn Mist-Eye: mending Rán's net. See docs/STORY.md.
import {N, H, CAST as C, sagaQuest} from './lines.js';

const q = sagaQuest('saeunn');

export const SAEUNN = [
  q(1, {
    title: 'The Drowned Don\'t Knock',
    giver: {port: 'hladir', building: 'altar', npc: 'volva'}, npcName: 'Old Heiðrún',
    offer: [
      N('Sæunn. You dreamt of the grey ship again, didn\'t you? So did I. So did half the fishermen.'),
      H('Ships rowed by drowned men, with no wind. Their eyes like wet pebbles.'),
      N('Something has loosened Rán\'s net. Make an offering, then ask Gunna in Ravnfjord what she saw. And bring wadmal.'),
      H('Wadmal for the gods?'),
      N('Wadmal for my shawl. It has more holes than Rán\'s net. The gods can knit their own.'),
    ],
    steps: [
      {do: 'sacrifice', blessing: 'eir', qty: 2, port: 'hladir', text: 'Buy two blessings of Eir at the Hlaðir altar.'},
      {do: 'visit', port: 'ravnfjord', building: 'meadhall', text: 'Ask Gunna Ladle in Ravnfjord what she saw.', say: [
        N('A grey ship came up the fjord at dawn. Nobody aboard but wet shadows.', C.gunna),
        N('It lifted old Orm\'s hoard right off the seabed and rowed away. No wind. Not a breath.', C.gunna),
      ]},
      {do: 'deliver', good: 'wadmal', qty: 10, port: 'hladir', building: 'altar', text: 'Bring 10 wadmal back to Heiðrún.'},
    ],
    done: [
      N('Hoards lifted from the seabed by the drowned. Someone is giving orders to Rán\'s guests.'),
      N('Go west to the Orkneys. Jarl Arnkell watches the tides like a hen watches eggs.'),
      H('And you?'),
      N('I shall knit.'),
    ],
    reward: {silver: 1200, renown: 5, blessings: {eir: 1}, unlockPorts: ['orkney']},
  }),
  q(2, {
    title: 'Bones That Sing',
    giver: {port: 'halogaland', building: 'market', npc: 'merchant'}, npcName: 'Áilu the Trader',
    offer: [
      N('A völva from the south. The sea is restless. Even the seals complain, and seals never complain.'),
      H('Heiðrún says Rán\'s net is loosened.'),
      N('My grandmother taught me to listen before I speak. Bring grain for Bergljót\'s winter store, then listen with me.'),
    ],
    steps: [
      {do: 'deliver', good: 'grain', qty: 20, port: 'halogaland', building: 'hall', text: 'Deliver 20 grain to Bergljót\'s winter store.'},
      {do: 'visit', port: 'halogaland', building: 'market', text: 'Listen to the sea with Áilu.', say: [
        N('Hear that? The waves come in eights, not nines. One is missing, like a skipped heartbeat.', C.ailu),
        H('A knot cut from her net, and a wave slipped out with it.'),
      ]},
    ],
    done: [
      N('Bergljót will trade you walrus ivory now. The sea respects old bone.'),
      N('When you find the thief, don\'t shout. Thieves hear shouting. Nobody hears listening.'),
      H('Thank you, Áilu. I\'ll listen loudly.'),
    ],
    reward: {silver: 2000, renown: 5, goods: {ivory: 5}, unlockGoods: ['ivory']},
  }),
  q(3, {
    title: 'Crows Over Pentland',
    giver: {port: 'orkney', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Arnkell Tidewatcher',
    requiresRenown: 8,
    offer: [
      N('A völva! Good. My cliffs crawl with crows the size of cows. They steal fish, sheep, and once a bishop\'s hat.'),
      H('Storm crows. They follow broken weather, and broken weather follows a broken net.'),
      N('Drive them off the Pentland Firth, and bring walrus ivory. For my grandchildren\'s teething toys. Don\'t ask.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['storm_crow', 'storm_crow'], at: {sea: 'pentland'}, text: 'Drive the storm crows from the Pentland Firth.'},
      {do: 'deliver', good: 'ivory', qty: 10, port: 'orkney', building: 'hall', text: 'Deliver 10 walrus ivory to Jarl Arnkell.'},
    ],
    done: [
      N('Not a feather left. The bishop wants his hat back, but I think it\'s in a nest in Norway now.'),
      N('Brother Colm of Dyflin keeps a book of tides, and Færeyjar\'s sheep-reeve counts every wave. Both are open to you.'),
      N('Iron too. My smiths owe me favours.'),
      H('Tides and waves. Somebody else has been counting.'),
    ],
    reward: {silver: 3000, renown: 6, unlockPorts: ['faereyjar', 'dyflin'], unlockGoods: ['iron']},
  }),
  q(4, {
    title: 'The Monk Who Counted Waves',
    giver: {port: 'dyflin', building: 'meadhall', npc: 'monk'}, npcName: 'Brother Colm',
    requiresRenown: 12,
    offer: [
      N('God\'s peace, seeress. Yes, I count waves. Someone must; they won\'t count themselves.'),
      H('Have you noticed one missing?'),
      N('Every ninth wave since spring. Bring wadmal for my freezing scriptorium, and I\'ll copy my tide-book for you.'),
    ],
    steps: [
      {do: 'deliver', good: 'wadmal', qty: 20, port: 'dyflin', building: 'meadhall', text: 'Deliver 20 wadmal to Brother Colm.'},
      {do: 'collect', item: 'q_tide_book', port: 'dyflin', building: 'meadhall', text: 'Collect the copy of Brother Colm\'s tide-book.', say: [
        N('Copied fair. The missing wave first went quiet near Heiðabýr. Then everywhere.', C.colm),
      ]},
      {do: 'visit', port: 'faereyjar', building: 'hall', text: 'Ask Gudrið Woolwise in Færeyjar about the waves.', say: [
        N('Waves? I count sheep, mostly. But yes, the ninth wave stopped coming. The sheep noticed first.', C.gudrid),
        N('Sheep notice everything. They just don\'t tell anyone.', C.gudrid),
      ]},
    ],
    done: [
      N('Take the news south. Jórvík and Hamwic have wise heads, loud markets and wine, which helps both.', C.gudrid),
      H('Heiðabýr, where it started. I\'ll get there.'),
    ],
    reward: {silver: 4000, renown: 8, unlockPorts: ['jorvik', 'hamwic'], unlockGoods: ['wine']},
  }),
  q(5, {
    title: 'Silver That Weighs Too Much',
    giver: {port: 'kaupang', building: 'hall', npc: 'merchant'}, npcName: 'Thórunn Scales',
    requiresRenown: 16,
    offer: [
      N('Seeress! Feel this coin. Cold in the sun, cold in your fist. Grey men pay with it.'),
      H('Silver from a drowned hoard keeps the sea\'s chill. Who pays with it?'),
      N('Svartkell the Tallyman\'s people. Bring wine for my market, then show a coin to Jórvík\'s moneyers.'),
    ],
    steps: [
      {do: 'deliver', good: 'wine', qty: 15, port: 'kaupang', building: 'hall', text: 'Deliver 15 wine to Thórunn.'},
      {do: 'collect', item: 'q_cold_coin', port: 'kaupang', building: 'market', text: 'Take one of the cold coins from Eyvind Saltfoot.', say: [
        N('Take one. Take them all. They give me chilblains.', C.eyvind),
      ]},
      {do: 'bring', item: 'q_cold_coin', port: 'jorvik', building: 'hall', text: 'Show the cold coin to Reeve Osgar in Jórvík.', say: [
        N('Struck in Miklagarðr, melted in Birka, recut in Jórvík... and drowned. This coin has died twice.', C.osgar),
      ]},
    ],
    done: [
      N('The Tallyman pays half the Baltic in drowned silver. Heiðabýr and Birka are where it flows.', C.osgar),
      N('I\'ll vouch for you there, and Kaupang will sell you furs.', C.osgar),
      H('Dead silver buying living men. That isn\'t trade. It\'s theft with good handwriting.'),
    ],
    reward: {silver: 5000, renown: 8, unlockPorts: ['heidaby', 'birka'], unlockGoods: ['furs']},
  }),
  q(6, {
    title: 'The Tallyman\'s Bargain',
    giver: {port: 'heidaby', building: 'hall', npc: 'jarl'}, npcName: 'Harbour-Jarl Auðun Broadbelt',
    requiresRenown: 22,
    offer: [
      N('A völva asking about drowned silver. I hoped you\'d come.'),
      N('Svartkell was a coin-weigher in Birka, banished for shaving coins. Now a ghost ship guards his routes off the Kattegat.'),
      H('He has a knot from Rán\'s net. With it, he orders the drowned to fetch him hoards.'),
      N('Bring furs for my watchmen, then do what völvas do. Preferably at that ghost ship.'),
    ],
    steps: [
      {do: 'deliver', good: 'furs', qty: 20, port: 'heidaby', building: 'hall', text: 'Deliver 20 furs to Auðun\'s watchmen.'},
      {do: 'defeat', enemies: ['draugr_ship'], at: {sea: 'kattegat'}, weather: 'fog', text: 'Lay the ghost ship in the Kattegat to rest.'},
    ],
    done: [
      N('The ghost ship sank. Again. Can a ship drown twice? I\'ll ask the priest.'),
      H('Its crew thanked me before they went. They only want to rest.'),
      N('Then rest them all. Take my harbour\'s best byrding, and letters for Gotland, Truso and Rúðuborg.'),
      N('Amber, blades and a wider sea. You\'ll need all three.'),
    ],
    reward: {silver: 9000, renown: 10, ship: 'byrding', unlockPorts: ['gotland', 'truso', 'rudaborg'], unlockGoods: ['amber', 'blades']},
  }),
  q(7, {
    title: 'Weaving Lessons',
    giver: {port: 'birka', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Gunnvor Weighbeam',
    requiresRenown: 28,
    offer: [
      N('Heiðrún writes that to bind what came unbound, you need a new knot. Woven, not stolen.'),
      H('Woven with what?'),
      N('An amber spindle first. Truso\'s elder keeps one for weddings. Bring amber for our guild, then borrow it.'),
    ],
    steps: [
      {do: 'deliver', good: 'amber', qty: 20, port: 'birka', building: 'hall', text: 'Deliver 20 amber to Reeve Gunnvor.'},
      {do: 'collect', item: 'q_amber_spindle', port: 'truso', building: 'hall', text: 'Borrow the amber spindle from Elder Gedas.', say: [
        N('For weddings, funerals and fixing the sea. Take it. Bring it back with a story.', C.gedas),
      ]},
      {do: 'bring', item: 'q_amber_spindle', port: 'birka', building: 'hall', text: 'Show the spindle to Reeve Gunnvor.', say: [
        N('Lovely. Now a thread strong enough. The spinners of Hólmgarðr make flax finer than hair.', C.gunnvor),
      ]},
    ],
    done: [
      N('Aldeigjuborg and Hólmgarðr will open their gates. I wrote that you\'re a völva, not a tax collector.'),
      H('Nobody ever believes that the first time.'),
    ],
    reward: {silver: 12000, renown: 10, unlockPorts: ['aldeigja', 'holmgard']},
  }),
  q(8, {
    title: 'Into the Grey Fort',
    giver: {port: 'holmgard', building: 'guild', npc: 'guildmaster'}, npcName: 'Guildmistress Bogumila',
    requiresRenown: 34,
    offer: [
      N('Flax finer than hair? We have it. But the Tallyman\'s grey ships hold Jómsborg, and our flax boats can\'t pass.'),
      H('Then Jómsborg must open.'),
      N('Join our guild, feed our spinners, and break that fort. Then the thread is yours.'),
    ],
    steps: [
      {do: 'donate', silver: 3000, port: 'holmgard', text: 'Donate 3 000 s to the Hólmgarðr guild.'},
      {do: 'deliver', good: 'honey', qty: 30, port: 'holmgard', building: 'guild', text: 'Deliver 30 honey for the guild\'s spinners.'},
      {do: 'defeat', enemies: ['fortress_gate', 'fortress_tower', 'draugr_ship'], at: {port: 'jomsborg'}, text: 'Break the Tallyman\'s hold on Jómsborg.'},
    ],
    done: [
      N('The grey ones are gone! The Wends of Jómsborg thank you, seeress. Our eel-smokers are weeping with joy.', C.dobromira),
      N('The Tallyman fled east with his knot. He left hacksilver, chopped from a hundred hoards.', C.dobromira),
      H('Some of it is old Orm\'s hoard from Ravnfjord. I\'ll see it goes home. And Bogumila\'s thread is here.'),
    ],
    reward: {silver: 16000, renown: 12, items: ['q_linen_thread'], blessings: {thor: 2}, unlockPorts: ['jomsborg'], unlockGoods: ['hacksilver']},
  }),
  q(9, {
    title: 'South Along the River',
    giver: {port: 'aldeigja', building: 'hall', npc: 'slav_prince'}, npcName: 'Voivode Radoslav',
    requiresRenown: 40,
    offer: [
      N('A völva with Hólmgarðr thread and Jómsborg hacksilver. The Tallyman rowed south along our river.'),
      N('Bring iron for my boatmen\'s hooks. The rapids are cruel and the bandits worse.'),
      H('Where is he going?'),
      N('Where every rich man goes. Miklagarðr, to hide his silver among the Greeks.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 30, port: 'aldeigja', building: 'hall', text: 'Deliver 30 iron to Voivode Radoslav.'},
      {do: 'defeat', enemies: ['raider_snekkja', 'raider_snekkja'], at: {sea: 'gulf_finland'}, text: 'Clear the bandits from the Gulf.'},
      {do: 'networth', amount: 50000, text: 'Grow your net worth to 50 000 s for the long road south.'},
    ],
    done: [
      N('The Gulf is clear. Kænugarðr and the Great City are open to you.'),
      N('Look for silk in Miklagarðr. They say silk thread can hold a storm.'),
      H('Amber, flax, silk. This knot will be prettier than the old one.'),
    ],
    reward: {silver: 20000, renown: 12, unlockPorts: ['kaenugard', 'miklagard'], unlockGoods: ['silk']},
  }),
  q(10, {
    title: 'A Scholar\'s Net',
    giver: {port: 'miklagard', building: 'hall', npc: 'byzantine_official'}, npcName: 'Magistra Eudokia',
    requiresRenown: 48,
    offer: [
      N('A Northern seeress in my library! The books said your kind were taller.'),
      H('Books exaggerate. I need to know about the nets of the sea.'),
      N('An old sailors\' tale tells of a knot cut from the sea\'s net, re-tied with silk and wool by a spinner at the world\'s edge.'),
    ],
    steps: [
      {do: 'collect', item: 'q_sea_scroll', port: 'miklagard', building: 'hall', text: 'Collect Magistra Eudokia\'s copy of the sailors\' tale.', say: [
        N('Read it carefully. If you smudge the ink, I will know. I always know.', C.eudokia),
      ]},
      {do: 'buy', good: 'silk', qty: 10, text: 'Buy 10 silk for the new knot.'},
      {do: 'deliver', good: 'silk', qty: 10, port: 'faereyjar', building: 'hall', text: 'Bring the silk to Gudrið Woolwise in Færeyjar, at the world\'s edge.'},
    ],
    done: [
      N('Greek silk, Hólmgarðr flax, an amber spindle and wool from my best ewe. There. Spun.', C.gudrid),
      N('A knot for Rán\'s net. Take it to Ísland; the Lawspeaker knows the old altar-rock.', C.gudrid),
      H('It\'s warm. The old knot must have been so cold.'),
    ],
    reward: {silver: 35000, renown: 15, items: ['q_woven_knot'], unlockPorts: ['island']},
  }),
  q(11, {
    title: 'Rán\'s Net',
    giver: {port: 'island', building: 'hall', npc: 'jarl'}, npcName: 'Lawspeaker Hildigunn Long-Memory',
    requiresRenown: 55,
    offer: [
      N('So you\'re the völva with the new knot. Svartkell sailed past yesterday with the old one, laughing like a bad debt.'),
      N('He has woken something below. Fishermen saw arms in the water. Many arms.'),
      H('The kraken. Rán\'s watchdog, angry because her net is torn.'),
      N('Give the gods their due, bless the knot at the altar-rock, and tie it into the sea.'),
    ],
    steps: [
      {do: 'sacrifice', blessing: 'kari', qty: 3, port: 'island', text: 'Buy three blessings of Kári at the Ísland altar.'},
      {do: 'bring', item: 'q_woven_knot', port: 'island', building: 'altar', text: 'Bless the new knot at the altar-rock.', say: [
        N('The knot glows like a hearth. Out there, something huge rolls over in the deep.', C.thorve),
      ]},
      {do: 'defeat', enemies: ['kraken', 'storm_crow', 'storm_crow', 'serpent'], at: {sea: 'iceland_sea'}, weather: 'storm', text: 'Calm the kraken in the Iceland Sea and tie the knot into Rán\'s net.'},
    ],
    done: [
      N('My kraken! You\'ve upset my kraken! It took me weeks to teach it to fetch!', C.svartkell),
      H('It was never yours. Neither was the knot.'),
      N('My knot is unravelling! Not the waves! Don\'t make me count the waves!', C.svartkell),
      H('Count kindly, Tallyman. The sea is patient.'),
      N('The ninth wave rolls in again. Ísland names you Rán\'s mender, Sæunn Mist-Eye.', C.hildigunn),
      H('Now I\'d like a cup of tea. Heiðrún will be insufferable.'),
    ],
    reward: {silver: 80000, renown: 40, flag: 'saga_done_saeunn'},
  }),
];
