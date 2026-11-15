import { SKILLS, skillsInText, type PriorExperience } from "./care-engine";

// Recognize titles only; never treat a full résumé line as a persistable title.
const TITLE_PATTERN = /\b(?:(?:senior|junior|assistant|regional|technical|sales|marketing|human resources|operations|project|program|office|account|customer success|facilities|safety|care|service|administrative|financial|business|data|software|shift)\s+){0,3}(?:manager|coordinator|supervisor|team lead|administrator|assistant|analyst|engineer|teacher|nurse|accountant|designer|developer|receptionist|consultant|director|specialist|representative|navigator)\b/gi;

export function resumeSuggestions(text: string): PriorExperience[] {
  const found: { title: string; start: number; end: number }[] = [];
  for (const match of text.matchAll(TITLE_PATTERN)) {
    const start = match.index;
    found.push({ title: match[0], start, end: start + match[0].length });
  }
  return found.map((job, i) => ({
    title: job.title,
    skills: skillsInText(text.slice(job.end, found[i + 1]?.start ?? text.length).replace(/^[^\n]*/, "")),
  })).filter((job, i, jobs) => jobs.findIndex((other) => other.title.toLowerCase() === job.title.toLowerCase()) === i);
}

export function confirmedExperience(jobs: PriorExperience[]): PriorExperience[] {
  return jobs.filter((job) => job.title.trim()).map((job) => ({
    title: job.title.trim(),
    skills: [...new Set(job.skills.filter((id) => SKILLS.some((skill) => skill.id === id)))],
  }));
}

export async function readResume(file: File): Promise<PriorExperience[]> {
  const bytes = await file.arrayBuffer();
  let text = "";
  if (/\.pdf$/i.test(file.name)) {
    const pdfjs = await import("pdfjs-dist");
    const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const loading = pdfjs.getDocument({ data: new Uint8Array(bytes) });
    try {
      const pdf = await loading.promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join(""));
      }
      text = pages.join("\n");
    } finally { await loading.destroy(); }
  } else if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth/mammoth.browser");
    text = (await mammoth.extractRawText({ arrayBuffer: bytes })).value;
  } else if (/\.txt$/i.test(file.name)) {
    text = new TextDecoder().decode(bytes);
  } else {
    throw new Error("Please choose a PDF, Word (.docx) or plain-text résumé.");
  }
  if (!text.trim()) throw new Error("No readable text found. Try a text-based PDF or Word résumé, or add your job titles manually.");
  return resumeSuggestions(text);
}