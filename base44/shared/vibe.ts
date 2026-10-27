export const POINTS = {
  solo: 10,
  take: 10,
  daily: 25,
  quiz: 20,
  room_answer: 5,
  room_create: 15,
  room: 50
};

export const ACHIEVEMENTS = [
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

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayKey() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function earnedAchievements(profile) {
  const p = profile || {};
  const keys = [];
  if ((p.games_played || 0) >= 1) keys.push("first_game");
  if ((p.rooms_hosted || 0) >= 1) keys.push("party_host");
  if ((p.wins || 0) >= 1) keys.push("crowd_favorite");
  if ((p.points || 0) >= 100) keys.push("rookie");
  if ((p.points || 0) >= 500) keys.push("pro");
  if ((p.points || 0) >= 1000) keys.push("legend");
  if ((p.streak || 0) >= 3) keys.push("daily_three");
  if ((p.quizzes || 0) >= 1) keys.push("open_book");
  if ((p.takes || 0) >= 5) keys.push("hot_take_hero");
  return keys;
}

export async function getOrCreateProfile(base44, user) {
  const existing = await base44.asServiceRole.entities.PlayerProfile.filter(
    { user_id: user.id },
    { limit: 1 }
  );
  if (existing.items && existing.items.length) return existing.items[0];
  const fallbackName = (user.full_name || (user.email ? user.email.split("@")[0] : "") || "Vibe Player").slice(0, 24);
  return await base44.asServiceRole.entities.PlayerProfile.create({
    user_id: user.id,
    display_name: fallbackName,
    avatar: "🦄",
    points: 0
  });
}

export async function grantPoints(base44, user, { action, actionKey, amount, patch }) {
  const sr = base44.asServiceRole.entities;
  const already = await sr.PointsEvent.filter(
    { user_id: user.id, action_key: actionKey },
    { limit: 1 }
  );
  if (already.items && already.items.length) {
    const profile = await getOrCreateProfile(base44, user);
    return { awarded: false, amount: 0, total: profile.points || 0, profile, newAchievements: [] };
  }

  const profile = await getOrCreateProfile(base44, user);
  await sr.PointsEvent.create({
    user_id: user.id,
    display_name: profile.display_name,
    action,
    action_key: actionKey,
    amount
  });

  const extra = patch || {};
  const next = {
    points: (profile.points || 0) + amount,
    games_played: (profile.games_played || 0) + (extra.games_played || 0),
    wins: (profile.wins || 0) + (extra.wins || 0),
    rooms_hosted: (profile.rooms_hosted || 0) + (extra.rooms_hosted || 0),
    quizzes: (profile.quizzes || 0) + (extra.quizzes || 0),
    takes: (profile.takes || 0) + (extra.takes || 0),
    streak: profile.streak || 0
  };

  if (action === "daily") {
    next.streak = profile.last_daily_date === yesterdayKey() ? (profile.streak || 0) + 1 : 1;
    next.last_daily_date = todayKey();
  }

  const earned = earnedAchievements(next);
  const known = profile.achievements || [];
  const newAchievements = earned.filter((k) => !known.includes(k));
  next.achievements = Array.from(new Set(known.concat(newAchievements)));

  const updatedProfile = await sr.PlayerProfile.update(profile.id, next);
  return { awarded: true, amount, total: next.points, profile: updatedProfile, newAchievements };
}