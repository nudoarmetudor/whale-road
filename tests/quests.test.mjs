// Validator for the story data (story owner): heroes, sagas, side tasks, quest items, lore.
// Run: node tests/quests.test.mjs
// Contract lists are hard-coded from docs/CONTRACT.md. When js/data/ports.js and routes.js are
// present, the test also checks buildings, goods for sale and sea marks against them.

import test from 'node:test';
import assert from 'node:assert/strict';

import {HEROES} from '../js/data/heroes.js';
import {SAGAS} from '../js/data/quests/sagas.js';
import {SIDE} from '../js/data/quests/side.js';
import {QUEST_ITEMS} from '../js/data/quests/items.js';
import * as LORE from '../js/data/lore.js';

async function opt(path) { try { return await import(path); } catch { return null; } }
const portsMod = await opt('../js/data/ports.js');
const routesMod = await opt('../js/data/routes.js');

// ------------------------------------------------------------------ contract lists
const PORTS = ['ravnfjord', 'kaupang', 'hladir', 'halogaland', 'faereyjar', 'island', 'orkney',
  'dyflin', 'jorvik', 'hamwic', 'rudaborg', 'heidaby', 'jomsborg', 'truso', 'gotland', 'birka',
  'aldeigja', 'holmgard', 'kaenugard', 'miklagard'];
const CULTURES = ['norse', 'dane', 'svear', 'gotlander', 'slav', 'byzantine', 'saxon', 'frank',
  'anglonorse', 'gael', 'island', 'aesti', 'wend'];
const BUILDINGS = ['market', 'hall', 'meadhall', 'shipyard', 'altar', 'runecarver', 'guild', 'bank',
  'moneylender', 'warehouse'];
const GOODS = ['stockfish', 'salt', 'grain', 'timber', 'wadmal', 'honey', 'iron', 'furs', 'amber',
  'wine', 'ivory', 'blades', 'silk', 'hacksilver'];
const SHIPS = ['faering', 'karvi', 'knarr', 'byrding', 'snekkja', 'busse', 'skeid', 'drakkar'];
const BLESSINGS = ['thor', 'eir', 'njord', 'odin', 'kari'];
const CHARMS = ['rune_hold', 'rune_reload', 'rune_hull', 'rune_storm', 'rune_altar', 'rune_luck',
  'rune_speed', 'rune_ram', 'rune_cursed_greed', 'rune_cursed_iron', 'horn_sea', 'mead_skald',
  'chart_old', 'compass_sun'];
const HERO_IDS = ['ylva', 'bjarki', 'saeunn', 'hrafn', 'ketill', 'grima', 'custom'];
const TALENTS = {ylva: 'shieldwall', bjarki: 'berserk', saeunn: 'seidr', hrafn: 'mockery',
  ketill: 'seaking', grima: 'trollgrip', custom: 'shieldwall'};
const SAGA_HEROES = {ylva: 11, bjarki: 11, saeunn: 11, hrafn: 11, ketill: 11, grima: 3};
const ENEMIES = ['raider_faering', 'raider_karvi', 'raider_snekkja', 'raider_drakkar', 'wend_longship',
  'jomsviking_skeid', 'collector_snekkja', 'byzantine_dromon', 'frankish_cog', 'draugr_ship',
  'serpent', 'kraken', 'storm_crow', 'fortress_tower', 'fortress_gate'];
const SEA_MARKS = ['skagerrak', 'kattegat', 'north_sea', 'norwegian_sea', 'iceland_sea', 'pentland',
  'irish_sea', 'channel', 'baltic_south', 'baltic_east', 'gulf_finland', 'dnieper_rapids', 'black_sea'];
const WEATHER = ['clear', 'fog', 'storm', 'rain'];
const PORTRAITS = [...HERO_IDS, 'jarl', 'merchant', 'shipwright', 'priest', 'volva', 'runecarver',
  'guildmaster', 'banker', 'moneylender', 'barkeep', 'skald', 'warehouse', 'raider', 'monk',
  'byzantine_official', 'slav_prince', 'saxon_reeve', 'frank_count', 'gael_king', 'aesti_elder',
  'townsman', 'townswoman'];
