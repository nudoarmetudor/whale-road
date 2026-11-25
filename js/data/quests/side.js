// Optional tasks shared by every hero (story owner). SIDE is a flat array in the CONTRACT.md
// quest schema with saga:null, chapter:null. Every port has at least one. Gríma's saga is
// finishing all of them.
//
// Reward flags of the form 'sells_<port>_<good>' mean: from now on that port's market also sells
// that good (the sim adds it to the port's produces). Other flags are story bookkeeping.
import {N, H, CAST as C, sideQuest as s} from './lines.js';

export const SIDE = [
  // ---- Ravnfjord ----
  s({
    id: 'side_ravn_goat', title: 'The Goat on the Roof',
    giver: {port: 'ravnfjord', building: 'meadhall', npc: 'barkeep'}, npcName: 'Gunna Ladle',
    offer: [
      N('Skeggi the goat climbed onto my roof and ate the thatch. Then he ate the ladder. Now he lives up there.'),
      N('Bring timber to patch the roof. Skeggi can stay; he\'s good for business.'),
    ],
    steps: [{do: 'deliver', good: 'timber', qty: 10, port: 'ravnfjord', building: 'meadhall', text: 'Deliver 10 timber to Gunna Ladle\'s mead hall.'}],
    done: [N('A new roof! Skeggi is already eyeing it.'), H('I\'d nail it down twice.')],
    reward: {silver: 500, renown: 2, goods: {honey: 5}},
  }),
  s({
    id: 'side_ravn_lamp', title: 'Ása\'s Lamp',
    giver: {port: 'ravnfjord', building: 'altar', npc: 'priest'}, npcName: 'Ása the Hof-Keeper',
    offer: [
      N('The hof lamp has burned for forty winters. Last night it guttered. Odin may want a word.'),
      N('Make an offering for his ravens. Two will do. He likes even numbers; it\'s the only tidy thing about him.'),
    ],
    steps: [{do: 'sacrifice', blessing: 'odin', qty: 2, port: 'ravnfjord', text: 'Buy two blessings of Odin at the Ravnfjord altar.'}],
    done: [N('The flame stands tall again. Take this charm. It makes the gods a little cheaper to please.'), H('Don\'t tell them.')],
    reward: {silver: 800, renown: 3, items: ['rune_altar']},
  }),
  // ---- Kaupang ----
  s({
    id: 'side_kaup_weights', title: 'Honest Weights',
    giver: {port: 'kaupang', building: 'hall', npc: 'merchant'}, npcName: 'Thórunn Scales',
    offer: [
      N('My market weights have been "borrowed" so often they\'ve worn light. Traders grumble.'),
      N('Saxi the Weigher in Heiðabýr keeps true weights. Fetch a set, sealed.'),
    ],
    steps: [
      {do: 'collect', item: 'q_true_weights', port: 'heidaby', building: 'bank', text: 'Collect the sealed weights from Saxi at the Heiðabýr bank.', say: [
        N('True to a hair. If anyone files them, I\'ll know, and I\'ll weigh their ears.', C.saxi),
      ]},
      {do: 'bring', item: 'q_true_weights', port: 'kaupang', building: 'hall', text: 'Bring the true weights to Thórunn in Kaupang.'},
    ],
    done: [N('Honest weights in Kaupang again. The grumbling has moved on to the weather.'), H('Weather can\'t be weighed. Yet.')],
    reward: {silver: 1500, renown: 4},
  }),
  s({
    id: 'side_kaup_rush', title: 'Fish Before It Turns',
    giver: {port: 'kaupang', building: 'market', npc: 'merchant'}, npcName: 'Eyvind Saltfoot', timeLimit: 15,
    offer: [
      N('Heiðabýr\'s fish market is empty and mine is full. Take 30 stockfish down there before the price drops.'),
      N('Fifteen days, mind. After that the Danes will have caught their own.'),
    ],
    steps: [{do: 'deliver', good: 'stockfish', qty: 30, port: 'heidaby', building: 'market', text: 'Deliver 30 stockfish to the Heiðabýr market within 15 days.'}],
    done: [N('Eyvind\'s fish, on time! Here\'s his share and mine.', C.tofa), H('Fresh as stockfish ever gets.')],
    reward: {silver: 1800, renown: 3},
  }),
  s({
    id: 'side_kaup_ring', title: 'The Generous Stranger',
    giver: {port: 'kaupang', building: 'meadhall', npc: 'barkeep'}, npcName: 'Ketta Two-Jugs',
    offer: [
      N('A stranger drank all night, left a ring "for the next brave captain", and didn\'t pay. You look brave.'),
      N('Pay his tab and the ring is yours. It\'s a lovely ring. Glows a bit. Probably fine.'),
    ],
    steps: [{do: 'pay', silver: 300, port: 'kaupang', building: 'meadhall', text: 'Pay the stranger\'s 300 s tab at the Kaupang mead hall.'}],
    done: [N('There you go. Prices will smile on you. Raiders will too, I expect. Twice as often.'), H('Ketta, this ring is cursed.'), N('I said "probably".')],
    reward: {renown: 1, items: ['rune_cursed_greed']},
  }),
  // ---- Hlaðir ----
  s({
    id: 'side_hladir_hound', title: 'The Sneezing Hound',
    giver: {port: 'hladir', building: 'altar', npc: 'volva'}, npcName: 'Old Heiðrún',
    offer: [
      N('The jarl\'s hound Snorri sneezes so hard he falls over. The jarl is heartbroken. Snorri is embarrassed.'),
      N('Honey for a poultice here, and willow bark from Áilu in Hálogaland. Bring the bark to the jarl.'),
    ],
    steps: [
      {do: 'deliver', good: 'honey', qty: 10, port: 'hladir', building: 'altar', text: 'Deliver 10 honey to Old Heiðrún.'},
      {do: 'collect', item: 'q_willow_bark', port: 'halogaland', building: 'market', text: 'Collect willow bark from Áilu in Hálogaland.', say: [
        N('Willow bark for a sneezing dog? Of course. Tell him to sniff fewer flowers.', C.ailu),
      ]},
      {do: 'bring', item: 'q_willow_bark', port: 'hladir', building: 'hall', text: 'Bring the willow bark to Jarl Hrolleif for Snorri.'},
    ],
    done: [N('Snorri stopped sneezing! He stood up all by himself! Here, take my skald\'s mead.', C.hrolleif), H('Good dog.')],
    reward: {silver: 1500, renown: 4, items: ['mead_skald']},
  }),
  s({
    id: 'side_hladir_keel', title: 'A Keel for the Yard',
    giver: {port: 'hladir', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Hrolleif Oakenbelly', requiresRenown: 10,
    offer: [
      N('My shipwrights want to build the longest keel in the north. I want them to stop asking me for things.'),
      N('Timber and iron, and both of us will be happy.'),
    ],
    steps: [
      {do: 'deliver', good: 'timber', qty: 40, port: 'hladir', building: 'hall', text: 'Deliver 40 timber to Jarl Hrolleif.'},
      {do: 'deliver', good: 'iron', qty: 15, port: 'hladir', building: 'hall', text: 'Deliver 15 iron for keel rivets.'},
    ],
    done: [N('The keel is laid. The shipwrights are happy. I am left in peace. Truly, a good day.'), H('Let me know when she sails.')],
    reward: {silver: 3000, renown: 5},
  }),
  // ---- Hálogaland ----
  s({
    id: 'side_halo_bell', title: 'The Herd-Bell',
    giver: {port: 'halogaland', building: 'market', npc: 'merchant'}, npcName: 'Áilu the Trader',
    offer: [
      N('A storm crow stole the bell of my lead reindeer. Without it, the herd wanders and I spend days finding them.'),
      N('The crow nests over the Norwegian Sea. If you scare it, it drops what it carries. Crows are like that.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['storm_crow'], at: {sea: 'norwegian_sea'}, text: 'Chase the storm crow over the Norwegian Sea.'},
      {do: 'visit', port: 'halogaland', building: 'market', text: 'Return the herd-bell to Áilu.', say: [
        N('That sound! My herd will hear it from three valleys away. Thank you, friend.', C.ailu),
      ]},
    ],
    done: [N('From now on I\'ll keep furs at my stall for you. Good ones, from my cousins on the fells.'), H('I\'ll come back for them.')],
    reward: {silver: 2000, renown: 4, unlockGoods: ['furs'], flag: 'sells_halogaland_furs'},
  }),
  s({
    id: 'side_halo_whales', title: 'Counting Whales',
    giver: {port: 'halogaland', building: 'hall', npc: 'jarl'}, npcName: 'Bergljót Whale-Counter', requiresRenown: 10,
    offer: [
      N('I count whales, ships and debts. The whales I like best. Bring salt for the winter stores.'),
      N('And show me you can keep your own count. A captain with a fat purse gets my old sea-chart.'),
    ],
    steps: [
      {do: 'deliver', good: 'salt', qty: 30, port: 'halogaland', building: 'hall', text: 'Deliver 30 salt to Bergljót.'},
      {do: 'networth', amount: 20000, text: 'Grow your net worth to 20 000 s.'},
    ],
    done: [N('Here, my old chart. Every price I ever saw, scribbled in the margins.'), H('Your handwriting is very small.'), N('So are most profits.')],
    reward: {silver: 2500, renown: 5, items: ['chart_old']},
  }),
  // ---- Færeyjar ----
  s({
    id: 'side_faer_fodder', title: 'Hay for the Fog Sheep',
    giver: {port: 'faereyjar', building: 'hall', npc: 'jarl'}, npcName: 'Gudrið Woolwise', timeLimit: 30,
    offer: [
      N('My sheep live in fog. They are very calm and very hungry. Winter fodder is short.'),
      N('Bring grain within thirty days and I\'ll pay you in wadmal, woven from those same calm sheep.'),
    ],
    steps: [{do: 'deliver', good: 'grain', qty: 25, port: 'faereyjar', building: 'hall', text: 'Deliver 25 grain to Gudrið within 30 days.'}],
    done: [N('The sheep thank you. They said "baa", but they meant it warmly.'), H('I could tell.')],
    reward: {silver: 2000, renown: 4, goods: {wadmal: 20}},
  }),
  s({
    id: 'side_faer_skua', title: 'The Skua Pirates',
    giver: {port: 'faereyjar', building: 'meadhall', npc: 'barkeep'}, npcName: 'Kálfur Puffin-Pie',
    offer: [
      N('Raiders out of the fog steal our fishermen\'s catch. We call them skuas, like the thieving birds.'),
      N('Teach them some manners in the Norwegian Sea. The puffin pie is on me.'),
    ],
    steps: [{do: 'defeat', enemies: ['raider_faering', 'raider_faering', 'raider_karvi'], at: {sea: 'norwegian_sea'}, text: 'Drive the skua raiders out of the Norwegian Sea.'}],
    done: [N('The fishermen are home with full boats! Pie for everyone!'), H('What\'s actually in puffin pie?'), N('Best not to ask.')],
    reward: {silver: 3000, renown: 5},
  }),
  // ---- Ísland ----
  s({
    id: 'side_isl_verse', title: 'Verse Two Hundred and Twelve',
    giver: {port: 'island', building: 'hall', npc: 'jarl'}, npcName: 'Lawspeaker Hildigunn Long-Memory',
    offer: [
      N('I recite the whole law from memory every summer. All of it. Except verse two hundred and twelve, which I forgot.'),
      N('An old skald in Færeyjar learned it from my teacher. Ask him, quietly. Nobody must know I forgot.'),
    ],
    steps: [
      {do: 'visit', port: 'faereyjar', building: 'meadhall', text: 'Ask the old skald in Færeyjar for verse 212.', say: [
        N('Two hundred and twelve: "No man shall sell a horse he has painted to look like a better horse." Classic.', C.thorgils),
      ]},
      {do: 'visit', port: 'island', building: 'hall', text: 'Whisper the verse to the Lawspeaker.'},
    ],
    done: [N('Of course! The painted horse! How could I forget? Your silence is worth this.'), H('What silence? Oh. That silence.')],
    reward: {silver: 4000, renown: 6},
  }),
  s({
    id: 'side_isl_spring', title: 'Bread from the Hot Spring',
    giver: {port: 'island', building: 'altar', npc: 'priest'}, npcName: 'Hof-Keeper Thorvé',
    offer: [
      N('We bake bread in the hot ground here. Lately the earth grumbles and the loaves come out angry.'),
      N('An offering to Kári for calm winds, and grain for proper bread. Then the earth may settle.'),
    ],
    steps: [
      {do: 'sacrifice', blessing: 'kari', qty: 2, port: 'island', text: 'Buy two blessings of Kári at the Ísland altar.'},
      {do: 'deliver', good: 'grain', qty: 20, port: 'island', building: 'altar', text: 'Deliver 20 grain to Thorvé.'},
    ],
    done: [N('Warm bread, calm earth. Take this storm-rune. Storms will step around you like a sleeping dog.'), H('A very large sleeping dog.')],
    reward: {silver: 3000, renown: 5, items: ['rune_storm']},
  }),
  // ---- Orkneyjar ----
  s({
    id: 'side_ork_selkie', title: 'The Tangled Seals',
    giver: {port: 'orkney', building: 'meadhall', npc: 'barkeep'}, npcName: 'Mór the Ale-Wife',
    offer: [
      N('A sea serpent in the Pentland Firth thrashes about and tangles the seals in our nets. Poor things howl all night.'),
      N('The old folk say seals remember kindness. Free them, and see.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['serpent'], at: {sea: 'pentland'}, text: 'Drive the serpent from the Pentland Firth.'},
      {do: 'visit', port: 'orkney', building: 'meadhall', text: 'Tell Mór the seals are free.', say: [
        N('Look on the doorstep. A horn, carved from shell, left by the tide. The seals remembered.', C.mor),
      ]},
    ],
    done: [N('Blow it in a fight and your enemies may think twice. Seals know a thing or two about fleeing.'), H('Thank you, seals.')],
    reward: {silver: 3500, renown: 6, items: ['horn_sea']},
  }),
  s({
    id: 'side_ork_ale', title: 'Orkney Ale',
    giver: {port: 'orkney', building: 'hall', npc: 'jarl'}, npcName: 'Jarl Arnkell Tidewatcher',
    offer: [
      N('The midsummer ale is the pride of the islands. This year the barley drowned and the bees sulked.'),
      N('Grain and honey, and I\'ll pay you in fish. We have a great deal of fish.'),
    ],
    steps: [
      {do: 'deliver', good: 'grain', qty: 25, port: 'orkney', building: 'hall', text: 'Deliver 25 grain to Jarl Arnkell.'},
      {do: 'deliver', good: 'honey', qty: 10, port: 'orkney', building: 'hall', text: 'Deliver 10 honey for the midsummer ale.'},
    ],
    done: [N('The ale is brewing! It will be ready by midsummer, or by midwinter, depending on the ale.'), H('Save me a cup either way.')],
    reward: {silver: 2000, renown: 3, goods: {stockfish: 20}},
  }),
  // ---- Dyflin ----
  s({
    id: 'side_dyf_guild', title: 'The Harpers\' Guild',
    giver: {port: 'dyflin', building: 'guild', npc: 'guildmaster'}, npcName: 'Donnchad Silverhand',
    offer: [
      N('The harpers\' and smiths\' guild of Dyflin welcomes patrons. Patrons with silver, especially.'),
      N('A donation, and our craftsmen will take your commissions.'),
    ],
    steps: [{do: 'donate', silver: 1500, port: 'dyflin', text: 'Donate 1 500 s to the Dyflin guild.'}],
    done: [N('Welcome, patron. Fionnuala the harper has a commission for you already.'), H('Already? Word travels fast here.')],
    reward: {renown: 4, flag: 'guild_dyflin'},
  }),
  s({
    id: 'side_dyf_harp', title: 'Strings for Fionnuala',
    giver: {port: 'dyflin', building: 'guild', npc: 'skald'}, npcName: 'Fionnuala the Harper',
    requires: ['side_dyf_guild'],
    offer: [
      N('My harp needs new tuning pins. Iron for the pins, walrus ivory for the pegs. The guild smiths will make them.'),
      N('They say a harp tuned true brings luck to whoever pays for it. I believe it, because I\'m the harper.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 5, port: 'dyflin', building: 'guild', text: 'Deliver 5 iron to the Dyflin guild.'},
      {do: 'deliver', good: 'ivory', qty: 5, port: 'dyflin', building: 'guild', text: 'Deliver 5 walrus ivory to the Dyflin guild.'},
    ],
    done: [N('Listen! True as a lark. This charm was carved from the offcuts. Keep it; luck follows.'), H('It hums. In tune, this time.')],
    reward: {silver: 1000, renown: 5, items: ['rune_luck']},
  }),
  s({
    id: 'side_dyf_pages', title: 'Brother Colm\'s Pages',
    giver: {port: 'dyflin', building: 'meadhall', npc: 'monk'}, npcName: 'Brother Colm',
    offer: [
      N('A gust took twelve pages of my gospel book clean out of the window and over the sea.'),
      N('A Jórvík trader writes that pages washed up in his market. Will you fetch them? Gently. They\'re soggy.'),
    ],
    steps: [
      {do: 'collect', item: 'q_lost_pages', port: 'jorvik', building: 'market', text: 'Collect Brother Colm\'s pages from the Jórvík market.'},
      {do: 'bring', item: 'q_lost_pages', port: 'dyflin', building: 'meadhall', text: 'Bring the pages to Brother Colm.'},
    ],
    done: [N('All twelve! A little salty. So am I, some days. Bless you.'), H('Shut the window next time.')],
    reward: {silver: 2500, renown: 5},
  }),
  // ---- Jórvík ----
  s({
    id: 'side_jor_guild', title: 'Comb-Makers\' Dues',
    giver: {port: 'jorvik', building: 'guild', npc: 'guildmaster'}, npcName: 'Wulfrun the Comb-Maker',
    offer: [
      N('Coppergate\'s comb-makers keep a guild. Antler, bone, walrus ivory. Patrons get first pick.'),
      N('Pay your dues and I\'ll take your commission.'),
    ],
    steps: [{do: 'donate', silver: 2000, port: 'jorvik', text: 'Donate 2 000 s to the Jórvík guild.'}],
    done: [N('You\'re a patron now. Come back with ivory and I\'ll make you something fit for a bride.'), H('I\'ll remember.')],
    reward: {renown: 4, flag: 'guild_jorvik'},
  }),
  s({
    id: 'side_jor_comb', title: 'The Ivory Comb',
    giver: {port: 'jorvik', building: 'guild', npc: 'guildmaster'}, npcName: 'Wulfrun the Comb-Maker',
    requires: ['side_jor_guild'],
    offer: [
      N('Hamwic\'s reeve is marrying off her daughter. A Jórvík comb would be the gift of the year.'),
      N('Bring walrus ivory and I\'ll carve the finest comb in Coppergate.'),
    ],
    steps: [{do: 'deliver', good: 'ivory', qty: 10, port: 'jorvik', building: 'guild', text: 'Deliver 10 walrus ivory to Wulfrun.'}],
    done: [N('There. Wave-patterns on one side, little puffins on the other. Take it to Hamwic.'), H('The puffins are my favourite part.')],
    reward: {silver: 1000, renown: 4, items: ['q_bone_comb']},
  }),
  s({
    id: 'side_jor_dues', title: 'Coin for Coppergate',
    giver: {port: 'jorvik', building: 'bank', npc: 'banker'}, npcName: 'Leofric Twice-Counted',
    offer: [
      N('Hamwic\'s reeve keeps her town\'s savings with us. She has a chest ready, but no ship to bring it.'),
      N('Fetch it, and don\'t open it. I counted it twice. I\'ll count it twice again.'),
    ],
    steps: [
      {do: 'collect', item: 'q_dues_chest', port: 'hamwic', building: 'hall', text: 'Collect Hamwic\'s savings chest from Reeve Wynflæd.'},
      {do: 'bring', item: 'q_dues_chest', port: 'jorvik', building: 'bank', text: 'Bring the chest to Leofric at the Jórvík bank.'},
    ],
    done: [N('One, two... and one, two. Correct, twice. Your fee, counted once. I trust you.'), H('High praise from you.')],
    reward: {silver: 2500, renown: 4},
  }),
  // ---- Hamwic ----
  s({
    id: 'side_ham_bride', title: 'A Comb for the Bride',
    giver: {port: 'hamwic', building: 'hall', npc: 'saxon_reeve'}, npcName: 'Reeve Wynflæd',
    requires: ['side_jor_comb'],
    offer: [
      N('My daughter weds at midsummer. Everyone is bringing linen. If only someone brought something special.'),
      H('As it happens, I carry a comb from Coppergate.'),
    ],
    steps: [{do: 'bring', item: 'q_bone_comb', port: 'hamwic', building: 'hall', text: 'Give Wulfrun\'s comb to Reeve Wynflæd.'}],
    done: [N('Puffins! She\'ll adore it. Take this, and a seat at the wedding feast.'), H('I\'ll bring my appetite.')],
    reward: {silver: 3000, renown: 6, goods: {wine: 10}},
  }),
  s({
    id: 'side_ham_salt', title: 'Salt for the Fish-Wives',
    giver: {port: 'hamwic', building: 'market', npc: 'townswoman'}, npcName: 'Ceolwyn the Fish-Wife', timeLimit: 20,
    offer: [
      N('The herring are running and we have no salt to cure them. Twenty days, and they\'ll be gone.'),
      N('Bring salt, and the fish-wives of Hamwic will shout your name at the market. Loudly. We\'re good at that.'),
    ],
    steps: [{do: 'deliver', good: 'salt', qty: 30, port: 'hamwic', building: 'market', text: 'Deliver 30 salt to the Hamwic market within 20 days.'}],
    done: [N('Salt! Ladies, a cheer for our captain!'), H('My ears are ringing.')],
    reward: {silver: 2200, renown: 3},
  }),
  // ---- Rúðuborg ----
  s({
    id: 'side_rud_barrels', title: 'The Vintner\'s Barrels',
    giver: {port: 'rudaborg', building: 'market', npc: 'merchant'}, npcName: 'Berthe the Vintner',
    offer: [
      N('The harvest was good and my barrels are few. Wine in a jug goes sour; wine in oak sings.'),
      N('Bring me timber for staves and I\'ll keep wine at my stall for Northern buyers.'),
    ],
    steps: [{do: 'deliver', good: 'timber', qty: 25, port: 'rudaborg', building: 'market', text: 'Deliver 25 timber to Berthe the vintner.'}],
    done: [N('Barrels for the whole harvest! Take a few casks now. And come back; my stall is yours.'), H('Your wine sings? I\'ll listen.')],
    reward: {silver: 1000, renown: 4, goods: {wine: 15}, unlockGoods: ['wine'], flag: 'sells_rudaborg_wine'},
  }),
  s({
    id: 'side_rud_cog', title: 'River Thieves',
    giver: {port: 'rudaborg', building: 'hall', npc: 'frank_count'}, npcName: 'Viscount Anseau', requiresRenown: 15,
    offer: [
      N('Thieves stole two of my merchant cogs and now prey on the Channel traders. My own ships! The shame.'),
      N('Bring them to heel. Gently with the cogs, please. I want them back with fewer holes.'),
    ],
    steps: [{do: 'defeat', enemies: ['frankish_cog', 'frankish_cog'], at: {sea: 'channel'}, text: 'Stop the thieves in the stolen cogs in the Channel.'}],
    done: [N('My cogs! Only slightly scorched. Rúðuborg owes you a fine dinner and a finer purse.'), H('I\'ll take both.')],
    reward: {silver: 4000, renown: 6},
  }),
  // ---- Heiðabýr ----
  s({
    id: 'side_heid_guild', title: 'Ingrid\'s Guild',
    giver: {port: 'heidaby', building: 'guild', npc: 'guildmaster'}, npcName: 'Ingrid Sixfingers',
    offer: [
      N('Heiðabýr\'s craft guild: smiths, glassmakers, comb-makers, and me. I count on six fingers, so I count faster.'),
      N('Patrons may commission the guild. Patrons pay first.'),
    ],
    steps: [{do: 'donate', silver: 2000, port: 'heidaby', text: 'Donate 2 000 s to the Heiðabýr guild.'}],
    done: [N('Welcome, patron. Bring iron and amber and our smiths will carve you a fine hold-rune.'), H('Six fingers. Very efficient.')],
    reward: {renown: 4, flag: 'guild_heidaby'},
  }),
  s({
    id: 'side_heid_charm', title: 'Iron and Amber',
    giver: {port: 'heidaby', building: 'guild', npc: 'guildmaster'}, npcName: 'Ingrid Sixfingers',
    requires: ['side_heid_guild'],
    offer: [
      N('An iron rune-plate, inlaid with amber, nailed inside a hull. Holds feel bigger. Nobody knows why. Nobody asks.'),
      N('Bring the iron and amber and it\'s yours.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 15, port: 'heidaby', building: 'guild', text: 'Deliver 15 iron to the Heiðabýr guild.'},
      {do: 'deliver', good: 'amber', qty: 5, port: 'heidaby', building: 'guild', text: 'Deliver 5 amber to the Heiðabýr guild.'},
    ],
    done: [N('Nail it near the mast. And don\'t ask why it works.'), H('I wasn\'t going to.')],
    reward: {renown: 4, items: ['rune_hold']},
  }),
  s({
    id: 'side_kaup_tally', title: 'The Warehouse Tally-Stick',
    giver: {port: 'kaupang', building: 'warehouse', npc: 'warehouse'}, npcName: 'Asfrid Keys',
    offer: [
      N('My tally-stick for the Gotland shipments sailed off by mistake. Without it, nobody knows whose barrels are whose.'),
      N('The Gotland warehouse has it. Bring it back before someone takes my honey thinking it\'s theirs.'),
    ],
    steps: [
      {do: 'collect', item: 'q_tally_stick', port: 'gotland', building: 'warehouse', text: 'Collect Asfrid\'s tally-stick from the Gotland warehouse.'},
      {do: 'bring', item: 'q_tally_stick', port: 'kaupang', building: 'warehouse', text: 'Return the tally-stick to Asfrid Keys in Kaupang.'},
    ],
    done: [N('Every notch where it should be. My honey is safe! Your fee, and a jar for the road.'), H('Honey and silver. A sweet errand.')],
    reward: {silver: 2000, renown: 3, goods: {honey: 5}},
  }),
  s({
    id: 'side_heid_ram', title: 'Hrefna\'s Ram',
    giver: {port: 'heidaby', building: 'shipyard', npc: 'shipwright'}, npcName: 'Hrefna the Shipwright', requiresRenown: 15,
    offer: [
      N('I\'ve an idea for a ram that bites twice as hard. I need iron for the beak and timber for the brace.'),
      N('Bring both, and you can have the rune that goes with it. My grandmother carved it. She was terrifying.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 20, port: 'heidaby', building: 'shipyard', text: 'Deliver 20 iron to Hrefna.'},
      {do: 'deliver', good: 'timber', qty: 20, port: 'heidaby', building: 'shipyard', text: 'Deliver 20 timber to Hrefna.'},
    ],
    done: [N('Here: the ram-rune. Your rams will hit like an angry grandmother.'), H('The most dangerous force in the North.')],
    reward: {renown: 4, items: ['rune_ram']},
  }),
  // ---- Jómsborg (opens when the fortress falls) ----
  s({
    id: 'side_joms_sweep', title: 'Sweeping Up Jómsborg',
    giver: {port: 'jomsborg', building: 'hall', npc: 'slav_prince'}, npcName: 'Starosta Dobromira',
    offer: [
      N('The raiders left Jómsborg a mess: broken doors, empty granaries, a goat in the chapel.'),
      N('Timber and grain to set things right. We pay in hacksilver; we have rather a lot of it now.'),
    ],
    steps: [
      {do: 'deliver', good: 'timber', qty: 30, port: 'jomsborg', building: 'hall', text: 'Deliver 30 timber to Starosta Dobromira.'},
      {do: 'deliver', good: 'grain', qty: 20, port: 'jomsborg', building: 'hall', text: 'Deliver 20 grain to Jómsborg\'s granary.'},
    ],
    done: [N('Doors on hinges, bread in ovens. The goat stays. He\'s been through a lot.'), H('Haven\'t we all.')],
    reward: {silver: 3000, renown: 6, goods: {hacksilver: 10}},
  }),
  s({
    id: 'side_joms_wreck', title: 'The Drowned Hoard',
    giver: {port: 'jomsborg', building: 'meadhall', npc: 'barkeep'}, npcName: 'Bogdan the Eel-Smoker',
    offer: [
      N('A ghost ship still haunts the waters off our coast, guarding the last hoard the Tallyman dredged up.'),
      N('Lay it to rest. The hoard belongs to whoever is brave enough. That\'s an old rule. I just made it up.'),
    ],
    steps: [{do: 'defeat', enemies: ['draugr_ship'], at: {sea: 'baltic_south'}, weather: 'fog', text: 'Lay the ghost ship off Jómsborg to rest.'}],
    done: [N('The ghost ship is gone and the hoard floats up, polite as you please. And this charm was with it.'), H('Lucky.'), N('Very.')],
    reward: {silver: 6000, renown: 8, items: ['rune_luck']},
  }),
  // ---- Truso ----
  s({
    id: 'side_truso_storm', title: 'After the Storm',
    giver: {port: 'truso', building: 'market', npc: 'townswoman'}, npcName: 'Rasa the Amber-Gatherer',
    offer: [
      N('After a storm the beach is gold with amber. But we gatherers must eat while we comb the sand.'),
      N('Bring salt for our fish, and I\'ll keep amber at my stall for you.'),
    ],
    steps: [{do: 'deliver', good: 'salt', qty: 20, port: 'truso', building: 'market', text: 'Deliver 20 salt to Rasa at the Truso market.'}],
    done: [N('Thank you! Here, from this morning\'s beach. The one with the beetle in it is lucky.'), H('Hello, beetle.')],
    reward: {silver: 500, renown: 3, goods: {amber: 15}, unlockGoods: ['amber'], flag: 'sells_truso_amber'},
  }),
  s({
    id: 'side_truso_sandbar', title: 'Stuck on the Sandbar',
    giver: {port: 'truso', building: 'hall', npc: 'aesti_elder'}, npcName: 'Elder Gedas Amberhand',
    offer: [
      N('Our gatherers\' boat ran onto a sandbar, and raiders circle them like gulls round a herring.'),
      N('Drive the raiders off, and bring my people home.'),
    ],
    steps: [
      {do: 'defeat', enemies: ['raider_karvi', 'raider_karvi'], at: {sea: 'baltic_east'}, text: 'Drive off the raiders circling the sandbar.'},
      {do: 'visit', port: 'truso', building: 'market', text: 'Bring the rescued gatherers home to the Truso market.', say: [
        N('We thought we\'d be eating sand for a week! Thank you, thank you.', C.rasa),
      ]},
    ],
    done: [N('Everyone home, and only one lost shoe. Truso thanks you.'), H('I\'ll keep an eye out for the shoe.')],
    reward: {silver: 3500, renown: 6},
  }),
  // ---- Gotland ----
  s({
    id: 'side_got_hoards', title: 'Ten Hoards, One Map',
    giver: {port: 'gotland', building: 'hall', npc: 'jarl'}, npcName: 'Chieftain Hegvald Ten-Hoards',
    offer: [
      N('I buried ten hoards and drew one map. Then I tore it in half so no one could steal it.'),
      N('Then I gave the halves to friends in Birka and Truso for safekeeping, and forgot which friends. Help?'),
    ],
    steps: [
      {do: 'collect', item: 'q_map_half_a', port: 'birka', building: 'meadhall', text: 'Find the first half of Hegvald\'s map in Birka\'s mead hall.', say: [
        N('This? I\'ve been using it as a coaster.', C.hallbera),
      ]},
      {do: 'collect', item: 'q_map_half_b', port: 'truso', building: 'hall', text: 'Find the second half with Elder Gedas in Truso.', say: [
        N('Hegvald\'s map? It\'s been holding up my table leg for two winters.', C.gedas),
      ]},
      {do: 'bring', item: 'q_map_half_a', port: 'gotland', building: 'hall', text: 'Bring the first half to Hegvald.'},
      {do: 'bring', item: 'q_map_half_b', port: 'gotland', building: 'hall', text: 'Bring the second half to Hegvald.'},
    ],
    done: [N('Both halves! Now I remember: hoard nine is under hoard four. Take a share, friend.'), H('Maybe draw two maps next time.')],
    reward: {silver: 5000, renown: 6, goods: {amber: 10}},
  }),
  s({
    id: 'side_got_nestegg', title: 'Hegvald\'s Nest Egg',
    giver: {port: 'gotland', building: 'bank', npc: 'banker'}, npcName: 'Botvi the Hoard-Counter', requiresRenown: 10,
    offer: [
      N('The chieftain wants an account opened for his grandson, by a captain of standing. His words.'),
      N('Show me you\'re a captain of standing, then pay in the first silver. He\'ll repay you double, he says.'),
    ],
    steps: [
      {do: 'networth', amount: 30000, text: 'Grow your net worth to 30 000 s.'},
      {do: 'pay', silver: 2000, port: 'gotland', building: 'bank', text: 'Pay 2 000 s into the grandson\'s account at the Gotland bank.'},
    ],
    done: [N('Opened. And here\'s Hegvald\'s repayment. Double, as promised. He never digs up less than he buries.'), H('A good habit.')],
    reward: {silver: 4000, renown: 5},
  }),
  // ---- Birka ----
  s({
    id: 'side_birka_scales', title: 'The Weigher\'s Old Scales',
    giver: {port: 'birka', building: 'bank', npc: 'banker'}, npcName: 'Folkvid the Careful',
    offer: [
      N('The old town scales have sat in my vault for years, after a scandal. The reeve wants them hung in her hall.'),
      N('A reminder, she says. Of what happens to coin-weighers with clever thumbs.'),
    ],
    steps: [
      {do: 'collect', item: 'q_old_scales', port: 'birka', building: 'bank', text: 'Collect the old town scales from Folkvid\'s vault.'},
      {do: 'bring', item: 'q_old_scales', port: 'birka', building: 'hall', text: 'Bring the old scales to Reeve Gunnvor.', say: [
        N('Look at that pan. Filed thin on one side. Some clever thumb did that, years ago.', C.gunnvor),
      ]},
    ],
    done: [N('They\'ll hang in my hall as a warning to anyone who thinks rounding is a kind of arithmetic.', C.gunnvor), H('Rounding down, mostly.')],
    reward: {silver: 2000, renown: 3},
  }),
  s({
    id: 'side_birka_furs', title: 'Furs Before First Frost',
    giver: {port: 'birka', building: 'market', npc: 'merchant'}, npcName: 'Arnvid Furtrader', timeLimit: 20,
    offer: [
      N('The first frost is coming and every fine lady in Birka wants a new fur collar. I have none.'),
      N('Twenty furs in twenty days, and I\'ll pay well. On day twenty-one, nobody wants furs. Fashion.'),
    ],
    steps: [{do: 'deliver', good: 'furs', qty: 20, port: 'birka', building: 'market', text: 'Deliver 20 furs to Arnvid at the Birka market within 20 days.'}],
    done: [N('Just in time! The collars will be sewn by morning.'), H('And out of fashion by spring.'), N('That\'s the beauty of it.')],
    reward: {silver: 3000, renown: 4},
  }),
  // ---- Aldeigjuborg ----
  s({
    id: 'side_ald_salt', title: 'Salt Up the Volkhov',
    giver: {port: 'aldeigja', building: 'hall', npc: 'slav_prince'}, npcName: 'Voivode Radoslav',
    offer: [
      N('Our trappers go up the Volkhov for the winter. No salt, no preserved meat, no trappers in spring.'),
      N('Bring salt and I\'ll pay you partly in furs. They go well with salt; ask any trapper.'),
    ],
    steps: [{do: 'deliver', good: 'salt', qty: 30, port: 'aldeigja', building: 'hall', text: 'Deliver 30 salt to Voivode Radoslav.'}],
    done: [N('Good. The trappers go north with full barrels. You\'ll have the furs they bring back.'), H('I\'ll be back for them.')],
    reward: {silver: 2500, renown: 4, goods: {furs: 10}},
  }),
  s({
    id: 'side_ald_boatmen', title: 'The Frozen Boatmen',
    giver: {port: 'aldeigja', building: 'meadhall', npc: 'barkeep'}, npcName: 'Milava the Brewer',
    offer: [
      N('The boatmen came back from the ice coughing and blue. Warm cloth and honey for the throat will cure them.'),
      N('My brew helps too, but they won\'t take it. Something about the taste.'),
    ],
    steps: [
      {do: 'deliver', good: 'wadmal', qty: 20, port: 'aldeigja', building: 'meadhall', text: 'Deliver 20 wadmal to Milava.'},
      {do: 'deliver', good: 'honey', qty: 10, port: 'aldeigja', building: 'meadhall', text: 'Deliver 10 honey to Milava.'},
    ],
    done: [N('Wrapped and warm and sipping honey. They\'re singing again, which is worse than the coughing.'), H('Can\'t win them all.')],
    reward: {silver: 2000, renown: 4},
  }),
  // ---- Hólmgarðr ----
  s({
    id: 'side_holm_guild', title: 'Bogumila\'s Guild',
    giver: {port: 'holmgard', building: 'guild', npc: 'guildmaster'}, npcName: 'Guildmistress Bogumila',
    offer: [
      N('The merchants\' guild of Hólmgarðr takes members from anywhere, if they pay and don\'t argue in the council.'),
      N('The first part is easy. The second, nobody manages.'),
    ],
    steps: [{do: 'donate', silver: 3000, port: 'holmgard', text: 'Donate 3 000 s to the Hólmgarðr guild.'}],
    done: [N('Welcome. Our bell-founders could use a patron. The council bell cracked during the goose debate.'), H('The goose debate?'), N('Don\'t ask.')],
    reward: {renown: 5, flag: 'guild_holmgard'},
  }),
  s({
    id: 'side_holm_bell', title: 'The Council Bell',
    giver: {port: 'holmgard', building: 'guild', npc: 'guildmaster'}, npcName: 'Guildmistress Bogumila',
    requires: ['side_holm_guild'],
    offer: [
      N('A new council bell: iron for the body, amber in the clapper for a sweet tone. The founders will add a gift for you.'),
      N('A small horn from the same metal. Blow it at your enemies; they\'ll think the council is coming.'),
    ],
    steps: [
      {do: 'deliver', good: 'iron', qty: 20, port: 'holmgard', building: 'guild', text: 'Deliver 20 iron to the Hólmgarðr guild.'},
      {do: 'deliver', good: 'amber', qty: 10, port: 'holmgard', building: 'guild', text: 'Deliver 10 amber to the Hólmgarðr guild.'},
    ],
    done: [N('Hear it ring! Every citizen now has a reason to come and argue. Here is your horn.'), H('Nobody wants the council coming for them.')],
    reward: {silver: 2000, renown: 6, items: ['horn_sea']},
  }),
  // ---- Kænugarðr ----
  s({
    id: 'side_kaen_rapids', title: 'Svitozar\'s Boats',
    giver: {port: 'kaenugard', building: 'market', npc: 'townsman'}, npcName: 'Svitozar the Rapids-Pilot',
    offer: [
      N('I guide boats down the rapids. Seven rapids, seven names, each ruder than the last.'),
      N('Now bandits wait at the fourth one. Chase them off and I\'ll guide you free for life.'),
    ],
    steps: [{do: 'defeat', enemies: ['raider_snekkja', 'raider_karvi'], at: {sea: 'dnieper_rapids'}, text: 'Chase the bandits from the Dnieper rapids.'}],
    done: [N('The rapids are only dangerous again, not deadly! Free guiding for life, as promised.'), H('How long is a pilot\'s life?'), N('Depends on the rapids.')],
    reward: {silver: 5000, renown: 7},
  }),
  s({
    id: 'side_kaen_feast', title: 'Honey for the Feast',
    giver: {port: 'kaenugard', building: 'hall', npc: 'slav_prince'}, npcName: 'Voivode Yaromir', timeLimit: 25,
    offer: [
      N('The princely feast is in twenty-five days. Without honey there\'s no mead, and without mead there\'s no feast.'),
      N('And without a feast, there\'s a very cross princess. Bring honey.'),
    ],
    steps: [{do: 'deliver', good: 'honey', qty: 30, port: 'kaenugard', building: 'hall', text: 'Deliver 30 honey to Voivode Yaromir within 25 days.'}],
    done: [N('The mead is brewing and the princess is smiling. Take some Greek silk; she insists.'), H('Thank her for me.')],
    reward: {silver: 4000, renown: 5, goods: {silk: 5}},
  }),
  // ---- Miklagarðr ----
  s({
    id: 'side_mik_seals', title: 'Seventeen Seals',
    giver: {port: 'miklagard', building: 'hall', npc: 'byzantine_official'}, npcName: 'Ioannikios of the Seventeen Seals',
    offer: [
      N('A foreign trader wishing to trade freely needs the seals of the market, the guild and the bank.'),
      N('Also a fee. Also patience. Mostly patience. Go. Return with seals.'),
    ],
    steps: [
      {do: 'pay', silver: 1000, port: 'miklagard', building: 'hall', text: 'Pay Ioannikios the 1 000 s fee.'},
      {do: 'visit', port: 'miklagard', building: 'market', text: 'Get the market\'s seal.'},
      {do: 'visit', port: 'miklagard', building: 'guild', text: 'Get the guild\'s seal.'},
      {do: 'visit', port: 'miklagard', building: 'bank', text: 'Get the bank\'s seal.'},
    ],
    done: [N('All the seals! Unprecedented. Here is your fee back, with interest, and my private price-chart.'), H('You\'re giving money back?'), N('Tell no one.')],
    reward: {silver: 6000, renown: 6, items: ['chart_old']},
  }),
  s({
    id: 'side_mik_guild', title: 'The Silk-Weavers\' Guild',
    giver: {port: 'miklagard', building: 'guild', npc: 'guildmaster'}, npcName: 'Nikephora the Silk-Weaver',
    offer: [
      N('The silk-weavers of the City accept foreign patrons. Rarely. For a large donation. Very rarely.'),
      N('But our looms make things no Northern loom has dreamed of.'),
    ],
    steps: [{do: 'donate', silver: 5000, port: 'miklagard', text: 'Donate 5 000 s to the silk-weavers\' guild.'}],
    done: [N('You are a patron of the looms. Bring silk and wadmal and we will weave you a sail that catches every breeze.'), H('Wadmal and silk, together?'), N('You\'ll see.')],
    reward: {renown: 6, flag: 'guild_miklagard'},
  }),
  s({
    id: 'side_mik_sail', title: 'A Silk Sail',
    giver: {port: 'miklagard', building: 'guild', npc: 'guildmaster'}, npcName: 'Nikephora the Silk-Weaver',
    requires: ['side_mik_guild'],
    offer: [
      N('Wadmal for strength, silk for lightness, woven together with a pattern that has no name.'),
      N('We will keep the sail. You will keep the rune sewn into its corner. That is where the speed lives.'),
    ],
    steps: [
      {do: 'deliver', good: 'silk', qty: 10, port: 'miklagard', building: 'guild', text: 'Deliver 10 silk to the silk-weavers\' guild.'},
      {do: 'deliver', good: 'wadmal', qty: 20, port: 'miklagard', building: 'guild', text: 'Deliver 20 wadmal to the silk-weavers\' guild.'},
    ],
    done: [N('Here: the speed-rune. Your ships will feel lighter than the gossip in the Hippodrome.'), H('That\'s very light.')],
    reward: {renown: 8, items: ['rune_speed']},
  }),
  s({
    id: 'side_mik_wager', title: 'The Droungarios\'s Wager',
    giver: {port: 'miklagard', building: 'hall', npc: 'byzantine_official'}, npcName: 'Droungarios Leon', requiresRenown: 40,
    offer: [
      N('They say Northern captains are the best on any sea. I command one dromon and a great deal of curiosity.'),
      N('A friendly bout on the Black Sea. Blunted arrows, no fire. Win, and the wager is yours.'),
    ],
    steps: [{do: 'defeat', enemies: ['byzantine_dromon'], at: {sea: 'black_sea'}, text: 'Win the friendly bout against the Droungarios on the Black Sea.'}],
    done: [N('Splendid! My crew is soaked and my pride is bruised. Here is your wager, and my respect.'), H('Same time next year?'), N('Absolutely not.')],
    reward: {silver: 10000, renown: 10},
  }),
];
