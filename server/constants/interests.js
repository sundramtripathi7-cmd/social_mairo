const INTEREST_IDS = [
  "coding",
  "ai",
  "gaming",
  "music",
  "movies",
  "anime",
  "cricket",
  "football",
  "fitness",
  "reading",
  "photography",
  "travel",
  "food",
  "startups",
  "dance",
  "memes",
];

const INTEREST_SET = new Set(INTEREST_IDS);
const MAX_INTERESTS = 8;

function cleanInterests(value) {
  if (!Array.isArray(value)) {
    return {
      error: "Interests must be a list.",
    };
  }

  const unique = [];

  for (const item of value) {
    const id = String(item || "")
      .trim()
      .toLowerCase();

    if (!INTEREST_SET.has(id)) {
      return {
        error: "Choose interests from the list.",
      };
    }

    if (!unique.includes(id)) {
      unique.push(id);
    }
  }

  if (unique.length > MAX_INTERESTS) {
    return {
      error: `Choose up to ${MAX_INTERESTS} interests.`,
    };
  }

  return { interests: unique };
}

module.exports = {
  INTEREST_IDS,
  MAX_INTERESTS,
  cleanInterests,
};
