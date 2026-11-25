// Small hand-drawn SVG icons for goods, buildings and the HUD. viewBox 0 0 32 32.
const W = (body, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`;
const ink = '#1d1a16';

const GOODS = {
  stockfish: `<path d="M4 16c4-6 14-8 20-3l4-4v14l-4-4c-6 5-16 3-20-3z" fill="#b9a98a" stroke="${ink}" stroke-width="1.6"/><circle cx="9" cy="15" r="1.4" fill="${ink}"/>`,
  salt: `<path d="M9 8h14l3 18H6z" fill="#efe9dc" stroke="${ink}" stroke-width="1.6"/><path d="M9 8c2-3 12-3 14 0" fill="none" stroke="${ink}" stroke-width="1.6"/><path d="M11 18h10" stroke="#8e2a22" stroke-width="2"/>`,
  grain: `<path d="M16 29V9" stroke="#7a5a20" stroke-width="2"/><g fill="#d9a83a" stroke="${ink}" stroke-width="1"><ellipse cx="13" cy="10" rx="2.5" ry="4" transform="rotate(-25 13 10)"/><ellipse cx="19" cy="10" rx="2.5" ry="4" transform="rotate(25 19 10)"/><ellipse cx="13" cy="17" rx="2.5" ry="4" transform="rotate(-25 13 17)"/><ellipse cx="19" cy="17" rx="2.5" ry="4" transform="rotate(25 19 17)"/><ellipse cx="16" cy="5" rx="2.2" ry="3.6"/></g>`,
  timber: `<rect x="4" y="12" width="24" height="9" rx="4" fill="#8a5a32" stroke="${ink}" stroke-width="1.6"/><ellipse cx="25" cy="16.5" rx="3" ry="4.5" fill="#d9b07a" stroke="${ink}" stroke-width="1.4"/><circle cx="25" cy="16.5" r="1.3" fill="none" stroke="${ink}"/>`,
  wadmal: `<rect x="5" y="9" width="22" height="15" rx="2" fill="#8c8a6e" stroke="${ink}" stroke-width="1.6"/><path d="M5 14h22M5 19h22M11 9v15M17 9v15M23 9v15" stroke="#5f6b3a" stroke-width="1"/>`,
  honey: `<path d="M10 11h12l2 14a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="#d99a2a" stroke="${ink}" stroke-width="1.6"/><rect x="9" y="6" width="14" height="5" rx="1.5" fill="#efe2c4" stroke="${ink}" stroke-width="1.4"/><path d="M13 15c0 4 2 4 2 7" stroke="#f3cf6a" stroke-width="2" fill="none"/>`,
  iron: `<path d="M5 22l5-9h12l5 9z" fill="#6e747a" stroke="${ink}" stroke-width="1.6"/><path d="M10 13l2-4h8l2 4" fill="#8d949a" stroke="${ink}" stroke-width="1.4"/>`,
  furs: `<path d="M8 6c4 2 12 2 16 0l-1 8 3 12c-6 3-14 3-20 0l3-12z" fill="#7a5032" stroke="${ink}" stroke-width="1.6"/><path d="M12 12l1 2M18 11l1 3M14 19l1 2M19 18l1 2" stroke="#3a2414" stroke-width="1.3"/>`,
  amber: `<path d="M16 4c6 6 9 11 9 15a9 9 0 0 1-18 0c0-4 3-9 9-15z" fill="#e0952a" stroke="${ink}" stroke-width="1.6"/><path d="M12 18c0-3 2-6 4-8" stroke="#ffd98a" stroke-width="2" fill="none"/>`,
  wine: `<path d="M12 4h8v4c4 2 6 6 6 11 0 6-4 9-10 9S6 25 6 19c0-5 2-9 6-11z" fill="#7a2a3a" stroke="${ink}" stroke-width="1.6"/><path d="M8 13c-3 0-4 4-2 6M24 13c3 0 4 4 2 6" fill="none" stroke="${ink}" stroke-width="1.4"/>`,
  ivory: `<path d="M6 26C8 14 16 6 27 5c-7 4-11 11-12 21z" fill="#f2ead6" stroke="${ink}" stroke-width="1.6"/><path d="M11 21c2-5 6-9 10-11" stroke="#c9b892" stroke-width="1.2" fill="none"/>`,
  blades: `<path d="M16 2l3 4v16h-6V6z" fill="#c9d0d6" stroke="${ink}" stroke-width="1.4"/><rect x="9" y="22" width="14" height="3" rx="1" fill="#c99a2e" stroke="${ink}" stroke-width="1.2"/><rect x="14.5" y="25" width="3" height="5" fill="#5b3a22"/>`,
  silk: `<path d="M6 10c4-3 16-3 20 0v12c-4 3-16 3-20 0z" fill="#a63a6a" stroke="${ink}" stroke-width="1.6"/><path d="M6 10c4 3 16 3 20 0M10 14c3 6 9 6 12 0" fill="none" stroke="#f0c0d8" stroke-width="1.3"/>`,
  hacksilver: `<path d="M5 20l6-6 5 3 4-6 7 5-3 9H8z" fill="#c8ccd2" stroke="${ink}" stroke-width="1.6"/><path d="M11 14l1 9M20 11l-2 12" stroke="#8a9098" stroke-width="1.2"/>`,
};
export const goodIcon = id => W(GOODS[id] || `<circle cx="16" cy="16" r="10" fill="#d9c59a" stroke="${ink}" stroke-width="1.6"/>`, 'ico good-ico');