const FORTRESS = 'jomsborg';

const QUEST_KEYS = ['id', 'saga', 'chapter', 'title', 'giver', 'npcName', 'requires', 'requiresRenown',
  'timeLimit', 'offer', 'steps', 'done', 'reward'];
const REWARD_KEYS = ['silver', 'items', 'goods', 'blessings', 'renown', 'unlockPorts', 'unlockGoods', 'flag', 'ship'];
const STEP_KEYS = {
  deliver: {req: ['good', 'qty', 'port', 'building'], opt: []},
  bring: {req: ['item', 'port', 'building'], opt: []},
  visit: {req: ['port', 'building'], opt: []},
  buy: {req: ['good', 'qty'], opt: ['port']},
  defeat: {req: ['enemies', 'at'], opt: ['weather']},
  pay: {req: ['silver', 'port', 'building'], opt: []},
  collect: {req: ['item', 'port', 'building'], opt: []},
  networth: {req: ['amount'], opt: []},
  sacrifice: {req: ['blessing', 'qty', 'port'], opt: []},
  donate: {req: ['silver', 'port'], opt: []},
};
const STEP_BUILDING = {sacrifice: 'altar', donate: 'guild'};
const MAX_LINE = 140;

const ALL = [...SAGAS, ...SIDE];
const BY_ID = Object.fromEntries(ALL.map((q) => [q.id, q]));
const ITEM_IDS = new Set(QUEST_ITEMS.map((i) => i.id));
const HERO = Object.fromEntries(HEROES.map((h) => [h.id, h]));

// Port data from the sim, when present.
const PD = portsMod && portsMod.PORTS ? portsMod.PORTS : null;
const sells = (port, good) => {
  if (!PD || !PD[port]) return true;
  const p = PD[port];
  return !(p.contraband || []).includes(good) && ([...(p.produces || []), ...(p.trades || [])]).includes(good);
};
const hasBuilding = (port, b) => !PD || !PD[port] || PD[port].buildings.includes(b);

// ------------------------------------------------------------------ helpers
function checkLines(where, lines, min, max) {
  assert.ok(Array.isArray(lines), `${where}: lines must be an array`);
  assert.ok(lines.length >= min && lines.length <= max, `${where}: ${lines.length} lines, want ${min}-${max}`);
  for (const l of lines) {
    assert.ok(l && ['npc', 'hero'].includes(l.who), `${where}: bad who ${JSON.stringify(l)}`);
    assert.equal(typeof l.text, 'string', `${where}: text`);
    assert.ok(l.text.length > 0 && l.text.length <= MAX_LINE, `${where}: line too long (${l.text.length}): ${l.text}`);
    if (l.npc !== undefined) {
      assert.ok(PORTRAITS.includes(l.npc), `${where}: bad npc portrait ${l.npc}`);
      assert.equal(typeof l.name, 'string', `${where}: npc line needs a name`);
    }
  }
}

function ancestors(id, seen = new Set()) {
  for (const r of BY_ID[id].requires) if (!seen.has(r)) { seen.add(r); ancestors(r, seen); }
  return seen;
}

