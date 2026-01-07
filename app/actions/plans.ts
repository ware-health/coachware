"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deletePlan(planId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase unavailable" };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get the plan to find the clientId before deleting
  const { data: plan } = await supabase
    .from("routine_plans")
    .select("clientId")
    .eq("id", planId)
    .eq("owner", user.id)
    .single();

  const { error } = await supabase
    .from("routine_plans")
    .delete()
    .eq("id", planId)
    .eq("owner", user.id);

  if (error) return { error: error.message };

  // Revalidate the client page if this was a client plan
  if (plan?.clientId) {
    revalidatePath(`/clients/${plan.clientId}`);
  }
  
  return { success: true };
}


