export type RoutinePlan = {
  id: string;
  owner: string;
  name: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ExerciseSet = {
  reps: number;
  value1: number;
  value2: number;
  weight: number;
  checked: boolean;
};

export type TemplateExercise = {
  exercise: Exercise & {
    primaryMuscleGroup?: string;
  };
  sets: ExerciseSet[];
  notes: string;
  superSetId?: string;
};

export type RoutineTemplate = {
  id: string;
  owner: string;
  planId: string;
  name: string;
  notes: string | null;
  exercises: TemplateExercise[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type Exercise = {
  id: string;
  name: string;
  type: "WR" | "BW" | "DR";
  notes?: string;
  primaryMuscleGroup?: string;
  isSystem?: boolean;
  animationUrl?: string | null;
};


