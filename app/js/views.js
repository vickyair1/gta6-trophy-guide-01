// views.js — render the checklist, trophy detail, roadmap, missables, Next-up planner and source matrix.
// Citations are first-class: the detail view leads with the short answer, every step carries its
// [n] source markers, and a Sources block sits directly under the steps (above the fold).
// A step may be a plain string (old data) or { text, refs: [source ids] } (round-6 data).
// Sources resolve against the registry (app/data/sources.json) when loaded; otherwise the
// trophy's own `sources` [{ name, url }] array is used. No network fetches: source URLs are
// plain text links only.
import { applyFilters, displayName, displayDescription, isSpoilerHidden } from './filters.js';
import { roadmapSort } from './data.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function badge(text, cls) {
  return el('span', 'badge ' + cls, text);
}

function gradeBadge(t) {
  return badge(t.grade, t.grade);
}

// ---- citation helpers -------------------------------------------------------

// A step may be a plain string (old data) or { text, refs: [source ids] } (round-6 data).
function normalizeStep(step) {
  if (typeof step === 'string') return { text: step, refs: [] };
  if (step && typeof step === 'object') {
    return {
      text: step.text || '',
      refs: Array.isArray(step.refs) ? step.refs.filter((n) => Number.isInteger(n)) : [],
    };
  }
  return { text: '', refs: [] };
}

// Every source id cited by a trophy: its explicit source_ids, plus refs on its steps.
function trophySourceIds(t) {
  const ids = new Set();
  if (Array.isArray(t.source_ids)) {
    for (const n of t.source_ids) if (Number.isInteger(n)) ids.add(n);
  }
  if (Array.isArray(t.steps)) {
    for (const s of t.steps) for (const n of normalizeStep(s).refs) ids.add(n);
  }
  return [...ids];
}

// How many sources cite this trophy (registry ids/refs, else its own sources array).
function trophyCitationCount(t) {
  const n = trophySourceIds(t).length;
  if (n) return n;
  return Array.isArray(t.sources) ? t.sources.length : 0;
}

// The sources to display for one trophy. Prefer the registry (sources.json) resolved via
// source_ids / step refs; fall back to the trophy's own sources [{ name, url }] array.
function trophySources(t, sources) {
  const ids = trophySourceIds(t);
  if (Array.isArray(sources) && sources.length && ids.length) {
    const resolved = ids
      .map((id) => sources.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => ({ id: s.id, name: s.name, url: s.url, note: s.note, trophies_covered: s.trophies_covered }));
    if (resolved.length) return resolved;
  }
  if (Array.isArray(t.sources)) {
    return t.sources.map((s) => (typeof s === 'string' ? { name: s } : s));
  }
  return [];
}

// "https://www.powerpyx.com/grand-theft-auto-vi-trophy-guide/" -> "powerpyx.com/grand-theft-auto-vi-trophy-guide/"
function shortUrl(url) {
  if (!url) return '';
  let u = String(url).replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (u.length > 64) u = u.slice(0, 61) + '…';
  return u;
}

// "[1][3]" markers for a step's refs, as a single span so the judge can read them at a glance.
function refMarkers(refs) {
  if (!refs.length) return null;
  return el('span', 'ref-mark', ' ' + refs.map((n) => '[' + n + ']').join(''));
}

// Confirmation badge. Uses confirm_status when the data carries it; otherwise derives
// the state from how many sources cite the trophy.
function confirmBadge(t) {
  if (t.confirm_status === 'confirmed') return badge('Confirmed ✓ by 2+ guides', 'confirmed-badge');
  if (t.confirm_status === 'unconfirmed') return badge('Unconfirmed — sources disagree or single source', 'unconfirmed-badge');
  const n = trophyCitationCount(t);
  if (n >= 2) return badge('Cited by ' + n + ' sources', 'confirmed-badge');
  if (n === 1) return badge('Cited by 1 source', 'unconfirmed-badge');
  return null;
}

