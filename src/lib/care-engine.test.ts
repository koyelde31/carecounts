import { describe, it, expect } from "vitest";
import { detectSkills, matchRoles, makeBullets, customRole } from "./care-engine";

const tasks = [
  { id: "a", text: "Coordinated appointments between three specialists", evidence: {} },
  { id: "b", text: "Supervised two home aides", evidence: { staff: "2" } },
];

describe("care engine", () => {
  it("cites the supporting example for each skill", () => {
    const m = detectSkills(tasks);
    expect(m.find((x) => x.skill.id === "coordination")?.taskIds).toEqual(["a"]);
    expect(m.find((x) => x.skill.id === "supervision")?.taskIds).toEqual(["b"]);
  });
  it("offers leadership roles when supervision evidence exists", () => {
    const roles = matchRoles(["supervision", "scheduling"]).map((r) => r.role.direction);
    expect(roles).toContain("Leadership");
  });
  it("never invents numbers and flags missing evidence", () => {
    const b = makeBullets(tasks, detectSkills(tasks), ["coordination", "supervision"]);
    expect(b[0]!.text).not.toMatch(/\d/);
    expect(b[0]!.missing).not.toBeNull();
    expect(b[1]!.text).toContain("2 support staff");
    expect(b[1]!.missing).toBeNull();
  });
  it("reads skills from a pasted job description", () => {
    expect(customRole("X", "You will supervise staff and manage the budget").skills).toEqual(["supervision", "budget"]);
  });
});

import { roleBullets, ROLES as R } from "./care-engine";
describe("role-tailored résumé lines", () => {
  const t = [
    { id: "a", text: "Coordinated appointments between my father's doctors", evidence: {} },
    { id: "b", text: "Supervised two home aides", evidence: { staff: "2" } },
    { id: "c", text: "Tracked the care budget", evidence: {} },
    { id: "d", text: "Kept family updated by email", evidence: {} },
  ];
  const ops = R.find((r) => r.id === "ops-manager")!;
  it("gives the 3 strongest lines, role skills first", () => {
    const b = roleBullets(t, ops, ["coordination", "supervision", "budget", "communication"]);
    expect(b.map((x) => x.skillId)).toEqual(["supervision", "budget", "coordination"]);
  });
  it("uses workplace terms, not caregiving words", () => {
    const text = roleBullets(t, ops, ["coordination", "supervision"]).map((x) => x.text).join(" ");
    expect(text).not.toMatch(/father|doctor|aide|family/i);
  });
  it("adds only facts the caregiver gave", () => {
    const b = roleBullets(t, ops, ["coordination"], { coordination: { count: "4", often: "weekly", result: "Cut missed appointments" } });
    expect(b[0]!.text).toBe("Coordinated schedules and handoffs across 4 external providers and service vendors on a weekly basis, cut missed appointments.");
    expect(roleBullets(t, ops, ["coordination"])[0]!.text).not.toMatch(/\d/);
  });
});
import { makeInterview } from "./care-engine";
it("interview situation uses workplace terms", () => {
  const s = makeInterview({ id: "a", text: "Coordinated my father's doctors", evidence: { providers: "3" } }, "coordination", "Ops");
  expect(s).not.toMatch(/father|doctor/i);
  expect(s).toContain("3 external providers");
});