const BLD = {
  market: `<path d="M4 13l3-7h18l3 7z" fill="#c99a2e" stroke="${ink}" stroke-width="1.5"/><path d="M4 13c2 3 4 3 6 0 2 3 4 3 6 0 2 3 4 3 6 0 2 3 4 3 6 0" fill="#8e2a22" stroke="${ink}" stroke-width="1.2"/><path d="M7 15v12h18V15" fill="none" stroke="${ink}" stroke-width="1.6"/><rect x="12" y="19" width="8" height="8" fill="#5b3a22"/>`,
  hall: `<path d="M3 17L16 5l13 12" fill="#5b3a22" stroke="${ink}" stroke-width="1.6"/><path d="M6 16v11h20V16" fill="#8a5a32" stroke="${ink}" stroke-width="1.6"/><path d="M16 5l-3-3M16 5l3-3" stroke="${ink}" stroke-width="1.6"/><rect x="13" y="20" width="6" height="7" fill="#3a2414"/>`,
  meadhall: `<path d="M9 9h12v16a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#c99a2e" stroke="${ink}" stroke-width="1.6"/><path d="M21 13h3a3 3 0 0 1 0 8h-3" fill="none" stroke="${ink}" stroke-width="1.8"/><path d="M8 9c1-4 13-4 14 0" fill="#f4f1ea" stroke="${ink}" stroke-width="1.4"/>`,
  shipyard: `<path d="M3 20h26l-4 6H7z" fill="#5b3a22" stroke="${ink}" stroke-width="1.6"/><path d="M16 4v16M16 5l9 12H16" fill="#efe2c4" stroke="${ink}" stroke-width="1.5"/><path d="M7 14l4-4" stroke="${ink}" stroke-width="2"/><rect x="4" y="8" width="5" height="3" transform="rotate(-45 6 9)" fill="#6e747a"/>`,
  altar: `<path d="M7 27h18M9 27V17h14v10" fill="#8d949a" stroke="${ink}" stroke-width="1.6"/><path d="M16 4c3 4 4 6 2 9-1 1-3 1-4 0-2-3-1-5 2-9z" fill="#e0952a" stroke="${ink}" stroke-width="1.3"/><rect x="7" y="14" width="18" height="3" fill="#6e747a" stroke="${ink}" stroke-width="1.2"/>`,
  runecarver: `<path d="M10 4h12l2 24H8z" fill="#9aa0a4" stroke="${ink}" stroke-width="1.6"/><path d="M16 8v14M16 11l4-3M16 15l-4-3M13 19l6 3" stroke="#8e2a22" stroke-width="1.8" fill="none"/>`,
  guild: `<path d="M5 26l9-9M14 17l-3-3 6-6 3 3z" fill="#6e747a" stroke="${ink}" stroke-width="1.6"/><path d="M27 26l-9-9M18 17l3-3-4-4" stroke="${ink}" stroke-width="1.8" fill="none"/><circle cx="22" cy="10" r="4" fill="#c99a2e" stroke="${ink}" stroke-width="1.4"/>`,
  bank: `<path d="M6 12h20v15H6z" fill="#5b3a22" stroke="${ink}" stroke-width="1.6"/><path d="M6 12l3-5h14l3 5" fill="#8a5a32" stroke="${ink}" stroke-width="1.4"/><rect x="12" y="16" width="8" height="7" fill="#c99a2e" stroke="${ink}" stroke-width="1.3"/><circle cx="16" cy="19.5" r="1.3" fill="${ink}"/>`,
  moneylender: `<path d="M10 9c-4 4-5 9-4 13 1 5 19 5 20 0 1-4 0-9-4-13z" fill="#a08a5a" stroke="${ink}" stroke-width="1.6"/><path d="M10 9l2-4h8l2 4z" fill="#8a7448" stroke="${ink}" stroke-width="1.4"/><path d="M16 13v10M13 15h5a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h5" fill="none" stroke="${ink}" stroke-width="1.5"/>`,
  warehouse: `<path d="M3 13L16 6l13 7v14H3z" fill="#8a5a32" stroke="${ink}" stroke-width="1.6"/><rect x="8" y="17" width="7" height="10" fill="#c9a06a" stroke="${ink}" stroke-width="1.2"/><rect x="17" y="17" width="7" height="10" fill="#c9a06a" stroke="${ink}" stroke-width="1.2"/><path d="M8 17l7 10M17 17l7 10" stroke="${ink}"/>`,
};
export const bldIcon = id => W(BLD[id] || BLD.hall, 'ico bld-ico');

