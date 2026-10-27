export const MODES = {
  "most-likely": {
    key: "most_likely",
    slug: "most-likely",
    title: "Who Is Most Likely To?",
    short: "Most Likely",
    emoji: "🫵",
    tagline: "Point the finger. Blame your friends.",
    how: "Everyone votes for a person. The most votes wins the round."
  },
  "would-you-rather": {
    key: "would_you_rather",
    slug: "would-you-rather",
    title: "Would You Rather?",
    short: "Would You Rather",
    emoji: "🤔",
    tagline: "Two cursed choices. Pick one.",
    how: "Choose between two wild options, then see how everyone else voted."
  },
  "hot-takes": {
    key: "hot_take",
    slug: "hot-takes",
    title: "Hot Takes",
    short: "Hot Takes",
    emoji: "🌶️",
    tagline: "Say the thing everyone is thinking.",
    how: "Drop your spiciest answer, then vote for the best takes."
  }
};

export const MODE_LIST = Object.values(MODES);

export function modeByKey(key) {
  return MODE_LIST.find((m) => m.key === key) || MODE_LIST[0];
}

export function modeBySlug(slug) {
  return MODES[slug] || null;
}

export const PERSONAS = [
  { key: "a", label: "The Group Mom", emoji: "🧃" },
  { key: "b", label: "The Chaos Gremlin", emoji: "👹" },
  { key: "c", label: "The Smooth Talker", emoji: "😎" },
  { key: "d", label: "The Wildcard", emoji: "🎲" }
];