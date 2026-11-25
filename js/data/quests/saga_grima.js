// Gríma Knotgrip: every errand on the Whale Road. Her saga is the optional tasks (SIDE);
// these three chapters are only the frame. Chapter 3 requires every side task.
import {N, H, CAST as C, sagaQuest} from './lines.js';
import {SIDE} from './side.js';

const q = sagaQuest('grima');

export const GRIMA = [
  q(1, {
    title: 'Granny\'s Bargain',
    giver: {port: 'halogaland', building: 'hall', npc: 'townswoman'}, npcName: 'Granny Gnúpa',
    offer: [
      N('Gríma, my granddaughter. Half troll and all heart. Promise me something.'),
      H('Anything, Granny. Within reason. Within lifting distance.'),
      N('Every errand folk ask of a stranger on the Whale Road, you do it. Every one. A troll\'s word is stone.'),
      N('Start small. Stockfish for my soup, then tell Kaupang\'s mead hall that Gríma is open for errands.'),
    ],
    steps: [
      {do: 'deliver', good: 'stockfish', qty: 20, port: 'halogaland', building: 'hall', text: 'Deliver 20 stockfish for Granny Gnúpa\'s soup.'},
      {do: 'visit', port: 'kaupang', building: 'meadhall', text: 'Tell the Kaupang mead hall you take errands.', say: [
        N('Errands? A half-troll doing errands? Can you lift a cart? There\'s a cart. With a goat on it.', C.ketta),
        H('Which way should the goat face?'),
      ]},
    ],
    done: [
      N('Word\'s out: Gríma Knotgrip takes any job, and puts goats down gently. Expect a queue.', C.ketta),
      H('A queue! Granny will be so proud.'),
    ],
    reward: {silver: 1000, renown: 5},
  }),
  q(2, {
    title: 'Brooms at Jómsborg',
    giver: {port: 'heidaby', building: 'hall', npc: 'jarl'}, npcName: 'Harbour-Jarl Auðun Broadbelt',
    requiresRenown: 30,
    offer: [
      N('Half the errands on the Whale Road end with "but the Jómsborg raiders..." Gríma, could you possibly...'),
      H('Knock down a fortress? Granny did say every errand.'),
      N('Bring iron for my allies and we\'ll sail together.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 30, port: 'heidaby', building: 'hall', text: 'Deliver 30 iron to Auðun\'s allies.'},
      {do: 'defeat', enemies: ['fortress_gate', 'fortress_tower', 'jomsviking_skeid'], at: {port: 'jomsborg'}, text: 'Free Jómsborg from the Tallyman\'s raiders.'},
    ],
    done: [
      N('You lifted our gate off its hinges and set it down politely. The Wends of Jómsborg are free!', C.dobromira),
      N('We\'ll have errands for you too, once we\'ve swept up. And hacksilver for sale.', C.dobromira),
      H('More errands! Granny, are you watching?'),
    ],
    reward: {silver: 15000, renown: 15, unlockPorts: ['jomsborg'], unlockGoods: ['hacksilver']},
  }),
  q(3, {
    title: 'Every Errand Done',
    giver: {port: 'halogaland', building: 'hall', npc: 'townswoman'}, npcName: 'Granny Gnúpa',
    requires: ['grima_02', ...SIDE.map((s) => s.id)],
    offer: [
      N('Every errand on the Whale Road, done. The stones are talking about you, child.'),
      H('Stones don\'t talk, Granny.'),
      N('These do. They say a grey man called Svartkell is furious. You freed every debtor he wanted, for nothing.'),
      N('He waits in the Norwegian Sea to fine you for kindness. Go and settle up. In full.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['raider_drakkar', 'collector_snekkja', 'collector_snekkja', 'draugr_ship', 'storm_crow'], at: {sea: 'norwegian_sea'}, weather: 'storm', text: 'Settle up with Svartkell the Tallyman in the Norwegian Sea.'},
    ],
    done: [
      N('Do you know how many debts you\'ve ruined doing favours? For FREE?', C.svartkell),
      H('Forty-something? I lost count. Trolls are bad at counting.'),
      N('I\'ll fine you! I\'ll fine you a... put me down! Put my SHIP down!', C.svartkell),
      H('Give Rán back the knot you stole, and I\'ll set you down gently.'),
      N('Ha! Every errand, and one grey nuisance. Come home, Gríma. Soup\'s on.', C.gnupa),
      H('Is there an errand that needs doing at home?'),
    ],
    reward: {silver: 60000, renown: 40, flag: 'saga_done_grima'},
  }),
];
