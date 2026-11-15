import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadWorkspace, saveWorkspace } from "@/lib/workspace";
import {
  EXAMPLE_TASKS, ROLES, SKILLS, customRole, detectSkills, roleBullets, type BulletFacts, makeInterview, makeLinkedIn,
  makeHeading, makeResumeEntry, RESUME_TITLES, matchRole, groupedRoleMatches, needsCaregivingDetail, CARE_DETAIL_PROMPTS, nextStage, skillName, type CareTask, type OutputKind, type WorkspaceData,
} from "@/lib/care-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ArrowLeft, Plus, Trash2, Quote } from "lucide-react";
import { ResumeReview } from "@/components/resume-review";
import { SkillStrengthSummary } from "@/components/skill-strength";

export const Route = createFileRoute("/_authenticated/build")({
  validateSearch: (s: Record<string, unknown>) => ({ step: Math.min(5, Math.max(1, Number(s["step"]) || 1)) }),
  head: () => ({
    meta: [
      { title: "Build your materials — Care Counts" },
      { name: "description", content: "Describe caregiving tasks, find supported skills, match roles and draft résumé language." },
      { property: "og:title", content: "Build your materials — Care Counts" },
      { property: "og:description", content: "Guided steps from caregiving tasks to résumé bullets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Build,
});

const STEP_TITLES = ["Your caregiving", "Skills your examples show", "Your target", "Role matches", "Your drafts"];
const uid = () => Math.random().toString(36).slice(2, 10);

function Build() {
  const { step } = Route.useSearch();
  const nav = useNavigate();
  const [user, setUser] = useState("");
  const [d, setD] = useState<WorkspaceData | null>(null);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => { loadWorkspace().then((w) => { setUser(w.uid); setD(w.data); setDraftCount(w.drafts.length); }); }, []);

  async function persist(next: WorkspaceData, quiet = false) {
    setD(next);
    try { await saveWorkspace(user, next, nextStage(next, draftCount)); if (!quiet) toast.success("Progress saved"); }
    catch { toast.error("Couldn't save. Please try again."); throw new Error("Save failed"); }
  }
  const go = (s: number) => nav({ to: "/build", search: { step: s } });

  if (!d) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  return (
    <div className="mx-auto max-w-3xl px-5 py-6 pb-24">
      <Link to="/workspace" className="inline-flex items-center text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Workspace</Link>
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {STEP_TITLES.map((_, i) => <div key={i} className={`h-2 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`} />)}
      </div>
      <p className="mt-4 text-sm font-bold text-muted-foreground">Step {step} of 5</p>
      <h1 className="text-3xl font-semibold">{STEP_TITLES[step - 1]}</h1>
      <div className="mt-6">
        {step === 1 && <StepTasks d={d} persist={persist} next={() => go(2)} />}
        {step === 2 && <StepSkills d={d} persist={persist} next={() => go(3)} back={() => go(1)} />}
        {step === 3 && <StepTarget d={d} persist={persist} next={() => go(4)} back={() => go(2)} />}
        {step === 4 && <StepMatches d={d} persist={persist} next={() => go(5)} back={() => go(3)} />}
        {step === 5 && <StepDrafts d={d} user={user} back={() => go(4)} onSaved={async () => { setDraftCount((c) => c + 1); await saveWorkspace(user, d, "ready"); }} />}
      </div>
    </div>
  );
}

type P = { d: WorkspaceData; persist: (d: WorkspaceData, quiet?: boolean) => Promise<void>; next: () => void; back?: (() => void) | undefined };

function Nav({ back, next, nextLabel = "Continue", disabled }: { back?: (() => void) | undefined; next: () => void; nextLabel?: string; disabled?: boolean }) {
  return (
    <div className="mt-8 flex gap-3">
      {back && <Button variant="outline" size="lg" className="h-14" onClick={back}>Back</Button>}
      <Button size="lg" className="h-14 flex-1 text-lg" onClick={next} disabled={disabled}>{nextLabel}</Button>
    </div>
  );
}

function StepTasks({ d, persist, next }: P) {
  const [text, setText] = useState("");
  const [ev, setEv] = useState({ providers: "", budget: "", staff: "", other: "" });
  const [showEv, setShowEv] = useState(false);
  const [period, setPeriod] = useState(d.period ?? "");
  const [details, setDetails] = useState<Record<string, string>>({});
  const vague = needsCaregivingDetail(text);

  async function add() {
    if (!text.trim()) return;
    const addedDetails = vague ? CARE_DETAIL_PROMPTS.map((prompt) => details[prompt.id]?.trim()).filter(Boolean) : [];
    const t: CareTask = { id: uid(), text: [text.trim(), ...addedDetails].join(". "), evidence: Object.fromEntries(Object.entries(ev).filter(([, v]) => v.trim())) };
    await persist({ ...d, period, tasks: [...d.tasks, t] });
    setText(""); setDetails({}); setEv({ providers: "", budget: "", staff: "", other: "" }); setShowEv(false);
  }
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Start with just one thing you did. You can add more later. Please leave out names, diagnoses and details that identify the person you cared for.</p>
      <div className="space-y-2">
        <Label htmlFor="period" className="text-base">When were you caregiving? <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input id="period" placeholder="e.g. 2021 – present" value={period} onChange={(e) => setPeriod(e.target.value)} onBlur={() => period !== (d.period ?? "") && persist({ ...d, period }, true)} className="h-14 text-lg" />
      </div>
      <div className="space-y-2 rounded-2xl border bg-card p-5">
        <Label htmlFor="task" className="text-base">Describe a task or responsibility, in your own words</Label>
        <Textarea id="task" rows={4} value={text} onChange={(e) => setText(e.target.value)} className="text-lg" placeholder="e.g. Kept track of appointments with four different specialists" />
        {vague && <div className="space-y-3 border-t pt-4">
          <p className="font-bold">What did that involve? <span className="font-normal text-muted-foreground">(optional)</span></p>
          <p className="text-sm text-muted-foreground">Share only what you did, without names or personal details. Leave any question blank.</p>
          {CARE_DETAIL_PROMPTS.map((prompt) => <div key={prompt.id} className="space-y-1"><Label htmlFor={`detail-${prompt.id}`}>{prompt.question}</Label><Textarea id={`detail-${prompt.id}`} rows={2} value={details[prompt.id] ?? ""} onChange={(e) => setDetails({ ...details, [prompt.id]: e.target.value })} /></div>)}
        </div>}
        <p className="pt-2 text-sm font-bold text-muted-foreground">Need a starting point? Tap an example and change it to fit you:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TASKS.map((ex) => (
            <button key={ex} type="button" onClick={() => setText(ex)} className="rounded-full border bg-muted px-3 py-2 text-left text-sm hover:bg-secondary">{ex}</button>
          ))}
        </div>
        <button type="button" className="mt-2 text-sm font-bold text-primary underline" onClick={() => setShowEv(!showEv)}>{showEv ? "Hide" : "Add"} numbers (optional)</button>
        {showEv && (
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            {([["providers", "Providers coordinated", "e.g. 4"], ["staff", "Support staff supervised", "e.g. 2"], ["budget", "Budget managed", "e.g. $3,000/month"], ["other", "Anything else you can count", "e.g. 30 appointments a month"]] as const).map(([k, l, ph]) => (
              <div key={k} className="space-y-1"><Label htmlFor={k}>{l}</Label><Input id={k} placeholder={ph} value={ev[k]} onChange={(e) => setEv({ ...ev, [k]: e.target.value })} className="h-12 text-base" /></div>
            ))}
          </div>
        )}
        <Button onClick={add} disabled={!text.trim()} size="lg" className="mt-3 h-12"><Plus className="mr-2 h-4 w-4" />Save this task</Button>
      </div>
      {d.tasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Your tasks ({d.tasks.length})</h2>
          {d.tasks.map((t) => (
            <div key={t.id} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <p className="flex-1">{t.text}{Object.values(t.evidence).some(Boolean) && <span className="block text-sm text-muted-foreground">Numbers: {Object.entries(t.evidence).map(([k, v]) => `${k} ${v}`).join(" · ")}</span>}</p>
              {needsCaregivingDetail(t.text) && <Button variant="outline" onClick={() => setText(t.text)}>Add detail</Button>}
              <Button variant="ghost" size="icon" aria-label="Remove task" onClick={() => persist({ ...d, tasks: d.tasks.filter((x) => x.id !== t.id) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
      <ResumeReview saved={d.priorExperience ?? []} onSave={(priorExperience) => persist({ ...d, priorExperience })} />
      <Nav next={next} disabled={!d.tasks.length} nextLabel="See my skills" />
    </div>
  );
}

function StepSkills({ d, persist, next, back }: P) {
  const matches = useMemo(() => detectSkills(d.tasks), [d.tasks]);
  const chosen = d.chosenSkills ?? matches.map((m) => m.skill.id);
  const toggle = (id: string) => persist({ ...d, chosenSkills: chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id] }, true);
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Caregiving is professional experience. Here's what employers would call the work you described — each skill shows the example that supports it. Untick anything that doesn't feel right.</p>
      {!matches.length && <p className="rounded-xl border border-dashed p-5">We couldn't link your tasks to a skill yet. Try adding detail about who you coordinated, what you scheduled, or decisions you made.</p>}
      {matches.map((m) => {
        const noNumbers = m.taskIds.every((id) => !Object.values(d.tasks.find((t) => t.id === id)?.evidence ?? {}).some(Boolean));
        return (
          <label key={m.skill.id} className="flex cursor-pointer gap-4 rounded-2xl border bg-card p-5 has-[:checked]:border-primary">
            <Checkbox className="mt-1 h-6 w-6" checked={chosen.includes(m.skill.id)} onCheckedChange={() => toggle(m.skill.id)} />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{m.skill.name}</h2>
              <p className="mt-1 text-muted-foreground">{m.skill.plain}</p>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-bold">Supported by your example{m.taskIds.length > 1 ? "s" : ""}:</p>
                {m.taskIds.map((id) => <p key={id} className="flex gap-2 rounded-lg bg-muted p-2 text-sm"><Quote className="h-4 w-4 shrink-0 text-primary" />{d.tasks.find((t) => t.id === id)?.text}</p>)}
                {m.keywords.length > 0 && <p className="text-xs text-muted-foreground">Why: you mentioned "{m.keywords.join('", "')}"</p>}
              </div>
              {noNumbers && <p className="mt-3 flex gap-2 rounded-lg bg-warning p-2 text-sm text-warning-foreground"><AlertTriangle className="h-4 w-4 shrink-0" />Missing evidence: {m.skill.evidenceHint} Add it in step 1 if you know it — we won't guess.</p>}
            </div>
          </label>
        );
      })}
      <SkillStrengthSummary d={{ ...d, chosenSkills: chosen }} />
      <Nav back={back} next={next} disabled={!chosen.length} nextLabel="Choose a target" />
    </div>
  );
}

function StepTarget({ d, persist, next, back }: P) {
  const [mode, setMode] = useState<"list" | "paste">(d.targetRoleId === "custom" ? "paste" : "list");
  const outputs = d.outputs ?? ["resume", "interview"];
  const setOut = (k: OutputKind) => persist({ ...d, outputs: outputs.includes(k) ? outputs.filter((x) => x !== k) : [...outputs, k] }, true);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {(["list", "paste"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-lg p-3 font-bold ${mode === m ? "bg-card shadow" : "text-muted-foreground"}`}>{m === "list" ? "Pick a role" : "Paste a job description"}</button>)}
      </div>
      {mode === "list" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((r) => (
            <button key={r.id} onClick={() => persist({ ...d, targetRoleId: r.id }, true)} className={`rounded-xl border p-4 text-left ${d.targetRoleId === r.id ? "border-primary bg-secondary" : "bg-card"}`}>
              <span className="block font-bold">{r.title}</span><span className="text-sm text-muted-foreground">{r.direction}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1"><Label htmlFor="rt" className="text-base">Job title</Label><Input id="rt" className="h-14 text-lg" value={d.customRoleTitle ?? ""} onChange={(e) => persist({ ...d, customRoleTitle: e.target.value, targetRoleId: "custom" }, true)} /></div>
          <div className="space-y-1"><Label htmlFor="jd" className="text-base">Job description</Label><Textarea id="jd" rows={8} className="text-base" value={d.jobDescription ?? ""} onChange={(e) => persist({ ...d, jobDescription: e.target.value, targetRoleId: "custom" }, true)} placeholder="Paste the posting here" /></div>
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">What do you want to create?</h2>
        {([["resume", "Résumé bullets"], ["linkedin", "LinkedIn wording"], ["interview", "Interview response"]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-lg"><Checkbox className="h-6 w-6" checked={outputs.includes(k)} onCheckedChange={() => setOut(k)} />{l}</label>
        ))}
      </div>
      <Nav back={back} next={() => { persist(d); next(); }} disabled={!d.targetRoleId || !outputs.length} nextLabel="See role matches" />
    </div>
  );
}

function StepMatches({ d, persist, next, back }: P) {
  const skills = d.chosenSkills ?? detectSkills(d.tasks).map((m) => m.skill.id);
  const target = d.targetRoleId === "custom" ? customRole(d.customRoleTitle ?? "", d.jobDescription ?? "") : ROLES.find((r) => r.id === d.targetRoleId);
  const groups = groupedRoleMatches(skills, d.priorExperience ?? [], target?.id === "custom" ? [...ROLES, target] : ROLES);
  const targetMatch = Object.values(groups).flat().find((m) => m.role.id === target?.id) ?? (target ? matchRole(target, skills) : null);
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-muted p-4 text-sm">These matches show where your evidence overlaps with what roles usually ask for. They're a starting point for your search, not a promise of being hired.</p>
      {targetMatch && <MatchCard m={targetMatch} label="Your target" />}
      {target?.id === "custom" && !target.skills.length && <p className="text-sm text-muted-foreground">We couldn't pick out skills from that description. Try pasting the "responsibilities" section.</p>}
      <h2 className="pt-4 text-xl font-semibold">Other directions your evidence supports</h2>
      {([ ["prior", "Prior-experience matches"], ["caregiving", "Caregiving-skill matches"], ["both", "Roles supported by both"] ] as const).map(([key, heading]) => <section key={key} className="space-y-3 pt-3">
        <h2 className="text-xl font-semibold">{heading}</h2>
        {!groups[key].length && <p className="text-sm text-muted-foreground">{key === "prior" && !d.priorExperience?.length ? "No prior work history confirmed. Adding a résumé is optional." : "No roles supported in this group yet."}</p>}
        {groups[key].map((m) => <MatchCard key={m.role.id} m={m} label={m.role.id === d.targetRoleId ? "Your target" : undefined} onPick={m.role.id === d.targetRoleId ? undefined : () => persist({ ...d, targetRoleId: m.role.id })} />)}
      </section>)}
      <Nav back={back} next={next} nextLabel="Create my drafts" />
    </div>
  );
}

function MatchCard({ m, label, onPick }: { m: ReturnType<typeof matchRole>; label?: string | undefined; onPick?: (() => void) | undefined }) {
  return (
    <div className={`rounded-2xl border p-5 ${label ? "border-primary bg-secondary" : "bg-card"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>{label && <p className="text-xs font-bold uppercase tracking-wider text-primary">{label}</p>}<h3 className="text-xl font-semibold">{m.role.title}</h3><p className="text-sm text-muted-foreground">{m.role.direction} · {m.strength}</p></div>
        {onPick && <Button variant="outline" onClick={onPick}>Make this my target</Button>}
      </div>
      <p className="mt-3">{m.why}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {m.matched.map((s) => <span key={s} className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">✓ {skillName(s)}</span>)}
        {m.missing.map((s) => <span key={s} className="rounded-full bg-warning px-3 py-1 text-sm text-warning-foreground">Not yet shown: {skillName(s)}</span>)}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{m.role.note}</p>
    </div>
  );
}

function StepDrafts({ d, user, back, onSaved }: { d: WorkspaceData; user: string; back: () => void; onSaved: () => Promise<void> }) {
  const matches = detectSkills(d.tasks);
  const skills = d.chosenSkills ?? matches.map((m) => m.skill.id);
  const role = d.targetRoleId === "custom" ? customRole(d.customRoleTitle ?? "", d.jobDescription ?? "") : ROLES.find((r) => r.id === d.targetRoleId);
  const roleTitle = role?.title ?? "your next role";
  const ordered = [...skills].sort((a, b) => Number(role?.skills.includes(b)) - Number(role?.skills.includes(a)));
  const outputs = d.outputs ?? ["resume", "interview"];

  const [facts, setFacts] = useState<Record<string, BulletFacts>>({});
  const tailored = roleBullets(d.tasks, role, skills, facts);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const finalBullets = tailored.map((b) => edits[b.skillId] ?? b.text);
  const [linkedin, setLinkedin] = useState(() => makeLinkedIn(roleTitle, ordered, d.period));
  const firstMatch = matches.find((m) => m.skill.id === ordered[0]);
  const [interviewSkill, setInterviewSkill] = useState(ordered[0] ?? "");
  const [interview, setInterview] = useState(() => makeInterview(d.tasks.find((t) => t.id === firstMatch?.taskIds[0]), ordered[0], roleTitle));
  const [saving, setSaving] = useState(false);
  const [entryTitle, setEntryTitle] = useState(RESUME_TITLES[0]!);
  const [entryStart, setEntryStart] = useState("");
  const [entryEnd, setEntryEnd] = useState("");
  const entry = makeResumeEntry(entryTitle, entryStart, entryEnd, finalBullets);


  async function save(kind: OutputKind | "entry", title: string, body: string) {
    setSaving(true);
    const { error } = await supabase.from("drafts").insert({ user_id: user, kind, title, body, role_title: roleTitle });
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await onSaved();
    toast.success("Draft saved to your workspace", { description: title });
  }

  return (
    <div className="space-y-8">
      <p className="text-muted-foreground">Everything below is built only from what you told us. Edit freely. Anything in [brackets] is yours to fill in — we won't make up results or numbers.</p>

      {outputs.includes("resume") && (
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-2xl font-semibold">Résumé bullets</h2>
          <p className="text-sm text-muted-foreground">Suggested heading: <strong>{makeHeading(d.period)}</strong></p>
          <p className="text-sm text-muted-foreground">Your 3 strongest lines for {roleTitle}, written in the terms employers use. Answer the short questions to add real numbers and results.</p>
          {tailored.map((b) => (
            <div key={b.skillId} className="space-y-2 border-t pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground">{skillName(b.skillId)}</p>
              <Textarea rows={3} className="text-base" value={edits[b.skillId] ?? b.text} onChange={(e) => setEdits({ ...edits, [b.skillId]: e.target.value })} aria-label="Edit résumé line" />
              {!edits[b.skillId] && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {b.questions.map((q) => (
                    <label key={q.key} className="space-y-1 text-sm">
                      <span className="text-muted-foreground">{q.q}</span>
                      <Input value={facts[b.skillId]?.[q.key] ?? ""} onChange={(e) => setFacts({ ...facts, [b.skillId]: { ...facts[b.skillId], [q.key]: e.target.value } })} />
                    </label>
                  ))}
                </div>
              )}
              {edits[b.skillId] && <button className="text-sm underline" onClick={() => { const n = { ...edits }; delete n[b.skillId]; setEdits(n); }}>Undo my edits</button>}
            </div>
          ))}
          <Button disabled={saving} size="lg" className="h-12" onClick={() => save("resume", `Résumé bullets — ${roleTitle}`, `${makeHeading(d.period)}\n${finalBullets.map((b) => `• ${b}`).join("\n")}`)}>Save résumé bullets</Button>
        </section>
      )}

      {outputs.includes("resume") && (
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-2xl font-semibold">Résumé entry</h2>
          <p className="text-sm text-muted-foreground">A complete job block for your résumé, using the 3 lines above. No employer name or details about the person you cared for.</p>
          <p className="text-sm font-bold">Job title</p>
          <div className="flex flex-wrap gap-2">
            {RESUME_TITLES.map((t) => <button key={t} onClick={() => setEntryTitle(t)} className={`rounded-full border px-3 py-1.5 text-sm ${entryTitle === t ? "border-primary bg-secondary font-bold" : ""}`}>{t}</button>)}
          </div>
          <div className="space-y-1"><Label htmlFor="et">Or type your own title</Label><Input id="et" className="h-12 text-base" value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="es">Start month/year <span className="text-muted-foreground">(optional)</span></Label><Input id="es" placeholder="e.g. Mar 2021" className="h-12 text-base" value={entryStart} onChange={(e) => setEntryStart(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="ee">End month/year <span className="text-muted-foreground">(optional)</span></Label><Input id="ee" placeholder="e.g. Jun 2024 or Present" className="h-12 text-base" value={entryEnd} onChange={(e) => setEntryEnd(e.target.value)} /></div>
          </div>
          <p className="text-sm font-bold">Preview</p>
          <div className="rounded-xl border bg-background p-4">
            {entry.split("\n").map((l, i) => <p key={i} className={i === 0 ? "font-semibold" : "mt-1 pl-2"}>{l}</p>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={saving} size="lg" className="h-12" onClick={() => save("entry", `Résumé entry — ${roleTitle}`, entry)}>Save résumé entry</Button>
            <Button variant="outline" size="lg" className="h-12" onClick={async () => { await navigator.clipboard.writeText(entry); toast.success("Copied"); }}>Copy</Button>
          </div>
          <p className="text-sm text-muted-foreground">Saved entries can be downloaded as PDF or Word from your workspace.</p>
        </section>
      )}

      {outputs.includes("linkedin") && (
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-2xl font-semibold">LinkedIn wording</h2>
          <Textarea rows={5} className="text-base" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          <Button disabled={saving} size="lg" className="h-12" onClick={() => save("linkedin", `LinkedIn — ${roleTitle}`, linkedin)}>Save LinkedIn wording</Button>
        </section>
      )}

      {outputs.includes("interview") && (
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h2 className="text-2xl font-semibold">Interview response</h2>
          <p className="text-sm text-muted-foreground">A "tell me about a time…" answer. Pick which skill to build it around:</p>
          <div className="flex flex-wrap gap-2">
            {ordered.map((s) => (
              <button key={s} onClick={() => { setInterviewSkill(s); const m = matches.find((x) => x.skill.id === s); setInterview(makeInterview(d.tasks.find((t) => t.id === m?.taskIds[0]), s, roleTitle)); }} className={`rounded-full border px-3 py-1.5 text-sm ${interviewSkill === s ? "border-primary bg-secondary font-bold" : ""}`}>{skillName(s)}</button>
            ))}
          </div>
          <Textarea rows={12} className="text-base" value={interview} onChange={(e) => setInterview(e.target.value)} />
          {interview.includes("[") && <p className="flex gap-2 text-sm text-warning-foreground"><AlertTriangle className="h-4 w-4 shrink-0" />Fill in the [bracketed] parts with what really happened before using this.</p>}
          <Button disabled={saving} size="lg" className="h-12" onClick={() => save("interview", `Interview answer — ${skillName(interviewSkill)}`, interview)}>Save interview response</Button>
        </section>
      )}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" className="h-14" onClick={back}>Back</Button>
        <Button asChild size="lg" className="h-14 flex-1 text-lg"><Link to="/workspace">Go to my saved drafts</Link></Button>
      </div>
    </div>
  );
}
