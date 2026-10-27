import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Sparkles, Trophy, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { MODE_LIST } from "@/lib/modes";
import ModeCard from "@/components/games/ModeCard";

const QUICK_ACTIONS = [
  { to: "/quiz", emoji: "🔮", title: "Personality Quiz", blurb: "Find out your type" },
  { to: "/rooms", emoji: "🎪", title: "Friend Room", blurb: "Play with a code" },
  { to: "/leaderboard", emoji: "🏆", title: "Leaderboard", blurb: "See this week's top vibes" }
];

export default function Home() {
  const { profile } = usePlayer();
  const [daily, setDaily] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    base44.entities.DailyChallenge.filter({ date: today, is_active: true }, { limit: 1 })
      .then((res) => setDaily((res.items || [])[0] || null))
      .catch(() => setDaily(null));
  }, [today]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (profile?.display_name || "friend").split(" ")[0];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-fuchsia-300/80">{greeting}</p>
        <h1 className="font-display text-[2.6rem] font-black leading-[0.95] text-white sm:text-5xl">
          Hey {firstName},<br />
          <span className="text-vibe">what's your vibe?</span>
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Answer ridiculous questions, roast your friends, discover your personality type.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2">
          <span className="text-base">✨</span>
          <div>
            <p className="font-display text-sm font-bold leading-none text-white">{profile?.points ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">points</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <div>
            <p className="font-display text-sm font-bold leading-none text-white">{profile?.streak ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">day streak</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2">
          <Trophy className="h-4 w-4 text-fuchsia-400" />
          <div>
            <p className="font-display text-sm font-bold leading-none text-white">{profile?.wins ?? 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">round wins</p>
          </div>
        </div>
      </div>

      <Link
        to="/daily"
        className="relative block overflow-hidden rounded-[2rem] border border-white/15 p-6 vibe-gradient glow-purple transition-transform duration-300 hover:-translate-y-0.5"
      >
        <div className="absolute inset-0 bg-black/25" />
        <div className="pointer-events-none absolute -right-4 -top-6 text-[6rem] opacity-25 animate-floaty">✨</div>
        <div className="relative">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-white/90">
            <Sparkles className="h-3 w-3" /> Daily vibe
          </p>
          <h2 className="mt-2 max-w-sm font-display text-2xl font-black leading-tight text-white">
            {daily ? daily.text : "Today's challenge is warming up"}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-white/85">
            {daily?.hint || "One question a day. Keep the streak alive."}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-bold text-white">
            {daily ? "Answer & earn 25 pts" : "See today's board"}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl font-extrabold text-white">Pick your poison</h2>
          <Link to="/games" className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200">
            All games
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODE_LIST.map((mode) => (
            <ModeCard key={mode.key} mode={mode} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold text-white">More ways to play</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              <span className="text-2xl">{action.emoji}</span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-white">{action.title}</p>
                <p className="truncate text-xs text-muted-foreground">{action.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/rooms"
        className="flex items-center justify-between rounded-2xl border border-dashed border-fuchsia-400/30 bg-fuchsia-500/5 px-5 py-4"
      >
        <span className="flex items-center gap-2 text-sm text-white/90">
          <Users className="h-4 w-4 text-fuchsia-300" /> Have a room code from a friend?
        </span>
        <ArrowRight className="h-4 w-4 text-fuchsia-300" />
      </Link>
    </div>
  );
}