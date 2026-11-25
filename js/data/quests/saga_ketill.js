// Ketill Grey-Keel: balancing the books. See docs/STORY.md.
import {N, H, CAST as C, sagaQuest} from './lines.js';

const q = sagaQuest('ketill');

export const KETILL = [
  q(1, {
    title: 'An Old Man\'s Errand',
    giver: {port: 'birka', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Gunnvor Weighbeam',
    offer: [
      N('Ketill Grey-Keel in my hall! The sea-king who sank a raider fleet with one oar and a bad mood.'),
      H('Two oars. And a good mood; I was laughing. What\'s this about grey cloaks buying debts?'),
      N('Bring grain for the town store, then see our banker. He has a note with tally marks you might know.'),
    ],
    steps: [
      {do: 'deliver', good: 'grain', qty: 20, port: 'birka', building: 'hall', text: 'Deliver 20 grain to Reeve Gunnvor.'},
      {do: 'visit', port: 'birka', building: 'bank', text: 'Look at the strange note at the Birka bank.', say: [
        N('This was among the deposits. "Paid by the Tallyman." The marks are odd.', C.folkvid),
        H('I know those marks. Svartkell. My purser, thirty years back. He kept my books so well I never saw him stealing.'),
      ]},
    ],
    done: [
      N('Your old purser? Then you\'d know where he goes next.', C.gunnvor),
      H('Wherever silver is careless. Truso first. He always liked amber; it hides scratches.'),
      N('Truso is open to you, then. Go gently. You\'re not thirty any more.', C.gunnvor),
    ],
    reward: {silver: 3000, renown: 6, unlockPorts: ['truso']},
  }),
  q(2, {
    title: 'Amber Shore Again',
    giver: {port: 'truso', building: 'hall', npc: 'aesti_elder'}, npcName: 'Elder Gedas Amberhand',
    offer: [
      N('Ketill! The last time you visited, you sat on my best chair and broke it.'),
      H('I\'ve lost weight since. Mostly from worry.'),
      N('Grey raiders rob our gatherers off the eastern Baltic. Drive them off and bring salt, and I forgive the chair.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['raider_karvi', 'raider_karvi', 'raider_faering'], at: {sea: 'baltic_east'}, text: 'Drive the grey raiders out of the eastern Baltic.'},
      {do: 'deliver', good: 'salt', qty: 30, port: 'truso', building: 'hall', text: 'Deliver 30 salt to Elder Gedas.'},
    ],
    done: [
      N('The chair is forgiven. My amber market is yours, old friend.'),
      N('The raiders spoke of Aldeigjuborg. Their master buys fur notes up the rivers.'),
      H('Svartkell always did love a fur coat. Even in summer.'),
    ],
    reward: {silver: 4000, renown: 6, goods: {amber: 10}, unlockGoods: ['amber']},
  }),
  q(3, {
    title: 'The Fur Road',
    giver: {port: 'aldeigja', building: 'hall', npc: 'slav_prince'}, npcName: 'Voivode Radoslav',
    requiresRenown: 8,
    offer: [
      N('Ketill Grey-Keel. My father spoke of you. Mostly kindly.'),
      H('Mostly is generous. What is the Tallyman doing on your river?'),
      N('Buying my trappers\' debts, then taking their boats. Amber for my wife\'s necklace, please; she\'s the real voivode.'),
    ],
    steps: [
      {do: 'deliver', good: 'amber', qty: 20, port: 'aldeigja', building: 'hall', text: 'Deliver 20 amber to Voivode Radoslav.'},
      {do: 'visit', port: 'aldeigja', building: 'market', text: 'Ask Zlata the furrier about the grey men.', say: [
        N('They paid my trappers in cold silver, then demanded the furs back at double. My furs!', C.zlata),
        N('Now I\'ll sell them to you instead, at an honest price.', C.zlata),
      ]},
    ],
    done: [
      N('Honest furs, and the Voivode says Hólmgarðr will open to you.', C.zlata),
      H('Furs, friends and fair prices. Svartkell hates all three.'),
    ],
    reward: {silver: 5000, renown: 8, unlockPorts: ['holmgard'], unlockGoods: ['furs']},
  }),
  q(4, {
    title: 'The Posadnik\'s Price',
    giver: {port: 'holmgard', building: 'hall', npc: 'slav_prince'}, npcName: 'Posadnik Ratibor',
    requiresRenown: 14,
    offer: [
      N('Old sea-king. Our town council debates everything, so I\'ll be quick. We owe the Tallyman far too much.'),
      N('Salt for our fish and timber for our walls, and the council will vote to help you. Probably.'),
      H('Probably?'),
      N('We once debated a goose for three days.'),
    ],
    steps: [
      {do: 'deliver', good: 'salt', qty: 40, port: 'holmgard', building: 'hall', text: 'Deliver 40 salt to Posadnik Ratibor.'},
      {do: 'deliver', good: 'timber', qty: 30, port: 'holmgard', building: 'hall', text: 'Deliver 30 timber for Hólmgarðr\'s walls.'},
    ],
    done: [
      N('The council voted yes. Unanimously, after only one fistfight.'),
      N('Kænugarðr\'s voivode needs help at the rapids, and our smiths will sell you iron.'),
      H('I remember the rapids. They remember me too. We didn\'t part friends.'),
    ],
    reward: {silver: 6000, renown: 8, unlockPorts: ['kaenugard'], unlockGoods: ['iron']},
  }),
  q(5, {
    title: 'The Rapids',
    giver: {port: 'kaenugard', building: 'hall', npc: 'slav_prince'}, npcName: 'Voivode Yaromir',
    requiresRenown: 20,
    offer: [
      N('Grey-Keel. Bandits under grey sails tax the rapids. Our merchants turn back, and the Greeks go without our wax.'),
      H('Then let an old man clear the way. Slowly, but thoroughly.'),
      N('Bring iron for our river forts as well.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 20, port: 'kaenugard', building: 'hall', text: 'Deliver 20 iron to Voivode Yaromir.'},
      {do: 'defeat', enemies: ['raider_snekkja', 'raider_snekkja'], at: {sea: 'dnieper_rapids'}, text: 'Clear the bandits from the Dnieper rapids.'},
    ],
    done: [
      N('The rapids flow free! Svitozar wants to carve your face on a rock, but he\'s terrible at faces.'),
      N('Take this skeid; we took it from the bandits. And sail on to Miklagarðr.'),
      H('A skeid! I feel thirty again. My knees disagree.'),
    ],
    reward: {silver: 10000, renown: 10, ship: 'skeid', unlockPorts: ['miklagard'], unlockGoods: ['silk']},
  }),
  q(6, {
    title: 'Paper and Purple',
    giver: {port: 'miklagard', building: 'hall', npc: 'byzantine_official'}, npcName: 'Ioannikios of the Seventeen Seals',
    requiresRenown: 26,
    offer: [
      N('Ketill, called Grey-Keel, retired sea-king. Your file is three scrolls long. Two of them are complaints.'),
      H('From whom?'),
      N('Everyone. You seek one Svartkell. He keeps an account here. To see it: a fee, a visit to the bank, and a third thing.'),
      N('I shall think of the third thing shortly.'),
    ],
    steps: [
      {do: 'pay', silver: 5000, port: 'miklagard', building: 'hall', text: 'Pay Ioannikios 5 000 s in fees.'},
      {do: 'collect', item: 'q_svartkell_contract', port: 'miklagard', building: 'bank', text: 'Collect a copy of Svartkell\'s contract at the bank.', say: [
        N('"Security for the loan: one knot, of the sea\'s own net." He borrowed against a goddess!', C.kyra),
        H('Oh, Svartkell. You clever fool.'),
      ]},
      {do: 'deliver', good: 'furs', qty: 30, port: 'miklagard', building: 'hall', text: 'The third thing: 30 furs for Ioannikios\'s chilly office.'},
    ],
    done: [
      N('Excellent. A purple wax seal for you. It means nothing, but people respect purple.'),
      N('The Emperor\'s merchants will now sell you wine. It is terrible. You\'ll love it.'),
      H('A seal that means nothing. I\'ll hang it beside my medals.'),
    ],
    reward: {silver: 12000, renown: 10, items: ['rune_speed'], unlockGoods: ['wine']},
  }),
  q(7, {
    title: 'Home Waters',
    giver: {port: 'heidaby', building: 'hall', npc: 'jarl'}, npcName: 'Harbour-Jarl Auðun Broadbelt',
    requiresRenown: 32,
    offer: [
      N('Ketill! The whole west coast asks after you. The Tallyman\'s collectors are in Kaupang and Ravnfjord.'),
      H('He\'s going after my old harbours. Petty. He was always petty.'),
      N('Bring wine for my hall, then deal with his collectors in the Skagerrak.'),
    ],
    steps: [
      {do: 'deliver', good: 'wine', qty: 20, port: 'heidaby', building: 'hall', text: 'Deliver 20 wine to Auðun.'},
      {do: 'defeat', enemies: ['collector_snekkja', 'collector_snekkja', 'raider_karvi'], at: {sea: 'skagerrak'}, text: 'Scatter the Tallyman\'s collectors in the Skagerrak.'},
    ],
    done: [
      N('Collectors, collected. Kaupang, Ravnfjord and Hlaðir will open their harbours to you.'),
      N('And walrus ivory comes south through Kaupang now. Bergljót sends her regards.'),
      H('Home waters. Smell that? Fish and old grudges.'),
    ],
    reward: {silver: 14000, renown: 12, unlockPorts: ['kaupang', 'ravnfjord', 'hladir'], unlockGoods: ['ivory']},
  }),
  q(8, {
    title: 'The Old Purser\'s Fortress',
    giver: {port: 'ravnfjord', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Hallvarð Thinbeard',
    requiresRenown: 38,
    offer: [
      N('Grey-Keel! I was a boy when you sailed. You threw me an apple once. I still have the core.'),
      H('Disgusting. Touching, but disgusting.'),
      N('Svartkell\'s ships winter in Jómsborg. Iron for my men, an offering to Njörðr, and let\'s end his winter early.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 30, port: 'ravnfjord', building: 'hall', text: 'Deliver 30 iron to Jarl Hallvarð.'},
      {do: 'sacrifice', blessing: 'njord', qty: 3, port: 'ravnfjord', text: 'Buy three blessings of Njörðr at the Ravnfjord altar.'},
      {do: 'defeat', enemies: ['fortress_gate', 'fortress_tower', 'fortress_tower', 'jomsviking_skeid'], at: {port: 'jomsborg'}, text: 'Storm Jómsborg.'},
    ],
    done: [
      N('Jómsborg is free! Old sea-king, the Wends of this town will tell of you for a hundred winters.', C.dobromira),
      N('Svartkell fled north with his knot. He left his hacksilver behind.', C.dobromira),
      H('North. To where we first met: the Hlaðir yards, where I hired him.'),
    ],
    reward: {silver: 18000, renown: 14, blessings: {thor: 2}, unlockPorts: ['jomsborg'], unlockGoods: ['hacksilver']},
  }),
  q(9, {
    title: 'Where It Started',
    giver: {port: 'hladir', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Hrolleif Oakenbelly',
    requiresRenown: 44,
    offer: [
      N('Ketill Grey-Keel! My father said you were the only man who could out-drink him. Then he fell over.'),
      H('I remember. Has Svartkell been here?'),
      N('He laughed at our yards and sailed west for the islands. Bring timber for the yards he mocked, and see Heiðrún.'),
    ],
    steps: [
      {do: 'deliver', good: 'timber', qty: 40, port: 'hladir', building: 'hall', text: 'Deliver 40 timber for the Hlaðir yards.'},
      {do: 'visit', port: 'hladir', building: 'altar', text: 'Ask Old Heiðrún about the knot.', say: [
        N('Old king. Your purser cheated Rán at counting waves and cut a knot from her net. She wants it back.', C.heidrun),
        H('Then I\'ll fetch it. He was my purser. His debts are mine.'),
      ]},
      {do: 'networth', amount: 100000, text: 'Grow your net worth to 100 000 s to raise a fleet in the west.'},
    ],
    done: [
      N('Hálogaland, the Orkneys, Færeyjar and Ísland. The whole north-west is open to you.'),
      H('And somewhere in it, an old friend I must stop.'),
    ],
    reward: {silver: 22000, renown: 14, unlockPorts: ['halogaland', 'orkney', 'faereyjar', 'island']},
  }),
  q(10, {
    title: 'The Grey Fleet Gathers',
    giver: {port: 'orkney', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Arnkell Tidewatcher',
    requiresRenown: 50,
    offer: [
      N('Sea-king. Svartkell\'s drowned fleet gathered off my islands, then sailed for the Skagerrak to wait for you.'),
      N('He left a message: "Tell Ketill I\'ve balanced the books."'),
      H('He always hated a debt he couldn\'t collect.'),
      N('Then gather the west. Ask Ísland\'s blessing, and bring stockfish to feed the fleet.'),
    ],
    steps: [
      {do: 'visit', port: 'island', building: 'hall', text: 'Ask the Lawspeaker of Ísland to back you.', say: [
        N('Svartkell? Outlawed here nine winters back. The Althing names you its champion against him.', C.hildigunn),
        N('Take this sunstone. It finds the sun through any fog he can raise.', C.hildigunn),
      ]},
      {do: 'deliver', good: 'stockfish', qty: 40, port: 'orkney', building: 'hall', text: 'Deliver 40 stockfish to feed the western fleet.'},
    ],
    done: [
      N('The west sails with you. Jórvík, Dyflin, Hamwic and Rúðuborg are open, and Frankish blades with them.'),
      H('One last voyage, then.'),
    ],
    reward: {silver: 30000, renown: 15, items: ['compass_sun'], unlockPorts: ['jorvik', 'dyflin', 'hamwic', 'rudaborg'], unlockGoods: ['blades']},
  }),
  q(11, {
    title: 'Balancing the Books',
    giver: {port: 'jorvik', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Osgar Coppergate',
    requiresRenown: 56,
    offer: [
      N('Grey-Keel! Coppergate has sent every boat that floats, and two that mostly float.'),
      H('That\'s more than I asked.'),
      N('Bring wine for the fleet\'s farewell feast. Then go. The Tallyman waits in the Skagerrak with his whole grey fleet.'),
    ],
    steps: [
      {do: 'deliver', good: 'wine', qty: 30, port: 'jorvik', building: 'hall', text: 'Deliver 30 wine for the farewell feast.'},
      {do: 'networth', amount: 200000, text: 'Grow your net worth to 200 000 s.'},
      {do: 'defeat', enemies: ['raider_drakkar', 'draugr_ship', 'draugr_ship', 'serpent', 'collector_snekkja'], at: {sea: 'skagerrak'}, weather: 'storm', text: 'Face Svartkell and his grey fleet in the Skagerrak.'},
    ],
    done: [
      N('Ketill! Old captain! Come to audit me?', C.svartkell),
      H('Come to bring you home, Svartkell. You were the best purser I ever had.'),
      N('I was the ONLY purser you ever had! You never checked a single number!', C.svartkell),
      H('That was my mistake. This is yours. Give Rán back her knot.'),
      N('...Fine. But I\'m keeping the receipt.', C.svartkell),
      H('The fog lifts, the drowned rest, and the books are finally balanced.'),
    ],
    reward: {silver: 80000, renown: 40, flag: 'saga_done_ketill'},
  }),
];
