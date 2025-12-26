export type RoutinePlan = {
  id: string;
  owner: string;
  name: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TemplateExercise = {
  exerciseId: string;
  type?: "WR" | "BW" | "DR";
  notes?: string;
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
  isSystem: boolean;
  animationUrl?: string | null;
};


