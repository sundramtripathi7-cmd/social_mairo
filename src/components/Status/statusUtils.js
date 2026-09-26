export const STATUS_BACKGROUNDS = [
  "#075e54",
  "#0b6e4f",
  "#123524",
  "#1b4332",
  "#1a365d",
  "#1e3a5f",
  "#312e81",
  "#4a1942",
  "#7f1d1d",
  "#7c2d12",
  "#3f3f46",
  "#111b21",
];

export const STATUS_DURATION_MS = 5000;

export function userIdOf(user) {
  return String(user?.id || user?._id || "");
}

export function authorIdOf(post) {
  const author = post?.author || {};

  return String(author._id || author.id || "");
}

export function formatTimeAgo(value) {
  if (!value) {
    return "";
  }

  const diff = Date.now() - new Date(value).getTime();

  if (diff < 60 * 1000) {
    return "Just now";
  }

  const minutes = Math.floor(diff / (60 * 1000));

  if (minutes < 60) {
    return minutes === 1
      ? "1 minute ago"
      : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return hours === 1
      ? "1 hour ago"
      : `${hours} hours ago`;
  }

  return "Yesterday";
}

export function statusFontSize(text) {
  const length = (text || "").trim().length;

  if (length <= 30) {
    return "2.5rem";
  }

  if (length <= 80) {
    return "1.9rem";
  }

  if (length <= 160) {
    return "1.4rem";
  }

  return "1.12rem";
}

export function groupStatuses(posts) {
  const sorted = [...posts].sort(
    (a, b) =>
      new Date(a.createdAt) - new Date(b.createdAt)
  );

  const map = new Map();

  sorted.forEach((post) => {
    const authorId = authorIdOf(post);

    if (!authorId) {
      return;
    }

    if (!map.has(authorId)) {
      map.set(authorId, {
        authorId,
        author: post.author || {},
        statuses: [],
      });
    }

    map.get(authorId).statuses.push(post);
  });

  return [...map.values()].sort((a, b) => {
    const aTime = new Date(
      a.statuses[a.statuses.length - 1].createdAt
    );
    const bTime = new Date(
      b.statuses[b.statuses.length - 1].createdAt
    );

    return bTime - aTime;
  });
}

export function unseenCount(statuses) {
  return statuses.filter((status) => !status.viewedByMe)
    .length;
}

export function firstUnseenIndex(statuses) {
  const index = statuses.findIndex(
    (status) => !status.viewedByMe
  );

  return index === -1 ? 0 : index;
}

/*
  Segmented ring: seen updates are grey, new ones are green.
  Segments start at the top and follow oldest to newest.
*/
export function ringGradient(statusCount, unseen) {
  if (statusCount <= 1) {
    return "";
  }

  const gap = Math.min(16, 48 / statusCount);
  const segment =
    (360 - gap * statusCount) / statusCount;
  const viewedCount = Math.max(
    0,
    statusCount - unseen
  );
  const stops = [];
  let angle = 0;

  for (let index = 0; index < statusCount; index += 1) {
    const color =
      index < viewedCount ? "#8696a0" : "#25d366";

    stops.push(
      `${color} ${angle}deg ${angle + segment}deg`
    );

    angle += segment;

    stops.push(
      `transparent ${angle}deg ${angle + gap}deg`
    );

    angle += gap;
  }

  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}
