import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { modeBySlug } from "@/lib/modes";
import ChoiceOptions from "@/components/games/ChoiceOptions";
import TakeList from "@/components/games/TakeList";

const PERSONA_EMOJI = { a: "🧃", b: "👹", c: "😎", d: "🎲" };

export default function GameMode() {
  const { mode: slug } = useParams();
  const mode = modeBySlug(slug);
  const { user, profile, blockedIds, refresh } = usePlayer();

  const [question, setQuestion] = useState(null);
  const [seen, setSeen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);
  const [counts, setCounts] = useState(null);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [takes, setTakes] = useState([]);
  const [takeText, setTakeText] = useState("");
  const [posting, setPosting] = useState(false);

  const loadTakes = async (questionId) => {
    const res = await base44.entities.TakeSubmission.filter(
      { question_id: questionId },
      { sort: "-votes", limit: 30 }
    );
    setTakes(res.items || []);
  };

  const loadQuestion = useCallback(
    async (exclude = []) => {
      setLoading(true);
      setError("");
      setFlash("");
      setPicked(null);
      try {
        const res = await base44.entities.Question.filter(
          { mode: mode.key, is_active: true },
          { limit: 100 }
        );
        const all = res.items || [];
        let pool = all.filter((q) => !exclude.includes(q.id));
        if (!pool.length) pool = all;
        if (!pool.length) {
          setQuestion(null);
          return;
        }
        const next = pool[Math.floor(Math.random() * pool.length)];
        setQuestion(next);
        setCounts({
          a: next.votes_a || 0,
          b: next.votes_b || 0,
          c: next.votes_c || 0,
          d: next.votes_d || 0
        });
        setSeen((prev) => prev.concat([next.id]));
        setTakeText("");
        if (next.mode === "hot_take") await loadTakes(next.id);
      } catch (err) {
        setError(err.message || "Could not load a question.");
      } finally {
        setLoading(false);
      }
    },
    [mode?.key]
  );

  useEffect(() => {
    if (mode) loadQuestion(seen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode?.key]);

  if (!mode) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm text-muted-foreground">That game mode doesn't exist.</p>
        <Link to="/games" className="mt-3 inline-block text-sm font-semibold text-fuchsia-300">
          Back to games
        </Link>
      </div>
    );
  }

  const options = ["a", "b", "c", "d"]
    .map((key) => ({
      key,
      label: question?.[`option_${key}`],
      emoji: question?.mode === "most_likely" ? PERSONA_EMOJI[key] : ""
    }))
    .filter((opt) => opt.label);

  const pick = async (choice) => {
    if (picked || !question) return;
    setPicked(choice);
    setError("");
    try {
      const { data } = await base44.functions.invoke("submitSoloAnswer", {
        questionId: question.id,
        choice
      });
      setCounts(data.counts);
      setFlash(data.awarded ? `+${data.amount} points` : "Already played this one — no double points");
      if (data.awarded) await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not save that answer.");
    }
  };

  const postTake = async () => {
    const text = takeText.trim();
    if (text.length < 3) {
      setError("Write a little more first.");
      return;
    }
    setPosting(true);
    setError("");
    try {
      await base44.entities.TakeSubmission.create({
        question_id: question.id,
        question_text: question.text,
        user_id: user?.id,
        display_name: profile?.display_name || "Vibe Player",
        text: text.slice(0, 220)
      });
      const { data } = await base44.functions.invoke("awardPoints", {
        action: "take",
        questionId: question.id
      });
      setFlash(data?.awarded ? `+${data.amount} points` : "One scored take per question — but still posted!");
      setTakeText("");
      await loadTakes(question.id);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not post that take.");
    } finally {
      setPosting(false);
    }
  };

  const voteTake = async (id) => {
    const { data } = await base44.functions.invoke("toggleVote", { kind: "take", id });
    setTakes((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              votes: data.votes,
              voter_ids: data.voted
                ? (t.voter_ids || []).concat([user.id])
                : (t.voter_ids || []).filter((v) => v !== user.id)
            }
          : t
      )
    );
  };

  return (
    <div className="space-y-6">
      <Link to="/games" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> All games
      </Link>

      <header className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{mode.emoji}</span>
          <h1 className="font-display text-2xl font-black text-white">{mode.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{mode.how}</p>
      </header>

      {loading && (
        <div className="grid place-items-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] py-20">
          <Loader2 className="h-6 w-6 animate-spin text-fuchsia-300" />
        </div>
      )}

      {!loading && !question && (
        <div className="rounded-[1.75rem] border border-dashed border-white/15 p-8 text-center">
          <p className="text-3xl">🫥</p>
          <p className="mt-2 font-display font-bold text-white">This deck is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">An admin can add questions from the admin panel.</p>
        </div>
      )}

      {!loading && question && (
        <>
          <div className="animate-pop relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.05] p-6">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-300/80">Your prompt</p>
            <h2 className="mt-2 font-display text-2xl font-black leading-snug text-white sm:text-3xl">
              {question.text}
            </h2>
          </div>

          {question.mode === "hot_take" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <textarea
                  value={takeText}
                  onChange={(e) => setTakeText(e.target.value.slice(0, 220))}
                  rows={3}
                  placeholder="Say the thing…"
                  className="w-full resize-none rounded-3xl border border-white/15 bg-black/30 p-4 text-sm text-white placeholder:text-muted-foreground focus:border-fuchsia-400/60 focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{takeText.length}/220</span>
                  <button
                    type="button"
                    onClick={postTake}
                    disabled={posting}
                    className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post take 👏"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Top takes
                  </h3>
                  <button
                    type="button"
                    onClick={() => loadTakes(question.id)}
                    className="inline-flex items-center gap-1 text-xs text-fuchsia-300"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>
                <TakeList
                  takes={takes}
                  currentUserId={user?.id}
                  blockedIds={blockedIds}
                  onVote={voteTake}
                />
              </div>
            </div>
          ) : (
            <ChoiceOptions options={options} counts={counts} picked={picked} onPick={pick} />
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

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => loadQuestion(seen)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Next question <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-5 py-2.5 text-sm font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/20"
            >
              🎪 Play this with friends
            </Link>
          </div>
        </>
      )}
    </div>
  );
}