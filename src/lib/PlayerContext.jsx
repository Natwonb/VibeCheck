import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_AVATAR } from "@/lib/avatars";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [blockedIds, setBlockedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const identify = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    const res = await base44.entities.PlayerProfile.filter({ user_id: me.id }, { limit: 1 });
    let existing = res.items && res.items[0];
    if (!existing) {
      existing = await base44.entities.PlayerProfile.create({
        user_id: me.id,
        display_name: (me.full_name || "Vibe Player").slice(0, 24),
        avatar: DEFAULT_AVATAR,
        points: 0
      });
    }
    setProfile(existing);
    const blocks = await base44.entities.UserBlock.filter({ blocker_id: me.id }, { limit: 100 });
    setBlockedIds((blocks.items || []).map((b) => b.blocked_id));
    return existing;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await identify();
      } catch (error) {
        // Not signed in yet — the app shell handles the redirect.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [identify]);

  const refresh = useCallback(async () => {
    if (!user) return null;
    const res = await base44.entities.PlayerProfile.filter({ user_id: user.id }, { limit: 1 });
    const fresh = res.items && res.items[0];
    if (fresh) setProfile(fresh);
    return fresh || null;
  }, [user]);

  const saveProfile = useCallback(
    async (patch) => {
      if (!profile) return null;
      const updated = await base44.entities.PlayerProfile.update(profile.id, patch);
      setProfile(updated);
      return updated;
    },
    [profile]
  );

  const blockUser = useCallback(
    async (blockedId, blockedName) => {
      if (!user || !blockedId) return;
      await base44.entities.UserBlock.create({
        blocker_id: user.id,
        blocked_id: blockedId,
        blocked_name: blockedName || "Player"
      });
      setBlockedIds((prev) => (prev.includes(blockedId) ? prev : prev.concat([blockedId])));
    },
    [user]
  );

  const unblockUser = useCallback(
    async (blockedId) => {
      if (!user) return;
      const res = await base44.entities.UserBlock.filter(
        { blocker_id: user.id, blocked_id: blockedId },
        { limit: 10 }
      );
      await Promise.all((res.items || []).map((b) => base44.entities.UserBlock.delete(b.id)));
      setBlockedIds((prev) => prev.filter((id) => id !== blockedId));
    },
    [user]
  );

  const value = {
    user,
    profile,
    loading,
    refresh,
    saveProfile,
    blockedIds,
    blockUser,
    unblockUser
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}