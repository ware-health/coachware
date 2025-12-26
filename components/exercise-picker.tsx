"use client";

import { useState } from "react";
import { Exercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ExerciseGrid } from "@/components/exercise-grid";

type Props = {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  pageSize?: number;
};

export function ExercisePicker({ exercises, onSelect, pageSize }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Add exercise</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[28rem]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase text-neutral-500">Add to template</p>
            <h3 className="text-lg font-semibold">Exercise Library</h3>
          </div>
          <ExerciseGrid
            exercises={exercises}
            pageSize={pageSize}
            allowAdd
            onAdd={(exercise) => {
              onSelect(exercise);
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}


