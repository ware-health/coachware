import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateExerciseList } from "@/components/template-exercise-list";
import { TemplateExerciseActions } from "@/components/template-exercise-actions";
import { exerciseLibrary, exerciseMap } from "@/data/exercises";
import { Exercise, ExerciseSet, TemplateExercise } from "@/lib/types";

export default async function TemplateDetailPage({
  params
}: {
  params: { planId: string; templateId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: template } = await supabase
    .from("routine_templates")
    .select("*")
    .eq("id", params.templateId)
    .eq("planId", params.planId)
    .eq("owner", user?.id)
    .single();

  if (!template) {
    notFound();
  }

  const updateMeta = async (formData: FormData) => {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("routine_templates")
      .update({ name, notes })
      .eq("id", params.templateId)
      .eq("owner", user.id);

    revalidatePath(`/plans/${params.planId}/templates/${params.templateId}`);
  };

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

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-neutral-500">Template</p>
          <h1 className="text-2xl font-semibold">{template.name}</h1>
          {template.notes ? (
            <p className="text-sm text-neutral-600">{template.notes}</p>
          ) : null}
        </div>
        <TemplateExerciseActions
          planId={params.planId}
          templateId={params.templateId}
          exercises={exerciseLibrary}
          rounded
        />
      </div>

      <div className="space-y-3">
        <TemplateExerciseList
          planId={params.planId}
          templateId={params.templateId}
          exercises={normalizeExercises(template.exercises)}
        />
      </div>
    </div>
  );
}


