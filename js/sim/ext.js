// Optional modules written by other owners (story, map). Loaded with top-level await so a
// missing or broken file never breaks the sim: each falls back to an empty value.
// Tests can override quest data with setQuestData().

async function opt(path) {
  try { return await import(path); } catch (e) { return {}; }
}

const heroes = await opt('../data/heroes.js');
const sagas = await opt('../data/quests/sagas.js');
const side = await opt('../data/quests/side.js');
const qitems = await opt('../data/quests/items.js');
const lore = await opt('../data/lore.js');
const routes = await opt('../data/routes.js');

// Collect every object that looks like a quest (has steps) from an array or a nested object.
function flatQuests(src) {
  const out = [];
  const walk = (v) => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (Array.isArray(v.steps) && v.id) { out.push(v); return; }
    Object.values(v).forEach(walk);
  };
  walk(src);
  return out;
}
function byId(src) {
  if (!src) return {};
  if (Array.isArray(src)) return Object.fromEntries(src.filter((h) => h && h.id).map((h) => [h.id, h]));
  return src;
}

// If sagas.js (SAGAS) is missing, collect every export of quests/saga_<hero>.js instead.
let sagaSrc = sagas.SAGAS;
if (!sagaSrc) {
  const ids = Object.keys(byId(heroes.HEROES));
  sagaSrc = [];
  for (const id of ids.length ? ids : ['ylva', 'bjarki', 'saeunn', 'hrafn', 'ketill', 'grima']) {
    sagaSrc.push(Object.values(await opt(`../data/quests/saga_${id}.js`)));
  }
}

export const EXT = {
  heroes: byId(heroes.HEROES),
  questItems: byId(qitems.QUEST_ITEMS),
  lore,
  routes,
  quests: [...flatQuests(sagaSrc), ...flatQuests(side.SIDE)],
};

export function setQuestData(list) { EXT.quests = flatQuests(list); }
export function questById(id) { return EXT.quests.find((q) => q.id === id) || null; }
