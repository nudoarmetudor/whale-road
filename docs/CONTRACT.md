# Whale Road: build contract

Shared rules for everyone writing code in this repo. Read it before touching a file.

## The game in one paragraph

**Whale Road** is an original browser trading-and-sailing game in the Viking age (c. 950).
You command a small fleet (up to 4 ships) from port to port across the North Sea, the
Baltic, the river road to Miklagarðr and the North Atlantic. Buy low, sell high, take
tasks from jarls, fight raiders and sea beasts in real-time-with-pause battles, sacrifice
goods at altars for divine blessings, buy rune-charms, bank, borrow, store goods, grow
your renown. Two modes: **Saga** (one of several heroes, each with an 11-chapter saga,
ports and goods unlock as you go) and **Free Trade** (everything open, endless, score =
net worth). Tone: warm, lightly humorous, never grimdark.

**Originality rule (hard).** Mechanics may resemble the genre's classics. Names, story,
characters, dialogue, place art, UI layout, music: all our own. Never copy or imitate
text, art, screens, music or names from any existing game.

## Tech rules

- Static site, no build step, no runtime dependencies. Plain JavaScript ES modules,
  loaded from `index.html`. Works from GitHub Pages under a sub-path, so **all URLs are
  relative** (`./js/...`), never `/js/...`.
- All art is drawn in code: SVG strings or Canvas 2D. No image files, no generated
  images, no web fonts from outside except Google Fonts link in index.html
  (`Cinzel` for titles, `Alegreya` for body text) with serif fallbacks.
- Audio is procedural Web Audio. No audio files.
- Mobile-first: must play on a phone in landscape AND portrait, touch only, no hover
  required. Minimum tap target 44 px. Test at 390x844 and 844x390 and 1440x900.
- Text the player reads is English (v1). Keep strings in the data/ui modules, short.
- No globals except `window.WR` (debug handle set by main.js). Modules export functions.
- Do not run `git commit`, `git push` or any git command that writes. Only the lead
  session commits.
- Only edit files you own (see below). If you need something from another module,
  code against the interface written here; if it is missing, write a tiny local stub
  and say so in your final report.

## File ownership

| Path | Owner |
|---|---|
| `js/state.js`, `js/data/*.js` (except quests, heroes, lore, routes, coast), `js/sim/*.js`, `tests/*.mjs` | sim |
| `index.html`, `css/main.css`, `js/main.js`, `js/ui/*.js` (except map.js), `manifest.webmanifest`, `sw.js` | ui |
| `js/art/scenes.js`, `js/art/portraits.js`, `js/art/paint.js` | art |
| `js/audio/music.js`, `js/audio/sfx.js` | audio |
| `js/ui/map.js`, `js/art/mapart.js`, `js/data/routes.js` | map |
| `js/combat/*.js`, `js/art/ships.js` | combat |
| `js/data/quests/*.js`, `js/data/heroes.js`, `js/data/lore.js` | story |
| `docs/*.md` | lead |

## Shared vocabulary (ids are stable; use exactly these)

### Ports (20) — `js/data/ports.js`

Each: `{id, name, lon, lat, culture, buildings:[], produces:[], demands:[], contraband:[], blurb}`.
`culture` ∈ `norse | dane | svear | gotlander | slav | byzantine | saxon | frank | anglonorse | gael | island | aesti | wend`.

| id | name | culture |
|---|---|---|
| ravnfjord | Ravnfjord (home port, fictional) | norse |
| kaupang | Kaupang | norse |
| hladir | Hlaðir | norse |
| halogaland | Hálogaland | norse |
| faereyjar | Færeyjar | island |
| island | Ísland | island |
| orkney | Orkneyjar | norse |
| dyflin | Dyflin | gael |
| jorvik | Jórvík | anglonorse |
| hamwic | Hamwic | saxon |
| rudaborg | Rúðuborg | frank |
| heidaby | Heiðabýr | dane |
| jomsborg | Jómsborg (raider fortress until defeated) | wend |
| truso | Truso | aesti |
| gotland | Gotland | gotlander |
| birka | Birka | svear |
| aldeigja | Aldeigjuborg | slav |
| holmgard | Hólmgarðr | slav |
| kaenugard | Kænugarðr | slav |
| miklagard | Miklagarðr | byzantine |

