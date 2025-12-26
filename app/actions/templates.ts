"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TemplateExercise } from "@/lib/types";

async function getSessionAndClient() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, session: null };
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return { supabase, session };
}

export async function createTemplate(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const planId = String(formData.get("planId") || "").trim();

  if (!name || !planId) return { error: "Name and plan are required" };

  const { supabase, session } = await getSessionAndClient();
  if (!session || !supabase) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("routine_templates")
    .insert({
      name,
      notes,
      planId,
      owner: session.user.id,
      exercises: []
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/plans/${planId}`);
  return { data };
}

export async function updateTemplateMeta(templateId: string, payload: {
  name?: string;
  notes?: string;
  planId: string;
}) {
  const { supabase, session } = await getSessionAndClient();
  if (!session || !supabase) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("routine_templates")
    .update({
      name: payload.name,
      notes: payload.notes
    })
    .eq("id", templateId)
    .eq("owner", session.user.id);

  if (error) return { error: error.message };
  revalidatePath(`/plans/${payload.planId}/templates/${templateId}`);
  return { success: true };
}

export async function addExerciseToTemplate(args: {
  templateId: string;
  planId: string;
  exerciseId: string;
  type?: TemplateExercise["type"];
}) {
  const { supabase, session } = await getSessionAndClient();
  if (!session || !supabase) return { error: "Not authenticated" };

  const { data: template, error: fetchError } = await supabase
    .from("routine_templates")
    .select("exercises, owner")
    .eq("id", args.templateId)
    .eq("owner", session.user.id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const exercises: TemplateExercise[] = Array.isArray(template?.exercises)
    ? template.exercises
    : [];

  exercises.push({
    exerciseId: args.exerciseId,
    type: args.type
  });

  const { error } = await supabase
    .from("routine_templates")
    .update({ exercises })
    .eq("id", args.templateId)
    .eq("owner", session.user.id);

  if (error) return { error: error.message };
  revalidatePath(`/plans/${args.planId}/templates/${args.templateId}`);
  return { success: true };
}

export async function removeExerciseFromTemplate(args: {
  templateId: string;
  planId: string;
  index: number;
}) {
  const { supabase, session } = await getSessionAndClient();
  if (!session) return { error: "Not authenticated" };

  const { data: template, error: fetchError } = await supabase
    .from("routine_templates")
    .select("exercises")
    .eq("id", args.templateId)
    .eq("owner", session.user.id)
    .single();

  if (fetchError) return { error: fetchError.message };
  const exercises: TemplateExercise[] = Array.isArray(template?.exercises)
    ? template.exercises
    : [];

  if (args.index < 0 || args.index >= exercises.length) {
    return { error: "Invalid exercise index" };
  }

  exercises.splice(args.index, 1);

  const { error } = await supabase
    .from("routine_templates")
    .update({ exercises })
    .eq("id", args.templateId)
    .eq("owner", session.user.id);

  if (error) return { error: error.message };
  revalidatePath(`/plans/${args.planId}/templates/${args.templateId}`);
  return { success: true };
}

export async function moveExerciseInTemplate(args: {
  templateId: string;
  planId: string;
  from: number;
  to: number;
}) {
  const { supabase, session } = await getSessionAndClient();
  if (!session) return { error: "Not authenticated" };

  const { data: template, error: fetchError } = await supabase
    .from("routine_templates")
    .select("exercises")
    .eq("id", args.templateId)
    .eq("owner", session.user.id)
    .single();

  if (fetchError) return { error: fetchError.message };
  const exercises: TemplateExercise[] = Array.isArray(template?.exercises)
    ? template.exercises
    : [];

  if (
    args.from < 0 ||
    args.from >= exercises.length ||
    args.to < 0 ||
    args.to >= exercises.length
  ) {
    return { error: "Invalid move positions" };
  }

  const [item] = exercises.splice(args.from, 1);
  exercises.splice(args.to, 0, item);

  const { error } = await supabase
    .from("routine_templates")
    .update({ exercises })
    .eq("id", args.templateId)
    .eq("owner", session.user.id);

  if (error) return { error: error.message };
  revalidatePath(`/plans/${args.planId}/templates/${args.templateId}`);
  return { success: true };
}


