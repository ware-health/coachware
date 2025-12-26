import { Exercise } from "@/lib/types";
import rawExercises from "../public/exercises/lottie_exercises.json";

type RawExercise = {
  id: string;
  name: string;
  lottie?: string;
  isSystem?: boolean;
};

export const exerciseLibrary: Exercise[] = (rawExercises as RawExercise[]).map(
  (item) => ({
    id: item.id,
    name: item.name,
    type: "WR",
    notes: "",
    isSystem: item.isSystem ?? true,
    animationUrl: item.lottie
      ? `/${item.lottie.replace(/^\/+/, "").replace(/^assets\//, "")}`
      : null
  })
);

export const exerciseMap = Object.fromEntries(
  exerciseLibrary.map((ex) => [ex.id, ex])
);


