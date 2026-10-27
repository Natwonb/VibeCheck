import React, { useEffect, useState } from "react";
import { Flame, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import ReportMenu from "@/components/ReportMenu";
import { cn } from "@/lib/utils";

export default function Daily() {
  const today = new Date().toISOString().slice(0, 10);
  const { user, profile, refresh, blockedIds } = usePlayer();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState([]);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  const mine = responses.find((r) => r.user_id === user?.id);

  const loadResponses = async () => {
    const res = await base44.entities.DailyResponse.filter(
      { challenge_date: today },
      { sort: "-votes", limit: 40 }
    );
    setResponses(res.items || []);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.entities.DailyChallenge.filter(
          { date: today, is_active: true },
          { limit: 1 }
        );
        if (alive) setChallenge((res.items || [])[0] || null);
        await loadResponses();
      } catch (err) {
        if (alive) setError(err.message || "Could not load today's challenge.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [today]);

  const submit = async () => {
    const text = answer.trim();
    if (text.length < 3) {
      setError("Give us a little more than that.");
      return;
    }
    setSubmitting(true);
    setError("");
    setFlash("");
    try {
      await base44.entities.DailyResponse.create({
        challenge_date: today,
        challenge_text: challenge.text,
        user_id: user?.id,
        display_name: profile?.display_name || "Vibe Player",
        avatar: profile?.avatar || "🦄",
        answer: text.slice(0, 200)
      });
      const { data } = await base44.functions.invoke("awardPoints", { action: "daily" });
      setFlash(
        data?.awarded
          ? `+${data.amount} points · ${data.profile?.streak ?? 1} day streak 🔥`
          : "You already scored today — still a good vibe."
      );
      setAnswer("");
      await loadResponses();
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not post that answer.");
    } finally {
      setSubmitting(false);
    }
  };

  const vote = async (id) => {
    const { data } = await base44.functions.invoke("toggleVote", { kind: "daily", id });
    setResponses((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              votes: data.votes,
              voter_ids: data.voted
                ? (r.voter_ids || []).concat([user.id])
                : (r.voter_ids || []).filter((v) => v !== user.id)
            }
          : r
      )
    );
  };

  const visible = responses.filter((r) => !r.is_hidden && !blockedIds.includes(r.user_id));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-fuchsia-300/80">Daily vibe</p>
        <h1 className="font-display text-4xl font-black leading-none text-white">One question. Every day.</h1>
      </header>

      {loading ? (
        <div className="grid place-items-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] py-20">
          <Loader2 className="h-6 w-6 animate-spin text-fuchsia-300" />
        </div>
      ) : !challenge ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/15 p-8 text-center">
          <p className="text-3xl">🌙</p>
          <p className="mt-2 font-display font-bold text-white">No challenge today yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Today's vibe is being written. Play a game in the meantime.
          </p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 p-6 vibe-gradient glow-purple">
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/85">
                {new Date(today + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric"
                })}
              </p>
              <h2 className="mt-2 font-display text-2xl font-black leading-snug text-white sm:text-3xl">
                {challenge.text}
              </h2>
              {challenge.hint && <p className="mt-2 text-sm text-white/85">{challenge.hint}</p>}
              <p className="mt-3 text-xs font-bold text-white/80">Worth {challenge.points || 25} points</p>
            </div>
          </div>

          {mine ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-fuchsia-300/80">Your answer</p>
              <p className="mt-2 font-display text-lg font-semibold text-white">"{mine.answer}"</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {mine.votes || 0} people vibed with this. Come back tomorrow for a new challenge.
              </p>
            </div>
          ) : (
            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <label className="text-[11px] font-bold uppercase tracking-[0.25em] text-fuchsia-300/80">
                Your answer
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="Be honest. Be funny."
                className="w-full resize-none rounded-2xl border border-white/15 bg-black/30 p-4 text-sm text-white placeholder:text-muted-foreground focus:border-fuchsia-400/60 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{answer.length}/200</span>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit
                </button>
              </div>
            </div>
          )}

          {flash && (
            <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
              {flash}
            </p>
          )}
          {error && (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          <section className="space-y-3">
            <h2 className="font-display text-lg font-extrabold text-white">Today's most popular</h2>
            {visible.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-white/15 p-6 text-center text-sm text-muted-foreground">
                Nobody has answered yet. Be the first vibe.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {visible.map((r, i) => {
                  const voted = (r.voter_ids || []).includes(user?.id);
                  return (
                    <li
                      key={r.id}
                      className="animate-pop flex items-start gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className="font-display text-sm font-black text-muted-foreground">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-semibold text-white">"{r.answer}"</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {r.avatar || "🦄"} {r.display_name || "Anonymous"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => vote(r.id)}
                          className={cn(
                            "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                            voted
                              ? "border-orange-400/60 bg-orange-500/20 text-orange-200"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                          )}
                        >
                          <Flame className={cn("h-3 w-3", voted && "text-orange-300")} />
                          {r.votes || 0}
                        </button>
                        <ReportMenu
                          targetType="DailyResponse"
                          targetId={r.id}
                          targetLabel={r.answer}
                          authorId={r.user_id}
                          authorName={r.display_name}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}