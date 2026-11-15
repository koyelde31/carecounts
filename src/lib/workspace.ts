import { supabase } from "@/integrations/supabase/client";
import type { WorkspaceData, Stage } from "./care-engine";

export const emptyData: WorkspaceData = { tasks: [] };

export async function loadWorkspace() {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user!.id;
  const { data } = await supabase.from("workspaces").select("*").eq("user_id", uid).maybeSingle();
  const { data: drafts } = await supabase.from("drafts").select("*").order("updated_at", { ascending: false });
  return {
    uid,
    stage: (data?.stage ?? "started") as Stage,
    data: { ...emptyData, ...((data?.data as unknown as WorkspaceData) ?? {}) },
    drafts: drafts ?? [],
  };
}

export async function saveWorkspace(uid: string, d: WorkspaceData, stage: Stage) {
  const { error } = await supabase.from("workspaces").upsert({
    user_id: uid, data: d as never, stage, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
