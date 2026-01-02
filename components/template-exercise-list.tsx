"use client";

import { Exercise, TemplateExercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moveExerciseInTemplate, removeExerciseFromTemplate, updateExerciseAlternatives } from "@/app/actions/templates";
import { useState, useTransition, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { exerciseLibrary, exerciseMap } from "@/data/exercises";
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
  const [showAlternativesPicker, setShowAlternativesPicker] = useState(false);
  const [selectedAlternatives, setSelectedAlternatives] = useState<Exercise[]>([]);
  const [alternativesSearchQuery, setAlternativesSearchQuery] = useState("");

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

  const handleOpenAlternativesPicker = (index: number) => {
    const item = exercises[index];
    setSelectedAlternatives(item.alternatives || []);
    setAlternativesSearchQuery("");
    setShowAlternativesPicker(true);
  };

  const handleSaveAlternatives = (index: number) => {
    startTransition(async () => {
      const result = await updateExerciseAlternatives({
        templateId,
        planId,
        exerciseIndex: index,
        alternatives: selectedAlternatives
      });
      if (result.success) {
        setShowAlternativesPicker(false);
        setSelectedAlternatives([]);
      } else {
        alert(result.error || "Failed to update alternatives");
      }
    });
  };

  // Get available exercises for alternatives (exclude current exercise and exercises already in template)
  const getAvailableExercisesForAlternatives = (currentExerciseIndex: number): Exercise[] => {
    if (currentExerciseIndex < 0 || currentExerciseIndex >= exercises.length) {
      return [];
    }
    const currentExercise = exercises[currentExerciseIndex];
    const currentExerciseId = currentExercise.exercise.id;
    const existingExerciseIds = new Set(exercises.map((ex) => ex.exercise.id));

    return exerciseLibrary.filter(
      (ex) =>
        ex.id !== currentExerciseId &&
        !existingExerciseIds.has(ex.id)
    );
  };

  const toggleAlternative = (exercise: Exercise) => {
    setSelectedAlternatives((prev) => {
      const isSelected = prev.some((alt) => alt.id === exercise.id);
      if (isSelected) {
        return prev.filter((alt) => alt.id !== exercise.id);
      } else {
        if (prev.length >= 5) {
          alert("Maximum of 5 alternatives allowed");
          return prev;
        }
        return [...prev, exercise];
      }
    });
  };

  const availableExercises = useMemo(() => {
    if (selectedIndex === null) return [];
    return getAvailableExercisesForAlternatives(selectedIndex);
  }, [selectedIndex, exercises]);

  const filteredAvailableExercises = useMemo(() => {
    if (!alternativesSearchQuery.trim()) return availableExercises;
    const query = alternativesSearchQuery.toLowerCase();
    return availableExercises.filter((ex) =>
      ex.name.toLowerCase().includes(query)
    );
  }, [availableExercises, alternativesSearchQuery]);

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300">
      <div className="min-w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="w-20 px-4 pr-8 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Exercise
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {exercises.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-sm text-neutral-600">
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
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden">
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
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {item.notes ? (
                        <span className="line-clamp-2">{item.notes}</span>
                      ) : (
                        "—"
                      )}
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
                    {item.notes ? (
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                        Notes: {item.notes}
                      </p>
                    ) : null}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase text-neutral-500">Alternative Exercises</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAlternativesPicker(selectedIndex)}
                        >
                          {item.alternatives && item.alternatives.length > 0
                            ? `Edit (${item.alternatives.length})`
                            : "Add Alternatives"}
                        </Button>
                      </div>
                      {item.alternatives && item.alternatives.length > 0 ? (
                        <div className="space-y-2">
                          {item.alternatives.map((alt) => (
                            <div
                              key={alt.id}
                              className="flex items-center gap-2 rounded-md border border-neutral-200 p-2"
                            >
                              <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
                                <AnimationPreview
                                  animationUrl={alt.animationUrl}
                                  name={alt.name}
                                  size="xs"
                                />
                              </div>
                              <span className="text-sm text-neutral-700">{alt.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500">
                          No alternatives set. Click "Add Alternatives" to add substitute exercises.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="mt-auto space-y-2">
                <Button
                  variant="default"
                  className="w-full bg-red-600 text-white hover:bg-red-500"
                  disabled={pending}
                  onClick={() => {
                    handleRemove(selectedIndex as number);
                    setSelectedIndex(null);
                  }}
                >
                  Remove from template
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Alternatives Picker Sheet */}
      <Sheet open={showAlternativesPicker} onOpenChange={setShowAlternativesPicker}>
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl">
          {selectedIndex !== null ? (
            <div className="flex h-full flex-col gap-4">
              <div>
                <p className="text-xs uppercase text-neutral-500">Select Alternative Exercises</p>
                <h3 className="text-lg font-semibold">
                  {exercises[selectedIndex]?.exercise?.name || "Exercise"}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Select up to 5 alternative exercises. Selected: {selectedAlternatives.length}/5
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                <Input
                  placeholder="Search exercises..."
                  value={alternativesSearchQuery}
                  onChange={(e) => setAlternativesSearchQuery(e.target.value)}
                  className="w-full"
                />
                {filteredAvailableExercises.length === 0 ? (
                  <p className="text-sm text-neutral-600">No exercises found.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-neutral-300">
                    <div className="min-w-full overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="w-20 px-4 pr-8 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                              Name
                            </th>
                            <th className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 bg-white">
                          {filteredAvailableExercises.map((exercise) => {
                            const isSelected = selectedAlternatives.some((alt) => alt.id === exercise.id);
                            return (
                              <tr
                                key={exercise.id}
                                className={`hover:bg-neutral-50 ${isSelected ? "bg-blue-50" : ""}`}
                              >
                                <td className="w-20 px-4 pr-8 py-2">
                                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden">
                                    <AnimationPreview
                                      animationUrl={exercise.animationUrl}
                                      name={exercise.name}
                                      size="sm"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-neutral-900">
                                  {exercise.name}
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleAlternative(exercise)}
                                    disabled={!isSelected && selectedAlternatives.length >= 5}
                                  >
                                    {isSelected ? "Selected" : "Select"}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {selectedAlternatives.length > 0 && (
                <div className="space-y-2 border-t border-neutral-200 pt-4">
                  <p className="text-sm font-medium text-neutral-700">Selected Alternatives:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedAlternatives.map((alt) => (
                      <div
                        key={alt.id}
                        className="flex items-center justify-between rounded-md border border-neutral-200 p-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
                            <AnimationPreview
                              animationUrl={alt.animationUrl}
                              name={alt.name}
                              size="xs"
                            />
                          </div>
                          <span className="text-sm text-neutral-700">{alt.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlternative(alt)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto flex gap-2 border-t border-neutral-200 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAlternativesPicker(false);
                    setSelectedAlternatives([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  disabled={pending}
                  onClick={() => {
                    if (selectedIndex !== null) {
                      handleSaveAlternatives(selectedIndex);
                    }
                  }}
                >
                  {pending ? "Saving..." : "Save Alternatives"}
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}


