<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Skill detection, role matching and draft text come from rule templates in `src/lib/care-engine.ts`, not AI; outputs must cite the user's own task text and never invent numbers.
- Caregiver data lives only in owner-scoped tables (`workspaces`, `drafts`); no admin or manager read paths.
- Sign-in is email magic link only (`signInWithOtp`).
- Parse optional résumés with dynamically imported browser readers and hold review candidates only in component state; this keeps original files and unconfirmed content out of storage and server requests.
- Store confirmed prior-experience titles and skill IDs within the existing owner-scoped workspace JSON; this preserves the existing private save and deletion paths.
- Classify role suggestions by explicit prior and caregiving skill evidence, never infer skills or qualifications from a job title; this keeps career expansion evidence-backed.