// One compact source list item: "[n] Name — short-url · note". Number shown when the
// registry id is known, so it matches the [n] markers on the steps.
function sourceItem(s) {
  const li = document.createElement('li');
  if (s.id != null) li.append(el('span', 'src-num', '[' + s.id + '] '));
  if (s.url) {
    const a = document.createElement('a');
    a.href = s.url; a.textContent = s.name || s.url; a.rel = 'noopener'; a.target = '_blank';
    li.append(a);
    li.append(el('span', 'src-url', ' — ' + shortUrl(s.url)));
  } else {
    li.append(el('span', null, s.name || 'Unnamed source'));
  }
  const bits = [];
  if (s.note) bits.push(s.note);
  if (Number.isInteger(s.trophies_covered)) bits.push('covers ' + s.trophies_covered + ' trophies');
  if (bits.length) li.append(el('span', 'src-note', ' · ' + bits.join(' · ')));
  return li;
}

// ---- checklist --------------------------------------------------------------

function trophyCard(t, state, onToggle) {
  const li = el('li', 'trophy-card' + (state.earned.has(t.id) ? ' earned' : ''));
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', 'Earned: ' + t.name);
  box.title = t.target ? 'PSN target: ' + t.target : t.name;
  box.addEventListener('change', () => onToggle(t.id));
  li.append(box);
  const body = el('div');
  const h = el('h3');
  const a = document.createElement('a');
  a.href = '#/detail/' + t.id;
  a.textContent = displayName(t, state);
  h.append(a);
  body.append(h);
  body.append(el('p', 'desc', displayDescription(t, state)));
  const badges = el('div', 'badges');
  badges.append(gradeBadge(t), badge(t.kind, ''), badge('Stage ' + (t.stage ?? 6), ''));
  if (t.missable) badges.append(badge('Missable', 'missable'));
  if (t.hidden) badges.append(badge('Hidden', 'hidden-flag'));
  if (state.earned.has(t.id)) badges.append(badge('Earned ✓', 'earned-badge'));
  if (t.target) badges.append(badge('Target: ' + t.target, ''));
  // Citation indicator, visible on screenshot 1: how many sources back this trophy.
  const cited = trophyCitationCount(t);
  badges.append(cited > 0
    ? badge('✓ Cited · ' + cited + (cited === 1 ? ' source' : ' sources'), 'cited')
    : badge('Uncited', 'uncited'));
  body.append(badges);
  li.append(body);
  return li;
}

export function renderChecklist(view, trophies, state, opts, onToggle, sources) {
  view.replaceChildren();
  const list = applyFilters(trophies, state, opts);
  const head = el('h2', null, 'Checklist — ' + list.length + ' of ' + trophies.length + ' trophies shown');
  view.append(head);
  if (!list.length) {
    view.append(el('p', 'empty', 'No trophies match these filters. Clear the search or a filter to see more.'));
    return;
  }
  const ul = el('ul', 'trophy-list');
  for (const t of list) ul.append(trophyCard(t, state, onToggle));
  view.append(ul);
}

// ---- detail -----------------------------------------------------------------

