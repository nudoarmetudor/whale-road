// Tiny helpers for writing dialogue lines in the quest files.
// A line is {who:'npc'|'hero', text}. An npc line may carry {npc, name} when the speaker is not
// the quest giver (npc = portrait id from CONTRACT.md, name = display name). The UI should use
// line.npc/line.name when present and fall back to the quest's giver.npc / npcName.

export const N = (text, who) => (who ? {who: 'npc', npc: who[0], name: who[1], text} : {who: 'npc', text});
export const H = (text) => ({who: 'hero', text});

// Recurring cast: [portrait id, display name]. See docs/STORY.md for the full roster.
export const CAST = {
  hallvard: ['jarl', 'Jarl Hallvarð Thinbeard'],
  gunna: ['barkeep', 'Gunna Ladle'],
  bardr: ['moneylender', 'Bárðr Pennyclaw'],
  asa: ['priest', 'Ása the Hof-Keeper'],
  thorunn: ['merchant', 'Thórunn Scales'],
  eyvind: ['merchant', 'Eyvind Saltfoot'],
  ketta: ['barkeep', 'Ketta Two-Jugs'],
  hrolleif: ['jarl', 'Jarl Hrolleif Oakenbelly'],
  heidrun: ['volva', 'Old Heiðrún'],
  bergljot: ['jarl', 'Bergljót Whale-Counter'],
  ailu: ['merchant', 'Áilu the Trader'],
  gnupa: ['townswoman', 'Granny Gnúpa'],
  gudrid: ['jarl', 'Gudrið Woolwise'],
  kalfur: ['barkeep', 'Kálfur Puffin-Pie'],
  hildigunn: ['jarl', 'Lawspeaker Hildigunn Long-Memory'],
  thorve: ['priest', 'Hof-Keeper Thorvé'],
  thorgils: ['skald', 'Thorgils Frostbeard'],
  arnkell: ['jarl', 'Jarl Arnkell Tidewatcher'],
  mor: ['barkeep', 'Mór the Ale-Wife'],
  cathal: ['gael_king', 'Rí Cathal mac Aodha'],
  colm: ['monk', 'Brother Colm'],
  fionnuala: ['skald', 'Fionnuala the Harper'],
  donnchad: ['guildmaster', 'Donnchad Silverhand'],
  osgar: ['jarl', 'Reeve Osgar Coppergate'],
  wulfrun: ['guildmaster', 'Wulfrun the Comb-Maker'],
  leofric: ['banker', 'Leofric Twice-Counted'],
  ulfcetel: ['moneylender', 'Ulfcetel Sharp'],
  wynflaed: ['saxon_reeve', 'Reeve Wynflæd'],
  eadmer: ['monk', 'Brother Eadmer'],
  ceolwyn: ['townswoman', 'Ceolwyn the Fish-Wife'],
  anseau: ['frank_count', 'Viscount Anseau'],
  berthe: ['merchant', 'Berthe the Vintner'],
  audun: ['jarl', 'Harbour-Jarl Auðun Broadbelt'],
  tofa: ['barkeep', 'Tófa Brewmother'],
  ingrid: ['guildmaster', 'Ingrid Sixfingers'],
  saxi: ['banker', 'Saxi the Weigher'],
  vedis: ['runecarver', 'Védís the Rune-Carver'],
  hrefna: ['shipwright', 'Hrefna the Shipwright'],
  asfrid: ['warehouse', 'Asfrid Keys'],
  dobromira: ['slav_prince', 'Starosta Dobromira'],
  bogdan: ['barkeep', 'Bogdan the Eel-Smoker'],
  gedas: ['aesti_elder', 'Elder Gedas Amberhand'],
  rasa: ['townswoman', 'Rasa the Amber-Gatherer'],
  hegvald: ['jarl', 'Chieftain Hegvald Ten-Hoards'],
  botvi: ['banker', 'Botvi the Hoard-Counter'],
  gunnvor: ['jarl', 'Reeve Gunnvor Weighbeam'],
  folkvid: ['banker', 'Folkvid the Careful'],
  hallbera: ['barkeep', 'Hallbera Half-Cask'],
  arnvid: ['merchant', 'Arnvid Furtrader'],
  radoslav: ['slav_prince', 'Voivode Radoslav'],
  zlata: ['merchant', 'Zlata the Furrier'],
  milava: ['barkeep', 'Milava the Brewer'],
  dragomir: ['skald', 'Old Dragomir the Gusli-Player'],
  ratibor: ['slav_prince', 'Posadnik Ratibor'],
  bogumila: ['guildmaster', 'Guildmistress Bogumila'],
  yaromir: ['slav_prince', 'Voivode Yaromir'],
  svitozar: ['townsman', 'Svitozar the Rapids-Pilot'],
  ioannikios: ['byzantine_official', 'Ioannikios of the Seventeen Seals'],
  eudokia: ['byzantine_official', 'Magistra Eudokia'],
  kyra: ['banker', 'Kyra Anastaso the Silver-Dealer'],
  nikephora: ['guildmaster', 'Nikephora the Silk-Weaver'],
  leon: ['byzantine_official', 'Droungarios Leon'],
  svartkell: ['raider', 'Svartkell the Tallyman'],
  kolli: ['raider', 'Kolli Fat-Oar'],
};

// Builds saga chapter n for a hero with the boilerplate filled in: id 'hero_NN', saga, chapter,
// requires the previous chapter, no time limit. Fields in o override the defaults.
const pad = (n) => String(n).padStart(2, '0');
export const sagaQuest = (hero) => (n, o) => ({
  id: `${hero}_${pad(n)}`, saga: hero, chapter: n,
  requires: n > 1 ? [`${hero}_${pad(n - 1)}`] : [], requiresRenown: 0, timeLimit: null,
  ...o,
});

// Builds an optional task: saga null, chapter null, no requirements unless given.
export const sideQuest = (o) => ({
  saga: null, chapter: null, requires: [], requiresRenown: 0, timeLimit: null, ...o,
});
