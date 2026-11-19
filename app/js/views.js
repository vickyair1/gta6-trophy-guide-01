// views.js — render the checklist, trophy detail, roadmap, missables and Next-up planner.
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
  body.append(badges);
  li.append(body);
  return li;
}

export function renderChecklist(view, trophies, state, opts, onToggle) {
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

export function renderDetail(view, trophy, state, onToggle, onNote) {
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
  wrap.append(el('h3', null, 'Guide'));
  if (isSpoilerHidden(trophy, state)) {
    wrap.append(el('p', 'spoiler', 'Spoiler mode is on. Earn this trophy to reveal its guide, or turn spoiler mode off.'));
  } else {
    wrap.append(el('p', 'guide', trophy.guide || ''));
    if (Array.isArray(trophy.steps) && trophy.steps.length) {
      wrap.append(el('h3', null, 'Steps'));
      const ol = document.createElement('ol');
      for (const s of trophy.steps) ol.append(el('li', null, s));
      wrap.append(ol);
    }
  }
  wrap.append(el('h3', null, 'Sources'));
  const src = el('ul', 'sources');
  for (const s of trophy.sources || []) {
    const li = document.createElement('li');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url; a.textContent = s.name; a.rel = 'noopener'; a.target = '_blank';
      li.append(a);
    } else li.textContent = s.name || s;
    src.append(li);
  }
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

const STAGES = [
  { n: 1, title: 'Stage 1 — Story chapters', text: 'Play Chapters 1–4 in order, then the final mission. Trophies: Gone Fishing, the four chapter trophies, and the gold final-mission trophy.' },
  { n: 2, title: 'Stage 2 — Named missions', text: 'Complete the named story missions: Breakfast Run, The Cartel Heist, Child’s Play, Headliners, VCIA Takedown, Operation Savage Glory.' },
  { n: 3, title: 'Stage 3 — Side strands', text: 'Finish the final mission for Andy, Kenton, Billy, Randy and Tyrone, plus 8 stranger strands across Leonida.' },
  { n: 4, title: 'Stage 4 — Activities', text: 'Try all 9 activity types, win 20 different races, win Top Fun drone races at all 14 locations, beat Cal at fishing, finish an arcade game, bowl at Kolt & Associates, and do the partner and stunt moments.' },
  { n: 5, title: 'Stage 5 — Collectibles & exploration', text: 'Meditate at all 18 spots, complete 3 card sets, WAiNK It at 100 locations, discover 100 vehicles, explore all 52 areas, complete 50 challenges and 250 stunts, and gold all 42 Shooting Range challenges.' },
  { n: 6, title: 'Stage 6 — Cleanup & economy', text: 'Rob 5 bank vaults and an armored truck, rob one illegal operation per gang, launder $250,000 in Marked Bills, spend $100,000 in shops, buy all 8 garages, register 10 vehicles to Scooter Bros — then 100% completion and the platinum.' },
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
      li.textContent = (state.earned.has(t.id) ? '✓ ' : '○ ') + (t.hidden && state.spoiler && !state.earned.has(t.id) ? 'Hidden story trophy' : t.name) + ' — ' + t.grade;
      ul.append(li);
    }
    box.append(ul);
    view.append(box);
  }
}

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

export function renderPlanner(view, trophies, state) {
  view.replaceChildren();
  view.append(el('h2', null, 'Next up — your next 5 trophies'));
  view.append(el('p', null, 'Suggested in roadmap order: the earliest unearned trophies first, so you always know what to do next.'));
  const next = [...trophies].filter((t) => !state.earned.has(t.id)).sort(roadmapSort).slice(0, 5);
  if (!next.length) {
    view.append(el('p', 'empty', 'All 55 trophies earned — the platinum is yours. Leonida Legend!'));
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
