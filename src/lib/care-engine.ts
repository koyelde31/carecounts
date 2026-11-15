// Guided-template engine: keyword rules map caregiver tasks to employer-recognized skills,
// skills to roles, and facts to drafts. No AI; every output cites the user's own text.

export type Evidence = { providers?: string; budget?: string; staff?: string; other?: string };
export type CareTask = { id: string; text: string; evidence: Evidence };
export type PriorExperience = { title: string; skills: string[] };
export type WorkspaceData = {
  period?: string;
  tasks: CareTask[];
  chosenSkills?: string[];
  targetRoleId?: string;
  jobDescription?: string;
  customRoleTitle?: string;
  outputs?: OutputKind[];
  priorExperience?: PriorExperience[];
};
export type OutputKind = "resume" | "linkedin" | "interview";
export type Stage = "started" | "exploring" | "drafting" | "ready";

export const STAGES: { id: Stage; label: string }[] = [
  { id: "started", label: "Started" },
  { id: "exploring", label: "Exploring Skills" },
  { id: "drafting", label: "Drafting" },
  { id: "ready", label: "Ready to Use" },
];

export type Skill = {
  id: string;
  name: string;
  plain: string;
  keywords: string[];
  verb: string;
  evidenceHint: string;
};

export const SKILLS: Skill[] = [
  { id: "coordination", name: "Cross-team coordination", plain: "You kept several separate people or organizations working from the same plan.", keywords: ["coordinat", "provider", "doctor", "specialist", "therap", "nurse", "liaison", "between", "team", "agency", "agencies", "clinic"], verb: "Coordinated", evidenceHint: "How many providers or organizations did you coordinate?" },
  { id: "scheduling", name: "Scheduling and logistics", plain: "You planned and adjusted calendars, transport and appointments so nothing fell through.", keywords: ["schedul", "appointment", "calendar", "transport", "rota", "shift", "logistic", "plan", "rides", "driv"], verb: "Managed", evidenceHint: "How many appointments or schedules per week or month?" },
  { id: "crisis", name: "Crisis response and risk management", plain: "You made calm, fast decisions when something went wrong and put plans in place to prevent repeats.", keywords: ["emergenc", "crisis", "urgent", "hospital", "er ", "fall", "incident", "risk", "safety", "911", "ambulance"], verb: "Led", evidenceHint: "How many emergencies did you handle, or what changed afterwards?" },
  { id: "supervision", name: "Staff supervision", plain: "You directed the work of paid or volunteer helpers and checked it was done well.", keywords: ["supervis", "aide", "staff", "carer", "caregiver", "hired", "hire", "train", "onboard", "volunteer", "helper", "nanny", "worker"], verb: "Supervised", evidenceHint: "How many support staff did you supervise?" },
  { id: "budget", name: "Budget and financial management", plain: "You tracked money, bills or benefits and made spending decisions.", keywords: ["budget", "bill", "financ", "money", "expense", "insurance", "claim", "benefit", "cost", "payment", "account"], verb: "Managed", evidenceHint: "Roughly what budget did you manage (per month or year)?" },
  { id: "advocacy", name: "Advocacy and negotiation", plain: "You represented someone's needs to institutions and pushed for a better outcome.", keywords: ["advocat", "appeal", "negotiat", "insurance", "denied", "fought", "dispute", "represent", "school", "iep"], verb: "Negotiated", evidenceHint: "What was the outcome (approved, reversed, saved)?" },
  { id: "compliance", name: "Records and compliance", plain: "You kept accurate records and followed rules, dosages or regulations carefully.", keywords: ["medication", "record", "document", "log", "track", "paperwork", "form", "compliance", "regulat", "dosage", "chart"], verb: "Maintained", evidenceHint: "How many medications, records or forms did you manage?" },
  { id: "communication", name: "Stakeholder communication", plain: "You kept family members, professionals and others informed and aligned.", keywords: ["communicat", "update", "family", "explain", "inform", "meeting", "call", "email", "liaise", "report"], verb: "Communicated", evidenceHint: "How many people did you keep updated, and how often?" },
  { id: "research", name: "Research and problem solving", plain: "You found information, compared options and solved unfamiliar problems.", keywords: ["research", "found", "compare", "option", "learn", "solv", "figure", "investigat", "evaluat"], verb: "Researched", evidenceHint: "What decision did your research support?" },
];

