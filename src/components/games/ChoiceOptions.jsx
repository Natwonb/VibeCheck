import React from "react";
import { cn } from "@/lib/utils";

export default function ChoiceOptions({ options, counts, picked, onPick }) {
  const total = options.reduce((sum, opt) => sum + (counts?.[opt.key] || 0), 0);

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const votes = counts?.[opt.key] || 0;
        const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
        const isPicked = picked === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            disabled={Boolean(picked)}
            onClick={() => onPick(opt.key)}
            className={cn(
              "relative w-full overflow-hidden rounded-[1.5rem] border p-4 text-left transition-all duration-300",
              isPicked
                ? "border-fuchsia-400/70 bg-fuchsia-500/15"
                : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]",
              picked && !isPicked && "opacity-70"
            )}
          >
            {picked && (
              <span
                className={cn(
                  "absolute inset-y-0 left-0 vibe-gradient transition-all duration-700",
                  isPicked ? "opacity-25" : "opacity-10"
                )}
                style={{ width: `${pct}%` }}
              />
            )}
            <span className="relative flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                {opt.emoji && <span className="text-xl">{opt.emoji}</span>}
                <span className="font-display text-base font-bold leading-snug text-white">{opt.label}</span>
              </span>
              {picked && (
                <span className="shrink-0 font-display text-lg font-black text-white">{pct}%</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}