"use client";

import { Exercise, TemplateExercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { moveExerciseInTemplate, removeExerciseFromTemplate } from "@/app/actions/templates";
import { useState, useTransition } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { exerciseMap } from "@/data/exercises";
import { AnimationPreview } from "@/components/animation-preview";

type Props = {
  planId: string;
  templateId: string;
  exercises: TemplateExercise[];
};

export function TemplateExerciseList({ planId, templateId, exercises }: Props) {
  const [pending, startTransition] = useTransition();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const formatType = (value?: Exercise["type"]) => {
    if (value === "WR") return "Weights & reps";
    if (value === "BW") return "Bodyweight (reps)";
    if (value === "DR") return "Duration";
    return "N/A";
  };

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
              <th className="w-20 px-4 pr-8 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Preview
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Exercise
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Type
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
                const exerciseId =
                  item.exercise?.id ||
                  (item as any).exerciseId ||
                  `exercise-${idx}`;
                const mapped = exerciseId ? exerciseMap[exerciseId] : undefined;
                const exercise: Exercise | undefined = item.exercise || mapped;
                return (
                  <tr
                    key={`${exerciseId}-${idx}`}
                    className={`cursor-pointer hover:bg-neutral-50 ${dragIndex === idx ? "bg-neutral-100" : ""}`}
                    draggable
                    onDragStart={() => setDragIndex(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragIndex === null || dragIndex === idx) return;
                      handleMove(dragIndex, idx);
                      setDragIndex(idx);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <td className="w-20 px-4 pr-8 py-2">
                      <div className="flex h-12 w-12 items-center justify-center">
                        <AnimationPreview
                          animationUrl={exercise?.animationUrl}
                          name={exercise?.name || exerciseId}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">
                      {exercise?.name || exerciseId}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {formatType(item.exercise?.type || exercise?.type)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <SheetContent side="right" className="w-96">
          {selectedIndex !== null ? (
            <div className="flex h-full flex-col gap-4">
              {(() => {
                const item = exercises[selectedIndex];
                const exerciseId =
                  item.exercise?.id ||
                  (item as any).exerciseId ||
                  `exercise-${selectedIndex}`;
                const mapped = exerciseId ? exerciseMap[exerciseId] : undefined;
                const exercise = item.exercise || mapped;
                return (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase text-neutral-500">Exercise</p>
                      <h2 className="text-xl font-semibold">
                        {exercise?.name || exerciseId}
                      </h2>
                    </div>
                    <AnimationPreview
                      animationUrl={exercise?.animationUrl}
                      name={exercise?.name || exerciseId}
                    />
                    <p className="text-sm text-neutral-700">
                      Type: {formatType(item.exercise?.type || exercise?.type)}
                    </p>
                  </div>
                );
              })()}
              <Button
                variant="default"
                className="mt-auto w-full bg-red-600 text-white hover:bg-red-500"
                disabled={pending}
                onClick={() => {
                  handleRemove(selectedIndex as number);
                  setSelectedIndex(null);
                }}
              >
                Remove from template
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}


