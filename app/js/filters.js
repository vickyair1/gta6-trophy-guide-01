// filters.js — search, grade/kind/missable/earned filters, and the spoiler rule.
export function applyFilters(trophies, state, opts) {
  const q = (opts.search || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (opts.grade !== 'all' && t.grade !== opts.grade) return false;
    if (opts.kind !== 'all' && t.kind !== opts.kind) return false;
    if (opts.missableOnly && !t.missable) return false;
    if (opts.earnedOnly && !state.earned.has(t.id)) return false;
    if (opts.unearnedOnly && state.earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))) return false;
    return true;
  });
}

// Spoiler rule: hide the name and description of a hidden story trophy until it is earned.
export function isSpoilerHidden(trophy, state) {
  return state.spoiler && trophy.hidden && !state.earned.has(trophy.id);
}

export function displayName(trophy, state) {
  return isSpoilerHidden(trophy, state) ? 'Hidden trophy — earn it to reveal' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isSpoilerHidden(trophy, state) ? 'Spoiler mode is on: this story trophy stays hidden until you earn it.' : trophy.description;
}