// ------------------------------------------------------------------ tests
test('heroes match the contract', () => {
  assert.deepEqual(HEROES.map((h) => h.id).sort(), [...HERO_IDS].sort());
  for (const h of HEROES) {
    for (const k of ['id', 'name', 'epithet', 'bio', 'talent', 'startPort', 'startShip', 'startSilver', 'startDebt', 'portrait']) {
      assert.ok(h[k] !== undefined, `${h.id}: missing ${k}`);
    }
    assert.equal(h.talent.id, TALENTS[h.id], `${h.id}: talent`);
    assert.ok(h.talent.name && h.talent.desc, `${h.id}: talent name/desc`);
    const words = h.bio.trim().split(/\s+/).length;
    assert.ok(words <= 60, `${h.id}: bio is ${words} words`);
    assert.ok(PORTS.includes(h.startPort), `${h.id}: startPort`);
    assert.ok(SHIPS.includes(h.startShip), `${h.id}: startShip`);
    assert.ok(Number.isFinite(h.startSilver) && Number.isFinite(h.startDebt), `${h.id}: silver/debt`);
    assert.ok(Array.isArray(h.startPorts) && h.startPorts.includes(h.startPort), `${h.id}: startPorts must include startPort`);
    for (const p of h.startPorts) assert.ok(PORTS.includes(p) && p !== FORTRESS, `${h.id}: start port ${p}`);
    for (const g of h.startGoods) assert.ok(GOODS.includes(g) && g !== 'hacksilver', `${h.id}: start good ${g}`);
  }
});

