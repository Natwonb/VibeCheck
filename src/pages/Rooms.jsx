import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { MODE_LIST } from "@/lib/modes";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeCode() {
  return Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Rooms() {
  const { user, profile } = usePlayer();
  const navigate = useNavigate();
  const [modeKey, setModeKey] = useState("most_likely");
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [myRooms, setMyRooms] = useState([]);

  useEffect(() => {
    if (!user) return;
    base44.entities.GameRoom.filter({ host_id: user.id }, { sort: "-created_date", limit: 5 })
      .then((res) => setMyRooms(res.items || []))
      .catch(() => setMyRooms([]));
  }, [user]);

  const createRoom = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await base44.entities.Question.filter({ mode: modeKey, is_active: true }, { limit: 100 });
      const ids = shuffle((res.items || []).map((q) => q.id)).slice(0, 8);
      if (!ids.length) {
        setError("No questions for that mode yet. Try another mode.");
        setCreating(false);
        return;
      }
      const code = makeCode();
      const room = await base44.entities.GameRoom.create({
        code,
        mode: modeKey,
        host_id: user.id,
        host_name: profile?.display_name || "Host",
        status: "lobby",
        players: [
          {
            user_id: user.id,
            display_name: profile?.display_name || "Host",
            avatar: profile?.avatar || "🦄"
          }
        ],
        question_ids: ids,
        round_index: 0,
        revealed: false
      });
      await base44.functions
        .invoke("awardPoints", { action: "room_create", roomId: room.id })
        .catch(() => null);
      navigate(`/rooms/${room.code}`);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not create that room.");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Enter the code your host gave you.");
      return;
    }
    setJoining(true);
    setError("");
    try {
      const { data } = await base44.functions.invoke("joinRoom", { code });
      navigate(`/rooms/${data.room.code}`);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not join that room.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-fuchsia-300/80">Friend rooms</p>
        <h1 className="font-display text-4xl font-black leading-none text-white">Bring the group chat</h1>
        <p className="text-sm text-muted-foreground">
          Create a room, share the code, and vote on each other in real time.
        </p>
      </header>

      <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-fuchsia-500/15 text-base">🎪</span>
          <h2 className="font-display text-lg font-extrabold text-white">Create a room</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {MODE_LIST.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => setModeKey(mode.key)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold transition",
                modeKey === mode.key
                  ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
              )}
            >
              {mode.emoji} {mode.short}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={createRoom}
          disabled={creating}
          className="vibe-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Create room & get a code
        </button>
      </section>

      <section className="space-y-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/15 text-base">🔑</span>
          <h2 className="font-display text-lg font-extrabold text-white">Join with a code</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC12"
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 font-display text-lg font-black tracking-[0.3em] text-white placeholder:text-muted-foreground/60 focus:border-fuchsia-400/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={joinRoom}
            disabled={joining}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 font-display text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
          >
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Join
          </button>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {myRooms.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="font-display text-lg font-extrabold text-white">Your recent rooms</h2>
          {myRooms.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.code}`}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-white/25"
            >
              <div>
                <p className="font-display text-sm font-bold tracking-widest text-white">{room.code}</p>
                <p className="text-[11px] capitalize text-muted-foreground">
                  {room.mode.replace(/_/g, " ")} · {room.status}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-fuchsia-300" />
            </Link>
          ))}
        </section>
      )}

      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-muted-foreground">
        Rooms are turn-based: everyone answers the same question, then the host reveals the results. Up to 12 players
        per room. Only you can edit your own answers.
      </p>
    </div>
  );
}