"use client";

import { Exercise } from "@/lib/types";
import { ExercisePicker } from "@/components/exercise-picker";
import { addExerciseToTemplate } from "@/app/actions/templates";
import { useTransition } from "react";

type Props = {
  planId: string;
  templateId: string;
  exercises: Exercise[];
  rounded?: boolean;
};

export function TemplateExerciseActions({
  planId,
  templateId,
  exercises,
  rounded
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <ExercisePicker
        exercises={exercises}
        pageSize={12}
        rounded={rounded}
        label="+ Add exercise"
        onSelect={(exercise, type) => {
          startTransition(() => {
            addExerciseToTemplate({
              templateId,
              planId,
              exercise,
              type
            });
          });
        }}
      />
      {pending ? <p className="text-xs text-neutral-500">Saving...</p> : null}
    </div>
  );
}