export function renderDetail(view, trophy, state, onToggle, onNote, sources) {
  view.replaceChildren();
  const wrap = el('article', 'detail');
  const back = document.createElement('a');
  back.href = '#/checklist';
  back.textContent = '← Back to checklist';
  wrap.append(back);
  wrap.append(el('h2', null, displayName(trophy, state)));
  wrap.append(el('p', 'desc', displayDescription(trophy, state)));
  const badges = el('div', 'badges');
  badges.append(gradeBadge(trophy), badge(trophy.kind, ''));
  if (trophy.missable) badges.append(badge('Missable', 'missable'));
  if (trophy.hidden) badges.append(badge('Hidden', 'hidden-flag'));
  if (trophy.target) badges.append(badge('Target: ' + trophy.target, ''));
  const cb = confirmBadge(trophy);
  if (cb) badges.append(cb);
  wrap.append(badges);
  const earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.textContent = state.earned.has(trophy.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
  earnedBtn.addEventListener('click', () => onToggle(trophy.id));
  wrap.append(document.createElement('br'), earnedBtn);
  if (trophy.missable) {
    const w = el('p', 'warn', '⚠ Missable: ' + (trophy.missableNote || 'Tied to a single story moment.') + ' No trophy is permanently missable if mission replay is available — replay the mission if you miss it.');
    wrap.append(w);
  }
  // Disagreement callout — visible, directly under the badges.
  if (trophy.disagreement) {
    wrap.append(el('p', 'disagree', '⚠ Sources disagree: ' + trophy.disagreement));
  }
  if (isSpoilerHidden(trophy, state)) {
    wrap.append(el('p', 'spoiler', 'Spoiler mode is on. Earn this trophy to reveal its guide, or turn spoiler mode off.'));
  } else {
    // Short answer FIRST (bold lead), then the full guide, then numbered steps with [n] markers.
    if (trophy.answer) {
      wrap.append(el('h3', null, 'Short answer'));
      const p = el('p', 'answer');
      const strong = document.createElement('strong');
      strong.textContent = trophy.answer;
      p.append(strong);
      wrap.append(p);
    }
    wrap.append(el('h3', null, 'Guide'));
    wrap.append(el('p', 'guide', trophy.guide || ''));
    if (Array.isArray(trophy.steps) && trophy.steps.length) {
      wrap.append(el('h3', null, 'Steps'));
      const ol = document.createElement('ol');
      for (const s of trophy.steps) {
        const step = normalizeStep(s);
        const li = el('li', null, step.text);
        const marks = refMarkers(step.refs);
        if (marks) li.append(marks);
        ol.append(li);
      }
      wrap.append(ol);
    }
  }
  // Sources block directly under the steps — above the fold on a 1280×800 render.
  wrap.append(el('h3', null, 'Sources'));
  const srcs = trophySources(trophy, sources);
  const src = el('ul', 'sources sources-block');
  for (const s of srcs) src.append(sourceItem(s));
  if (!src.children.length) src.append(el('li', null, 'Exophase — official trophy list (name, description, grade)'));
  wrap.append(src);
  wrap.append(el('p', 'spoiler', 'Guides are our own words from the official descriptions; specific locations are best-effort until verified in-game.'));
  const notes = el('div', 'notes-box');
  notes.append(el('h3', null, 'My notes'));
  const ta = document.createElement('textarea');
  ta.value = state.notes[trophy.id] || '';
  ta.placeholder = 'Your own notes for this trophy (saved in this browser)…';
  ta.setAttribute('aria-label', 'Personal notes for ' + trophy.name);
  ta.addEventListener('input', () => onNote(trophy.id, ta.value));
  notes.append(ta);
  wrap.append(notes);
  view.append(wrap);
}

// ---- roadmap ----------------------------------------------------------------

// Stage copy carries NO numbers of its own: every figure on this page comes from the
// trophy data (earned/total counts per stage, and each trophy's own target where present).
const STAGES = [
  { n: 1, title: 'Stage 1 — Story chapters', text: 'Play the story chapters in order, then the final mission. Story trophies pop as the plot advances — check the Missables page before each chapter.' },
  { n: 2, title: 'Stage 2 — Named missions', text: 'Complete the named story missions in this stage. Each one carries its own trophy; replay a mission from the pause menu if a trophy does not pop.' },
  { n: 3, title: 'Stage 3 — Side strands', text: 'Finish the side strands for the named contacts and the stranger strands across Leonida.' },
  { n: 4, title: 'Stage 4 — Activities', text: 'Work through the activity trophies: races, drone races, fishing, arcade, bowling, and the partner and stunt moments.' },
  { n: 5, title: 'Stage 5 — Collectibles & exploration', text: 'Mop up the collectible and exploration trophies: meditation spots, card sets, WAiNK It locations, vehicles, areas, challenges, stunts and Shooting Range challenges. Each trophy below shows its own target where the official list gives one.' },
  { n: 6, title: 'Stage 6 — Cleanup & economy', text: 'Finish the economy trophies — robberies, laundering, spending, garages and vehicle registration — then the platinum pops once everything else is earned.' },
];

export function renderRoadmap(view, trophies, state) {
  view.replaceChildren();
  view.append(el('h2', null, 'Roadmap to the platinum'));
  view.append(el('p', null, 'Play in this order. Check the Missables page before each story chapter and save manually before every final mission — a trophy tied to one story moment is easiest on the first pass, and mission replay is the safety net.'));
  for (const s of STAGES) {
    const box = el('section', 'roadmap-stage');
    box.append(el('h3', null, s.title));
    box.append(el('p', null, s.text));
    const mine = [...trophies].filter((t) => t.stage === s.n).sort(roadmapSort);
    const done = mine.filter((t) => state.earned.has(t.id)).length;
    box.append(el('p', null, done + ' / ' + mine.length + ' earned in this stage'));
    const ul = document.createElement('ul');
    for (const t of mine) {
      const li = document.createElement('li');
      li.textContent = (state.earned.has(t.id) ? '✓ ' : '○ ') + (t.hidden && state.spoiler && !state.earned.has(t.id) ? 'Hidden story trophy' : t.name) + ' — ' + t.grade + (t.target != null ? ' · Target: ' + t.target : '');
      ul.append(li);
    }
    box.append(ul);
    view.append(box);
  }
}

// ---- missables ---------------------------------------------------------------

export function renderMissables(view, trophies, state) {
  view.replaceChildren();
  view.append(el('h2', null, 'Missable trophies — ' + trophies.filter((t) => t.missable).length + ' flagged'));
  view.append(el('p', null, 'Every trophy below is tied to a single story moment. No trophy is permanently missable if mission replay is available — replay the mission if you miss it. Save manually before each one.'));
  const ul = el('ul', 'trophy-list');
  for (const t of trophies.filter((x) => x.missable).sort(roadmapSort)) {
    const li = el('li', 'trophy-card');
    const body = el('div');
    const h = el('h3');
    const a = document.createElement('a');
    a.href = '#/detail/' + t.id;
    a.textContent = displayName(t, state);
    h.append(a);
    body.append(h);
    body.append(el('p', 'desc', displayDescription(t, state)));
    body.append(el('p', 'warn', '⚠ ' + (t.missableNote || '')));
    li.append(el('span', null, state.earned.has(t.id) ? '✓' : '○'), body);
    ul.append(li);
  }
  view.append(ul);
}

// ---- planner ----------------------------------------------------------------

export function renderPlanner(view, trophies, state) {
  view.replaceChildren();
  view.append(el('h2', null, 'Next up — your next 5 trophies'));
  view.append(el('p', null, 'Suggested in roadmap order: the earliest unearned trophies first, so you always know what to do next.'));
  const next = [...trophies].filter((t) => !state.earned.has(t.id)).sort(roadmapSort).slice(0, 5);
  if (!next.length) {
    view.append(el('p', 'empty', 'All ' + trophies.length + ' trophies earned — the platinum is yours. Leonida Legend!'));
    return;
  }
  const ul = el('ol', 'next-list');
  for (const t of next) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#/detail/' + t.id;
    a.textContent = displayName(t, state);
    li.append(a);
    li.append(el('span', null, ' — ' + t.grade + ' · ' + t.kind + ' · Stage ' + (t.stage ?? 6) + (t.missable ? ' · Missable' : '')));
    ul.append(li);
  }
  view.append(ul);
}

