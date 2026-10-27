import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, Check, Loader2, LogOut, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { AVATARS } from "@/lib/avatars";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { user, profile, saveProfile, unblockUser } = usePlayer();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🦄");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setAvatar(profile.avatar || "🦄");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    base44.entities.UserBlock.filter({ blocker_id: user.id }, { limit: 50 })
      .then((res) => setBlocks(res.items || []))
      .catch(() => setBlocks([]));
  }, [user]);

  const save = async () => {
    const clean = name.trim().slice(0, 24);
    if (clean.length < 2) {
      setError("Pick a display name with at least 2 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setFlash("");
    try {
      await saveProfile({ display_name: clean, avatar });
      setFlash("Saved. Looking good.");
    } catch (err) {
      setError(err.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: "Points", value: profile?.points ?? 0 },
    { label: "Games", value: profile?.games_played ?? 0 },
    { label: "Wins", value: profile?.wins ?? 0 },
    { label: "Streak", value: profile?.streak ?? 0 }
  ];

  const unlocked = profile?.achievements || [];

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
          {avatar}
        </span>
        <div>
          <h1 className="font-display text-2xl font-black text-white">{profile?.display_name || "Your profile"}</h1>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
            <p className="font-display text-lg font-black text-white">{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
        <h2 className="font-display text-lg font-extrabold text-white">Edit profile</h2>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 font-display text-base font-bold text-white focus:border-fuchsia-400/60 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Avatar</p>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAvatar(option)}
                className={cn(
                  "grid aspect-square place-items-center rounded-xl text-lg transition",
                  avatar === option ? "bg-fuchsia-500/25 ring-1 ring-fuchsia-400/60" : "bg-white/5 hover:bg-white/10"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save changes
        </button>
        {flash && <p className="text-xs font-semibold text-emerald-300">{flash}</p>}
        {error && <p className="text-xs font-semibold text-rose-300">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-white">Achievements</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlocked.includes(achievement.key);
            return (
              <div
                key={achievement.key}
                className={cn(
                  "rounded-2xl border p-3 transition",
                  isUnlocked
                    ? "border-fuchsia-400/40 bg-fuchsia-500/10"
                    : "border-white/10 bg-white/[0.02] opacity-55"
                )}
              >
                <span className="text-xl">{achievement.emoji}</span>
                <p className="mt-1 font-display text-xs font-bold text-white">{achievement.title}</p>
                <p className="text-[10px] text-muted-foreground">{achievement.blurb}</p>
              </div>
            );
          })}
        </div>
      </section>

      {blocks.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-extrabold text-white">Blocked players</h2>
          {blocks.map((block) => (
            <div
              key={block.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm text-white">
                <Ban className="h-3.5 w-3.5 text-rose-300" /> {block.blocked_name || "Player"}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await unblockUser(block.blocked_id);
                  setBlocks((prev) => prev.filter((b) => b.id !== block.id));
                }}
                className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200"
              >
                Unblock
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-display text-lg font-extrabold text-white">Settings</h2>
        {user?.role === "admin" && (
          <Link
            to="/admin"
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white"
          >
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-fuchsia-300" /> Admin tools
            </span>
            <span className="text-xs text-muted-foreground">Questions & reports</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => base44.auth.logout()}
          className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-muted-foreground transition hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>

      <p className="text-center text-[11px] text-muted-foreground">
        Your email is never shown to other players. Only your display name and avatar appear on the leaderboard.
      </p>
    </div>
  );
}