Buildings ids: `market, hall, meadhall, shipyard, altar, runecarver, guild, bank, moneylender, warehouse`.
- market = trading; hall = the jarl's/ruler's hall (quest giver, unlocks ports); meadhall =
  rumours, price tips, contacts, side tasks; shipyard = repair, buy/sell ships, armaments,
  special ammo, fleet order; altar = sacrifice goods for blessings; runecarver = rune-charms
  (magic items); guild = craft-guild donations and combination recipes; bank = deposit
  (10%/yr, only in that town); moneylender = loans; warehouse = store goods in that port.

### Goods (14) — `js/data/goods.js`

`stockfish, salt, grain, timber, wadmal, honey, iron, furs, amber, wine, ivory, blades, silk, hacksilver`
(wadmal = coarse wool cloth; ivory = walrus ivory; blades = Frankish sword blades, contraband in
`rudaborg` and `hamwic`; hacksilver only after a raider fortress falls). Currency: **silver**,
shown as a number + "s" (e.g. `1 250 s`).

### Ships (8) — `js/data/ships.js`

`faering, karvi, knarr, byrding, snekkja, busse, skeid, drakkar`.
Stats: `{hull, cargo, slots, speed, ram, price}`. Each armament occupies 5 cargo.

### Armaments — `js/data/ships.js` export `ARMS`

`spearmen` (short range, standard), `huscarls` (short, premium), `archers` (long, standard),
`marksmen` (long, premium). Special ammo: `harpoon` (heavy, one target), `firearrows` (light,
all targets), `greekfire` (heavy, all targets; sold only in Miklagarðr).

### Blessings (5) — `js/data/blessings.js`

`thor` Thor's Hammer (lightning strikes all enemies; costs 20 salt),
`eir` Eir's Mending (repairs 25% of fleet hull; 20 stockfish),
`njord` Njörðr's Swell (next rams deal triple damage for 12 s; 15 grain),
`odin` Odin's Ravens (ranged damage +60% for 15 s; 10 wadmal),
`kari` Kári's Gale (all enemies stunned 5 s and knocked back; 10 iron).
Each has a cooldown in battle. Player starts a Saga with 2 thor, 1 eir.

### Items (rune-charms and quest items) — `js/data/items.js`

Charms (runecarver, some quest-only): `rune_hold` (+10% cargo), `rune_reload` (weapons reload
30% faster), `rune_hull` (+20% hull), `rune_storm` (storms avoided), `rune_altar` (blessings
cost 10% less), `rune_luck` (better loot), `rune_speed` (+10% sailing speed), `rune_ram`
(+50% ram damage), `rune_cursed_greed` (cursed: +15% sell prices but raiders find you twice
as often), `rune_cursed_iron` (cursed: +25% hull, -15% speed), `horn_sea` (once per battle: enemies flee chance), `mead_skald` (talent bar
fills 30% faster), `chart_old` (shows all port prices you have seen within 30 days),
`compass_sun` (sunstone: voyages 15% shorter in fog/winter).
Quest items are free-form ids defined by the story owner with prefix `q_` and must be
registered in `js/data/quests/items.js` as `{id, name, desc}`.

### Heroes — `js/data/heroes.js` (story owner)

`ylva, bjarki, saeunn, hrafn` (start unlocked); `ketill, grima` (unlock after finishing any
saga); `custom` (unlock after finishing any saga; name + look chosen by player).
Each: `{id, name, epithet, bio, talent:{id,name,desc}, startPort, startShip, startSilver,
startDebt, portrait}`. Grima's saga is "finish every optional task".
Talent ids (combat owner implements effects): `shieldwall` (Ylva: fleet takes 50% less
damage 10 s), `berserk` (Bjarki: fleet damage x3 for 6 s), `seidr` (Sæunn: enemies miss
70% for 8 s), `mockery` (Hrafn: enemy reload 2x slower 10 s), `seaking` (Ketill: every
ship fires a free volley at every enemy), `trollgrip` (Grima: grabs one enemy ship,
crushes 50% of its max hull), `custom` uses `shieldwall`.

