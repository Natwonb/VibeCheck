export const ALL_ACHIEVEMENTS = [
  { key: "first_game", title: "First Vibes", emoji: "🎉", blurb: "Played your first game" },
  { key: "party_host", title: "Party Host", emoji: "🎪", blurb: "Hosted a friend room" },
  { key: "crowd_favorite", title: "Crowd Favorite", emoji: "🏆", blurb: "Won a room round" },
  { key: "rookie", title: "Vibe Rookie", emoji: "🌱", blurb: "Earned 100 points" },
  { key: "pro", title: "Vibe Pro", emoji: "⚡", blurb: "Earned 500 points" },
  { key: "legend", title: "Vibe Legend", emoji: "👑", blurb: "Earned 1,000 points" },
  { key: "daily_three", title: "Daily Devotee", emoji: "🔥", blurb: "Kept a 3 day streak" },
  { key: "open_book", title: "Open Book", emoji: "🔮", blurb: "Finished the personality quiz" },
  { key: "hot_take_hero", title: "Hot Take Hero", emoji: "🌶️", blurb: "Posted 5 hot takes" }
];

export function achievementByKey(key) {
  return ALL_ACHIEVEMENTS.find((a) => a.key === key);
}