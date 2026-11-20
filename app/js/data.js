// data.js — load the trophy list and the source registry from app/data/*.json (local files, never the network).
export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const doc = await response.json();
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  return trophies.map((t, i) => ({ ...t, id: t.id ?? i + 1 }));
}

// Load the guide-source registry (app/data/sources.json):
//   { "sources": [{ "id": 1, "name": "PowerPyx — GTA 6 Trophy Guide", "url": "https://…",
//                  "note": "full page read", "trophies_covered": 55 }, …] }
// Ids 1–5 are the written guides, 6 is the Exophase official list, 7 is PSNProfiles.
// Returns the sources array, or null when the file is missing, unreadable or empty.
// Callers MUST fall back to each trophy's own `sources` [{ name, url }] array when this is null.
// This function never throws.
export async function loadSources() {
  try {
    const response = await fetch('data/sources.json');
    if (!response.ok) return null;
    const doc = await response.json();
    const list = Array.isArray(doc) ? doc : doc.sources;
    if (!Array.isArray(list) || !list.length) return null;
    return list.map((s, i) => ({ ...s, id: s.id ?? i + 1 }));
  } catch {
    return null;
  }
}

export function gradeOrder(grade) {
  return { platinum: 0, gold: 1, silver: 2, bronze: 3 }[grade] ?? 4;
}

export function roadmapSort(a, b) {
  return (a.stage - b.stage) || (a.id - b.id);
}