test('every quest follows the schema', () => {
  const ids = new Set();
  for (const q of ALL) {
    const w = q.id || JSON.stringify(q).slice(0, 60);
    assert.ok(typeof q.id === 'string' && !ids.has(q.id), `${w}: id missing or duplicate`);
    ids.add(q.id);
    for (const k of Object.keys(q)) assert.ok(QUEST_KEYS.includes(k), `${w}: unknown key ${k}`);
    for (const k of QUEST_KEYS) assert.ok(k in q, `${w}: missing ${k}`);
    assert.ok(q.saga === null || SAGA_HEROES[q.saga], `${w}: saga`);
    if (q.saga) assert.ok(Number.isInteger(q.chapter), `${w}: chapter`);
    else assert.equal(q.chapter, null, `${w}: side task chapter must be null`);
    assert.ok(q.title && q.npcName, `${w}: title/npcName`);
    assert.ok(PORTS.includes(q.giver.port), `${w}: giver port`);
    assert.ok(BUILDINGS.includes(q.giver.building), `${w}: giver building`);
    assert.ok(hasBuilding(q.giver.port, q.giver.building), `${w}: ${q.giver.port} has no ${q.giver.building}`);
    assert.ok(PORTRAITS.includes(q.giver.npc), `${w}: giver npc portrait ${q.giver.npc}`);
    assert.ok(Array.isArray(q.requires), `${w}: requires`);
    for (const r of q.requires) assert.ok(BY_ID[r], `${w}: requires unknown ${r}`);
    assert.ok(Number.isFinite(q.requiresRenown), `${w}: requiresRenown`);
    assert.ok(q.timeLimit === null || (Number.isInteger(q.timeLimit) && q.timeLimit > 0), `${w}: timeLimit`);
    checkLines(`${w} offer`, q.offer, 2, 6);
    checkLines(`${w} done`, q.done, 2, 6);
    assert.ok(q.steps.length >= 1 && q.steps.length <= 4, `${w}: ${q.steps.length} steps`);

    q.steps.forEach((s, i) => {
      const sw = `${w} step ${i}`;
      const spec = STEP_KEYS[s.do];
      assert.ok(spec, `${sw}: unknown do ${s.do}`);
      for (const k of spec.req) assert.ok(s[k] !== undefined, `${sw}: missing ${k}`);
      for (const k of Object.keys(s)) {
        assert.ok(['do', 'text', 'say', ...spec.req, ...spec.opt].includes(k), `${sw}: unexpected key ${k}`);
      }
      assert.ok(typeof s.text === 'string' && s.text.length && s.text.length <= MAX_LINE, `${sw}: text`);
      if (s.say) checkLines(`${sw} say`, s.say, 1, 6);
      if (s.port) assert.ok(PORTS.includes(s.port), `${sw}: port ${s.port}`);
      if (s.building) {
        assert.ok(BUILDINGS.includes(s.building), `${sw}: building ${s.building}`);
        assert.ok(hasBuilding(s.port, s.building), `${sw}: ${s.port} has no ${s.building}`);
      }
      if (STEP_BUILDING[s.do]) assert.ok(hasBuilding(s.port, STEP_BUILDING[s.do]), `${sw}: ${s.port} has no ${STEP_BUILDING[s.do]}`);
      if (s.good) assert.ok(GOODS.includes(s.good), `${sw}: good ${s.good}`);
      if (s.qty !== undefined) assert.ok(Number.isInteger(s.qty) && s.qty > 0, `${sw}: qty`);
      if (s.item) assert.ok(s.item.startsWith('q_'), `${sw}: quest items must start with q_`);
      if (s.blessing) assert.ok(BLESSINGS.includes(s.blessing), `${sw}: blessing`);
      if (s.do === 'buy' && s.port) assert.ok(sells(s.port, s.good), `${sw}: ${s.port} does not sell ${s.good}`);
      if (s.do === 'defeat') {
        assert.ok(Array.isArray(s.enemies) && s.enemies.length >= 1 && s.enemies.length <= 6, `${sw}: enemies`);
        for (const e of s.enemies) assert.ok(ENEMIES.includes(e), `${sw}: enemy ${e}`);
        const at = s.at;
        assert.ok(at && (at.port || at.sea) && !(at.port && at.sea), `${sw}: at needs port or sea`);
        if (at.port) assert.ok(PORTS.includes(at.port), `${sw}: at.port`);
        if (at.sea) assert.ok(SEA_MARKS.includes(at.sea), `${sw}: sea mark ${at.sea}`);
        const fort = s.enemies.some((e) => e.startsWith('fortress_'));
        if (fort) assert.equal(at.port, FORTRESS, `${sw}: fortress pieces only at Jómsborg`);
        if (s.weather) assert.ok(WEATHER.includes(s.weather), `${sw}: weather`);
      }
      for (const k of ['silver', 'amount']) if (s[k] !== undefined) assert.ok(Number.isInteger(s[k]) && s[k] > 0, `${sw}: ${k}`);
    });

    const r = q.reward;
    for (const k of Object.keys(r)) assert.ok(REWARD_KEYS.includes(k), `${w}: reward key ${k}`);
    for (const it of r.items || []) assert.ok(CHARMS.includes(it) || it.startsWith('q_'), `${w}: reward item ${it}`);
    for (const g of Object.keys(r.goods || {})) assert.ok(GOODS.includes(g), `${w}: reward good ${g}`);
    for (const b of Object.keys(r.blessings || {})) assert.ok(BLESSINGS.includes(b), `${w}: reward blessing ${b}`);
    for (const p of r.unlockPorts || []) assert.ok(PORTS.includes(p), `${w}: unlock port ${p}`);
    for (const g of r.unlockGoods || []) assert.ok(GOODS.includes(g), `${w}: unlock good ${g}`);
    if (r.ship) assert.ok(SHIPS.includes(r.ship), `${w}: ship`);
    if (r.flag !== undefined) assert.equal(typeof r.flag, 'string', `${w}: flag`);
    if (r.flag && r.flag.startsWith('sells_')) {
      const [, port, good] = r.flag.match(/^sells_([a-z]+)_([a-z]+)$/) || [];
      assert.ok(PORTS.includes(port) && GOODS.includes(good), `${w}: bad sells_ flag ${r.flag}`);
    }
  }
});

test('requires chains are acyclic', () => {
  const state = {};
  const visit = (id, path) => {
    if (state[id] === 2) return;
    assert.notEqual(state[id], 1, `cycle: ${[...path, id].join(' -> ')}`);
    state[id] = 1;
    for (const r of BY_ID[id].requires) visit(r, [...path, id]);
    state[id] = 2;
  };
  for (const q of ALL) visit(q.id, []);
});

