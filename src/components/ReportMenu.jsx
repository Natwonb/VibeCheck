import React, { useState } from "react";
import { MoreHorizontal, Flag, Ban, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { cn } from "@/lib/utils";

const REASONS = ["Inappropriate", "Mean or bullying", "Spam", "Something else"];

export default function ReportMenu({ targetType, targetId, targetLabel, authorId, authorName, onBlocked, className }) {
  const { user, blockUser } = usePlayer();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendReport = async (reason) => {
    if (!user) return;
    try {
      await base44.entities.ContentReport.create({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        target_label: String(targetLabel || "").slice(0, 180),
        reason,
        status: "open"
      });
      setSent(true);
      setPicking(false);
    } catch (err) {
      setError(err.message || "Could not send that report.");
    }
  };

  const blockAuthor = async () => {
    if (!authorId || authorId === user?.id) return;
    await blockUser(authorId, authorName);
    onBlocked?.();
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-label="More options"
        onClick={() => {
          setOpen((v) => !v);
          setPicking(false);
        }}
        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-30 w-48 rounded-2xl border border-white/10 bg-popover p-1.5 shadow-2xl">
          {sent ? (
            <p className="flex items-center gap-2 px-2 py-2 text-xs text-emerald-300">
              <Check className="h-3.5 w-3.5" /> Thanks, we'll review it.
            </p>
          ) : picking ? (
            <div className="space-y-1">
              <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">Why?</p>
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => sendReport(reason)}
                  className="w-full rounded-xl px-2 py-1.5 text-left text-xs text-white/90 transition hover:bg-white/10"
                >
                  {reason}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs text-white/90 transition hover:bg-white/10"
              >
                <Flag className="h-3.5 w-3.5" /> Report
              </button>
              {authorId && authorId !== user?.id && (
                <button
                  type="button"
                  onClick={blockAuthor}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs text-rose-300 transition hover:bg-rose-500/10"
                >
                  <Ban className="h-3.5 w-3.5" /> Block {authorName || "player"}
                </button>
              )}
            </div>
          )}
          {error && <p className="px-2 py-1 text-[11px] text-rose-300">{error}</p>}
        </div>
      )}
    </div>
  );
}