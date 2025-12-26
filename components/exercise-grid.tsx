"use client";

import { useMemo, useState } from "react";
import { Exercise } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimationPreview } from "@/components/animation-preview";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Props = {
  exercises: Exercise[];
  allowAdd?: boolean;
  onAdd?: (exercise: Exercise) => void;
  pageSize?: number;
};

export function ExerciseGrid({
  exercises,
  allowAdd = false,
  onAdd,
  pageSize = 24
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = exercises.filter((ex) =>
      ex.name.toLowerCase().includes(query.toLowerCase())
    );
    setPage(1);
    return list;
  }, [exercises, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const current = filtered.slice(start, start + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search exercises"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span>
            {filtered.length} items • Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-600">No exercises found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {current.map((exercise) => (
            <Sheet
              key={exercise.id}
              open={selected?.id === exercise.id}
              onOpenChange={(isOpen) => setSelected(isOpen ? exercise : null)}
            >
              <SheetTrigger asChild>
                <button
                  onClick={() => setSelected(exercise)}
                  className="flex h-full flex-col border border-black bg-white text-left"
                >
                  <AnimationPreview
                    animationUrl={exercise.animationUrl}
                    name={exercise.name}
                  />
                  <div className="p-3">
                    <p className="text-sm font-semibold">{exercise.name}</p>
                    <p className="text-xs text-neutral-600">
                      {exercise.isSystem ? "System" : "Custom"}
                    </p>
                  </div>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-96">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-neutral-500">Exercise</p>
                    <h2 className="text-xl font-semibold">{exercise.name}</h2>
                  </div>
                  <AnimationPreview
                    animationUrl={exercise.animationUrl}
                    name={exercise.name}
                  />
                  {exercise.notes ? (
                    <p className="text-sm text-neutral-700">{exercise.notes}</p>
                  ) : (
                    <p className="text-sm text-neutral-500">No notes provided.</p>
                  )}
                  <Button
                    className="w-full"
                    disabled={!allowAdd}
                    onClick={() => {
                      if (!allowAdd) return;
                      onAdd?.(exercise);
                    }}
                  >
                    {allowAdd ? "Add to template" : "Open a template to add"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      )}
    </div>
  );
}