test('each hero has the right number of chapters, ending in a boss fight', () => {
  for (const [hero, n] of Object.entries(SAGA_HEROES)) {
    const ch = SAGAS.filter((q) => q.saga === hero).sort((a, b) => a.chapter - b.chapter);
    assert.deepEqual(ch.map((q) => q.chapter), Array.from({length: n}, (_, i) => i + 1), `${hero}: chapters`);
    ch.forEach((q, i) => {
      assert.equal(q.id, `${hero}_${String(i + 1).padStart(2, '0')}`, `${hero}: id`);
      if (i > 0) assert.ok(q.requires.includes(ch[i - 1].id), `${q.id}: must require the previous chapter`);
    });
    const last = ch[ch.length - 1];
    assert.equal(last.steps[last.steps.length - 1].do, 'defeat', `${last.id}: must end with a defeat step`);
  }
  assert.equal(SAGAS.filter((q) => q.saga && q.saga !== 'grima').length, 55);
  const g3 = SAGAS.find((q) => q.id === 'grima_03');
  for (const s of SIDE) assert.ok(g3.requires.includes(s.id), `grima_03 must require ${s.id}`);
});

test('every port has at least one side task; at least 36 in all', () => {
  assert.ok(SIDE.length >= 36, `only ${SIDE.length} side tasks`);
  for (const p of PORTS) assert.ok(SIDE.some((q) => q.giver.port === p), `no side task at ${p}`);
  for (const q of SIDE) assert.equal(q.saga, null, `${q.id}: side saga must be null`);
});

test('every q_ item is registered, and registered items are used', () => {
  const used = new Set();
  for (const q of ALL) {
    for (const s of q.steps) if (s.item) used.add(s.item);
    for (const it of q.reward.items || []) if (it.startsWith('q_')) used.add(it);
  }
  for (const it of used) assert.ok(ITEM_IDS.has(it), `quest item ${it} not in QUEST_ITEMS`);
  for (const it of QUEST_ITEMS) {
    assert.ok(it.id.startsWith('q_') && it.name && it.desc, `bad quest item ${JSON.stringify(it)}`);
    assert.ok(used.has(it.id), `quest item ${it.id} is registered but never used`);
  }
  assert.equal(ITEM_IDS.size, QUEST_ITEMS.length, 'duplicate quest item ids');
});

test('bring steps only ask for items the player can have', () => {
  for (const q of ALL) {
    const have = new Set();
    for (const a of ancestors(q.id)) {
      for (const it of BY_ID[a].reward.items || []) have.add(it);
      for (const s of BY_ID[a].steps) if (s.do === 'collect') have.add(s.item);
    }
    for (const s of q.steps) {
      if (s.do === 'collect') have.add(s.item);
      if (s.do === 'bring') { assert.ok(have.has(s.item), `${q.id}: brings ${s.item} it never got`); have.delete(s.item); }
    }
  }
});

