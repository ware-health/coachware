"use client";

import { Exercise, TemplateExercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  moveExerciseInTemplate,
  removeExerciseFromTemplate
} from "@/app/actions/templates";
import { useTransition } from "react";
import { exerciseMap } from "@/data/exercises";

type Props = {
  planId: string;
  templateId: string;
  exercises: TemplateExercise[];
};

export function TemplateExerciseList({ planId, templateId, exercises }: Props) {
  const [pending, startTransition] = useTransition();

  const handleMove = (from: number, to: number) => {
    startTransition(() => {
      moveExerciseInTemplate({ templateId, planId, from, to });
    });
  };

  const handleRemove = (index: number) => {
    startTransition(() => {
      removeExerciseFromTemplate({ templateId, planId, index });
    });
  };

  if (exercises.length === 0) {
    return <p className="text-sm text-neutral-600">No exercises yet.</p>;
  }

  return (
    <div className="space-y-3">
      {exercises.map((item, idx) => {
        const exercise: Exercise | undefined = exerciseMap[item.exerciseId];
        return (
          <div
            key={`${item.exerciseId}-${idx}`}
            className="flex items-center justify-between border border-black bg-white p-3"
          >
            <div>
              <p className="text-sm font-semibold">
                {exercise?.name || item.exerciseId}
              </p>
              <p className="text-xs text-neutral-600">
                {item.type || exercise?.type || "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMove(idx, Math.max(0, idx - 1))}
                disabled={idx === 0 || pending}
              >
                Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMove(idx, Math.min(exercises.length - 1, idx + 1))}
                disabled={idx === exercises.length - 1 || pending}
              >
                Down
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(idx)}
                disabled={pending}
              >
                Remove
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}