export type Role = {
  id: string;
  title: string;
  direction: "Operations" | "Leadership" | "Project delivery" | "Health and care" | "Client services" | "Administration";
  skills: string[];
  note: string;
};

export const ROLES: Role[] = [
  { id: "ops-coordinator", title: "Operations Coordinator", direction: "Operations", skills: ["scheduling", "coordination", "compliance", "budget"], note: "Keeps daily operations, vendors and schedules running." },
  { id: "ops-manager", title: "Operations Manager", direction: "Leadership", skills: ["supervision", "budget", "coordination", "crisis", "scheduling"], note: "Most postings also ask for prior management titles; your supervision evidence is the bridge." },
  { id: "team-lead", title: "Team Lead / Shift Supervisor", direction: "Leadership", skills: ["supervision", "scheduling", "communication", "crisis"], note: "Leads a team day to day and handles escalations." },
  { id: "project-coordinator", title: "Project Coordinator", direction: "Project delivery", skills: ["coordination", "scheduling", "communication", "research"], note: "Tracks tasks and deadlines across several contributors." },
  { id: "program-manager", title: "Program Manager (nonprofit)", direction: "Leadership", skills: ["coordination", "budget", "advocacy", "communication", "supervision"], note: "Runs services for a community; budget and partner evidence matters." },
  { id: "care-coordinator", title: "Care Coordinator / Patient Navigator", direction: "Health and care", skills: ["coordination", "advocacy", "compliance", "communication"], note: "Some employers require a certification or health background." },
  { id: "case-manager", title: "Case Manager", direction: "Health and care", skills: ["advocacy", "compliance", "coordination", "crisis"], note: "Many positions require a social work or nursing license." },
  { id: "customer-success", title: "Customer Success Manager", direction: "Client services", skills: ["communication", "advocacy", "research", "crisis"], note: "Advocating for someone's needs translates to advocating for clients." },
  { id: "facilities", title: "Facilities / Safety Coordinator", direction: "Operations", skills: ["crisis", "compliance", "scheduling", "supervision"], note: "Safety and incident planning are central." },
  { id: "office-manager", title: "Office Manager", direction: "Administration", skills: ["scheduling", "budget", "compliance", "supervision"], note: "Often includes supervising staff and managing budgets." },
];

const norm = (s: string) => ` ${s.toLowerCase()} `;

export type SkillMatch = { skill: Skill; taskIds: string[]; keywords: string[] };

export function detectSkills(tasks: CareTask[]): SkillMatch[] {
  const out: SkillMatch[] = [];
  for (const skill of SKILLS) {
    const taskIds: string[] = [];
    const kws = new Set<string>();
    for (const t of tasks) {
      const text = norm(t.text);
      const hits = skill.keywords.filter((k) => text.includes(k));
      const evHit =
        (skill.id === "coordination" && t.evidence.providers) ||
        (skill.id === "budget" && t.evidence.budget) ||
        (skill.id === "supervision" && t.evidence.staff);
      if (hits.length || evHit) {
        taskIds.push(t.id);
        hits.forEach((h) => kws.add(h.trim()));
      }
    }
    if (taskIds.length) out.push({ skill, taskIds, keywords: [...kws] });
  }
  return out;
}

export function skillsInText(text: string): string[] {
  const t = norm(text);
  return SKILLS.filter((s) => s.keywords.some((k) => t.includes(k))).map((s) => s.id);
}

export type RoleMatch = {
  role: Role;
  matched: string[];
  missing: string[];
  strength: "Strong overlap" | "Partial overlap" | "Some overlap";
  why: string;
};

export function matchRole(role: Role, skillIds: string[]): RoleMatch {
  const matched = role.skills.filter((s) => skillIds.includes(s));
  const missing = role.skills.filter((s) => !skillIds.includes(s));
  const ratio = role.skills.length ? matched.length / role.skills.length : 0;
  const strength = ratio >= 0.75 ? "Strong overlap" : ratio >= 0.5 ? "Partial overlap" : "Some overlap";
  const names = matched.map((id) => skillName(id).toLowerCase());
  const why = matched.length
    ? `This role asks for ${names.join(", ")} — your examples show each of these.`
    : "Your examples don't yet show the skills this role usually asks for.";
  return { role, matched, missing, strength, why };
}

