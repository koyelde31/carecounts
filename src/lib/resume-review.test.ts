import { describe, it, expect } from "vitest";
import { confirmedExperience, resumeSuggestions } from "./resume-review";
import { groupedRoleMatches, needsCaregivingDetail } from "./care-engine";

describe("private résumé review", () => {
  it("extracts titles and skills without employers or employment dates", () => {
    const jobs = resumeSuggestions("Jane Example\nOperations Coordinator | Example Corporation | 2018–2021\nScheduled appointments and tracked records.\nOffice Manager | Another Company | 2021–2022\nSupervised staff and managed budgets.");
    expect(jobs).toEqual([
      { title: "Operations Coordinator", skills: ["scheduling", "compliance"] },
      { title: "Office Manager", skills: ["supervision", "budget"] },
    ]);
  });
  it("retains only confirmed title and known skill IDs", () => {
    const job = { title: "Office Manager", skills: ["budget", "budget", "invented"], employer: "Example", dates: "2020" };
    expect(confirmedExperience([job])).toEqual([{ title: "Office Manager", skills: ["budget"] }]);
  });
  it("does not infer skills from a title alone", () => {
    expect(resumeSuggestions("Operations Manager")).toEqual([{ title: "Operations Manager", skills: [] }]);
  });
});

describe("caregiving detail and career expansion", () => {
  it.each(["cared for my kid", "cared for my aging parents"])("offers optional detail prompts for %s", (text) => {
    expect(needsCaregivingDetail(text)).toBe(true);
  });
  it("does not probe a task that already describes concrete scheduling work", () => {
    expect(needsCaregivingDetail("Cared for my kid and scheduled appointments")).toBe(false);
  });
  it("separates prior-only, care-only and combined evidence without restricting care matches", () => {
    const groups = groupedRoleMatches(["crisis"], [{ title: "Accountant", skills: ["budget"] }]);
    expect(groups.prior.map((m) => m.role.id)).toContain("office-manager");
    expect(groups.caregiving.map((m) => m.role.id)).toContain("team-lead");
    expect(groups.both.map((m) => m.role.id)).toContain("ops-manager");
    expect(groups.caregiving.find((m) => m.role.id === "team-lead")?.matched).toEqual(["crisis"]);
  });
});