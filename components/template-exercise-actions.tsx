"use client";

import { Exercise } from "@/lib/types";
import { ExercisePicker } from "@/components/exercise-picker";
import { addExerciseToTemplate } from "@/app/actions/templates";
import { useTransition } from "react";

type Props = {
  planId: string;
  templateId: string;
  exercises: Exercise[];
};

export function TemplateExerciseActions({ planId, templateId, exercises }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <ExercisePicker
        exercises={exercises}
        pageSize={12}
        onSelect={(exercise) => {
          startTransition(() => {
            addExerciseToTemplate({
              templateId,
              planId,
              exerciseId: exercise.id,
              type: exercise.type
            });
          });
        }}
      />
      {pending ? <p className="text-xs text-neutral-500">Saving...</p> : null}
    </div>
  );
}


