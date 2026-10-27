import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GLOWS = {
  most_likely: "from-fuchsia-500/30 via-purple-500/10 to-transparent",
  would_you_rather: "from-orange-400/30 via-pink-500/10 to-transparent",
  hot_take: "from-pink-500/30 via-orange-400/10 to-transparent"
};

export default function ModeCard({ mode, subtitle, className }) {
  return (
    <Link
      to={`/games/${mode.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07]",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-gradient-to-br blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70",
          GLOWS[mode.key]
        )}
      />
      <div className="relative flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/30 text-2xl">
          {mode.emoji}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-extrabold leading-tight text-white">{mode.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle || mode.tagline}</p>
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-fuchsia-300/90">Play now</span>
        <ArrowRight className="h-4 w-4 text-fuchsia-300 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}