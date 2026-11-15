import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { loadWorkspace } from "@/lib/workspace";
import { STAGES, type Stage, type WorkspaceData } from "@/lib/care-engine";
import { exportPdf, exportDocx, downloadBlob } from "@/lib/export";
import { SkillStrengthSummary } from "@/components/skill-strength";
import { deleteMyAccount } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Copy, Trash2, ArrowRight, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { title: "Your workspace — Care Counts" },
      { name: "description", content: "Your private Care Counts workspace: progress, next step and saved drafts." },
      { property: "og:title", content: "Your workspace — Care Counts" },
      { property: "og:description", content: "Private caregiver workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Workspace,
});

type Draft = { id: string; kind: string; title: string; body: string; role_title: string | null; updated_at: string };
const KIND: Record<string, string> = { resume: "Résumé bullets", linkedin: "LinkedIn wording", interview: "Interview response", entry: "Résumé entry" };

function nextAction(stage: Stage, d: WorkspaceData) {
  if (!d.tasks.length) return { label: "Describe one caregiving task", step: 1 };
  if (stage === "exploring") return { label: "Review your skills and pick a target role", step: 2 };
  if (stage === "drafting") return { label: "Create and save your drafts", step: 5 };
  return { label: "Polish and download your materials", step: 5 };
}

function Workspace() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const delAccount = useServerFn(deleteMyAccount);
  const [ws, setWs] = useState<Awaited<ReturnType<typeof loadWorkspace>> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<string, { title: string; body: string }>>({});

  const refresh = () => loadWorkspace().then((w) => { setWs(w); setEdits({}); });
  useEffect(() => { refresh(); }, []);

  if (!ws) return <div className="p-10 text-center text-muted-foreground">Opening your workspace…</div>;
  const drafts = ws.drafts as Draft[];
  const stageIdx = STAGES.findIndex((s) => s.id === ws.stage);
  const next = nextAction(ws.stage, ws.data);

  async function saveDraft(d: Draft) {
    const e = edits[d.id]; if (!e) return;
    const { error } = await supabase.from("drafts").update({ ...e, updated_at: new Date().toISOString() }).eq("id", d.id);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    toast.success("Draft saved", { description: e.title });
    refresh();
  }
  async function removeDraft(id: string) {
    await supabase.from("drafts").delete().eq("id", id);
    toast.success("Draft deleted"); setSelected((s) => s.filter((x) => x !== id)); refresh();
  }
  async function deleteAllData() {
    await supabase.from("drafts").delete().eq("user_id", ws!.uid);
    await supabase.from("workspaces").delete().eq("user_id", ws!.uid);
    toast.success("All saved drafts and entries were permanently deleted"); refresh();
  }
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut(); nav({ to: "/auth", replace: true });
  }
  async function deleteAccount() {
    try {
      await delAccount();
      await supabase.auth.signOut();
      toast.success("Your account and everything in it were deleted");
      nav({ to: "/", replace: true });
    } catch { toast.error("We couldn't delete your account. Please try again."); }
  }
  const chosen = drafts.filter((d) => selected.includes(d.id)).map((d) => ({ title: edits[d.id]?.title ?? d.title, body: edits[d.id]?.body ?? d.body }));

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl font-semibold text-primary">Care Counts</span>
        <Button variant="ghost" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
      </header>

      <h1 className="mt-8 text-3xl font-semibold">Your workspace</h1>
      <p className="mt-1 text-muted-foreground">Only you can see this.</p>

      <ol className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Progress">
        {STAGES.map((s, i) => (
          <li key={s.id} className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-bold ${i <= stageIdx ? "border-primary bg-secondary text-secondary-foreground" : "text-muted-foreground"}`} aria-current={i === stageIdx ? "step" : undefined}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${i <= stageIdx ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{i < stageIdx ? <Check className="h-3 w-3" /> : i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      <section className="mt-6 rounded-2xl bg-primary p-6 text-primary-foreground">
        <p className="text-sm font-bold uppercase tracking-wider opacity-80">Next useful step</p>
        <p className="mt-1 text-2xl font-display">{next.label}</p>
        <Button asChild size="lg" variant="secondary" className="mt-4 h-12">
          <Link to="/build" search={{ step: next.step }}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>

      <div className="mt-6"><SkillStrengthSummary d={ws.data} /></div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">Saved drafts</h2>
          {drafts.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" disabled={!chosen.length} onClick={async () => downloadBlob(await exportPdf(chosen), "care-counts.pdf")}>Download PDF</Button>
              <Button variant="outline" disabled={!chosen.length} onClick={async () => downloadBlob(await exportDocx(chosen), "care-counts.docx")}>Download Word</Button>
            </div>
          )}
        </div>
        {drafts.length > 0 && <p className="mt-1 text-sm text-muted-foreground">Tick the drafts you want to download.</p>}
        {!drafts.length && <p className="mt-3 rounded-xl border border-dashed p-6 text-muted-foreground">No drafts yet. They'll appear here once you save them.</p>}
        <div className="mt-4 space-y-4">
          {drafts.map((d) => {
            const e = edits[d.id] ?? { title: d.title, body: d.body };
            const dirty = !!edits[d.id];
            return (
              <article key={d.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <Checkbox className="mt-3 h-5 w-5" aria-label={`Select ${d.title}`} checked={selected.includes(d.id)} onCheckedChange={(c) => setSelected((s) => c ? [...s, d.id] : s.filter((x) => x !== d.id))} />
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground">{KIND[d.kind] ?? d.kind}{d.role_title ? ` · ${d.role_title}` : ""}</p>
                    <Input value={e.title} onChange={(ev) => setEdits({ ...edits, [d.id]: { ...e, title: ev.target.value } })} className="h-11 text-base font-bold" aria-label="Draft title" />
                    <Textarea value={e.body} rows={6} onChange={(ev) => setEdits({ ...edits, [d.id]: { ...e, body: ev.target.value } })} className="text-base" aria-label="Draft text" />
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={!dirty} onClick={() => saveDraft(d)}>Save changes</Button>
                      <Button variant="outline" onClick={() => { navigator.clipboard.writeText(e.body); toast.success("Copied"); }}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                      <Button variant="ghost" className="text-destructive" onClick={() => removeDraft(d.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">Your data</h2>
        <p className="mt-1 text-muted-foreground">Your entries are used only to build your materials. They are never shared, used for research or used to train models.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Confirm label="Delete all saved drafts and entries" title="Delete everything you've saved?" body="Your tasks, skills and drafts will be permanently deleted. Your account stays open." onConfirm={deleteAllData} />
          <Confirm label="Delete my account" title="Permanently delete your account?" body="This removes your account and everything in it. It can't be undone." onConfirm={deleteAccount} />
        </div>
      </section>
    </div>
  );
}

function Confirm({ label, title, body, onConfirm }: { label: string; title: string; body: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="outline" className="border-destructive text-destructive">{label}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{body}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Keep it</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={onConfirm}>Delete permanently</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
