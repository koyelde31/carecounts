import { describe, expect, it } from "vitest";
import { makeResumeEntry, skillStrengths, type CareTask } from "./care-engine";

const t = (id: string, text: string, evidence = {}): CareTask => ({ id, text, evidence });

describe("skill strength levels", () => {
  it("one example without numbers is Shown and asks for the missing fact", () => {
    const [s] = skillStrengths([t("a", "Supervised a helper")], ["supervision"]);
    expect(s!.level).toBe("shown");
    expect(s!.tip).toBe("How many support staff did you supervise?");
    expect(s!.examples).toEqual(["Supervised a helper"]);
  });
  it("an example plus a number is Strong with no tip", () => {
    const [s] = skillStrengths([t("a", "Supervised helpers", { staff: "2" })], ["supervision"]);
    expect(s!.level).toBe("strong");
    expect(s!.tip).toBeNull();
  });
  it("two examples are Strong", () => {
    const s = skillStrengths([t("a", "Supervised a helper"), t("b", "Trained a new aide")], ["supervision"]);
    expect(s.find((x) => x.skill.id === "supervision")!.level).toBe("strong");
  });
  it("caregiving plus a confirmed job title is Proven in both", () => {
    const s = skillStrengths([t("a", "Supervised a helper")], ["supervision"], [{ title: "Shift Lead", skills: ["supervision"] }]);
    expect(s[0]!.level).toBe("both");
    expect(s[0]!.priorTitles).toEqual(["Shift Lead"]);
  });
});

describe("résumé entry", () => {
  it("shows dates only when given and never adds employer or recipient words", () => {
    expect(makeResumeEntry("Care Coordinator", "", "", ["Did X."])).toBe("Care Coordinator\n• Did X.");
    expect(makeResumeEntry("Care Coordinator", "Mar 2021", "Jun 2024", ["A"])).toBe("Care Coordinator | Mar 2021 – Jun 2024\n• A");
    expect(makeResumeEntry("Family Care Manager", "2021", "", ["A"])).not.toMatch(/present|father|mother|child/i);
  });
});