test('saga progression: ports, goods and renown open in order', () => {
  for (const hero of Object.keys(SAGA_HEROES)) {
    const h = HERO[hero];
    const open = new Set(h.startPorts), goods = new Set(h.startGoods), gotGoods = new Set();
    let renown = 0;
    const chain = SAGAS.filter((q) => q.saga === hero).sort((a, b) => a.chapter - b.chapter);
    // Gríma's saga runs the side tasks around chapter 2 (which frees Jómsborg), then chapter 3.
    const atFort = (q) => q.giver.port === FORTRESS;
    const order = hero === 'grima'
      ? [chain[0], ...SIDE.filter((q) => !atFort(q)), chain[1], ...SIDE.filter(atFort), chain[2]] : chain;
    for (const q of order) {
      const w = `${hero}: ${q.id}`;
      // Side tasks in Gríma's run may come in any order the requires allow; renown is checked for chapters.
      if (q.saga) assert.ok(renown >= q.requiresRenown, `${w}: needs renown ${q.requiresRenown}, only ${renown} reachable`);
      assert.ok(open.has(q.giver.port), `${w}: giver port ${q.giver.port} not open yet`);
      const qBought = new Set();
      for (const s of q.steps) {
        if (s.port) assert.ok(open.has(s.port), `${w}: step port ${s.port} not open yet`);
        if (s.do === 'defeat' && s.at.port && s.at.port !== FORTRESS) assert.ok(open.has(s.at.port), `${w}: battle port not open`);
        if (s.do === 'deliver' || s.do === 'buy') {
          assert.ok(goods.has(s.good), `${w}: good ${s.good} not unlocked yet`);
          const where = s.do === 'buy' && s.port ? [s.port] : [...open];
          const source = where.some((p) => sells(p, s.good)) || gotGoods.has(s.good) || qBought.has(s.good);
          assert.ok(source, `${w}: nowhere open sells ${s.good}`);
          if (s.do === 'buy') qBought.add(s.good);
        }
      }
      const r = q.reward;
      renown += r.renown || 0;
      for (const p of r.unlockPorts || []) open.add(p);
      for (const g of r.unlockGoods || []) goods.add(g);
      for (const g of Object.keys(r.goods || {})) gotGoods.add(g);
    }
    if (hero !== 'grima') {
      assert.deepEqual([...open].sort(), [...PORTS].sort(), `${hero}: not every port opens`);
      assert.deepEqual([...goods].sort(), [...GOODS].sort(), `${hero}: not every good unlocks`);
      assert.ok(open.has(FORTRESS), `${hero}: Jómsborg never falls`);
    }
  }
});

test('side tasks ask only for goods some market sells', () => {
  for (const q of SIDE) for (const s of q.steps) {
    if (s.do === 'deliver' && s.good !== 'hacksilver') {
      assert.ok(PORTS.some((p) => p !== FORTRESS && sells(p, s.good)), `${q.id}: nobody sells ${s.good}`);
    }
  }
});

test('sea marks and ports agree with the map and sim data when present', () => {
  if (routesMod && routesMod.SEA_MARKS) {
    for (const m of SEA_MARKS) assert.ok(routesMod.SEA_MARKS[m], `routes.js lacks sea mark ${m}`);
  }
  if (PD) for (const p of PORTS) assert.ok(PD[p], `ports.js lacks ${p}`);
});

