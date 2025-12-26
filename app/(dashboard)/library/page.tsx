import { ExerciseGrid } from "@/components/exercise-grid";
import { exerciseLibrary } from "@/data/exercises";

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-neutral-500">Browse</p>
          <h1 className="text-2xl font-semibold">Exercise Library</h1>
        </div>
      </div>
      <ExerciseGrid exercises={exerciseLibrary} pageSize={24} />
    </div>
  );
}


