"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Exercise, ExerciseSet, TemplateExercise } from "@/lib/types";
import { exerciseMap } from "@/data/exercises";

async function getSessionAndClient() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, session: null };
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return { supabase, session };
}

const defaultSet = (): ExerciseSet => ({
  reps: 0,
  value1: 0,
  value2: 0,
  weight: 0,
  checked: false
});

const normalizeExercise = (raw: any): TemplateExercise => {
  const rawExercise = raw?.exercise || null;
  const exerciseId = raw?.exerciseId || rawExercise?.id || "";
  const libraryExercise = exerciseId ? exerciseMap[exerciseId] : undefined;

  const exercise: Exercise = {
    id: exerciseId,
    name: rawExercise?.name || libraryExercise?.name || exerciseId || "Exercise",
    type: rawExercise?.type || raw?.type || libraryExercise?.type || "WR",
    notes: rawExercise?.notes || raw?.notes || "",
    primaryMuscleGroup: rawExercise?.primaryMuscleGroup,
    isSystem: rawExercise?.isSystem ?? libraryExercise?.isSystem ?? true,
    animationUrl: rawExercise?.animationUrl ?? libraryExercise?.animationUrl ?? null
  };

  const sets: ExerciseSet[] = Array.isArray(raw?.sets)
    ? raw.sets.map((s: any) => ({
        reps: Number(s?.reps ?? 0),
        value1: Number(s?.value1 ?? 0),
        value2: Number(s?.value2 ?? 0),
        weight: Number(s?.weight ?? 0),
        checked: Boolean(s?.checked)
      }))
    : [defaultSet()];

  return {
    exercise,
    notes: raw?.notes ?? "",
    superSetId: raw?.superSetId ?? "",
    sets
  };
};

const normalizeExercises = (value: unknown): TemplateExercise[] => {
  if (Array.isArray(value)) return value.map(normalizeExercise);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(normalizeExercise) : [];
    } catch {
      return [];
    }
  }
  return [];
};

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
  exercise: Exercise;
  type?: Exercise["type"];
  notes?: string;
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

  const exercises: TemplateExercise[] = normalizeExercises(template?.exercises);

  const exerciseToAdd: TemplateExercise = {
    exercise: {
      ...args.exercise,
      type: args.type ?? args.exercise.type,
      isSystem: args.exercise.isSystem ?? true
    },
    notes: args.notes ?? "",
    superSetId: "",
    sets: [defaultSet()]
  };

  exercises.push(exerciseToAdd);

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
  const exercises: TemplateExercise[] = normalizeExercises(template?.exercises);

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
  const exercises: TemplateExercise[] = normalizeExercises(template?.exercises);

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


