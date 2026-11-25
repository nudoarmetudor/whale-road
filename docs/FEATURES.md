# Feature checklist

Every gameplay system found in the two genre classics Tudor named (a 2005 Caribbean trading
game and a 2009 ancient-Greek one by the same studio), and how Whale Road covers it.
Mechanics are matched; names, story, art, music and layout are our own.

Sources read on 2026-11-25: the 2005 game's official help pages, store pages, and reviews
and player guides on Pocket Gamer, JayIsGames, MyGamer, Gamezebo, GameYum and a Steam
community guide. The fan wiki for both games refused automated access, so a few numbers
(exact ship stats in the 2009 game, crew rules) were not available; where a source was
silent, the design choice is ours and marked *(ours)*.

Legend: `[x]` built (tested in a browser at phone portrait, phone landscape and desktop sizes), `[ ]` not built.
Source tags: **A** = 2005 game, **B** = 2009 game, **AB** = both.

## Modes, heroes, goals
- [x] Saga mode: story, ports and goods unlock as you go (AB)
- [x] Free Trade mode: all ports and goods open, no tasks, endless (AB)
- [x] Free Trade unlocked from the start *(A had it at start, B after finishing; we open it at start)*
- [x] Four starting heroes, two more unlocked by finishing any saga (B: 4+2; A: 4+1)
- [x] Custom hero (name, look) unlocked by finishing a saga (A)
- [x] Each hero has an 11-chapter main saga (B)
- [x] Shared optional tasks, same for every hero (B)
- [x] One unlockable hero whose saga is "finish every optional task" (B)
- [x] Each hero has a combat talent: bar fills as the fleet deals damage, button fires it (B)
- [x] Score = net worth = silver carried + bank deposits + goods + ships − debt (A)
- [x] Saga ends with a final boss battle (A) and an ending scene
- [x] Easy mode toggle at any time: "?" markers on next building and on the sea (B)
- [x] Ranks that grow with renown *(B mentions "rank"; thresholds ours)*
- [x] Feats (achievements) per profile, shared by heroes in that profile (B)
- [x] Several player profiles, each with its own journal and feats (B)
- [x] Free Trade high-score table *(ours)*

## Map, travel, time
- [x] One sea chart; tap a discovered port to sail (AB)
- [x] Locked ports shown with "?" until unlocked by a jarl's tasks (A)
- [x] Tap/hover a port: services, goods, last prices, travel time (B)
- [x] Voyage length depends on distance and fleet speed (slowest ship) (AB)
- [x] Set Sail disabled when the fleet is overloaded (A)
- [x] Sailing animation along real sea and river routes; days pass (AB)
- [x] Sailing speed option and in-game fast toggle (A)
- [x] Storms on voyages: unavoidable hull damage unless warded (A)
- [x] Rain/fog in battle reduces accuracy/visibility (B)
- [x] Main-quest markers gold, optional markers blue, on the chart and in town (B)
- [x] Calendar with seasons; prices vary by time of year (A); winter seas rougher *(ours)*

## Ports and buildings
- [x] 20 ports, each with a distinct painted scene (A had 20)
- [x] 3 to 8 buildings per port, varying by town (A)
- [x] City view: tap buildings to enter (AB); building chips for phones *(ours)*
- [x] Market (AB)
- [x] Jarl's hall: quest giver, unlocks ports (A governor, B acropolis)
- [x] Mead hall: rumours, price tips, contacts, reputation, side tasks (A alehouse)
- [x] Shipyard: repair, buy/sell ships with trade-in, one ship for sale per visit, armaments +/−, special ammo, fleet order (AB)
- [x] Altar: sacrifice goods for blessings, quantity or Max (B)
- [x] Rune-carver: magic charms, some cursed (A alehouse items, B reliquary)
- [x] Craft guild: donate, then combination tasks that give a free crafted good/item (B)
- [x] Bank: 10%/year, money reachable only in that town, cannot be robbed (A)
- [x] Moneylender: up to 2× net worth at 10%/month; overdue → collectors attack, no new loans (AB)
- [x] Warehouse: store goods in that port (A)
- [x] Talk button: townsfolk lines, advances quests (B)
- [x] Left/top panel: silver carried, bank, debt, date, cargo meter (AB)

