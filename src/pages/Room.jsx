import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Copy, Crown, Loader2, Play, Trophy, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { modeByKey } from "@/lib/modes";
import RoomPlay from "@/components/rooms/RoomPlay";
import { cn } from "@/lib/utils";

export default function Room() {
  const { code } = useParams();
  const { user, profile, refresh } = usePlayer();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadAnswers = useCallback(async (roomId) => {
    const res = await base44.entities.RoomAnswer.filter(
      { room_id: roomId },
      { sort: "-created_date", limit: 200 }
    );
    setAnswers(res.items || []);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.entities.GameRoom.filter(
          { code: String(code || "").toUpperCase() },
          { limit: 1 }
        );
        const found = (res.items || [])[0];
        if (!found) {
          if (alive) setError("We couldn't find that room. Check the code with your host.");
          return;
        }
        if (!alive) return;
        setRoom(found);
        if ((found.question_ids || []).length) {
          const qres = await base44.entities.Question.filter(
            { id: { $in: found.question_ids } },
            { limit: 20 }
          );
          if (alive) setQuestions(qres.items || []);
        }
        await loadAnswers(found.id);
      } catch (err) {
        if (alive) setError(err.message || "Could not load that room.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code, loadAnswers]);

  useEffect(() => {
    if (!room?.id) return undefined;
    const unsubRoom = base44.entities.GameRoom.subscribe((event) => {
      if (event?.data?.id === room.id) setRoom(event.data);
    });
    const unsubAnswers = base44.entities.RoomAnswer.subscribe((event) => {
      if (event?.data?.room_id === room.id) loadAnswers(room.id);
    });
    return () => {
      if (typeof unsubRoom === "function") unsubRoom();
      if (typeof unsubAnswers === "function") unsubAnswers();
    };
  }, [room?.id, loadAnswers]);

  const isHost = room?.host_id === user?.id;
  const isPlayer = Boolean(room?.players?.some((p) => p.user_id === user?.id));
  const mode = room ? modeByKey(room.mode) : null;
  const currentQuestion = room
    ? questions.find((q) => q.id === (room.question_ids || [])[room.round_index || 0])
    : null;

  const join = async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await base44.functions.invoke("joinRoom", { code: room.code });
      setRoom(data.room);
      await loadAnswers(data.room.id);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not join.");
    } finally {
      setBusy(false);
    }
  };

  const startGame = async () => {
    setBusy(true);
    try {
      const updated = await base44.entities.GameRoom.update(room.id, {
        status: "playing",
        round_index: 0,
        revealed: false
      });
      setRoom(updated);
    } catch (err) {
      setError(err.message || "Could not start the game.");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async (payload) => {
    if (!currentQuestion) return;
    setBusy(true);
    setError("");
    try {
      await base44.entities.RoomAnswer.create({
        room_id: room.id,
        question_id: currentQuestion.id,
        round_index: room.round_index || 0,
        user_id: user.id,
        display_name: profile?.display_name || "Player",
        ...payload
      });
      await base44.functions
        .invoke("awardPoints", {
          action: "room_answer",
          roomId: room.id,
          round: room.round_index || 0
        })
        .catch(() => null);
      await loadAnswers(room.id);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not save your answer.");
    } finally {
      setBusy(false);
    }
  };

  const reveal = async () => {
    setBusy(true);
    try {
      const updated = await base44.entities.GameRoom.update(room.id, { revealed: true });
      setRoom(updated);
    } catch (err) {
      setError(err.message || "Could not reveal results.");
    } finally {
      setBusy(false);
    }
  };

  const nextRound = async () => {
    setBusy(true);
    try {
      const updated = await base44.entities.GameRoom.update(room.id, {
        round_index: (room.round_index || 0) + 1,
        revealed: false
      });
      setRoom(updated);
    } catch (err) {
      setError(err.message || "Could not move to the next question.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("finishRoom", { roomId: room.id });
      setRoom(data.room);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not finish the game.");
    } finally {
      setBusy(false);
    }
  };

  const voteAnswer = async (answerId) => {
    const { data } = await base44.functions.invoke("toggleVote", { kind: "roomAnswer", id: answerId });
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === answerId
          ? {
              ...a,
              votes: data.votes,
              voter_ids: data.voted
                ? (a.voter_ids || []).concat([user.id])
                : (a.voter_ids || []).filter((v) => v !== user.id)
            }
          : a
      )
    );
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      setCopied(false);
    }
  };

  const standings = (() => {
    if (!room) return [];
    const counts = {};
    answers.forEach((a) => {
      if (a.target_name) counts[a.target_name] = (counts[a.target_name] || 0) + 1;
    });
    return (room.players || [])
      .map((p) => ({ ...p, votes: counts[p.display_name] || 0 }))
      .sort((a, b) => b.votes - a.votes);
  })();

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-fuchsia-300" />
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-3xl">🔍</p>
        <p className="font-display font-bold text-white">{error}</p>
        <Link to="/rooms" className="inline-block text-sm font-semibold text-fuchsia-300">
          Back to friend rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/rooms" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Rooms
        </Link>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-display text-sm font-black tracking-[0.25em] text-white transition hover:bg-white/10"
        >
          {room.code}
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>

      <header className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">
          <span>{mode?.emoji}</span> {mode?.title}
        </div>
        <h1 className="font-display text-2xl font-black text-white">
          {room.status === "finished" ? "That's a wrap" : room.status === "lobby" ? "Waiting room" : "Game on"}
        </h1>
        <p className="text-xs text-muted-foreground">
          Host: {room.host_name} · {room.players?.length || 0} player{(room.players?.length || 0) === 1 ? "" : "s"}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(room.players || []).map((player) => (
          <span
            key={player.user_id}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
              player.user_id === user?.id
                ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-white"
                : "border-white/10 bg-white/5 text-muted-foreground"
            )}
          >
            <span>{player.avatar || "🦄"}</span>
            {player.display_name}
          </span>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!isPlayer && room.status !== "finished" && (
        <button
          type="button"
          onClick={join}
          disabled={busy || room.status !== "lobby"}
          className="vibe-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold text-white shadow-lg disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {room.status === "lobby" ? "Join this room" : "This round already started"}
        </button>
      )}

      {room.status === "lobby" && (
        <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-4xl animate-floaty">🎪</p>
          <div>
            <p className="font-display text-lg font-bold text-white">Share the code</p>
            <p className="mt-1 font-display text-3xl font-black tracking-[0.35em] text-vibe">{room.code}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Everyone joins from Friend Rooms → Join with a code.
            </p>
          </div>
          {isHost ? (
            <button
              type="button"
              onClick={startGame}
              disabled={busy}
              className="vibe-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start game ({(room.players || []).length} in)
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Waiting for the host to start…</p>
          )}
        </div>
      )}

      {room.status === "playing" && (
        <RoomPlay
          room={room}
          question={currentQuestion}
          answers={answers}
          isHost={isHost}
          userId={user?.id}
          busy={busy}
          onAnswer={submitAnswer}
          onReveal={reveal}
          onNext={nextRound}
          onFinish={finish}
          onVoteAnswer={voteAnswer}
        />
      )}

      {room.status === "finished" && (
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-white/15 p-6 text-center vibe-gradient glow-purple">
            <div className="mx-auto max-w-md rounded-3xl bg-black/30 p-5">
              <Crown className="mx-auto h-7 w-7 text-amber-300" />
              <p className="mt-2 font-display text-xs font-bold uppercase tracking-[0.25em] text-white/80">
                Most likely
              </p>
              <p className="font-display text-2xl font-black text-white">
                {room.winner_name || "Nobody stood out"}
              </p>
              <p className="mt-1 text-xs text-white/80">Everyone earned room points for playing.</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-white">
              <Trophy className="h-4 w-4 text-amber-300" /> Final board
            </h2>
            {standings.map((player, index) => (
              <div
                key={player.user_id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <span className="flex items-center gap-2 font-display text-sm font-bold text-white">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span className="text-lg">{player.avatar || "🦄"}</span>
                  {player.display_name}
                </span>
                <span className="text-xs font-bold text-fuchsia-300">{player.votes} votes</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/rooms"
              className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg"
            >
              Play again
            </Link>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-display text-sm font-bold text-white"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}