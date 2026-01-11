"use client";

import { useState } from "react";
import { Exercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ExerciseGrid } from "@/components/exercise-grid";

type Props = {
  exercises: Exercise[];
  onSelect: (exercise: Exercise, type: Exercise["type"], notes: string) => void;
  pageSize?: number;
  rounded?: boolean;
  label?: string;
};

export function ExercisePicker({
  exercises,
  onSelect,
  pageSize,
  rounded,
  label = "Add exercise"
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          className={rounded ? "rounded-md px-4 py-2" : ""}
        >
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl flex flex-col overflow-hidden">
        <div className="flex-shrink-0 space-y-4 pb-4">
          <div>
            <p className="text-xs uppercase text-neutral-500">Add to template</p>
            <h3 className="text-lg font-semibold">Exercise Library</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 pt-2">
          <ExerciseGrid
            exercises={exercises}
            pageSize={pageSize}
            allowAdd
            onAdd={(exercise, type, notes) => {
              onSelect(exercise, type, notes);
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}


