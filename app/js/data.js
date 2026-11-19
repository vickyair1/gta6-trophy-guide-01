// data.js — load the trophy list from app/data/trophies.json (a local file, never the network).
export async function loadTrophies() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const doc = await response.json();
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  return trophies.map((t, i) => ({ ...t, id: t.id ?? i + 1 }));
}

export function gradeOrder(grade) {
  return { platinum: 0, gold: 1, silver: 2, bronze: 3 }[grade] ?? 4;
}

export function roadmapSort(a, b) {
  return (a.stage - b.stage) || (a.id - b.id);
}
