import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePlayer } from "@/lib/PlayerContext";
import { MODE_LIST } from "@/lib/modes";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  mode: "would_you_rather",
  text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  category: ""
};

export default function Admin() {
  const { user } = usePlayer();
  const [tab, setTab] = useState("questions");
  const [questions, setQuestions] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const isAdmin = user?.role === "admin";

  const load = async () => {
    setLoading(true);
    try {
      const [qres, rres] = await Promise.all([
        base44.entities.Question.list({ sort: "-created_date", limit: 100 }),
        base44.entities.ContentReport.list({ sort: "-created_date", limit: 50 })
      ]);
      setQuestions(qres.items || []);
      setReports(rres.items || []);
    } catch (err) {
      setError(err.message || "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="space-y-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-8 text-center">
        <Shield className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="font-display font-bold text-white">Admins only</p>
        <p className="text-sm text-muted-foreground">This area manages questions and reported content.</p>
        <Link to="/" className="inline-block text-sm font-semibold text-fuchsia-300">
          Back to home
        </Link>
      </div>
    );
  }

  const addQuestion = async () => {
    setError("");
    setFlash("");
    if (form.text.trim().length < 8) {
      setError("Write the full question first.");
      return;
    }
    if (form.mode !== "hot_take" && !form.option_a.trim()) {
      setError("Add at least one answer option.");
      return;
    }
    setBusy(true);
    try {
      await base44.entities.Question.create({
        mode: form.mode,
        text: form.text.trim(),
        option_a: form.option_a.trim() || undefined,
        option_b: form.option_b.trim() || undefined,
        option_c: form.option_c.trim() || undefined,
        option_d: form.option_d.trim() || undefined,
        category: form.category.trim() || "general",
        is_active: true
      });
      setForm({ ...EMPTY_FORM, mode: form.mode });
      setFlash("Question added.");
      await load();
    } catch (err) {
      setError(err.message || "Could not add that question.");
    } finally {
      setBusy(false);
    }
  };

  const toggleQuestion = async (question) => {
    try {
      await base44.entities.Question.update(question.id, { is_active: !question.is_active });
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, is_active: !question.is_active } : q))
      );
    } catch (err) {
      setError(err.message || "Could not update the question.");
    }
  };

  const removeQuestion = async (question) => {
    try {
      await base44.entities.Question.delete(question.id);
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
    } catch (err) {
      setError(err.message || "Could not delete the question.");
    }
  };

  const resolveReport = async (report, remove) => {
    setError("");
    try {
      if (remove) {
        const entityName = report.target_type;
        if (["TakeSubmission", "DailyResponse", "RoomAnswer"].includes(entityName)) {
          await base44.entities[entityName].update(report.target_id, { is_hidden: true });
        }
      }
      await base44.entities.ContentReport.update(report.id, {
        status: remove ? "removed" : "reviewed"
      });
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: remove ? "removed" : "reviewed" } : r))
      );
    } catch (err) {
      setError(err.message || "Could not resolve that report.");
    }
  };

  const visibleQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase())
  );
  const openReports = reports.filter((r) => r.status === "open");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-fuchsia-300/80">Admin</p>
        <h1 className="font-display text-3xl font-black text-white">Keep the vibes clean</h1>
      </header>

      <div className="flex gap-2">
        {[
          { key: "questions", label: `Questions (${questions.length})` },
          { key: "reports", label: `Reports (${openReports.length})` }
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setTab(option.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-bold transition",
              tab === option.key
                ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                : "border-white/10 bg-white/5 text-muted-foreground hover:text-white"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {flash && (
        <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
          {flash}
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-fuchsia-300" />
        </div>
      ) : tab === "questions" ? (
        <>
          <section className="space-y-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="font-display text-lg font-extrabold text-white">Add a question</h2>
            <div className="flex flex-wrap gap-2">
              {MODE_LIST.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, mode: mode.key }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    form.mode === mode.key
                      ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                      : "border-white/10 bg-white/5 text-muted-foreground"
                  )}
                >
                  {mode.emoji} {mode.short}
                </button>
              ))}
            </div>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={2}
              placeholder={
                form.mode === "hot_take"
                  ? "Unpopular opinion: …"
                  : form.mode === "most_likely"
                  ? "Who is most likely to …"
                  : "Would you rather …"
              }
              className="w-full resize-none rounded-2xl border border-white/15 bg-black/30 p-3 text-sm text-white placeholder:text-muted-foreground focus:border-fuchsia-400/60 focus:outline-none"
            />
            {form.mode !== "hot_take" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {["option_a", "option_b", "option_c", "option_d"].map((field, index) => (
                  <input
                    key={field}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder={
                      form.mode === "most_likely"
                        ? ["The Group Mom", "The Chaos Gremlin", "The Smooth Talker", "The Wildcard"][index]
                        : `Option ${index + 1}${index > 1 ? " (optional)" : ""}`
                    }
                    className="rounded-2xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/70 focus:border-fuchsia-400/60 focus:outline-none"
                  />
                ))}
              </div>
            )}
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category (optional)"
              className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/70 focus:border-fuchsia-400/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={addQuestion}
              disabled={busy}
              className="vibe-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-bold text-white shadow-lg disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add question
            </button>
          </section>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-fuchsia-400/60 focus:outline-none"
          />

          <ul className="space-y-2">
            {visibleQuestions.map((question) => (
              <li key={question.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300/80">
                      {question.mode.replace(/_/g, " ")} · {question.is_active === false ? "hidden" : "active"}
                    </p>
                    <p className="mt-1 font-display text-sm font-semibold text-white">{question.text}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {[question.option_a, question.option_b, question.option_c, question.option_d]
                        .filter(Boolean)
                        .join(" · ") || "Open answer"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => toggleQuestion(question)}
                      title={question.is_active === false ? "Activate" : "Hide"}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-muted-foreground transition hover:text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question)}
                      title="Delete"
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-rose-300 transition hover:bg-rose-500/15"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="space-y-2">
          {reports.length === 0 && (
            <li className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-muted-foreground">
              Nothing reported. The vibes are immaculate.
            </li>
          )}
          {reports.map((report) => (
            <li key={report.id} className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300/80">
                  {report.target_type} · {report.status}
                </p>
                <span className="text-[10px] text-muted-foreground">{report.reason}</span>
              </div>
              <p className="font-display text-sm font-semibold text-white">"{report.target_label}"</p>
              {report.status === "open" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => resolveReport(report, false)}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-white"
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={() => resolveReport(report, true)}
                    className="rounded-full border border-rose-400/40 bg-rose-500/15 px-4 py-1.5 text-xs font-bold text-rose-200"
                  >
                    Remove content
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}