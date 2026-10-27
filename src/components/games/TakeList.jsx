import React from "react";
import { Flame } from "lucide-react";
import ReportMenu from "@/components/ReportMenu";
import { cn } from "@/lib/utils";

export default function TakeList({ takes, currentUserId, blockedIds, onVote, emptyText }) {
  const visible = takes.filter((t) => !t.is_hidden && !blockedIds.includes(t.user_id));

  if (!visible.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyText || "No takes yet — be the first to say it."}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {visible.map((take, index) => {
        const voted = (take.voter_ids || []).includes(currentUserId);
        return (
          <li
            key={take.id}
            className="animate-pop rounded-3xl border border-white/10 bg-white/[0.04] p-4"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-base font-semibold leading-snug text-white">"{take.text}"</p>
              <ReportMenu
                targetType="TakeSubmission"
                targetId={take.id}
                targetLabel={take.text}
                authorId={take.user_id}
                authorName={take.display_name}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">— {take.display_name || "Anonymous"}</p>
              <button
                type="button"
                onClick={() => onVote(take.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                  voted
                    ? "border-orange-400/60 bg-orange-500/20 text-orange-200"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                )}
              >
                <Flame className={cn("h-3.5 w-3.5", voted && "text-orange-300")} />
                {take.votes || 0}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}