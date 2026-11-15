import { useRef, useState } from "react";
import { Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SKILLS, type PriorExperience } from "@/lib/care-engine";
import { confirmedExperience, readResume } from "@/lib/resume-review";

export function ResumeReview({ saved, onSave }: { saved: PriorExperience[]; onSave: (jobs: PriorExperience[]) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [review, setReview] = useState<PriorExperience[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function select(file?: File) {
    if (!file) return;
    setError(""); setStatus(""); setReview(null);
    if (file.size > 10 * 1024 * 1024) { setError("Please choose a résumé smaller than 10 MB."); return; }
    setBusy(true);
    try {
      const suggestions = await readResume(file);
      setReview(suggestions.length ? suggestions : [{ title: "", skills: [] }]);
      setStatus(suggestions.length ? "Review the extracted job titles and skills before confirming." : "No job titles were recognized. You can add them below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read this résumé. Try another file or add your work history manually.");
    } finally { setBusy(false); }
  }

  return (
    <section className="space-y-3 border-t pt-6">
      <h2 className="text-xl font-semibold">Work before caregiving <span className="text-base font-normal text-muted-foreground">(optional)</span></h2>
      <p className="text-sm text-muted-foreground">Your résumé is read only on this device and discarded. Only job titles and skills you confirm are saved to your private workspace — not employers or dates.</p>
      <input ref={input} type="file" accept=".pdf,.docx,.txt" className="hidden" aria-label="Upload previous résumé" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void select(file); }} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload className="mr-2 h-4 w-4" />{busy ? "Reading résumé…" : "Upload previous résumé"}</Button>
        <Button variant="ghost" disabled={busy} onClick={() => { setReview(saved.length ? saved.map((job) => ({ ...job, skills: [...job.skills] })) : [{ title: "", skills: [] }]); setError(""); setStatus(""); }}>{saved.length ? "Review saved work history" : "Add work history manually"}</Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
      {review !== null && <div className="space-y-4">
        {review.map((job, i) => <div key={i} className="space-y-3 border-b pb-4">
          <div className="flex items-center gap-2">
            <Input aria-label={`Prior job title ${i + 1}`} placeholder="Job title only — no employer or dates" value={job.title} onChange={(e) => setReview(review.map((row, j) => j === i ? { ...row, title: e.target.value } : row))} />
            <Button variant="ghost" size="icon" aria-label={`Remove prior job ${i + 1}`} onClick={() => setReview(review.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <p className="text-sm font-bold">Skills from this job that you confirm</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SKILLS.map((skill) => <label key={skill.id} className="flex items-center gap-2 text-sm"><Checkbox checked={job.skills.includes(skill.id)} onCheckedChange={(checked) => setReview(review.map((row, j) => j === i ? { ...row, skills: checked ? [...row.skills, skill.id] : row.skills.filter((id) => id !== skill.id) } : row))} />{skill.name}</label>)}
          </div>
        </div>)}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setReview([...review, { title: "", skills: [] }])}><Plus className="mr-2 h-4 w-4" />Add job title</Button>
          <Button disabled={busy || review.some((job) => !job.title.trim())} onClick={async () => {
            setBusy(true); setError("");
            try { await onSave(confirmedExperience(review)); setReview(null); setStatus("Confirmed job titles and skills saved."); }
            catch { setError("Couldn't save your work history. Please try again."); }
            finally { setBusy(false); }
          }}>Confirm and save work history</Button>
          <Button variant="ghost" disabled={busy} onClick={() => { setReview(null); setStatus(""); }}>Discard review</Button>
        </div>
      </div>}
      {review === null && saved.length > 0 && <ul className="list-inside list-disc text-sm text-muted-foreground">{saved.map((job, i) => <li key={i}>{job.title}</li>)}</ul>}
    </section>
  );
}