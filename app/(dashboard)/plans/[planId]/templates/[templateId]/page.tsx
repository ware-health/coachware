import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TemplateExerciseList } from "@/components/template-exercise-list";
import { TemplateExerciseActions } from "@/components/template-exercise-actions";
import { DeleteTemplateButton } from "@/components/delete-template-button";
import { ClientCalendar } from "@/components/client-calendar";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
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

  // Get plan to get clientId
  const { data: plan } = await supabase
    .from("routine_plans")
    .select("*")
    .eq("id", params.planId)
    .eq("owner", user?.id)
    .single();

  if (!plan || !plan.clientId) {
    notFound();
  }

  // Get client for calendar start date
  const { data: client } = await supabase
    .from("clients")
    .select("id, created_at")
    .eq("id", plan.clientId)
    .single();

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

  // Fetch logs for calendar - filtered by templateId
  const { data: routineLogs } = await supabase
    .from("routine_logs")
    .select("*")
    .eq("templateId", params.templateId);

  // Enrich logs with plan information
  const enrichedLogs = (routineLogs || []).map((log: any) => {
    return {
      ...log,
      planName: plan.name || null
    };
  });

  const startDate = client?.created_at
    ? new Date(client.created_at as string)
    : new Date(new Date().getFullYear(), 0, 1);
  const endDate = new Date(new Date().getFullYear(), 11, 31);

  const logDates = new Set<string>();
  const logsByDate = new Map<string, any[]>();
  
  enrichedLogs.forEach((log: any) => {
    // Use startTime as primary date field, fallback to createdAt
    const raw = log?.startTime || log?.createdAt;
    if (raw) {
      const iso = new Date(raw).toISOString().slice(0, 10);
      logDates.add(iso);
      
      // Group logs by date
      if (!logsByDate.has(iso)) {
        logsByDate.set(iso, []);
      }
      logsByDate.get(iso)!.push(log);
    }
  });

  // Map consecutive logged days to color bands for a heatmap-like look.
  const colorPalette = [
    "bg-emerald-200",
    "bg-emerald-300",
    "bg-emerald-400",
    "bg-emerald-500",
    "bg-emerald-600"
  ];
  const sortedLogIso = Array.from(logDates).sort();
  const logColorMap = new Map<string, string>();
  let segmentIndex = -1;
  let prevDate: Date | null = null;
  for (const iso of sortedLogIso) {
    const current = new Date(iso);
    const isConsecutive =
      prevDate && (current.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24) === 1;
    if (!isConsecutive) {
      segmentIndex += 1;
    }
    const color = colorPalette[segmentIndex % colorPalette.length];
    logColorMap.set(iso, color);
    prevDate = current;
  }

  // Convert Maps to plain objects for client component
  const logColorMapObj: Record<string, string> = Object.fromEntries(logColorMap);
  const logsByDateObj: Record<string, any[]> = Object.fromEntries(
    Array.from(logsByDate.entries()).map(([date, logs]) => [date, logs])
  );

  // Build aligned month buckets from start month through year end.
  const monthBuckets: {
    label: string;
    year: number;
    month: number;
    days: { date: string; key: string; isLogged: boolean; isDisabled: boolean }[];
  }[] = [];

  const monthCursor = new Date(startDate);
  monthCursor.setDate(1);

  while (monthCursor <= endDate) {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, idx) => {
      const date = new Date(year, month, idx + 1);
      const key = date.toISOString().slice(0, 10);
      const isLogged = logDates.has(key);
      const isDisabled = date < startDate || date > endDate;
      return { date: date.toISOString(), key, isLogged, isDisabled };
    });

    monthBuckets.push({
      label: monthCursor.toLocaleString("default", { month: "short" }),
      year,
      month,
      days
    });

    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href={`/plans/${params.planId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 flex items-start justify-between">
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
      </div>

      <div className="space-y-3">
        <TemplateExerciseList
          planId={params.planId}
          templateId={params.templateId}
          exercises={normalizeExercises(template.exercises)}
        />
      </div>

      <ClientCalendar
        monthBuckets={monthBuckets}
        logColorMap={logColorMapObj}
        logsByDate={logsByDateObj}
      />

      <div className="border-t border-neutral-200 pt-6">
        <DeleteTemplateButton
          templateId={params.templateId}
          planId={params.planId}
          templateName={template.name}
        />
      </div>
    </div>
  );
}


