// store.js — progress, notes, spoiler mode and theme, saved in localStorage; export/import of progress.
const KEY = 'leonida-platinum-v1';

export function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    // Coerce stored ids to numbers: trophy ids are numbers, and a string id
    // would never match in the earned Set.
    const earned = (Array.isArray(raw.earned) ? raw.earned : []).map((n) => Number(n)).filter((n) => Number.isInteger(n));
    return {
      earned: new Set(earned),
      notes: raw.notes && typeof raw.notes === 'object' ? raw.notes : {},
      spoiler: raw.spoiler === true,
      theme: raw.theme === 'light' ? 'light' : 'dark',
    };
  } catch {
    return { earned: new Set(), notes: {}, spoiler: false, theme: 'dark' };
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify({
    earned: [...state.earned],
    notes: state.notes,
    spoiler: state.spoiler,
    theme: state.theme,
  }));
}

export function toggleEarned(state, id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveState(state);
}

export function setNote(state, id, text) {
  state.notes[id] = text;
  saveState(state);
}

export function exportProgress(state) {
  const blob = new Blob([JSON.stringify({ exported: 'leonida-platinum', earned: [...state.earned], notes: state.notes }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function validateImport(text) {
  const doc = JSON.parse(text);
  const earned = Array.isArray(doc) ? doc : doc.earned;
  if (!Array.isArray(earned)) throw new Error('No earned list found in file.');
  const ids = earned.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
  if (ids.length === 0 && earned.length > 0) throw new Error('No valid trophy ids found in file.');
  return { earned: ids, notes: doc.notes && typeof doc.notes === 'object' ? doc.notes : {} };
}
