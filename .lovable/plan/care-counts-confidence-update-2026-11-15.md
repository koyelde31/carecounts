# Care Counts: confidence update

Keep the current layout, colors, wording and privacy rules. Add two things.

## 1. Skill strength summary
A new section in the workspace (and at the end of the skills step) listing every skill the caregiver's own entries support.

For each skill:
- The skill name in workplace terms (for example "Vendor and provider coordination").
- The caregiver's own example that proves it, quoted from what they typed or confirmed from their résumé.
- An evidence level, decided by clear rules and never by guessing:
  - **Shown** – one example mentions it.
  - **Strong** – several examples, or an example plus a number they gave (how many, how often, what improved).
  - **Proven in both** – supported by caregiving and by a confirmed prior job title.
- One "make it stronger" tip naming the fact that is missing (for example "Add how many providers you coordinated"), with a button that jumps to that question.
- Short, factual note such as "This is project coordination work employers hire for." No promises about getting hired.

## 2. Ready-made résumé entry
In the drafts step, a new "Résumé entry" option that builds a complete job block:
- Title the caregiver picks from workplace options (Family Care Manager, Household Operations Manager, Care Coordinator) or types their own.
- Start and end month/year they choose; both optional. No employer name, no care-recipient details.
- The 3 strongest role-tailored lines already built, editable.
- Preview shown as it would appear on a résumé, then save, copy, or download as PDF or Word like other drafts.

## Technical details
- Evidence-level rules and entry builder live in the existing rule engine with tests for: level rules, quoted example comes from user text, no invented numbers, entry contains no recipient words, dates only when given.
- Entry saved as a new draft kind in the existing private drafts table; no new tables.