## Module interfaces

### State (`js/state.js`, core)

```js
export const S = {/* live game state, see below */};
export function newGame({mode, hero, name, look, easy}) {}
export function save(slot) {} export function load(slot) {} export function listSaves() {}
export function on(event, fn) {} export function emit(event, data) {}
// events: 'silver', 'cargo', 'day', 'port', 'quest', 'feat', 'fleet', 'battle-end'
```

State shape (read-only for non-core modules; change it through sim functions):

```js
S = {
  mode: 'saga'|'free', hero: 'ylva', name, easy: true, day: 1 /* day 1 = 1 April 950 */,
  port: 'ravnfjord' /* null while at sea */, silver, bank: {heidaby: 0,...}, debt: {amount, due},
  fleet: [{id, type:'knarr', name, hull, arms:{archers:2,...}, ammo:{harpoon:0,...}}],
  cargo: {stockfish: 10, ...}, cargoPaid: {stockfish: 8,...} /* avg price paid */,
  items: ['rune_hold', 'q_...'], blessings: {thor:2, eir:1, njord:0, odin:0, kari:0},
  warehouse: {heidaby: {furs: 20}}, unlockedPorts: [...], unlockedGoods: [...],
  quests: {active: {id: {step, data}}, done: [ids]}, renown, feats: [...],
  seen: {port: {day, prices:{good:price}}}, flags: {}, stats: {...}
}
```

### Sim (sim owner) — binding API for the UI owner

Every mutating function returns `{ok:true, ...}` or `{ok:false, msg:'short reason'}` and
emits the matching state event. All live in `js/sim/`.

```js
// time.js
date(day) -> {d, month /*0-11*/, monthName, year, season:'spring'|'summer'|'autumn'|'winter', label:'3 Haymonth 950'}
// economy.js
market(port) -> [{good, name, buy /*price to buy, null if not sold here*/, sell /*price we get*/,
                  contraband, stockNote:'plenty'|'some'|'scarce'}]
maxBuy(good) ; buy(good, qty) ; sell(good, qty) ; sellContraband(good) -> {ok, caught, fine, silver}
tick(days) // daily drift, weekly refresh, seasons, events; called by voyage/time
// fleet.js
cargoUsed() ; cargoCap() ; fleetSpeed() ; netWorth() ; repairCost(i /*or 'all'*/) ; repair(i|'all')
shipOffer(port) -> type|null (one per visit) ; shipValue(i) ; buyShip(type) ; sellShip(i)
armCost(arm) ; addArm(i, arm) ; removeArm(i, arm) ; ammoCost(ammo) ; buyAmmo(ammo, qty) ; reorder(from, to) ; rename(i, name)
// bank.js
deposit(n) ; withdraw(n) ; bankHere() ; loanMax() ; borrow(n) ; repay(n) ; loanStatus() -> {amount, due, overdue}
storeGoods(good, qty) ; takeGoods(good, qty) ; warehouseHere() -> {good: qty}
// altar.js
blessingCost(b) -> {good, qty} ; maxBlessing(b) ; buyBlessing(b, qty)
// charms.js
shop(port) -> [{id, name, desc, price, cursed}] ; buyCharm(id) ; sellCharm(id) ; mod(key) -> number
// keys: cargo, reload, hull, speed, ram, loot, altar, sellPrice, raidChance, talent
// quests.js
offers(port, building) -> [quest] ; accept(id) ; act(port, building) -> [{quest, step, kind, lines}]
  // performs deliver/bring/visit/pay/collect/donate steps that are satisfiable here
journal() -> [{id, title, saga, chapter, stepText, done}] ; markers() -> [{port|sea, building, kind:'main'|'side'}]
battleAt(port|seaMark) -> {questId, enemies, weather} | null ; winBattle(questId)
// voyage.js
travelDays(from, to) ; planVoyage(to) -> {days, events:[{day, type:'storm'|'raid'|'quest'|'collectors'|'beast'|'calm'|'wreck', enemies, text}]}
arrive(to) // sets port, autosaves, ticks economy, records seen prices
// feats.js
check() ; list() -> [{id, name, desc, got}]
// rank.js
rank() -> {title, next, progress}
```