## Goods and economy
- [x] 14 goods with min–max price ranges per good (A)
- [x] Prices differ by port (produced = cheap, demanded = dear) (AB)
- [x] Prices move over time; refresh at least weekly (A)
- [x] Seasonal price swings (A)
- [x] Your trades move the price (buying raises, selling lowers) *(ours, standard genre)*
- [x] New goods unlock through the saga (AB); top good only after a raider fortress falls (A)
- [x] A town starts selling a good after you sell it 10 units (B)
- [x] Contraband: not listed; "sell all" only, high price, risk of confiscation and fine (A)
- [x] Buy screen: amount, Max (cargo room and silver), Reset, running total (B)
- [x] Sell screen: amount, Max, Sell All (B); shows average price paid *(ours)*
- [x] Quest goods move to a separate list, not cargo (B)
- [x] No penalty for reselling at the same port (B)

## Ships, fleet, armaments
- [x] 8 ship types, faering to drakkar, with hull, cargo, slots, speed, ram, price (A had 7)
- [x] Fleet of up to 4 ships (B); single-ship start (A)
- [x] Each armament takes 5 cargo (A)
- [x] Short and long range, standard and premium armaments (B)
- [x] Sell armament for immediate refund (B)
- [x] Special ammo: heavy single, light all, heavy all (A)
- [x] Repairs cost silver at shipyards (AB)
- [x] Selling a ship returns its value with armaments; cannot sell if cargo would overflow (B)
- [x] Fleet screen: drag to reorder; order matters in battle (B)
- [x] Magic items: +10% cargo, faster reload, +20% hull, storm ward, cheaper blessings (AB)

## Combat
- [x] Real-time battle that starts paused; one button to start/pause (B)
- [x] Your fleet on one side, enemies on the other, health bars (AB)
- [x] Weapons fire automatically after reloading (A)
- [x] Tap an enemy to focus fire; ships without orders shoot the one in front (AB)
- [x] Ramming button; cannot ram flying or swimming foes; ramming bigger ships hurts you (B)
- [x] Ships shuffle to the middle as gaps open; tough ships best in the middle (B)
- [x] Flee button, not guaranteed, costs damage, no loot (AB)
- [x] Five blessing buttons with cooldowns, usable only while enemies remain (B)
- [x] Special-ammo buttons (A)
- [x] Hero talent bar (B)
- [x] Loot: silver and dropped goods; needs free cargo (B)
- [x] Enemy kinds: raiders, warships, sea beasts, flying beasts, ghost ship, fortress (AB)
- [x] Attack a raider-held fortress port; freeing it opens the port and its goods (A)
- [x] Moneylender's collectors attack if a loan is overdue (B)
- [x] Gods send beasts after you when angered *(B; ours: if you skip an altar task)*
- [x] Battle speed toggle *(reviewers asked for it)*

## Quests
- [x] Jarl tasks: deliver goods, bring items, visit, hunt raiders, gather across towns (AB)
- [x] Rescue / retake / cure style multi-step tasks (B)
- [x] Multi-port tasks later in the saga (A)
- [x] A set number of tasks for a jarl unlocks the next port (A)
- [x] Rewards: silver, items, goods unlocks, blessings, ships (AB)
- [x] Task list that tracks automatically; journal with list + details (AB)
- [x] Some optional time limits *(ours)*

## UI and system
- [x] Main menu: Saga, Free Trade, Continue, Load, Options, Help, Credits, Hide menu (watch ships) (A)
- [x] In-game menu: Resume, Save, Load, Options, Quit to menu (A)
- [x] Autosave on entering each port; manual save slots with timestamps (B)
- [x] Options: music volume, effects volume, fullscreen, graphic detail, sailing speed, dialogue speed, tutorial on/off, Easy mode (AB)
- [x] Hotkeys on desktop: I items, S ship, C cargo, T tasks, L log, F fullscreen, H tutorial (A)
- [x] Tutorial hints in the first port (A)
- [x] Ship's log of events (A)
- [x] Phone: landscape and portrait, touch only *(ours)*
- [x] Installable as a home-screen app (PWA) and works offline *(ours)*

## Presentation
- [x] Painted-style port scenes, a distinct look per culture and per port (B)
- [x] Animated details: water, smoke, birds, flags (A)
- [x] Hero and NPC portraits in dialogue (AB)
- [x] Original music, a theme per region plus sea, storm, battle, tavern (A changed music by town and battle)
- [x] Sound effects for trade, battle, sailing
- [x] Light humour in dialogue (AB)

## Notes on coverage (2026-11-25)
- The 2005 game let you carry one ship; the 2009 game a fleet. Whale Road starts with one ship and grows to four.
- The 2009 game's crew rules were not documented in any readable source; crews are armaments here, as in its shipyard.
- The story owner wrote 30 extra feat names in `js/data/lore.js` with trigger notes; the 32 feats the sim checks are live, the extra ones are not wired yet.
- The custom hero has no saga of its own; in Saga mode it plays an open world with the side tasks.
- Music was measured (levels, keys, no clipping) but has not yet been listened to by a person.
