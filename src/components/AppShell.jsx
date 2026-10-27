import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, Gamepad2, Sparkles, Users, User as UserIcon, Trophy, Brain, Shield } from "lucide-react";
import Logo from "@/components/Logo";
import { usePlayer } from "@/lib/PlayerContext";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/daily", label: "Daily", icon: Sparkles },
  { to: "/rooms", label: "Rooms", icon: Users },
  { to: "/profile", label: "Profile", icon: UserIcon }
];

const SIDE_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/daily", label: "Daily Challenge", icon: Sparkles },
  { to: "/rooms", label: "Friend Rooms", icon: Users },
  { to: "/quiz", label: "Personality Quiz", icon: Brain },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profile & Settings", icon: UserIcon }
];

function PointsPill({ points }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      <span className="text-sm">✨</span>
      <span className="font-display text-sm font-bold text-white">{points ?? 0}</span>
      <span className="text-xs text-muted-foreground">pts</span>
    </div>
  );
}

export default function AppShell() {
  const { profile, user } = usePlayer();

  return (
    <div className="app-bg min-h-screen text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-black/30 p-6 backdrop-blur-xl md:flex">
        <NavLink to="/" className="mb-9">
          <Logo />
        </NavLink>
        <nav className="flex flex-1 flex-col gap-1">
          {SIDE_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  "mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all",
                  isActive ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Shield className="h-4.5 w-4.5" strokeWidth={2.2} />
              Admin
            </NavLink>
          )}
        </nav>
        <div className="card-surface rounded-3xl p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Your vibe</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl">{profile?.avatar || "🦄"}</span>
            <div className="min-w-0">
              <p className="truncate font-display font-bold text-white">{profile?.display_name || "Loading…"}</p>
              <p className="text-xs text-muted-foreground">{profile?.points ?? 0} points · {profile?.streak ?? 0} day streak</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-background/70 px-4 backdrop-blur-xl md:hidden">
          <NavLink to="/">
            <Logo size="sm" />
          </NavLink>
          <PointsPill points={profile?.points} />
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5 md:px-8 md:pb-16 md:pt-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {MAIN_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition-colors",
                  isActive ? "text-white" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-5 w-5", isActive && "text-fuchsia-400")} strokeWidth={2.3} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}