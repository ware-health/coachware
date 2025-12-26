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

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300">
      <div className="min-w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Exercise
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {exercises.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-4 text-sm text-neutral-600"
                >
                  No exercises yet.
                </td>
              </tr>
            ) : (
              exercises.map((item, idx) => {
                const exercise: Exercise | undefined = exerciseMap[item.exerciseId];
                return (
                  <tr key={`${item.exerciseId}-${idx}`} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">
                      {exercise?.name || item.exerciseId}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {item.type || exercise?.type || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">
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
                          onClick={() =>
                            handleMove(idx, Math.min(exercises.length - 1, idx + 1))
                          }
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


