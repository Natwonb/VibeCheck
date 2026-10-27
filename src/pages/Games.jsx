import React from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { MODE_LIST } from "@/lib/modes";
import ModeCard from "@/components/games/ModeCard";

const STEPS = [
  { n: "1", title: "Pick a mode", text: "Three games, zero chill." },
  { n: "2", title: "Answer fast", text: "Your gut is funnier than your brain." },
  { n: "3", title: "See the board", text: "Real percentages from real players." }
];

export default function Games() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-fuchsia-300/80">Play</p>
        <h1 className="font-display text-4xl font-black leading-none text-white">Pick your poison</h1>
        <p className="text-sm text-muted-foreground">Solo rounds earn points instantly. Bring friends for the chaos.</p>
      </header>

      <div className="grid gap-3">
        {MODE_LIST.map((mode) => (
          <ModeCard key={mode.key} mode={mode} subtitle={mode.how} />
        ))}
      </div>

      <Link
        to="/rooms"
        className="flex items-center justify-between rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/25"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-fuchsia-500/15 text-xl">🎪</span>
          <div>
            <p className="font-display text-base font-bold text-white">Play with friends</p>
            <p className="text-xs text-muted-foreground">Create a room, share the code, vote on each other</p>
          </div>
        </div>
        <Users className="h-4 w-4 text-fuchsia-300" />
      </Link>

      <section className="grid gap-2.5 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-display text-xs font-black text-fuchsia-300">{step.n}</span>
            <p className="mt-1 font-display text-sm font-bold text-white">{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}