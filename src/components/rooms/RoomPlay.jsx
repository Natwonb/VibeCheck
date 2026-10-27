import React, { useState } from "react";
import { ArrowRight, Check, Crown, Eye, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomPlay({
  room,
  question,
  answers,
  isHost,
  userId,
  busy,
  onAnswer,
  onReveal,
  onNext,
  onFinish,
  onVoteAnswer
}) {
  const [takeText, setTakeText] = useState("");
  const round = room.round_index || 0;
  const roundAnswers = answers.filter((a) => a.round_index === round && !a.is_hidden);
  const myAnswer = roundAnswers.find((a) => a.user_id === userId);
  const players = room.players || [];
  const totalRounds = (room.question_ids || []).length;
  const isLastRound = round >= totalRounds - 1;

  if (!question) {
    return (
      <div className="grid place-items-center rounded-[1.75rem] border border-white/10 bg-white/[0.04] py-16">
        <Loader2 className="h-5 w-5 animate-spin text-fuchsia-300" />
      </div>
    );
  }

  const tallies = {};
  roundAnswers.forEach((a) => {
    const label = room.mode === "would_you_rather" ? a.option : room.mode === "hot_take" ? a.text : a.target_name;
    if (!label) return;
    tallies[label] = (tallies[label] || 0) + 1;
  });
  const ranked = Object.keys(tallies)
    .map((label) => ({ label, count: tallies[label] }))
    .sort((a, b) => b.count - a.count);
  const maxVotes = ranked.length ? ranked[0].count : 0;

  const submitText = () => {
    const text = takeText.trim();
    if (text.length < 3) return;
    onAnswer({ text: text.slice(0, 200) });
    setTakeText("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">
          Round {round + 1} of {totalRounds}
        </span>
        <span>
          {roundAnswers.length}/{players.length} answered
        </span>
      </div>

      <div className="animate-pop relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.05] p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <h2 className="relative font-display text-2xl font-black leading-snug text-white sm:text-3xl">
          {question.text}
        </h2>
      </div>

      {!room.revealed && !myAnswer && (
        <div className="space-y-3">
          {room.mode === "most_likely" && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Who's it going to be?
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {players.map((player) => (
                  <button
                    key={player.user_id}
                    type="button"
                    onClick={() => onAnswer({ target_name: player.display_name, option: player.user_id })}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-left transition hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10"
                  >
                    <span className="text-2xl">{player.avatar || "🦄"}</span>
                    <span className="font-display text-sm font-bold text-white">{player.display_name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {room.mode === "would_you_rather" && (
            <div className="space-y-3">
              {["a", "b"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAnswer({ option: key })}
                  className="flex w-full items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full vibe-gradient font-display text-sm font-black text-white">
                    {key.toUpperCase()}
                  </span>
                  <span className="font-display text-base font-bold text-white">
                    {question[`option_${key}`]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {room.mode === "hot_take" && (
            <div className="space-y-2">
              <textarea
                value={takeText}
                onChange={(e) => setTakeText(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="Drop your take…"
                className="w-full resize-none rounded-3xl border border-white/15 bg-black/30 p-4 text-sm text-white placeholder:text-muted-foreground focus:border-fuchsia-400/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={submitText}
                disabled={busy || takeText.trim().length < 3}
                className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Lock in take
              </button>
            </div>
          )}
        </div>
      )}

      {!room.revealed && myAnswer && (
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Check className="h-3.5 w-3.5" /> Answer locked in
          </p>
          <p className="mt-1 font-display text-base font-semibold text-white">
            {room.mode === "would_you_rather"
              ? question[`option_${myAnswer.option}`]
              : room.mode === "hot_take"
              ? `"${myAnswer.text}"`
              : myAnswer.target_name}
          </p>
          <p className="mt-1 text-xs text-emerald-200/80">
            Waiting for the rest of the room ({roundAnswers.length} of {players.length}).
          </p>
        </div>
      )}

      {room.revealed && (
        <div className="space-y-3">
          {room.mode === "hot_take" ? (
            <ul className="space-y-2.5">
              {roundAnswers
                .slice()
                .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                .map((answer) => {
                  const voted = (answer.voter_ids || []).includes(userId);
                  return (
                    <li
                      key={answer.id}
                      className="flex items-start justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-white">"{answer.text}"</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">— {answer.display_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onVoteAnswer(answer.id)}
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                          voted
                            ? "border-orange-400/60 bg-orange-500/20 text-orange-200"
                            : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                        )}
                      >
                        🔥 {answer.votes || 0}
                      </button>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <div className="space-y-2.5">
              {ranked.length === 0 && (
                <p className="rounded-3xl border border-dashed border-white/15 p-6 text-center text-sm text-muted-foreground">
                  Nobody answered this round.
                </p>
              )}
              {ranked.map((row, index) => (
                <div
                  key={row.label}
                  className="animate-pop relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <span
                    className="absolute inset-y-0 left-0 vibe-gradient opacity-25 transition-all duration-700"
                    style={{ width: `${maxVotes ? (row.count / maxVotes) * 100 : 0}%` }}
                  />
                  <span className="relative flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-white">
                      {index === 0 && <Crown className="h-4 w-4 text-amber-300" />}
                      {row.label}
                    </span>
                    <span className="font-display text-sm font-black text-white">
                      {row.count} vote{row.count === 1 ? "" : "s"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isHost && (
        <div className="flex flex-wrap gap-2.5 border-t border-white/10 pt-4">
          {!room.revealed ? (
            <button
              type="button"
              onClick={onReveal}
              disabled={busy || roundAnswers.length === 0}
              className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg disabled:opacity-50"
            >
              <Eye className="h-4 w-4" /> Reveal results
            </button>
          ) : isLastRound ? (
            <button
              type="button"
              onClick={onFinish}
              disabled={busy}
              className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              Finish game
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={busy}
              className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
            >
              Next question <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {!isHost && room.revealed && (
        <p className="text-center text-xs text-muted-foreground">Waiting for the host to continue…</p>
      )}
    </div>
  );
}