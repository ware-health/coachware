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
        <div className="overflow-hidden rounded-lg border border-neutral-300">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                    Preview
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {current.map((exercise) => (
                  <tr
                    key={exercise.id}
                    className="hover:bg-neutral-50 cursor-pointer"
                    onClick={() => setSelected(exercise)}
                  >
                    <td className="px-4 py-2">
                      <div className="flex h-12 w-12 items-center justify-center">
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
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {exercise.isSystem ? "System" : "Custom"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Sheet
        open={!!selected}
        onOpenChange={(isOpen) => !isOpen && setSelected(null)}
      >
        {selected ? (
          <SheetContent side="right" className="w-96">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase text-neutral-500">Exercise</p>
                <h2 className="text-xl font-semibold">{selected.name}</h2>
              </div>
              <AnimationPreview
                animationUrl={selected.animationUrl}
                name={selected.name}
              />
              {selected.notes ? (
                <p className="text-sm text-neutral-700">{selected.notes}</p>
              ) : (
                <p className="text-sm text-neutral-500">No notes provided.</p>
              )}
              <Button
                className="w-full"
                disabled={!allowAdd}
                onClick={() => {
                  if (!allowAdd || !selected) return;
                  onAdd?.(selected);
                  setSelected(null);
                }}
              >
                {allowAdd ? "Add to template" : "Open a template to add"}
              </Button>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  );
}

