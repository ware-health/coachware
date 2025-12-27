"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createClientPlan(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();

  if (!name || !clientId) return { error: "Name and client are required" };

  const supabase = await createClient();
  if (!supabase) return { error: "Supabase unavailable" };

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Create the routine plan
  const { data: plan, error: planError } = await supabase
    .from("routine_plans")
    .insert({
      name,
      notes,
      owner: user.id,
      clientId
    })
    .select()
    .single();

  if (planError || !plan) return { error: planError?.message || "Plan creation failed" };

  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}


