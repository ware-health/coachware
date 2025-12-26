"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPlan(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (!name) return { error: "Plan name is required" };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase unavailable" };
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("routine_plans")
    .insert({
      name,
      notes,
      owner: session.user.id
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/plans");
  return { data };
}