The UI owner builds screens on this API; `voyage.travelDays` uses `routes.distance(from, to)`
from the map owner.

### Art (art owner)

```js
import {portScene, titleScene, seaScene} from './art/scenes.js';
portScene(portId, {time:'day'|'dusk'|'night', season:'summer'|'winter', width:1600, height:900})
// -> SVG string, viewBox 0 0 1600 900. Every building present in the port's `buildings`
// list is drawn as a group <g class="bld" data-b="market"> ... </g> and gets a label
// anchor: <g class="bld-label" data-b="market" transform="translate(x,y)"></g>.
// Each culture has a distinct skyline (Norse longhouses and stave temple, Saxon timber
// church, Frankish stone abbey, Slavic wooden kremlin with log towers, Byzantine domes and
// sea walls, Icelandic turf houses under mountains, Aesti amber shore, Wendish fortress).
// Each port must look distinct even within a culture (landform, light, details).
// Animated pieces (water shimmer, smoke, flags, birds) via SVG <animate> or CSS classes
// prefixed `wr-anim-`.
titleScene() // -> SVG string for the title screen, 1600x900
seaScene({weather:'clear'|'fog'|'storm'|'rain', time}) // battle/voyage backdrop, 1600x900
import {portrait} from './art/portraits.js';
portrait(id, {size:256}) // -> SVG string. ids: hero ids + npc ids:
// jarl, merchant, shipwright, priest, volva, runecarver, guildmaster, banker, moneylender,
// barkeep, skald, warehouse, raider, monk, byzantine_official, slav_prince, saxon_reeve,
// frank_count, gael_king, aesti_elder, townsman, townswoman
```

### Audio (audio owner)

```js
import * as Music from './audio/music.js';
Music.init()  // call on first user gesture; safe to call twice
Music.play(theme) // crossfades. themes: 'title','norse','dane','east','slav','byzantine',
                  // 'west','frank','island','sea','storm','battle','victory','defeat','tavern'
Music.setVolume(0..1); Music.stop();
import * as Sfx from './audio/sfx.js';
Sfx.play(name) // 'coin','click','sail','wave','arrow','hit','ram','splash','thunder',
               // 'heal','horn','sink','buy','sell','quest','levelup','error','page'
Sfx.setVolume(0..1)
```

### Map (map owner)

```js
import {openMap} from './ui/map.js';
openMap(root, {onSail(portId){}, onClose(){}}) // full-screen map; pan & pinch zoom;
// ports from data/ports.js projected with js/data/coast.js PROJ; locked ports show "?";
// tap a port -> card with name, culture, services (building icons), goods sold, last
// seen prices, travel days, quest markers (gold main / blue side), [Sail] button.
import {path, distance} from './data/routes.js';
path(fromId, toId) // -> [[x,y],...] in map coords, sea/river only, used for the voyage
distance(fromId, toId) // in map units
import {SEA_MARKS} from './data/routes.js'; // named sea points for quest battles:
// skagerrak, kattegat, north_sea, norwegian_sea, iceland_sea, pentland, irish_sea, channel,
// baltic_south, baltic_east, gulf_finland, dnieper_rapids, black_sea. {id:{name, x, y}}
import {playVoyage} from './ui/map.js';
playVoyage(root, {from, to, days, onEvent(dayIndex) /* may return a Promise (encounter) */,
                  onArrive(){}}) // animates the ship along the path, day counter
```

### Combat (combat owner)

```js
import {startBattle} from './combat/battle.js';
startBattle(root, {enemies:[{kind:'raider_karvi', ...}], weather, place:'sea'|'fortress',
                   onEnd({result:'win'|'lose'|'fled', loot:{good:qty}, silver})})
// Reads/writes S.fleet hull, S.blessings, S.fleet[].ammo via state; uses hero talent.
import {shipSVG, drawShip} from './art/ships.js';
shipSVG(type, {w:240, sail:'#b33', shields:true}) // side view
drawShip(ctx, type, x, y, scale, {facing:1|-1, sail, damage:0..1, t})
```

