// Quest items (story owner). Every q_ id used in SAGAS or SIDE is registered here.
// Quest items take no cargo space and cannot be sold.

export const QUEST_ITEMS = [
  // Ylva
  {id: 'q_orm_crate', name: 'Orm\'s Crate', desc: 'A heavy sea-chest Orm left in Hálogaland. Only Ylva may open it.'},
  {id: 'q_grey_page', name: 'Ledger Page', desc: 'A page torn from the Tallyman\'s ledger, found in a Gotland hoard. Names, sums and a knot-mark.'},
  {id: 'q_tally_key', name: 'The Tallyman\'s Key', desc: 'An iron key from Svartkell\'s strongbox in Jómsborg. Cold to the touch.'},
  {id: 'q_grey_notes', name: 'Bundle of Debt Notes', desc: 'Four hundred debts of Northern captains, bought with drowned silver.'},
  // Bjarki
  {id: 'q_kolli_letter', name: 'Kolli\'s Letter', desc: 'Sealed with fish glue. Smells like Kolli. Says very little.'},
  {id: 'q_sun_banner', name: 'The Sun Banner', desc: 'An Icelandic banner that will not burn, tear or wash. Do not sniff it.'},
  // Sæunn
  {id: 'q_tide_book', name: 'Copy of the Tide-Book', desc: 'Brother Colm\'s record of every wave since spring. Every ninth wave is missing.'},
  {id: 'q_cold_coin', name: 'Cold Coin', desc: 'A silver coin from a drowned hoard. It stays cold in the sun.'},
  {id: 'q_amber_spindle', name: 'Amber Spindle', desc: 'Truso\'s wedding spindle, lent for mending the sea. Bring it back with a story.'},
  {id: 'q_linen_thread', name: 'Hólmgarðr Thread', desc: 'Flax thread spun finer than hair by the guild-women of Hólmgarðr.'},
  {id: 'q_sea_scroll', name: 'The Sailors\' Tale', desc: 'Magistra Eudokia\'s copy of an old tale of the sea\'s net. Do not smudge it.'},
  {id: 'q_woven_knot', name: 'The Woven Knot', desc: 'A new knot for Rán\'s net, spun of silk, flax, wool and amber. It feels warm.'},
  // Hrafn
  {id: 'q_riddle_stick', name: 'Riddle-Stick', desc: 'A stick of backwards runes left by a grey stranger. It hums at night, off-key.'},
  {id: 'q_outlaw_verdict', name: 'The Old Verdict', desc: 'The Lawspeaker\'s words on Svartkell\'s outlawry, carved for you to carry.'},
  {id: 'q_tally_book', name: 'Svartkell\'s Tally-Book', desc: 'Found under the floor of the old weighing-house. Last entry: "Owed: everything."'},
  {id: 'q_last_verse', name: 'The Last Verse', desc: 'An old song for sending the drowned home. It must be sung to the very end.'},
  // Ketill
  {id: 'q_svartkell_contract', name: 'Svartkell\'s Contract', desc: 'A Greek bank loan, secured against "one knot, of the sea\'s own net".'},
  // Optional tasks
  {id: 'q_true_weights', name: 'True Weights', desc: 'A sealed set of market weights from Saxi of Heiðabýr. True to a hair.'},
  {id: 'q_willow_bark', name: 'Willow Bark', desc: 'Áilu\'s remedy for a sneezing hound.'},
  {id: 'q_lost_pages', name: 'Brother Colm\'s Pages', desc: 'Twelve soggy pages of a gospel book, blown across the sea.'},
  {id: 'q_bone_comb', name: 'Ivory Comb', desc: 'A walrus-ivory comb from Coppergate, with waves on one side and puffins on the other.'},
  {id: 'q_dues_chest', name: 'Savings Chest', desc: 'Hamwic\'s savings, bound for the Jórvík bank. Counted twice.'},
  {id: 'q_tally_stick', name: 'Warehouse Tally-Stick', desc: 'Asfrid\'s notched record of whose barrels are whose.'},
  {id: 'q_map_half_a', name: 'Hoard Map, Left Half', desc: 'Half of Hegvald\'s map. Has a ring where a mug stood on it.'},
  {id: 'q_map_half_b', name: 'Hoard Map, Right Half', desc: 'The other half. Squashed flat under a table leg.'},
  {id: 'q_old_scales', name: 'The Old Town Scales', desc: 'Birka\'s old scales. One pan was filed thin by a clever thumb.'},
];

export const QUEST_ITEM_BY_ID = Object.fromEntries(QUEST_ITEMS.map((i) => [i.id, i]));
