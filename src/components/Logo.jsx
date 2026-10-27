import React from "react";
import { cn } from "@/lib/utils";

export default function Logo({ size = "md", showWord = true, className }) {
  const box = size === "sm" ? "h-8 w-8 text-base rounded-xl" : size === "lg" ? "h-14 w-14 text-3xl rounded-2xl" : "h-10 w-10 text-xl rounded-2xl";
  const word = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "vibe-gradient grid place-items-center font-display font-black text-white shadow-lg glow-purple",
          box
        )}
      >
        ⚡
      </div>
      {showWord && (
        <span className={cn("font-display font-black tracking-tight text-white", word)}>
          Vibe<span className="text-vibe">Check</span>
        </span>
      )}
    </div>
  );
}