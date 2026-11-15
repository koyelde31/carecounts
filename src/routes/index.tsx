import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ListChecks, Briefcase, FileDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Care Counts — put your caregiving experience into words" },
      { name: "description", content: "A private tool that turns your caregiving tasks into evidence-backed skills, role matches and résumé bullets." },
      { property: "og:title", content: "Care Counts" },
      { property: "og:description", content: "Turn caregiving tasks into skills employers recognize — privately, using only your facts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: ListChecks, t: "Describe what you did", d: "Start with one task, in your own words. Numbers are optional." },
  { icon: Briefcase, t: "See skills and roles", d: "Each skill points back to your example, with plain reasons for every role match." },
  { icon: FileDown, t: "Leave with something usable", d: "Edit résumé bullets, LinkedIn wording or an interview answer. Copy or download." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-display text-2xl font-semibold text-primary">Care Counts</span>
        <Button asChild variant="outline" size="lg"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="py-12 md:py-20">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-accent-foreground">For family and unpaid caregivers</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Caregiving is real work. Describe it the way employers do.</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">Turn what you actually did — coordinating providers, managing schedules, handling emergencies, supervising staff — into skills backed by your own examples, and see which roles they lead to.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-14 px-8 text-lg"><Link to="/auth">Start with one task</Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Most caregivers we surveyed believed their skills transfer, but 93% had never put caregiving on a résumé.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.t} className="rounded-2xl border bg-card p-6">
              <s.icon className="mb-3 h-7 w-7 text-primary" />
              <h2 className="text-xl font-semibold">{s.t}</h2>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </section>
        <section className="mt-10 flex gap-4 rounded-2xl bg-secondary p-6">
          <ShieldCheck className="h-8 w-8 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Private by design</h2>
            <p className="mt-1 text-secondary-foreground">Only you can see your workspace. We never ask for names, diagnoses or details about the person you care for, and your entries are used only to build your materials — never for research or training. You can delete everything at any time.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
