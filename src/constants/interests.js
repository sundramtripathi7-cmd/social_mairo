export const INTERESTS = [
  { id: "coding", label: "Coding" },
  { id: "ai", label: "AI" },
  { id: "gaming", label: "Gaming" },
  { id: "music", label: "Music" },
  { id: "movies", label: "Movies" },
  { id: "anime", label: "Anime" },
  { id: "cricket", label: "Cricket" },
  { id: "football", label: "Football" },
  { id: "fitness", label: "Fitness" },
  { id: "reading", label: "Reading" },
  { id: "photography", label: "Photography" },
  { id: "travel", label: "Travel" },
  { id: "food", label: "Food" },
  { id: "startups", label: "Startups" },
  { id: "dance", label: "Dance" },
  { id: "memes", label: "Memes" },
];

export const MAX_INTERESTS = 8;

export function matchPercent(mine = [], theirs = []) {
  if (!mine.length || !theirs.length) {
    return 0;
  }

  const theirSet = new Set(theirs);
  let shared = 0;

  for (const id of mine) {
    if (theirSet.has(id)) {
      shared += 1;
    }
  }

  return Math.round((shared / mine.length) * 100);
}