export function matchRoles(skillIds: string[]): RoleMatch[] {
  return ROLES.map((r) => matchRole(r, skillIds))
    .filter((m) => m.matched.length > 0)
    .sort((a, b) => b.matched.length / b.role.skills.length - a.matched.length / a.role.skills.length);
}

export function groupedRoleMatches(careSkills: string[], prior: PriorExperience[], roles = ROLES) {
  const priorSkills = [...new Set(prior.flatMap((job) => job.skills))];
  const groups: Record<"prior" | "caregiving" | "both", RoleMatch[]> = { prior: [], caregiving: [], both: [] };
  for (const role of roles) {
    const care = matchRole(role, careSkills);
    const previous = matchRole(role, priorSkills);
    if (!care.matched.length && !previous.matched.length) continue;
    const group = care.matched.length && previous.matched.length ? "both" : care.matched.length ? "caregiving" : "prior";
    const match = matchRole(role, [...new Set([...careSkills, ...priorSkills])]);
    const sources = [
      ...care.matched.map((id) => `${skillName(id)} from your caregiving examples`),
      ...previous.matched.map((id) => `${skillName(id)} from your confirmed prior work (${prior.filter((job) => job.skills.includes(id)).map((job) => job.title).join(", ")})`),
    ];
    groups[group].push({ ...match, why: `Supported by: ${sources.join("; ")}.` });
  }
  Object.values(groups).forEach((list) => list.sort((a, b) => b.matched.length / b.role.skills.length - a.matched.length / a.role.skills.length));
  return groups;
}

export function needsCaregivingDetail(text: string) {
  const vague = /\b(cared?\s+for|care\s+for|look(?:ed|ing)?\s+after|caregiv|care\s*giver|care\s+of)\b/i.test(text);
  return vague && detectSkills([{ id: "entry", text, evidence: {} }]).length === 0;
}

export const CARE_DETAIL_PROMPTS = [
  { id: "schedules", question: "What schedules, appointments or transport did you manage?" },
  { id: "coordination", question: "What did you coordinate between professionals or services?" },
  { id: "decisions", question: "What options did you research, and what decisions did you make?" },
  { id: "emergencies", question: "How did you handle an emergency or make a safety plan?" },
  { id: "budgets", question: "What bills, spending or budgets did you manage?" },
  { id: "helpers", question: "Did you supervise or train helpers? What did you do?" },
];

export function customRole(title: string, jd: string): Role {
  const skills = skillsInText(jd);
  return { id: "custom", title: title || "Your target role", direction: "Operations", skills, note: "Built from the job description you pasted." };
}

export const skillName = (id: string) => SKILLS.find((s) => s.id === id)?.name ?? id;