### Story (story owner)

Files: `js/data/quests/sagas.js` (export `SAGAS`: main quests, 11 chapters per hero),
`js/data/quests/side.js` (export `SIDE`: optional tasks shared by all heroes, at least 30,
spread over all ports; Grima's saga = finish them all), `js/data/quests/items.js` (export
`QUEST_ITEMS`), `js/data/lore.js` (export `RUMOURS` per port culture, `TOWNSFOLK` lines,
`PRICE_TIPS` templates, `INTRO` per hero, `ENDINGS`, `BARKEEP` lines, `FEATS`).

Quest schema (core implements this engine exactly):

```js
{ id:'ylva_03', saga:'ylva' /* null for side tasks */, chapter:3, title:'Salt for a Wedding',
  giver:{port:'kaupang', building:'hall', npc:'jarl'}, npcName:'Jarl Eystein Fairhair-not',
  requires:['ylva_02'], requiresRenown:0, timeLimit:null /* days, optional */,
  offer:[{who:'npc', text:'...'}, {who:'hero', text:'...'}],   // shown when offered
  steps:[ // done in order; the current step shows in the journal and drives map markers
    {do:'deliver', good:'salt', qty:40, port:'kaupang', building:'hall', text:'Bring 40 salt to the jarl.'},
    {do:'bring', item:'q_ring', port:'birka', building:'meadhall', text:'...', say:[lines]},
    {do:'visit', port:'hladir', building:'altar', text:'...', say:[lines]},
    {do:'buy', good:'amber', qty:10, text:'...'},         // bought goods become quest goods (no cargo)
    {do:'defeat', enemies:['raider_karvi','raider_karvi'], at:{port:'jorvik'} /* fight when arriving */
       /* or at:{sea:'skagerrak'} a named sea marker from routes.js SEA_MARKS */, weather:'fog', text:'...'},
    {do:'pay', silver:5000, port:'heidaby', building:'hall', text:'...'},
    {do:'collect', item:'q_letter', port:'dyflin', building:'hall', text:'...', say:[lines]},
    {do:'networth', amount:100000, text:'...'},
    {do:'sacrifice', blessing:'eir', qty:3, port:'hladir', text:'...'}, // buy 3 blessings at that altar
    {do:'donate', silver:2000, port:'jorvik', text:'...'},             // at the guild
  ],
  done:[{who:'npc', text:'...'}],
  reward:{silver:4000, items:['rune_hold'], goods:{furs:10}, blessings:{thor:2}, renown:10,
          unlockPorts:['birka'], unlockGoods:['furs'], flag:'met_eystein', ship:'snekkja'} }
```

Enemy kinds (combat owner implements; story uses them): `raider_faering, raider_karvi,
raider_snekkja, raider_drakkar, wend_longship, jomsviking_skeid, collector_snekkja` (sent by
the moneylender when a loan is overdue), `byzantine_dromon`, `frankish_cog`, `draugr_ship`
(ghost ship), `serpent` (sea beast; swims, cannot be rammed), `kraken` (sea beast, cannot be
rammed), `storm_crow` (giant raven; flies, cannot be rammed), `fortress_tower`,
`fortress_gate` (raider fortress pieces; cannot move).

## Look and feel

Palette (CSS variables in main.css): `--ink #1d1a16`, `--parchment #efe2c4`,
`--parch-dark #d9c59a`, `--wood #5b3a22`, `--wood-dark #3a2414`, `--gold #c99a2e`,
`--sea #2f5d6e`, `--sea-deep #183a48`, `--blood #8e2a22`, `--moss #5f6b3a`, `--snow #f4f1ea`.
Panels: carved-wood frame with parchment inside. Painterly look: layered silhouettes,
atmospheric perspective, soft gradients, subtle paper/brush texture via SVG filters
(feTurbulence + feDisplacementMap) used sparingly for performance on phones.
