import React, { useEffect, useState } from "react";
import { Crown, Loader2, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { cn } from "@/lib/utils";

function weekStartIso() {
  const now = new Date();
  const day = (now.getUTCDay() + 6) % 7;
  const monday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day, 0, 0, 0)
  );
  return monday.toISOString();
}

export default function Leaderboard() {
  const { user, profile } = usePlayer();
  const [tab, setTab] = useState("week");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const profilesRes = await base44.entities.PlayerProfile.list({ limit: 100 });
        const profiles = profilesRes.items || [];
        const byUserId = {};
        profiles.forEach((p) => {
          byUserId[p.user_id] = p;
        });

        if (tab === "week") {
          const { rows: totals } = await base44.entities.PointsEvent.aggregate({
            query: { created_date: { $gte: weekStartIso() } },
            groupBy: "user_id",
            sum: ["amount"]
          });
          const mapped = (totals || [])
            .map((row) => {
              const match = byUserId[row.user_id];
              return {
                user_id: row.user_id,
                name: match?.display_name || "Vibe Player",
                avatar: match?.avatar || "🦄",
                points: Math.round(row.sum_amount || 0)
              };
            })
            .filter((row) => row.points > 0)
            .sort((a, b) => b.points - a.points);
          if (alive) setRows(mapped);
        } else {
          const sorted = profiles
            .slice()
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .map((p) => ({
              user_id: p.user_id,
              name: p.display_name,
              avatar: p.avatar || "🦄",
              points: p.points || 0
            }));
          if (alive) setRows(sorted);
        }
      } catch (err) {
        if (alive) setError(err.message || "Could not load the leaderboard.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tab]);

  const myRank = rows.findIndex((row) => row.user_id === user?.id);
  const myRow = myRank >= 0 ? rows[myRank] : null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-fuchsia-300/80">Leaderboard</p>
        <h1 className="font-display text-4xl font-black leading-none text-white">Top vibes only</h1>
      </header>

      <div className="flex gap-2">
        {[
          { key: "week", label: "This week" },
          { key: "all", label: "All time" }
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setTab(option.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold transition",
              tab === option.key
                ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {myRow && (
        <div className="flex items-center justify-between rounded-3xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{myRow.avatar}</span>
            <div>
              <p className="font-display text-sm font-bold text-white">You're #{myRank + 1}</p>
              <p className="text-[11px] text-fuchsia-200/80">{profile?.display_name}</p>
            </div>
          </div>
          <p className="font-display text-lg font-black text-white">{myRow.points}</p>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] py-20">
          <Loader2 className="h-6 w-6 animate-spin text-fuchsia-300" />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/15 p-8 text-center">
          <Trophy className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 font-display font-bold text-white">No scores {tab === "week" ? "this week" : "yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Play a round or answer the daily challenge to put yourself on the board.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li
              key={row.user_id}
              className={cn(
                "flex items-center justify-between rounded-2xl border px-4 py-3",
                row.user_id === user?.id
                  ? "border-fuchsia-400/40 bg-fuchsia-500/10"
                  : "border-white/10 bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-display text-sm font-black text-muted-foreground">
                  {index === 0 ? <Crown className="h-4 w-4 text-amber-300" /> : index + 1}
                </span>
                <span className="text-xl">{row.avatar}</span>
                <span className="font-display text-sm font-bold text-white">
                  {row.name}
                  {row.user_id === user?.id && <span className="ml-1.5 text-[10px] text-fuchsia-300">you</span>}
                </span>
              </div>
              <span className="font-display text-sm font-black text-white">{row.points}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Points come from games, daily challenges, quizzes and rooms. Each action only counts once.
      </p>
    </div>
  );
}