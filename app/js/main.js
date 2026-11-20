// main.js — boot the guide: load data, wire the store, filters, theme, spoiler mode and hash routing.
import { loadTrophies, loadSources } from './data.js';
import { loadState, saveState, toggleEarned, setNote, exportProgress, validateImport } from './store.js';
import { renderChecklist, renderDetail, renderRoadmap, renderMissables, renderPlanner, renderMatrix } from './views.js';

const view = document.getElementById('view');
const state = loadState();
let trophies = [];
// The source registry (app/data/sources.json), or null when the file is missing —
// views fall back to each trophy's own `sources` array in that case.
let sources = null;

function applyTheme() {
  document.body.dataset.theme = state.theme;
  document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '☀ Sunset / Night' : '☾ Night / Sunset';
}

function applySpoilerButton() {
  document.getElementById('spoilerToggle').textContent = state.spoiler ? '👁 Spoiler mode: on' : '👁 Spoiler mode: off';
}

function renderProgress() {
  const total = trophies.length || 55;
  const n = state.earned.size;
  document.getElementById('progressCount').textContent = n + ' / ' + total + ' earned';
  document.getElementById('progressPct').textContent = Math.round((n / total) * 100) + '%';
  document.getElementById('progressFill').style.width = ((n / total) * 100) + '%';
  const counts = {};
  for (const t of trophies) {
    counts[t.grade] = counts[t.grade] || { got: 0, total: 0 };
    counts[t.grade].total++;
    if (state.earned.has(t.id)) counts[t.grade].got++;
  }
  document.getElementById('gradeCounts').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => (counts[g] ? g + ' ' + counts[g].got + '/' + counts[g].total : '')).filter(Boolean).join(' · ');
}

function filterOpts() {
  return {
    search: document.getElementById('search').value,
    grade: document.getElementById('gradeFilter').value,
    kind: document.getElementById('kindFilter').value,
    missableOnly: document.getElementById('missableFilter').checked,
    earnedOnly: document.getElementById('earnedFilter').checked,
    unearnedOnly: document.getElementById('unearnedFilter').checked,
  };
}

function route() {
  const hash = location.hash || '#/checklist';
  const parts = hash.replace(/^#\//, '').split('/');
  const page = parts[0] || 'checklist';
  document.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.route === page));
  document.getElementById('toolbar').style.display = page === 'checklist' ? '' : 'none';
  const onToggle = (id) => { toggleEarned(state, id); renderProgress(); route(); };
  const onNote = (id, text) => setNote(state, id, text);
  if (page === 'detail') {
    const t = trophies.find((x) => x.id === Number(parts[1]));
    if (t) renderDetail(view, t, state, onToggle, onNote, sources);
    else renderChecklist(view, trophies, state, filterOpts(), onToggle, sources);
  } else if (page === 'roadmap') renderRoadmap(view, trophies, state);
  else if (page === 'missables') renderMissables(view, trophies, state);
  else if (page === 'planner') renderPlanner(view, trophies, state);
  else if (page === 'matrix') renderMatrix(view, trophies, sources);
  else renderChecklist(view, trophies, state, filterOpts(), onToggle, sources);
}

document.getElementById('themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveState(state);
  applyTheme();
});
document.getElementById('spoilerToggle').addEventListener('click', () => {
  state.spoiler = !state.spoiler;
  saveState(state);
  applySpoilerButton();
  route();
});
for (const id of ['search', 'gradeFilter', 'kindFilter', 'missableFilter', 'earnedFilter', 'unearnedFilter']) {
  document.getElementById(id).addEventListener('input', route);
  document.getElementById(id).addEventListener('change', route);
}
document.getElementById('exportBtn').addEventListener('click', () => exportProgress(state));
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const status = document.getElementById('importStatus');
  if (!file) return;
  try {
    const parsed = validateImport(await file.text());
    state.earned = new Set(parsed.earned);
    state.notes = { ...state.notes, ...parsed.notes };
    saveState(state);
    renderProgress();
    route();
    status.textContent = 'Imported ' + parsed.earned.length + ' earned trophies.';
  } catch (err) {
    status.textContent = 'Import failed: ' + err.message;
  }
  e.target.value = '';
});
window.addEventListener('hashchange', route);

applyTheme();
applySpoilerButton();
try {
  // loadSources() never throws: it returns null when data/sources.json is missing.
  [trophies, sources] = await Promise.all([loadTrophies(), loadSources()]);
} catch (err) {
  view.textContent = 'Could not load the trophy list: ' + err.message;
  throw err;
}
renderProgress();
route();
