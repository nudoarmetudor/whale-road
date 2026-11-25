// Bjarki Bear-Shoulder: twenty harbours and one fortress. See docs/STORY.md.
import {N, H, CAST as C, sagaQuest} from './lines.js';

const q = sagaQuest('bjarki');

export const BJARKI = [
  q(1, {
    title: 'Twenty and Then Some',
    giver: {port: 'heidaby', building: 'hall', npc: 'jarl'}, npcName: 'Harbour-Jarl Auðun Broadbelt',
    offer: [
      N('Bjarki Bear-Shoulder! Last I heard, you\'d joined the Jómsvikings.'),
      H('I left. They started paying in grey silver, cold as a fish\'s handshake. And the dice were loaded.'),
      N('Honest of you. Then do honest work: Kaupang timber for my shipyard, and see off the raiders in the Kattegat.'),
      H('Timber I can carry. Raiders I can scare. Counting I\'ll leave to you.'),
    ],
    steps: [
      {do: 'buy', good: 'timber', qty: 15, port: 'kaupang', text: 'Buy 15 timber in the Kaupang market; Heiðabýr has none.'},
      {do: 'deliver', good: 'timber', qty: 15, port: 'heidaby', building: 'shipyard', text: 'Deliver 15 timber to Hrefna at the Heiðabýr shipyard.'},
      {do: 'defeat', enemies: ['raider_faering', 'raider_faering'], at: {sea: 'kattegat'}, text: 'Chase two raider faerings out of the Kattegat.'},
    ],
    done: [
      N('Two raiders sent home wet, and Hrefna says you stacked the timber neatly. Neatly!'),
      N('Elder Gedas of Truso needs a strong arm. Grey sails bother his amber gatherers. Truso is open to you.'),
      H('Grey sails again. I\'ve a feeling I\'ll be seeing a lot of them.'),
    ],
    reward: {silver: 1500, renown: 5, unlockPorts: ['truso']},
  }),
  q(2, {
    title: 'The Amber Shore',
    giver: {port: 'truso', building: 'hall', npc: 'aesti_elder'}, npcName: 'Elder Gedas Amberhand',
    offer: [
      N('You\'re the big Dane? Auðun said you were big. He undersold it.'),
      H('Big is just the shape I came in.'),
      N('Raiders under grey sails rob my gatherers on the beach. Drive them off, and bring salt. Storm season is coming.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['raider_karvi', 'raider_karvi'], at: {sea: 'baltic_south'}, text: 'Drive the grey-sailed raiders off the southern Baltic.'},
      {do: 'deliver', good: 'salt', qty: 20, port: 'truso', building: 'hall', text: 'Deliver 20 salt to Elder Gedas for curing fish.'},
    ],
    done: [
      N('The beach is ours again and the gulls are back. Our amber market is open to you, friend.'),
      N('The raiders shouted a name as they fled: "The Tallyman will hear of this!"'),
      H('The Tallyman. Whoever he is, I hope he can count my fists.'),
    ],
    reward: {silver: 2500, renown: 6, goods: {amber: 10}, unlockGoods: ['amber']},
  }),
  q(3, {
    title: 'Kolli Fat-Oar',
    giver: {port: 'birka', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Gunnvor Weighbeam',
    requiresRenown: 8,
    offer: [
      N('A Jómsborg deserter in my town. Do I lock you up or hire you?'),
      H('Hire me. I eat less than a prison does. Slightly.'),
      N('Ha. Your old oar-mate Kolli left you a letter at our mead hall. Bring amber for my wall-shrine, then go and read it.'),
    ],
    steps: [
      {do: 'deliver', good: 'amber', qty: 15, port: 'birka', building: 'hall', text: 'Deliver 15 amber to Reeve Gunnvor.'},
      {do: 'collect', item: 'q_kolli_letter', port: 'birka', building: 'meadhall', text: 'Collect Kolli\'s letter from the Birka mead hall.', say: [
        N('A letter for "Bjarki, the big one". Sealed with fish glue. Smells like Kolli.', C.hallbera),
        H('"Bjarki. Come to Gotland. Bring nothing grey." He never was a poet.'),
      ]},
      {do: 'bring', item: 'q_kolli_letter', port: 'gotland', building: 'hall', text: 'Find Kolli in Gotland.', say: [
        N('Kolli? He\'s in my barn, eating my cheese.', C.hegvald),
        N('Bjarki! The Jómsborg captains sold their oaths to Svartkell the Tallyman. He pays in drowned silver.', C.kolli),
        N('He has a knot that calls the drowned up from wrecks to fetch him hoards. Every hoard goes in his ledger.', C.kolli),
      ]},
    ],
    done: [
      H('Then we need friends. Lots of friends. More than twenty, if possible.'),
      N('Voivode Radoslav of Aldeigjuborg hates raiders. I\'ll write to him, and Birka will sell you iron.', C.hegvald),
      N('And stay out of my cheese.', C.hegvald),
    ],
    reward: {silver: 3000, renown: 8, unlockPorts: ['aldeigja'], unlockGoods: ['iron']},
  }),
  q(4, {
    title: 'Spears for Kaupang',
    giver: {port: 'kaupang', building: 'hall', npc: 'merchant'}, npcName: 'Thórunn Scales',
    requiresRenown: 12,
    offer: [
      N('You\'re gathering friends against Jómsborg? Gather spears first. My watchmen have sticks and harsh words.'),
      H('Harsh words are something. Iron is better.'),
      N('Bring iron, and a friend from the east, as proof you aren\'t just a large man shouting.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 20, port: 'kaupang', building: 'hall', text: 'Deliver 20 iron to Thórunn in Kaupang.'},
      {do: 'visit', port: 'aldeigja', building: 'hall', text: 'Win the support of Voivode Radoslav in Aldeigjuborg.', say: [
        N('The Tallyman bought my boatmen\'s debts and now calls their boats his. So yes, I stand with you.', C.radoslav),
        N('Tell Kaupang the Voivode is your friend. And take furs; your northern winters are coming.', C.radoslav),
      ]},
    ],
    done: [
      N('Thórunn\'s letters will open the Norway coast to you: Ravnfjord and Hlaðir. And I\'ll sell you furs.', C.radoslav),
      H('Furs! At last, something that fits my shoulders.'),
    ],
    reward: {silver: 4000, renown: 8, goods: {furs: 10}, unlockPorts: ['ravnfjord', 'hladir'], unlockGoods: ['furs']},
  }),
  q(5, {
    title: 'The Jarl Who Wrestles',
    giver: {port: 'hladir', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Hrolleif Oakenbelly',
    requiresRenown: 18,
    offer: [
      N('So you\'re the bear-shouldered fellow. I don\'t lend ships to men I haven\'t wrestled.'),
      H('I don\'t wrestle jarls. It ends badly for one of us and the other gets in trouble.'),
      N('Furs for my hall, an offering to Thor at our altar, then we wrestle. Win or lose, you\'ll have my answer.'),
    ],
    steps: [
      {do: 'deliver', good: 'furs', qty: 20, port: 'hladir', building: 'hall', text: 'Deliver 20 furs to Jarl Hrolleif.'},
      {do: 'sacrifice', blessing: 'thor', qty: 2, port: 'hladir', text: 'Buy two blessings of Thor at the Hlaðir altar.'},
      {do: 'visit', port: 'hladir', building: 'hall', text: 'Wrestle Jarl Hrolleif.', say: [
        N('Ready? Hup! ... Ow. Ow. That\'s my good shoulder.', C.hrolleif),
        H('Sorry! I\'ll put you down gently.'),
        N('You ARE putting me down gently. That\'s the insulting part.', C.hrolleif),
      ]},
    ],
    done: [
      N('A man who wins and apologises. You\'re no raider, Bjarki.'),
      N('Take my old snekkja, the Hrolleif\'s Pride. Rename her; she never lived up to it.'),
      N('And go north to Hálogaland. Bergljót trades walrus ivory and knows every sea-road.'),
      H('A warship! Kolli will cry. He cries at everything, but still.'),
    ],
    reward: {silver: 5000, renown: 10, ship: 'snekkja', unlockPorts: ['halogaland'], unlockGoods: ['ivory']},
  }),
  q(6, {
    title: 'The Watch on the Belt',
    giver: {port: 'heidaby', building: 'hall', npc: 'jarl'}, npcName: 'Harbour-Jarl Auðun Broadbelt',
    requiresRenown: 25,
    offer: [
      N('Jómsviking skeids raid my coast now, in daylight. Svartkell must be paying them double.'),
      H('Double nothing is still nothing. Their silver is cold.'),
      N('Cold or not, it buys spears. Iron for my coast watch, ivory for Ingrid\'s guild charms, then hunt that skeid.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 30, port: 'heidaby', building: 'hall', text: 'Deliver 30 iron to Auðun\'s coast watch.'},
      {do: 'deliver', good: 'ivory', qty: 10, port: 'heidaby', building: 'guild', text: 'Deliver 10 walrus ivory to Ingrid Sixfingers at the guild.'},
      {do: 'defeat', enemies: ['jomsviking_skeid', 'raider_karvi'], at: {sea: 'baltic_south'}, text: 'Hunt down the Jómsviking skeid in the southern Baltic.'},
    ],
    done: [
      N('A Jómsviking skeid, beaten by a man who walked out of Jómsborg. The skalds will love it.'),
      N('Jórvík, Hamwic and Rúðuborg will trade with you now, wine and Frankish blades included.'),
      N('Blades are forbidden in Rúðuborg and Hamwic, mind. The Franks are touchy about their swords.'),
      H('I\'ll keep them wrapped and my mouth shut. Mostly.'),
    ],
    reward: {silver: 8000, renown: 12, unlockPorts: ['jorvik', 'hamwic', 'rudaborg'], unlockGoods: ['wine', 'blades']},
  }),
  q(7, {
    title: 'The Western Oath',
    giver: {port: 'jorvik', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Osgar Coppergate',
    requiresRenown: 32,
    offer: [
      N('You want Jórvík\'s ships against Jómsborg? Grey raiders already harry the North Sea. Clear them first.'),
      H('And then?'),
      N('Then wine for my oath-feast, and get Hamwic\'s reeve to swear too. Saxons and Northmen at one table. Imagine.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['raider_snekkja', 'raider_snekkja'], at: {sea: 'north_sea'}, text: 'Clear the grey raiders from the North Sea.'},
      {do: 'deliver', good: 'wine', qty: 20, port: 'jorvik', building: 'hall', text: 'Deliver 20 wine for Osgar\'s oath-feast.'},
      {do: 'visit', port: 'hamwic', building: 'hall', text: 'Ask Reeve Wynflæd of Hamwic to swear the oath.', say: [
        N('Jórvík\'s Northmen and Hamwic\'s Saxons on one side? Well. We both hate thieves more than each other.', C.wynflaed),
        N('Hamwic swears. Tell Osgar he owes me a barrel of the good wine.', C.wynflaed),
      ]},
    ],
    done: [
      N('Our friends in Dyflin and the Orkneys will hear of you. Go west if you need more oars.', C.wynflaed),
      H('More oars, more friends, more feasts. This is the best war I\'ve never started.'),
    ],
    reward: {silver: 10000, renown: 12, items: ['rune_reload'], unlockPorts: ['dyflin', 'orkney']},
  }),
  q(8, {
    title: 'The River Princes',
    giver: {port: 'aldeigja', building: 'hall', npc: 'slav_prince'}, npcName: 'Voivode Radoslav',
    requiresRenown: 40,
    offer: [
      N('The western harbours stand with you. Now the east must. The Tallyman\'s silver flows down our rivers.'),
      N('Bring Frankish blades for my guard and salt for our winter. Then the princes will listen to you.'),
      H('Blades and salt. A warrior\'s breakfast.'),
    ],
    steps: [
      {do: 'deliver', good: 'blades', qty: 10, port: 'aldeigja', building: 'hall', text: 'Deliver 10 Frankish blades to the Voivode\'s guard.'},
      {do: 'deliver', good: 'salt', qty: 30, port: 'aldeigja', building: 'hall', text: 'Deliver 30 salt for Aldeigjuborg\'s winter.'},
      {do: 'networth', amount: 40000, text: 'Grow your net worth to 40 000 s, so the princes take you seriously.'},
    ],
    done: [
      N('Blades, salt and a full purse. Hólmgarðr and Kænugarðr will open their markets to you.'),
      N('Mind the rapids, Bjarki, and the mosquitoes. Both bite.'),
      H('I\'ll bite back.'),
    ],
    reward: {silver: 14000, renown: 12, unlockPorts: ['holmgard', 'kaenugard']},
  }),
  q(9, {
    title: 'The Rapids Run',
    giver: {port: 'kaenugard', building: 'hall', npc: 'slav_prince'}, npcName: 'Voivode Yaromir',
    requiresRenown: 48,
    offer: [
      N('The Tallyman\'s raiders squat at the rapids south of here, taxing every boat bound for the Greeks.'),
      N('Bring furs for the Greek market, and our best pilot will take you down past them to Miklagarðr.'),
      H('I\'ve never seen the Great City. Is it really bigger than Heiðabýr?'),
      N('Heiðabýr would fit in its bathhouses. Twice.'),
    ],
    steps: [
      {do: 'deliver', good: 'furs', qty: 30, port: 'kaenugard', building: 'hall', text: 'Deliver 30 furs to Voivode Yaromir.'},
      {do: 'visit', port: 'kaenugard', building: 'market', text: 'Meet Svitozar the rapids-pilot.', say: [
        N('Seven rapids, seven names, each ruder than the last. I\'ll slip you past the bandits going south.', C.svitozar),
        N('Coming back north with a Greek ship behind you? Then we stop slipping and start knocking.', C.svitozar),
      ]},
    ],
    done: [
      N('Sail south to Miklagarðr: silk, Greek fire, and officials with more seals than a seal colony.', C.svitozar),
      H('Silk for Kolli. He\'ll pretend he doesn\'t want it.'),
    ],
    reward: {silver: 18000, renown: 15, unlockPorts: ['miklagard'], unlockGoods: ['silk']},
  }),
  q(10, {
    title: 'Every Shield on the Whale Road',
    giver: {port: 'miklagard', building: 'hall', npc: 'byzantine_official'}, npcName: 'Ioannikios of the Seventeen Seals',
    requiresRenown: 55,
    offer: [
      N('You request imperial ships to attack a fortress in the distant Baltic. That is form nine: request for distant aid.'),
      H('Is there a form for "please, it\'s important"?'),
      N('Form eleven. It requires a fee and a witness. I will be the witness. I am also the fee.'),
    ],
    steps: [
      {do: 'pay', silver: 20000, port: 'miklagard', building: 'hall', text: 'Pay Ioannikios the 20 000 s "witness fee".'},
      {do: 'defeat', enemies: ['raider_drakkar', 'raider_snekkja', 'raider_snekkja'], at: {sea: 'dnieper_rapids'}, text: 'Sail north and break the raiders\' hold on the Dnieper rapids.'},
      {do: 'visit', port: 'orkney', building: 'hall', text: 'Bring Jarl Arnkell of the Orkneys into the alliance.', say: [
        N('A Greek dromon sailing north with you? I\'ll come just to see their faces at Jómsborg.', C.arnkell),
        N('And I\'ll write to Færeyjar and Ísland. They make sail-cloth that laughs at gales.', C.arnkell),
      ]},
      {do: 'networth', amount: 120000, text: 'Grow your net worth to 120 000 s to feed the allied fleet.'},
    ],
    done: [
      N('The rapids are free, says the pilot, and your purse satisfies form twenty. A dromon will meet you in the Baltic.'),
      N('Also, Færeyjar and Ísland now trade with you. Very rustic. Very warm. Very far.'),
      H('Every shield on the Whale Road. Let Svartkell count those.'),
    ],
    reward: {silver: 30000, renown: 15, items: ['rune_hull'], blessings: {kari: 2}, unlockPorts: ['faereyjar', 'island']},
  }),
  q(11, {
    title: 'The Storming of Jómsborg',
    giver: {port: 'heidaby', building: 'hall', npc: 'jarl'}, npcName: 'Harbour-Jarl Auðun Broadbelt',
    requiresRenown: 65,
    offer: [
      N('Ships from twenty harbours fill my bay. I\'ve never seen so many people agree on anything.'),
      H('One more thing. Kolli says the Icelanders keep a banner that won\'t burn.'),
      N('Then fetch it, arm the fleet, and let\'s knock on Jómsborg\'s gate.'),
    ],
    steps: [
      {do: 'collect', item: 'q_sun_banner', port: 'island', building: 'hall', text: 'Borrow the Sun Banner from the Lawspeaker of Ísland.', say: [
        N('The Sun Banner. It won\'t burn, won\'t tear and won\'t wash. We don\'t talk about the smell.', C.hildigunn),
      ]},
      {do: 'deliver', good: 'iron', qty: 40, port: 'heidaby', building: 'hall', text: 'Arm the allied fleet: deliver 40 iron to Auðun.'},
      {do: 'defeat', enemies: ['fortress_gate', 'fortress_tower', 'fortress_tower', 'jomsviking_skeid', 'raider_drakkar'], at: {port: 'jomsborg'}, text: 'Storm Jómsborg and break the Tallyman\'s hold.'},
    ],
    done: [
      N('My fortress! My ledgers! Do you know what sea-spray does to a column of sums?', C.svartkell),
      H('I can\'t count past twenty. But I know when a thing is finished.'),
      N('The knot! No, it\'s slipping... it\'s going home!', C.svartkell),
      N('He\'s gone in the sea after it, and the grey ships are fog. Bjarki, the gate is open!', C.kolli),
      N('The Wends of Jómsborg welcome you, Bear-Shoulder. Our market, our eel and our hacksilver are yours.', C.dobromira),
      H('Twenty harbours, one fortress, and nobody counting. Let\'s feast.'),
    ],
    reward: {silver: 80000, renown: 40, flag: 'saga_done_bjarki', unlockPorts: ['jomsborg'], unlockGoods: ['hacksilver']},
  }),
];