const HUD = {
  silver: `<circle cx="16" cy="16" r="11" fill="#d9dde2" stroke="${ink}" stroke-width="1.8"/><circle cx="16" cy="16" r="7" fill="none" stroke="#8a9098" stroke-width="1.4"/><path d="M16 11v10M12 16h8" stroke="#8a9098" stroke-width="1.4"/>`,
  bank: BLD.bank,
  debt: `<path d="M8 4h16v24l-4-3-4 3-4-3-4 3z" fill="#efe2c4" stroke="${ink}" stroke-width="1.6"/><path d="M12 11h8M12 16h8M12 21h5" stroke="#8e2a22" stroke-width="1.6"/>`,
  date: `<circle cx="16" cy="16" r="11" fill="#2f5d6e" stroke="${ink}" stroke-width="1.6"/><path d="M16 5a11 11 0 0 1 0 22 8 8 0 0 0 0-22z" fill="#efe2c4"/>`,
  cargo: `<path d="M5 11l11-6 11 6v12l-11 6-11-6z" fill="#a8783e" stroke="${ink}" stroke-width="1.6"/><path d="M5 11l11 6 11-6M16 17v12" fill="none" stroke="${ink}" stroke-width="1.4"/>`,
  renown: `<path d="M16 3l3.6 8 8.4.8-6.4 5.6 2 8.4L16 21.4 8.4 25.8l2-8.4L4 11.8l8.4-.8z" fill="#c99a2e" stroke="${ink}" stroke-width="1.5"/>`,
  sail: `<path d="M16 3v22M16 4l10 16H16zM14 7l-8 13h8z" fill="#efe2c4" stroke="${ink}" stroke-width="1.5"/><path d="M3 24h26l-4 5H7z" fill="#5b3a22" stroke="${ink}" stroke-width="1.5"/>`,
  journal: `<path d="M6 5h16a4 4 0 0 1 4 4v18H10a4 4 0 0 1-4-4z" fill="#efe2c4" stroke="${ink}" stroke-width="1.6"/><path d="M6 23a4 4 0 0 1 4-4h16" fill="none" stroke="${ink}" stroke-width="1.4"/><path d="M11 9h10M11 13h8" stroke="#5b3a22" stroke-width="1.5"/>`,
  fleet: `<path d="M3 19h26l-4 7H7z" fill="#5b3a22" stroke="${ink}" stroke-width="1.6"/><path d="M15 4v15M15 5l-9 12h9zM17 7l8 10h-8z" fill="#efe2c4" stroke="${ink}" stroke-width="1.4"/>`,
  items: `<path d="M10 4h12l2 24H8z" fill="#9aa0a4" stroke="${ink}" stroke-width="1.6"/><path d="M16 9v13M16 12l4-3M13 18l6 3" stroke="#c99a2e" stroke-width="1.8" fill="none"/>`,
  log: `<path d="M8 3h13l5 5v21H8z" fill="#efe2c4" stroke="${ink}" stroke-width="1.6"/><path d="M12 12h10M12 16h10M12 20h7" stroke="#5b3a22" stroke-width="1.5"/>`,
  menu: `<path d="M6 9h20M6 16h20M6 23h20" stroke="#efe2c4" stroke-width="3" stroke-linecap="round"/>`,
  talk: `<path d="M5 7h22v13H14l-6 5v-5H5z" fill="#efe2c4" stroke="${ink}" stroke-width="1.6"/><path d="M10 12h12M10 16h8" stroke="#5b3a22" stroke-width="1.5"/>`,
  help: `<circle cx="16" cy="16" r="12" fill="#efe2c4" stroke="${ink}" stroke-width="1.6"/><path d="M12 12a4 4 0 1 1 5 4c-1 .5-1 1.5-1 3" fill="none" stroke="${ink}" stroke-width="2.2"/><circle cx="16" cy="23" r="1.5" fill="${ink}"/>`,
  lock: `<rect x="7" y="14" width="18" height="14" rx="2" fill="#c99a2e" stroke="${ink}" stroke-width="1.6"/><path d="M11 14V10a5 5 0 0 1 10 0v4" fill="none" stroke="${ink}" stroke-width="2.4"/>`,
  blessing: `<path d="M16 3c4 6 7 9 7 14a7 7 0 0 1-14 0c0-5 3-8 7-14z" fill="#e0952a" stroke="${ink}" stroke-width="1.5"/>`,
};
export const hudIcon = id => W(HUD[id] || HUD.help, 'ico hud-ico');