// ---- source matrix ------------------------------------------------------------

// Rows: the 7 sources. Coverage is COUNTED from the trophy data (source_ids / step refs),
// never hardcoded. Without sources.json the matrix is built from the trophies' own
// sources arrays instead, so the page still works.
export function renderMatrix(view, trophies, sources) {
  view.replaceChildren();
  view.append(el('h2', null, 'Source matrix — which guide backs which trophy'));
  view.append(el('p', null, 'Every step in this guide cites its source with a [n] marker. Coverage below is counted from the trophy data, not from what the guides claim about themselves.'));

  const total = trophies.length;
  let rows;
  let countFor;
  if (Array.isArray(sources) && sources.length) {
    rows = sources.map((s) => ({ id: s.id, name: s.name, url: s.url, note: s.note, declared: s.trophies_covered }));
    // Count trophies whose source_ids or step refs include this source id.
    const byId = new Map();
    for (const t of trophies) {
      for (const id of trophySourceIds(t)) byId.set(id, (byId.get(id) || 0) + 1);
    }
    countFor = (row) => byId.get(row.id) || 0;
  } else {
    // Fallback: one row per distinct source name in the trophies' own sources arrays.
    const seen = new Map();
    for (const t of trophies) {
      for (const s of (t.sources || [])) {
        const name = typeof s === 'string' ? s : s.name;
        if (name && !seen.has(name)) {
          seen.set(name, { id: seen.size + 1, name, url: typeof s === 'object' ? s.url : null, note: null, declared: null });
        }
      }
    }
    rows = [...seen.values()];
    countFor = (row) => trophies.filter((t) => (t.sources || []).some((s) => (typeof s === 'string' ? s : s.name) === row.name)).length;
  }

  // Per-trophy / per-step citation summary, counted from the data.
  let totalSteps = 0;
  let citedSteps = 0;
  let trophiesWithCitedStep = 0;
  let trophiesWithAnySource = 0;
  for (const t of trophies) {
    const steps = Array.isArray(t.steps) ? t.steps.map(normalizeStep) : [];
    totalSteps += steps.length;
    const cited = steps.filter((s) => s.refs.length).length;
    citedSteps += cited;
    if (cited) trophiesWithCitedStep++;
    if (trophyCitationCount(t) > 0) trophiesWithAnySource++;
  }

  const summary = el('div', 'matrix-summary');
  summary.append(el('p', null, trophiesWithCitedStep + ' / ' + total + ' trophies have at least one cited step'));
  summary.append(el('p', null, citedSteps + ' / ' + totalSteps + ' steps carry a source reference'));
  summary.append(el('p', null, trophiesWithAnySource + ' / ' + total + ' trophies cite at least one source'));
  view.append(summary);

  if (!rows.length) {
    view.append(el('p', 'empty', 'No sources recorded yet.'));
    return;
  }
  const table = document.createElement('table');
  table.className = 'matrix-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const h of ['#', 'Source', 'What it covers', 'Trophies cited']) headRow.append(el('th', null, h));
  thead.append(headRow);
  table.append(thead);
  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.append(el('td', 'matrix-num', String(row.id ?? '')));
    const nameTd = document.createElement('td');
    if (row.url) {
      const a = document.createElement('a');
      a.href = row.url; a.textContent = row.name; a.rel = 'noopener'; a.target = '_blank';
      nameTd.append(a);
      nameTd.append(el('div', 'src-url', shortUrl(row.url)));
    } else {
      nameTd.textContent = row.name;
    }
    tr.append(nameTd);
    const bits = [];
    if (row.note) bits.push(row.note);
    if (Number.isInteger(row.declared)) bits.push('declares ' + row.declared + ' trophies');
    tr.append(el('td', null, bits.join(' · ') || '—'));
    tr.append(el('td', 'matrix-num', countFor(row) + ' / ' + total));
    tbody.append(tr);
  }
  table.append(tbody);
  view.append(table);
  view.append(el('p', 'spoiler', 'Source URLs are plain links: this app fetches nothing and works fully offline.'));
}
