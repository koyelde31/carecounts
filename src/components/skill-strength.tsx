import { Link } from "@tanstack/react-router";
import { Quote, Briefcase, Lightbulb } from "lucide-react";
import { LEVEL_LABEL, skillStrengths, type WorkspaceData } from "@/lib/care-engine";

export function SkillStrengthSummary({ d }: { d: WorkspaceData }) {
  const list = skillStrengths(d.tasks, d.chosenSkills, d.priorExperience ?? []);
  if (!list.length) return null;
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5" aria-labelledby="strength-h">
      <h2 id="strength-h" className="text-2xl font-semibold">Your skill strength</h2>
      <p className="text-sm text-muted-foreground">Each skill below is backed by something you told us. Add a fact to make a skill stronger.</p>
      {list.map((s) => (
        <div key={s.skill.id} className="space-y-2 border-t pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{s.skill.name}</h3>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${s.level === "shown" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>{LEVEL_LABEL[s.level]}</span>
          </div>
          <p className="text-sm text-muted-foreground">{s.note}</p>
          {s.examples.map((e) => <p key={e} className="flex gap-2 rounded-lg bg-muted p-2 text-sm"><Quote className="h-4 w-4 shrink-0 text-primary" />{e}</p>)}
          {s.priorTitles.map((t) => <p key={t} className="flex gap-2 text-sm"><Briefcase className="h-4 w-4 shrink-0 text-primary" />From your confirmed job title: {t}</p>)}
          {s.tip && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-warning p-2 text-sm text-warning-foreground">
              <Lightbulb className="h-4 w-4 shrink-0" /><span className="flex-1">Make it stronger: {s.tip}</span>
              <Link to="/build" search={{ step: 1 }} className="font-bold underline">Add this fact</Link>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