test('lore is complete', () => {
  const {INTRO, ENDINGS, RUMOURS, PRICE_TIPS, TOWNSFOLK, BARKEEP, BARKEEP_TALK, SKALD, FEATS, DEFEAT, GLOSSARY} = LORE;
  const lineOk = (where, l) => {
    const text = typeof l === 'string' ? l : l && l.text;
    assert.ok(typeof text === 'string' && text.length > 0 && text.length <= MAX_LINE, `${where}: bad line ${JSON.stringify(l)}`);
    for (const tok of text.match(/\{[a-z]+\}/g) || []) assert.ok(['{good}', '{port}', '{name}', '{price}', '{dir}'].includes(tok), `${where}: unknown token ${tok}`);
    if (typeof l === 'object') {
      assert.ok(['npc', 'hero', 'narrator'].includes(l.who), `${where}: who`);
      if (l.npc) assert.ok(PORTRAITS.includes(l.npc), `${where}: npc portrait ${l.npc}`);
    }
  };
  for (const h of HERO_IDS) {
    assert.ok(Array.isArray(INTRO[h]) && INTRO[h].length >= 4 && INTRO[h].length <= 8, `INTRO.${h}: 4-8 lines`);
    INTRO[h].forEach((l) => lineOk(`INTRO.${h}`, l));
    assert.ok(Array.isArray(ENDINGS[h]) && ENDINGS[h].length >= 3, `ENDINGS.${h}`);
    ENDINGS[h].forEach((l) => lineOk(`ENDINGS.${h}`, l));
  }
  for (const c of CULTURES) {
    assert.ok(RUMOURS[c] && RUMOURS[c].length >= 8, `RUMOURS.${c}: need 8`);
    RUMOURS[c].forEach((l) => lineOk(`RUMOURS.${c}`, l));
    assert.ok(TOWNSFOLK[c] && TOWNSFOLK[c].length >= 10, `TOWNSFOLK.${c}: need 10`);
    TOWNSFOLK[c].forEach((l) => lineOk(`TOWNSFOLK.${c}`, l));
  }
  assert.ok(CULTURES.some((c) => RUMOURS[c].some((l) => l.includes('{good}'))), 'some rumours should carry {good}');
  assert.ok(Array.isArray(PRICE_TIPS) && PRICE_TIPS.length >= 4, 'PRICE_TIPS must be an array of templates (sim reads it)');
  for (const t of PRICE_TIPS) { lineOk('PRICE_TIPS', t); assert.ok(/\{good\}/.test(t) && /\{port\}/.test(t) && /\{dir\}/.test(t), `PRICE_TIPS: ${t}`); }
  for (const k of ['high', 'low']) {
    assert.ok(PRICE_TIPS[k] && PRICE_TIPS[k].length >= 4, `PRICE_TIPS.${k}`);
    for (const t of PRICE_TIPS[k]) { lineOk(`PRICE_TIPS.${k}`, t); assert.ok(t.includes('{good}') && t.includes('{port}'), `PRICE_TIPS.${k}: needs {good} and {port}: ${t}`); }
  }
  assert.ok(BARKEEP.any && BARKEEP.any.length >= 4, 'BARKEEP.any');
  for (const [k, v] of Object.entries(BARKEEP)) { assert.ok(k === 'any' || CULTURES.includes(k), `BARKEEP.${k}`); v.forEach((l) => lineOk(`BARKEEP.${k}`, l)); }
  for (const [k, v] of Object.entries(BARKEEP_TALK)) { assert.ok(v.length >= 3, `BARKEEP_TALK.${k}`); v.forEach((l) => lineOk(`BARKEEP_TALK.${k}`, l)); }
  assert.ok(Array.isArray(SKALD) && SKALD.length >= 8, 'SKALD');
  SKALD.forEach((l) => lineOk('SKALD', l));
  assert.ok(Array.isArray(FEATS) && FEATS.length >= 25, 'FEATS: need 25');
  const fids = new Set();
  for (const f of FEATS) {
    assert.ok(f.id && /^[a-z0-9_]+$/.test(f.id) && !fids.has(f.id), `FEATS: bad or duplicate id ${f.id}`);
    fids.add(f.id);
    assert.ok(f.name && f.desc && f.desc.length <= MAX_LINE, `FEATS.${f.id}: name/desc`);
  }
  for (const [k, v] of Object.entries(DEFEAT)) { assert.ok(v.length >= 3, `DEFEAT.${k}`); v.forEach((l) => lineOk(`DEFEAT.${k}`, l)); }
  assert.ok(Array.isArray(GLOSSARY) && GLOSSARY.length >= 15, 'GLOSSARY');
  for (const g of GLOSSARY) assert.ok(g.term && g.meaning, `GLOSSARY: ${JSON.stringify(g)}`);
});

test('summary', () => {
  const sagaCount = SAGAS.length, sideCount = SIDE.length;
  const used = {};
  for (const q of ALL) {
    const add = (p, b) => { if (p && b) (used[p] ||= new Set()).add(b); };
    add(q.giver.port, q.giver.building);
    for (const s of q.steps) add(s.port, s.building || STEP_BUILDING[s.do]);
  }
  console.log(`  sagas: ${sagaCount} quests, side: ${sideCount}, quest items: ${QUEST_ITEMS.length}, feats: ${LORE.FEATS.length}`);
  if (process.env.SHOW_BUILDINGS) for (const p of PORTS) console.log(`  ${p.padEnd(11)} ${[...(used[p] || [])].sort().join(', ')}`);
});