export const BLD_NAMES = {market: 'Market', hall: "Jarl's hall", meadhall: 'Mead hall', shipyard: 'Shipyard', altar: 'Altar',
  runecarver: 'Rune-carver', guild: 'Craft guild', bank: 'Bank', moneylender: 'Moneylender', warehouse: 'Warehouse'};

// App icon (also written to icon.svg) - a dragon-prow ship on a gold disc.
export const APP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#3a2414"/>
<circle cx="256" cy="240" r="176" fill="#c99a2e"/><circle cx="256" cy="240" r="160" fill="#2f5d6e"/>
<path d="M120 300h272l-30 52H150z" fill="#5b3a22" stroke="#1d1a16" stroke-width="8"/>
<path d="M392 300c20-30 18-70-6-86 18 30 6 50-14 58z" fill="#5b3a22" stroke="#1d1a16" stroke-width="8"/>
<path d="M252 120v180" stroke="#1d1a16" stroke-width="10"/><path d="M180 140h150l-14 140H194z" fill="#8e2a22" stroke="#1d1a16" stroke-width="8"/>
<path d="M200 170h112M204 210h104M198 250h116" stroke="#efe2c4" stroke-width="10" opacity=".85"/>
<path d="M96 380c40-16 80 16 120 0s80 16 120 0 80 16 120 0" fill="none" stroke="#efe2c4" stroke-width="10" stroke-linecap="round"/></svg>`;
