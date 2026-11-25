// Ylva Steadyhand: the widow's ledger. See docs/STORY.md.
import {N, H, CAST as C, sagaQuest} from './lines.js';

const q = sagaQuest('ylva');

export const YLVA = [
  q(1, {
    title: 'Herring and Arithmetic',
    giver: {port: 'ravnfjord', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Hallvarð Thinbeard',
    offer: [
      N('Ylva. I\'m sorry about Orm. The sea takes the best fishermen and leaves the worst singers. I would know. I sing.'),
      H('He left me a knarr, a debt, and a goat that hates me. I need work, jarl.'),
      N('Then learn the trade the gentle way. Buy 20 stockfish here, where it\'s cheap, and take it to Thórunn in Kaupang.'),
      N('Buy low, sell high, and never let anyone weigh your silver with a thumb on the scale.'),
    ],
    steps: [
      {do: 'buy', good: 'stockfish', qty: 20, port: 'ravnfjord', text: 'Buy 20 stockfish in the Ravnfjord market.'},
      {do: 'deliver', good: 'stockfish', qty: 20, port: 'kaupang', building: 'hall', text: 'Deliver 20 stockfish to Thórunn Scales in the Kaupang hall.'},
    ],
    done: [
      N('Stockfish! Dry as a lawyer\'s joke and twice as useful. Hallvarð said you\'d come.', C.thorunn),
      N('Here\'s your pay. Sail north to Hálogaland when you can; Bergljót there asked after Orm.', C.thorunn),
      H('Orm knew everyone. I\'m only starting to learn how many.'),
    ],
    reward: {silver: 1500, renown: 5, blessings: {eir: 1}, unlockPorts: ['halogaland']},
  }),
  q(2, {
    title: 'Orm\'s Crate',
    giver: {port: 'ravnfjord', building: 'moneylender', npc: 'moneylender'}, npcName: 'Bárðr Pennyclaw',
    offer: [
      N('Ah, the widow. My condolences. Also, Orm owed me three thousand. I accept silver, gold and very little sympathy.'),
      H('You\'ll have a thousand now, and the rest as I earn it.'),
      N('Splendid. Bergljót in Hálogaland is keeping a crate of Orm\'s. Fetch it. Perhaps it\'s full of money for me.'),
    ],
    steps: [
      {do: 'pay', silver: 1000, port: 'ravnfjord', building: 'moneylender', text: 'Pay Bárðr 1 000 s toward Orm\'s debt.'},
      {do: 'collect', item: 'q_orm_crate', port: 'halogaland', building: 'hall', text: 'Collect Orm\'s crate from Bergljót Whale-Counter in Hálogaland.', say: [
        N('Orm left this with me in spring. Heavy. He said only Ylva opens it, so I sat on it all summer.', C.bergljot),
        H('Thank you for not opening it.'),
        N('I said I sat on it. I didn\'t say I was proud of it.', C.bergljot),
      ]},
      {do: 'bring', item: 'q_orm_crate', port: 'ravnfjord', building: 'hall', text: 'Open Orm\'s crate with Jarl Hallvarð as witness.', say: [
        N('Walrus tusks! And a note in Orm\'s terrible runes.', C.hallvard),
        H('"If I don\'t come back, pay Bárðr what I owe and not a coin more. He weighs with his thumb."'),
        N('Ha! I always said Orm read people better than runes.', C.hallvard),
      ]},
    ],
    done: [
      N('Those tusks are walrus ivory. Bergljót\'s people will sell you more, and carvers in the south pay well.'),
      N('As for Bárðr, I\'ll have a quiet word with his thumb.'),
      H('Let him keep his thumb. I\'ll keep my eyes open.'),
    ],
    reward: {silver: 2500, renown: 5, goods: {ivory: 5}, unlockGoods: ['ivory']},
  }),
  q(3, {
    title: 'A Debt Sold South',
    giver: {port: 'heidaby', building: 'hall', npc: 'jarl'}, npcName: 'Harbour-Jarl Auðun Broadbelt',
    requiresRenown: 5,
    offer: [
      N('Ylva of Ravnfjord? Bárðr\'s boy came through last week, selling your husband\'s note to a man in a grey cloak.'),
      H('Sold it? To whom?'),
      N('No name. He paid in silver so cold it fogged the scales. My herring fleet needs salt, and you need answers.'),
      N('Bring timber for my shipyard and salt for my hall, and ask in the mead hall what folk saw.'),
    ],
    steps: [
      {do: 'deliver', good: 'timber', qty: 20, port: 'heidaby', building: 'shipyard', text: 'Deliver 20 timber to Hrefna at the Heiðabýr shipyard.'},
      {do: 'visit', port: 'heidaby', building: 'meadhall', text: 'Ask in the Heiðabýr mead hall about the grey-cloaked buyer.', say: [
        N('Grey cloak? Ordered water. WATER. In my mead hall. Then asked who owed what to whom, and wrote it all down.', C.tofa),
        N('Sailed for Birka. Said the silver there "remembers him". Strange man. Tipped badly.', C.tofa),
      ]},
      {do: 'deliver', good: 'salt', qty: 30, port: 'heidaby', building: 'hall', text: 'Deliver 30 salt to Auðun\'s hall.'},
    ],
    done: [
      N('Birka, then. I\'ll send word to Reeve Gunnvor. She\'s honest, and she hates bad tippers.'),
      N('Birka and Gotland are open to you. Buy iron while you\'re south. Grey cloaks have a way of getting rough.'),
      H('Iron, then. And a long talk with Birka.'),
    ],
    reward: {silver: 3000, renown: 6, unlockPorts: ['birka', 'gotland'], unlockGoods: ['iron']},
  }),
  q(4, {
    title: 'The Weigher\'s Shadow',
    giver: {port: 'birka', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Gunnvor Weighbeam',
    requiresRenown: 10,
    offer: [
      N('Grey cloak, cold silver, writes down debts? That\'s Svartkell. He weighed coins in this very town.'),
      N('We caught him shaving silver off every coin he touched. Banished him nine winters back. He called it "rounding".'),
      H('Now he\'s buying debts. Mine among them.'),
      N('Hegvald of Gotland dug a ledger page out of a hoard. Bring it to me, and bring iron for my town wall.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 25, port: 'birka', building: 'hall', text: 'Deliver 25 iron to Reeve Gunnvor in Birka.'},
      {do: 'collect', item: 'q_grey_page', port: 'gotland', building: 'hall', text: 'Collect the ledger page from Chieftain Hegvald in Gotland.', say: [
        N('Found it in a hoard under my neighbour\'s barn. Don\'t tell him. Well, it\'s my barn now. Long story.', C.hegvald),
        N('Names, sums, ships. And a mark like a knot. I don\'t like that knot.', C.hegvald),
      ]},
      {do: 'bring', item: 'q_grey_page', port: 'birka', building: 'hall', text: 'Bring the ledger page to Reeve Gunnvor.', say: [
        N('Svartkell\'s hand. Debts from Truso to Jórvík. He isn\'t collecting silver, Ylva. He\'s collecting captains.', C.gunnvor),
      ]},
    ],
    done: [
      N('Every captain in his debt is a ship he can call on. Clever, rotten, and very tidy.'),
      N('Elder Gedas of Truso is on this list. Truso is open to you; amber folk keep careful counts too.'),
      H('If Svartkell wants a tidy ledger, I\'ll give him a messy one.'),
    ],
    reward: {silver: 5000, renown: 8, unlockPorts: ['truso'], unlockGoods: ['amber']},
  }),
  q(5, {
    title: 'Amber and Accounts',
    giver: {port: 'kaupang', building: 'hall', npc: 'merchant'}, npcName: 'Thórunn Scales',
    requiresRenown: 15,
    offer: [
      N('Ylva! Grey Company men were here, offering to "help" my captains with their debts. Help, like a fox helps hens.'),
      H('Svartkell. He\'s buying notes all along the Whale Road.'),
      N('Then out-trade him. Hear what Gedas of Truso knows, bring me amber for the fair, and fatten your purse.'),
      N('Captains trust a full purse over a grey cloak. Usually.'),
    ],
    steps: [
      {do: 'visit', port: 'truso', building: 'hall', text: 'Speak with Elder Gedas in Truso.', say: [
        N('Grey men offered silver for my gatherers\' debts. Silver that smelled of seaweed. I said no.', C.gedas),
        N('They spoke of Jórvík and the Orkneys. Many debts there. Take my amber, and my warning.', C.gedas),
      ]},
      {do: 'deliver', good: 'amber', qty: 15, port: 'kaupang', building: 'hall', text: 'Deliver 15 amber to Thórunn in Kaupang.'},
      {do: 'networth', amount: 15000, text: 'Grow your net worth to 15 000 s.'},
    ],
    done: [
      N('Fifteen thousand and a hold of amber. Captains notice that sort of thing.'),
      N('I\'ve written to my cousins over the North Sea. Jórvík and the Orkneys are open to you, and furs from the north.'),
      H('Then I\'ll go and see how many western captains Svartkell owns.'),
    ],
    reward: {silver: 6000, renown: 10, unlockPorts: ['jorvik', 'orkney'], unlockGoods: ['furs']},
  }),
  q(6, {
    title: 'The Coppergate Debtors',
    giver: {port: 'jorvik', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Osgar Coppergate',
    requiresRenown: 20,
    offer: [
      N('Half of Coppergate owes the Grey Company. The comb-makers, the potters, even my brother-in-law, who owes everyone.'),
      N('Svartkell\'s collectors come at the new moon. Unpaid notes, and they take the boats, the tools, the lot.'),
      H('Then I\'ll pay what I can and see off the rest.'),
    ],
    steps: [
      {do: 'deliver', good: 'furs', qty: 20, port: 'jorvik', building: 'hall', text: 'Deliver 20 furs to Reeve Osgar to sell for the comb-makers.'},
      {do: 'pay', silver: 3000, port: 'jorvik', building: 'bank', text: 'Pay 3 000 s at the Jórvík bank to clear the comb-makers\' notes.'},
      {do: 'defeat', enemies: ['collector_snekkja', 'collector_snekkja'], at: {sea: 'north_sea'}, text: 'Drive off the Grey Company\'s collectors on the North Sea.'},
    ],
    done: [
      N('Two collector ships sent home wet! Coppergate will sing about it. Badly, but loudly.'),
      N('A third one ran aground on my mudflat. A busse, sturdy as a church. She\'s yours, Ylva.'),
      N('My friends in Hamwic, Dyflin and Rúðuborg will know your name. Wine and Frankish blades flow from there.'),
      H('A busse! Orm would have cried, then said it was the wind.'),
    ],
    reward: {silver: 8000, renown: 12, ship: 'busse', unlockPorts: ['hamwic', 'rudaborg', 'dyflin'], unlockGoods: ['wine', 'blades']},
  }),
  q(7, {
    title: 'Silver Goes East',
    giver: {port: 'birka', building: 'hall', npc: 'jarl'}, npcName: 'Reeve Gunnvor Weighbeam',
    requiresRenown: 30,
    offer: [
      N('News from the river road. Svartkell\'s men are in Aldeigjuborg and Hólmgarðr, buying the fur-traders\' debts.'),
      N('The eastern princes won\'t deal with a stranger. They deal with guild merchants, and Birka\'s guild has a seat free.'),
      H('What does a seat cost?'),
      N('Silver, and a feast. Our guild trusts nobody it hasn\'t watched eat.'),
    ],
    steps: [
      {do: 'donate', silver: 3000, port: 'birka', text: 'Donate 3 000 s to Birka\'s merchant guild.'},
      {do: 'deliver', good: 'wine', qty: 20, port: 'birka', building: 'hall', text: 'Bring 20 wine for the guild feast.'},
      {do: 'visit', port: 'gotland', building: 'hall', text: 'Ask Chieftain Hegvald for letters to the eastern princes.', say: [
        N('Letters? I\'ll write you three. One for each prince, and one for any prince I\'ve forgotten.', C.hegvald),
      ]},
    ],
    done: [
      N('There. Sealed with my best wax, which is honey wax, so keep it away from bears.', C.hegvald),
      N('Aldeigjuborg and Hólmgarðr will open to you. Mind the river mosquitoes; they charge interest too.', C.hegvald),
      H('Everything on the Whale Road charges interest, it seems.'),
    ],
    reward: {silver: 10000, renown: 12, items: ['rune_hold'], unlockPorts: ['aldeigja', 'holmgard']},
  }),
  q(8, {
    title: 'The Grey Fortress',
    giver: {port: 'holmgard', building: 'hall', npc: 'slav_prince'}, npcName: 'Posadnik Ratibor',
    requiresRenown: 40,
    offer: [
      N('Welcome, merchant of Ravnfjord. Your Svartkell bought debts here, then demanded our fur boats in payment.'),
      N('His ships winter behind the walls of Jómsborg, with Jómsviking captains he pays in drowned silver.'),
      H('Then the debts end at Jómsborg\'s gate.'),
      N('Bring iron for our spears. Auðun of Heiðabýr will lend you ships. Then knock. Loudly.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 30, port: 'holmgard', building: 'hall', text: 'Deliver 30 iron to Posadnik Ratibor.'},
      {do: 'visit', port: 'heidaby', building: 'hall', text: 'Ask Auðun of Heiðabýr for ships.', say: [
        N('Ships? Take six, and my cousin\'s, though he\'s still sulking about the last time.', C.audun),
      ]},
      {do: 'defeat', enemies: ['fortress_gate', 'fortress_tower', 'jomsviking_skeid'], at: {port: 'jomsborg'}, text: 'Storm the gate of Jómsborg.'},
    ],
    done: [
      N('Free! The Wends of Jómsborg thank you. Those grey sailors ate all our smoked eel.', C.dobromira),
      N('Svartkell fled before the gate fell. He left a strongbox: hacksilver, and the key to his ledgers.', C.dobromira),
      H('Hacksilver chopped from a hundred hoards. Some of it belongs to people I know.'),
      N('Trade it, return it, spend it in our market. Jómsborg is open to honest sails now.', C.dobromira),
    ],
    reward: {silver: 15000, renown: 15, blessings: {thor: 2}, items: ['q_tally_key'], unlockPorts: ['jomsborg'], unlockGoods: ['hacksilver']},
  }),
  q(9, {
    title: 'The River Road',
    giver: {port: 'aldeigja', building: 'hall', npc: 'slav_prince'}, npcName: 'Voivode Radoslav',
    requiresRenown: 50,
    offer: [
      N('You took Jómsborg! Now the river road. Svartkell\'s silver flows south to the bankers of Miklagarðr.'),
      N('Bandits under grey sails haunt the Gulf. My boatmen won\'t row until they\'re gone.'),
      H('And beyond the bandits?'),
      N('Kænugarðr, then the Great City. Bring grain for my boatmen. Nobody rows the rapids hungry.'),
    ],
    steps: [
      {do: 'deliver', good: 'grain', qty: 30, port: 'aldeigja', building: 'hall', text: 'Deliver 30 grain to Voivode Radoslav\'s boatmen.'},
      {do: 'defeat', enemies: ['raider_snekkja', 'raider_snekkja', 'raider_karvi'], at: {sea: 'gulf_finland'}, text: 'Clear the grey-sailed bandits from the Gulf.'},
      {do: 'networth', amount: 60000, text: 'Grow your net worth to 60 000 s. The Greeks only open doors for the rich.'},
    ],
    done: [
      N('The Gulf is clear, your purse is fat, and my boatmen are singing. All three are rare.'),
      N('Go south. Kænugarðr and Miklagarðr will welcome you, and the silk merchants will try to sell you the moon.'),
      H('If the moon is fairly priced, I might buy it.'),
    ],
    reward: {silver: 20000, renown: 15, unlockPorts: ['kaenugard', 'miklagard'], unlockGoods: ['silk']},
  }),
  q(10, {
    title: 'Seventeen Seals',
    giver: {port: 'miklagard', building: 'hall', npc: 'byzantine_official'}, npcName: 'Ioannikios of the Seventeen Seals',
    requiresRenown: 60,
    offer: [
      N('Svartkell? A client of the silver-dealers on the Mese. He deposited notes. Debts of Northern captains. Many.'),
      N('To withdraw notes not your own you need a key, a fee, and the patience of a pillar saint. Have you all three?'),
      H('I have his key, from his own strongbox in Jómsborg. And the fee.'),
      N('Two of three. Remarkable, for a Northerner. Proceed.'),
    ],
    steps: [
      {do: 'pay', silver: 25000, port: 'miklagard', building: 'hall', text: 'Pay 25 000 s in fees to Ioannikios.'},
      {do: 'bring', item: 'q_tally_key', port: 'miklagard', building: 'bank', text: 'Open Svartkell\'s strongroom at the bank with his key.', say: [
        N('The key fits. Inside: notes for four hundred ships, and a letter.', C.kyra),
        N('"Gone to the edge of the world to collect the last debt." He writes beautifully, for a thief.', C.kyra),
      ]},
      {do: 'collect', item: 'q_grey_notes', port: 'miklagard', building: 'bank', text: 'Take Svartkell\'s bundle of debt notes.', say: [
        H('Four hundred notes. Every captain on the Whale Road, and Orm\'s among them.'),
      ]},
      {do: 'visit', port: 'orkney', building: 'hall', text: 'Ask Jarl Arnkell what "the edge of the world" means.', say: [
        N('The edge of the world? That\'s what we call Færeyjar and Ísland. Svartkell\'s grey sails went that way.', C.arnkell),
      ]},
    ],
    done: [
      N('I\'ll send you off with my best pilot and my worst jokes. Færeyjar and Ísland are open to you.', C.arnkell),
      N('Fishermen say drowned crews sail with him, and a knot glows at his belt.', C.arnkell),
      H('Then I\'ll find the man with the knot.'),
    ],
    reward: {silver: 30000, renown: 20, items: ['rune_storm'], unlockPorts: ['faereyjar', 'island']},
  }),
  q(11, {
    title: 'Every Debt Paid',
    giver: {port: 'island', building: 'hall', npc: 'jarl'}, npcName: 'Lawspeaker Hildigunn Long-Memory',
    requiresRenown: 70,
    offer: [
      N('A merchant with a sea-chest of debts. Svartkell got here first, claiming every Icelandic ship as payment.'),
      N('Ísland has no king. We have law, and by our law a debt bought with drowned silver is no debt at all.'),
      H('Then I\'ll bring him the law.'),
      N('Burn those notes before witnesses, show the captains you can stand behind them, then sail out. He waits offshore.'),
    ],
    steps: [
      {do: 'bring', item: 'q_grey_notes', port: 'island', building: 'hall', text: 'Burn Svartkell\'s notes before the Lawspeaker.', say: [
        N('Four hundred debts up in smoke. Every captain in the North just got lighter.', C.hildigunn),
        H('Orm\'s too. Burn well, old debt.'),
      ]},
      {do: 'networth', amount: 150000, text: 'Grow your net worth to 150 000 s, enough to stand behind every freed captain.'},
      {do: 'defeat', enemies: ['raider_drakkar', 'collector_snekkja', 'collector_snekkja', 'draugr_ship'], at: {sea: 'iceland_sea'}, weather: 'fog', text: 'Face Svartkell the Tallyman and his fleet in the Iceland Sea.'},
    ],
    done: [
      N('My ledgers! My columns! Do you know how hard it is to rule a straight line on wet vellum?', C.svartkell),
      H('Your columns stand on drowned men. Give back the knot, Svartkell.'),
      N('It\'s slipping! It\'s going home! She\'ll make me count the waves forever!', C.svartkell),
      H('Then count well. Every wave a debt repaid.'),
      N('The grey ships are mist. Ylva of Ravnfjord, the law of Ísland names you friend of every harbour.', C.hildigunn),
      H('Let\'s go home. I owe a goat an apology.'),
    ],
    reward: {silver: 80000, renown: 40, flag: 'saga_done_ylva'},
  }),
];