function clean(text: string) {
  let t = text.trim().replace(/\s+/g, " ").replace(/[.]+$/, "");
  t = t.replace(/^(i |i've |i have |i was |i )/i, "");
  return t.charAt(0).toLowerCase() + t.slice(1);
}

function evidenceSuffix(ev: Evidence): string {
  const parts: string[] = [];
  if (ev.providers) parts.push(`${ev.providers} providers`);
  if (ev.staff) parts.push(`${ev.staff} support staff`);
  if (ev.budget) parts.push(`a budget of ${ev.budget}`);
  if (ev.other) parts.push(ev.other);
  return parts.length ? `, involving ${parts.join(", ")}` : "";
}

export type Bullet = { text: string; skillId: string; taskId: string; missing: string | null };

export function makeBullets(tasks: CareTask[], matches: SkillMatch[], skillIds: string[]): Bullet[] {
  const bullets: Bullet[] = [];
  const used = new Set<string>();
  for (const id of skillIds) {
    const m = matches.find((x) => x.skill.id === id);
    if (!m) continue;
    const task = tasks.find((t) => m.taskIds.includes(t.id) && !used.has(t.id)) ?? tasks.find((t) => m.taskIds.includes(t.id));
    if (!task) continue;
    used.add(task.id);
    const hasNumbers = Object.values(task.evidence).some(Boolean);
    const body = clean(task.text);
    const startsWithVerb = /^[a-z]+ed\b/.test(body);
    const text = `${startsWithVerb ? body.charAt(0).toUpperCase() + body.slice(1) : `${m.skill.verb}: ${body}`}${evidenceSuffix(task.evidence)}.`;
    bullets.push({ text, skillId: id, taskId: task.id, missing: hasNumbers ? null : m.skill.evidenceHint });
  }
  return bullets;
}

export function makeHeading(period?: string) {
  return `Family Caregiver${period ? ` · ${period.trim()}` : ""}`;
}

export function makeLinkedIn(roleTitle: string, skillIds: string[], period?: string) {
  const names = skillIds.slice(0, 4).map((s) => skillName(s).toLowerCase());
  return `${makeHeading(period)}\n\nFull-time caregiving management role responsible for ${names.join(", ")}, coordinating external providers, vendors and support staff. Bringing these ${roleTitle} skills to my next role.`;
}

export function makeInterview(task: CareTask | undefined, skillId: string | undefined, roleTitle: string) {
  if (!task || !skillId) return "";
  const s = SKILLS.find((x) => x.id === skillId);
  if (!s) return "";
  return [
    `Situation: In a full-time caregiving management role, I ${workLine(task, skillId).replace(/^./, (c) => c.toLowerCase())}.`,
    `Task: I needed to make sure [describe what had to go right — in your words].`,
    `Action: I ${s.verb.toLowerCase()} [the specific steps you took].`,
    `Result: [what changed because of your work — only facts you can stand behind].`,
    `Why it matters for ${roleTitle}: this is the same ${s.name.toLowerCase()} the role asks for.`,
  ].join("\n\n");
}

export const EXAMPLE_TASKS = [
  "Coordinated appointments between my father's cardiologist, physical therapist and home nurse",
  "Managed a weekly schedule of medications, transport and shift changes for two home aides",
  "Handled emergencies, including a fall that needed a hospital visit, and set up a safety plan afterwards",
  "Supervised support staff and trained new aides on routines",
  "Tracked insurance claims and the monthly care budget, and appealed a denied claim",
];

export function nextStage(d: WorkspaceData, draftCount: number): Stage {
  if (draftCount > 0) return "ready";
  if (d.targetRoleId) return "drafting";
  if (d.tasks.length > 0) return "exploring";
  return "started";
}

// ---- Role-tailored résumé lines: role terms + action + scope + result, workplace wording only.
export type BulletFacts = { count?: string | undefined; often?: string | undefined; result?: string | undefined };
export type RoleBullet = { skillId: string; taskId: string; text: string; questions: { key: keyof BulletFacts; q: string }[] };

const PURPOSE: Record<Role["direction"], string> = {
  Operations: "to keep daily operations on schedule",
  Leadership: "to deliver consistent team performance",
  "Project delivery": "to keep deliverables on time",
  "Health and care": "to ensure continuity of client care",
  "Client services": "to improve client outcomes",
  Administration: "to keep office processes running smoothly",
};

const n = (v?: string) => (v?.trim() ? `${v.trim()} ` : "");
const LINES: Record<string, (f: BulletFacts) => string> = {
  coordination: (f) => `Coordinated schedules and handoffs across ${n(f.count)}external providers and service vendors`,
  scheduling: (f) => `Managed ${n(f.count)}recurring appointments, transport bookings and staff shift changes`,
  crisis: (f) => `Led response to ${n(f.count)}urgent safety incidents and implemented a documented risk-prevention plan`,
  supervision: (f) => `Supervised and trained ${n(f.count)}support staff on daily procedures and quality standards`,
  budget: (f) => `Managed ${f.count?.trim() ? `a ${f.count.trim()} budget` : "the operating budget"}, tracking invoices, insurance claims and payments`,
  advocacy: (f) => `Negotiated with insurers and institutions on ${n(f.count)}disputed claims and service decisions`,
  compliance: (f) => `Maintained accurate, compliant records for ${f.count?.trim() ? `${f.count.trim()} ` : ""}regulated items, forms and logs`,
  communication: (f) => `Kept ${n(f.count)}stakeholders aligned through regular status updates`,
  research: (f) => `Researched and evaluated ${n(f.count)}vendor and service options to support key decisions`,
};

export function roleBullets(tasks: CareTask[], role: Role | undefined, chosen: string[], facts: Record<string, BulletFacts> = {}): RoleBullet[] {
  const matches = detectSkills(tasks).filter((m) => chosen.includes(m.skill.id));
  const ranked = matches.sort((a, b) =>
    Number(role?.skills.includes(b.skill.id)) - Number(role?.skills.includes(a.skill.id)) ||
    (role ? role.skills.indexOf(a.skill.id) - role.skills.indexOf(b.skill.id) : 0) ||
    b.taskIds.length - a.taskIds.length);
  const purpose = PURPOSE[role?.direction ?? "Operations"];
  return ranked.slice(0, 3).map((m) => {
    const task = tasks.find((t) => t.id === m.taskIds[0])!;
    const ev = task.evidence;
    const pre = m.skill.id === "coordination" ? ev.providers : m.skill.id === "supervision" ? ev.staff : m.skill.id === "budget" ? ev.budget : undefined;
    const f: BulletFacts = { count: pre, ...facts[m.skill.id] };
    const often = f.often?.trim() ? ` on a ${f.often.trim().replace(/^(on a |every )/i, "")} basis` : "";
    const result = f.result?.trim() ? `, ${f.result.trim().replace(/[.]+$/, "").replace(/^./, (c) => c.toLowerCase())}` : ` ${purpose}`;
    return {
      skillId: m.skill.id,
      taskId: task.id,
      text: `${LINES[m.skill.id]!(f)}${often}${result}.`,
      questions: [
        { key: "count", q: m.skill.evidenceHint },
        { key: "often", q: "How often? (e.g. weekly, daily)" },
        { key: "result", q: "What improved because of this? (e.g. reduced missed appointments)" },
      ],
    };
  });
}

function workLine(task: CareTask, skillId: string) {
  const ev = task.evidence;
  const count = skillId === "coordination" ? ev.providers : skillId === "supervision" ? ev.staff : skillId === "budget" ? ev.budget : undefined;
  return LINES[skillId]?.({ count }) ?? clean(task.text);
}

// ---- Skill strength summary: evidence levels decided by fixed rules, never guessed.
export type StrengthLevel = "shown" | "strong" | "both";
export const LEVEL_LABEL: Record<StrengthLevel, string> = { shown: "Shown", strong: "Strong", both: "Proven in both" };
export type SkillStrength = {
  skill: Skill;
  level: StrengthLevel;
  examples: string[];
  priorTitles: string[];
  tip: string | null;
  note: string;
};

export function skillStrengths(tasks: CareTask[], chosen: string[] | undefined, prior: PriorExperience[] = []): SkillStrength[] {
  const matches = detectSkills(tasks).filter((m) => !chosen || chosen.includes(m.skill.id));
  const ids = new Set([...matches.map((m) => m.skill.id), ...prior.flatMap((p) => p.skills)]);
  const out: SkillStrength[] = [];
  for (const skill of SKILLS) {
    if (!ids.has(skill.id)) continue;
    const m = matches.find((x) => x.skill.id === skill.id);
    const careTasks = (m?.taskIds ?? []).map((id) => tasks.find((t) => t.id === id)!).filter(Boolean);
    const priorTitles = prior.filter((p) => p.skills.includes(skill.id)).map((p) => p.title);
    const hasNumber = careTasks.some((t) => Object.values(t.evidence).some((v) => v?.trim()));
    const level: StrengthLevel = careTasks.length && priorTitles.length ? "both" : careTasks.length >= 2 || hasNumber ? "strong" : "shown";
    const roles = ROLES.filter((r) => r.skills.includes(skill.id)).slice(0, 2).map((r) => r.title);
    out.push({
      skill,
      level,
      examples: careTasks.map((t) => t.text),
      priorTitles,
      tip: careTasks.length && !hasNumber ? skill.evidenceHint : null,
      note: `This is ${skill.name.toLowerCase()} — roles like ${roles.join(" and ")} list it.`,
    });
  }
  const rank: Record<StrengthLevel, number> = { both: 0, strong: 1, shown: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

// ---- Ready-made résumé entry: caregiver-chosen title and dates, no employer or recipient details.
export const RESUME_TITLES = ["Family Care Manager", "Household Operations Manager", "Care Coordinator"];

export function makeResumeEntry(title: string, start: string, end: string, lines: string[]) {
  const s = start.trim(), e = end.trim();
  const dates = s && e ? `${s} – ${e}` : s ? `Since ${s}` : e ? `Until ${e}` : "";
  const head = `${title.trim() || RESUME_TITLES[0]}${dates ? ` | ${dates}` : ""}`;
  return [head, ...lines.filter((l) => l.trim()).map((l) => `• ${l.trim()}`)].join("\n");
}
