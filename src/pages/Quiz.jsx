import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { QUIZ_QUESTIONS, RESULTS, TRAITS, computeResult } from "@/lib/personality";
import { cn } from "@/lib/utils";

export default function Quiz() {
  const { user, refresh } = usePlayer();
  const [stage, setStage] = useState("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [resultKey, setResultKey] = useState(null);
  const [scores, setScores] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    base44.entities.PersonalityResult.filter({ user_id: user.id }, { sort: "-created_date", limit: 1 })
      .then((res) => setPrevious((res.items || [])[0] || null))
      .catch(() => setPrevious(null));
  }, [user]);

  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[step];

  const start = () => {
    setStage("playing");
    setStep(0);
    setAnswers([]);
    setResultKey(null);
    setScores(null);
    setError("");
  };

  const choose = async (trait) => {
    const nextAnswers = answers.concat([trait]);
    if (step + 1 < total) {
      setAnswers(nextAnswers);
      setStep(step + 1);
      return;
    }
    const computed = computeResult(nextAnswers);
    setAnswers(nextAnswers);
    setResultKey(computed.resultKey);
    setScores(computed.scores);
    setStage("result");
    setSaving(true);
    try {
      await base44.entities.PersonalityResult.create({
        user_id: user.id,
        result_key: computed.resultKey,
        result_title: RESULTS[computed.resultKey].title,
        emoji: RESULTS[computed.resultKey].emoji,
        scores: computed.scores,
        answers: nextAnswers
      });
      await base44.functions.invoke("awardPoints", { action: "quiz" }).catch(() => null);
      await refresh();
      const res = await base44.entities.PersonalityResult.filter(
        { user_id: user.id },
        { sort: "-created_date", limit: 1 }
      );
      setPrevious((res.items || [])[0] || null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not save your result.");
    } finally {
      setSaving(false);
    }
  };

  const result = resultKey ? RESULTS[resultKey] : null;
  const answered = scores ? Object.values(scores).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>

      {stage === "intro" && (
        <>
          <header className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-fuchsia-300/80">Personality quiz</p>
            <h1 className="font-display text-4xl font-black leading-none text-white">
              What's your <span className="text-vibe">actual</span> vibe?
            </h1>
            <p className="text-sm text-muted-foreground">
              {total} quick questions. No wrong answers, only exposing ones.
            </p>
          </header>

          {previous && (
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <span className="text-3xl">{previous.emoji || "🔮"}</span>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Your last result</p>
                <p className="font-display text-base font-bold text-white">{previous.result_title}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={start}
            className="vibe-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display text-base font-bold text-white shadow-lg"
          >
            <Sparkles className="h-4 w-4" /> {previous ? "Take it again" : "Start the quiz"}
          </button>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.values(RESULTS).map((item) => (
              <div key={item.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <span className="text-xl">{item.emoji}</span>
                <p className="mt-1 font-display text-xs font-bold text-white">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">{item.tagline}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {stage === "playing" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <span>
                Question {step + 1} / {total}
              </span>
              <span>{Math.round((step / total) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full vibe-gradient transition-all duration-500"
                style={{ width: `${(step / total) * 100}%` }}
              />
            </div>
          </div>

          <h2 className="animate-pop font-display text-2xl font-black leading-snug text-white sm:text-3xl">
            {question.text}
          </h2>

          <div className="space-y-3">
            {["a", "b"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => choose(question[key].trait)}
                className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-left font-display text-base font-bold text-white transition hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10"
              >
                {question[key].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "result" && result && (
        <div className="space-y-5">
          <div className={cn("relative overflow-hidden rounded-[2rem] border border-white/15 p-7 text-center bg-gradient-to-br", result.color)}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative">
              <span className="text-6xl animate-floaty inline-block">{result.emoji}</span>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/85">You are</p>
              <h1 className="font-display text-3xl font-black text-white">{result.title}</h1>
              <p className="mt-1 font-display text-sm font-bold text-white/90">{result.tagline}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{result.description}</p>

          <div className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Your mix
            </h2>
            {Object.values(TRAITS).map((trait) => {
              const value = scores?.[trait.key] || 0;
              const pct = answered ? Math.round((value / answered) * 100) : 0;
              return (
                <div key={trait.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white">
                      {trait.emoji} {trait.label}
                    </span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full vibe-gradient" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {saving && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving your result…
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
              onClick={start}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-display text-sm font-bold text-white transition hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
            <Link
              to="/leaderboard"
              className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg"
            >
              See the leaderboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}