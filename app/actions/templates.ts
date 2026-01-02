"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Exercise, ExerciseSet, TemplateExercise } from "@/lib/types";
import { exerciseMap } from "@/data/exercises";

async function getSessionAndClient() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
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

  // Normalize alternatives - ensure it's always an array
  const alternatives: Exercise[] = Array.isArray(raw?.alternatives)
    ? raw.alternatives.map((alt: any) => {
        const altId = alt?.id || "";
        const altLibraryExercise = altId ? exerciseMap[altId] : undefined;
        return {
          id: altId,
          name: alt?.name || altLibraryExercise?.name || altId || "Exercise",
          type: alt?.type || altLibraryExercise?.type || "WR",
          notes: alt?.notes || altLibraryExercise?.notes || "",
          primaryMuscleGroup: alt?.primaryMuscleGroup || altLibraryExercise?.primaryMuscleGroup,
          isSystem: alt?.isSystem ?? altLibraryExercise?.isSystem ?? true,
          animationUrl: alt?.animationUrl ?? altLibraryExercise?.animationUrl ?? null
        };
      })
    : [];

  return {
    exercise,
    alternatives,
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

  const { supabase, user } = await getSessionAndClient();
  if (!user || !supabase) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("routine_templates")
    .insert({
      name,
      notes,
      planId,
      owner: user.id,
      exercises: []
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/plans/${planId}`);
  redirect(`/plans/${planId}`);
}

export async function updateTemplateMeta(templateId: string, payload: {
  name?: string;
  notes?: string;
  planId: string;
}) {
  const { supabase, user } = await getSessionAndClient();
  if (!user || !supabase) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("routine_templates")
    .update({
      name: payload.name,
      notes: payload.notes
    })
    .eq("id", templateId)
    .eq("owner", user.id);

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
  const { supabase, user } = await getSessionAndClient();
  if (!user || !supabase) return { error: "Not authenticated" };

  const { data: template, error: fetchError } = await supabase
    .from("routine_templates")
    .select("exercises, owner")
    .eq("id", args.templateId)
    .eq("owner", user.id)
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
    .eq("owner", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/plans/${args.planId}/templates/${args.templateId}`);
  return { success: true };
}

export async function removeExerciseFromTemplate(args: {
  templateId: string;
  planId: string;
  index: number;
}) {
  const { supabase, user } = await getSessionAndClient();
  if (!user || !supabase) return { error: "Not authenticated" };

  const { data: template, error: fetchError } = await supabase
    .from("routine_templates")
    .select("exercises")
    .eq("id", args.templateId)
    .eq("owner", user.id)
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
    .eq("owner", user.id);

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
  const { supabase, user } = await getSessionAndClient();
  if (!user || !supabase) return { error: "Not authenticated" };

  const { data: template, error: fetchError } = await supabase
    .from("routine_templates")
    .select("exercises")
    .eq("id", args.templateId)
    .eq("owner", user.id)
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
    .eq("owner", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/plans/${args.planId}/templates/${args.templateId}`);
  return { success: true };
}

export async function updateExerciseAlternatives(args: {
  templateId: string;
  planId: string;
  exerciseIndex: number;
  alternatives: Exercise[];
}) {
  const { supabase, user } = await getSessionAndClient();
  if (!user || !supabase) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate alternatives is an array (never null)
  if (!Array.isArray(args.alternatives)) {
    return {
      success: false,
      error: "Alternatives must be an array",
      code: "INVALID_ALTERNATIVES_TYPE"
    };
  }

  // Validate maximum of 5 alternatives
  if (args.alternatives.length > 5) {
    return {
      success: false,
      error: "Maximum of 5 alternatives allowed per exercise",
      code: "MAX_ALTERNATIVES_EXCEEDED"
    };
  }

  // Fetch template
  const { data: template, error: fetchError } = await supabase
    .from("routine_templates")
    .select("exercises, owner")
    .eq("id", args.templateId)
    .eq("owner", user.id)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const exercises: TemplateExercise[] = normalizeExercises(template?.exercises);

  // Validate exercise index exists
  if (args.exerciseIndex < 0 || args.exerciseIndex >= exercises.length) {
    return {
      success: false,
      error: "Invalid exercise index",
      code: "INVALID_EXERCISE_INDEX"
    };
  }

  const targetExercise = exercises[args.exerciseIndex];
  const primaryExerciseId = targetExercise.exercise.id;

  // Collect all exercise IDs already in the template (primary exercises only)
  const existingExerciseIds = new Set(
    exercises.map((ex) => ex.exercise.id)
  );

  // Validate each alternative
  const seenIds = new Set<string>();
  for (const alt of args.alternatives) {
    // Validate exercise ID exists
    if (!alt.id) {
      return {
        success: false,
        error: "All alternatives must have a valid exercise ID",
        code: "INVALID_EXERCISE_ID"
      };
    }

    // Check if exercise exists in library (for system exercises) or has required fields
    if (!exerciseMap[alt.id] && !alt.name) {
      return {
        success: false,
        error: `Exercise with ID "${alt.id}" not found`,
        code: "EXERCISE_NOT_FOUND"
      };
    }

    // Validate no self-reference
    if (alt.id === primaryExerciseId) {
      return {
        success: false,
        error: "An exercise cannot be its own alternative",
        code: "SELF_REFERENCE_NOT_ALLOWED"
      };
    }

    // Validate no duplicates in alternatives array
    if (seenIds.has(alt.id)) {
      return {
        success: false,
        error: `Duplicate alternative exercise: "${alt.id}"`,
        code: "DUPLICATE_ALTERNATIVE"
      };
    }
    seenIds.add(alt.id);

    // Validate alternative is not already in template as a primary exercise
    if (existingExerciseIds.has(alt.id)) {
      return {
        success: false,
        error: `Exercise "${alt.id}" is already in the template and cannot be used as an alternative`,
        code: "EXERCISE_ALREADY_IN_TEMPLATE"
      };
    }
  }

  // Note: We're replacing all alternatives, so we don't need to check against existing alternatives

  // Normalize alternatives to ensure they have all required fields
  const normalizedAlternatives: Exercise[] = args.alternatives.map((alt) => {
    const libraryExercise = exerciseMap[alt.id];
    return {
      id: alt.id,
      name: alt.name || libraryExercise?.name || alt.id,
      type: alt.type || libraryExercise?.type || "WR",
      notes: alt.notes || libraryExercise?.notes || "",
      primaryMuscleGroup: alt.primaryMuscleGroup || libraryExercise?.primaryMuscleGroup,
      isSystem: alt.isSystem ?? libraryExercise?.isSystem ?? true,
      animationUrl: alt.animationUrl ?? libraryExercise?.animationUrl ?? null
    };
  });

  // Update the exercise with new alternatives
  exercises[args.exerciseIndex] = {
    ...targetExercise,
    alternatives: normalizedAlternatives
  };

  // Save to database
  const { error: updateError } = await supabase
    .from("routine_templates")
    .update({ exercises })
    .eq("id", args.templateId)
    .eq("owner", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/plans/${args.planId}/templates/${args.templateId}`);
  return { success: true };
}

export async function deleteTemplate(args: {
  templateId: string;
  planId: string;
}) {
  const { supabase, user } = await getSessionAndClient();
  if (!user || !supabase) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("routine_templates")
    .delete()
    .eq("id", args.templateId)
    .eq("owner", user.id)
    .eq("planId", args.planId);

  if (error) return { error: error.message };

  revalidatePath(`/plans/${args.planId}`);
  return { success: true };
}


