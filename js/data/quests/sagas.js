// Main quests (story owner). SAGAS is a flat array of quests in the CONTRACT.md schema:
// 11 chapters each for ylva, bjarki, saeunn, hrafn and ketill, and a 3-chapter frame for grima
// (her chapter 3 requires every optional task in SIDE). The custom hero has no saga.
//
// Each hero's chapters live in saga_<hero>.js; this file only gathers them.
// Port and good unlock order per saga: docs/STORY.md, "Unlock order".

import {YLVA} from './saga_ylva.js';
import {BJARKI} from './saga_bjarki.js';
import {SAEUNN} from './saga_saeunn.js';
import {HRAFN} from './saga_hrafn.js';
import {KETILL} from './saga_ketill.js';
import {GRIMA} from './saga_grima.js';

export const SAGAS = [...YLVA, ...BJARKI, ...SAEUNN, ...HRAFN, ...KETILL, ...GRIMA];

// Convenience lookups for the engine and the journal.
export const SAGA_BY_ID = Object.fromEntries(SAGAS.map((q) => [q.id, q]));
export const sagaOf = (hero) => SAGAS.filter((q) => q.saga === hero).sort((a, b) => a.chapter - b.chapter);
export const SAGA_LENGTH = {ylva: 11, bjarki: 11, saeunn: 11, hrafn: 11, ketill: 11, grima: 3};
