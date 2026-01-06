"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AnimationPreview } from "@/components/animation-preview";
import { exerciseMap } from "@/data/exercises";

type Log = {
  id: string;
  name: string;
  notes: string | null;
  startTime: string;
  endTime: string;
  exercises: any;
  createdAt: string;
};

type Day = {
  date: string; // ISO string
  key: string;
  isLogged: boolean;
  isDisabled: boolean;
};

type MonthBucket = {
  label: string;
  year: number;
  month: number;
  days: Day[];
};

type Props = {
  monthBuckets: MonthBucket[];
  logColorMap: Record<string, string>;
  logsByDate: Record<string, Log[]>;
};

export function ClientCalendar({ monthBuckets, logColorMap, logsByDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedLogs = selectedDate ? logsByDate[selectedDate] || [] : [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatSet = (set: any, exerciseType?: string) => {
    const type = exerciseType || "WR";
    
    if (type === "WR") {
      // Weights & reps
      const weight = set.weight || 0;
      const reps = set.reps || 0;
      if (weight > 0 && reps > 0) {
        return `${weight}kg × ${reps} reps`;
      } else if (reps > 0) {
        return `${reps} reps`;
      } else if (weight > 0) {
        return `${weight}kg`;
      }
      return "—";
    } else if (type === "BW") {
      // Bodyweight (reps)
      const reps = set.reps || 0;
      return reps > 0 ? `${reps} reps` : "—";
    } else if (type === "DR") {
      // Duration
      const value1 = set.value1 || 0;
      const value2 = set.value2 || 0;
      if (value1 > 0 && value2 > 0) {
        return `${value1}:${String(value2).padStart(2, "0")} (${value1 * 60 + value2} min)`;
      } else if (value1 > 0) {
        return `${value1} min`;
      }
      return "—";
    }
    
    // Fallback: show all values
    const parts: string[] = [];
    if (set.weight > 0) parts.push(`${set.weight}kg`);
    if (set.reps > 0) parts.push(`${set.reps} reps`);
    if (set.value1 > 0) parts.push(`v1: ${set.value1}`);
    if (set.value2 > 0) parts.push(`v2: ${set.value2}`);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {monthBuckets.map((month, idx) => {
          const startOffset = ((new Date(month.year, month.month, 1).getDay() ?? 0) + 6) % 7; // Monday start
          return (
            <div key={`${month.year}-${month.month}-${idx}`} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">{month.label}</span>
                  <span className="text-xs text-neutral-500">{month.year}</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-neutral-400">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {Array.from({ length: startOffset }).map((_, idx) => (
                  <div key={`pad-${month.year}-${month.month}-${idx}`} className="h-9 w-9" />
                ))}
                {month.days.map((day) => {
                  const dayNum = new Date(day.date).getDate();
                  const iso = day.key;
                  const isLogged = day.isLogged;
                  const color = logColorMap[iso];
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => isLogged && setSelectedDate(iso)}
                      disabled={!isLogged}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-semibold transition-colors ${
                        isLogged
                          ? color
                            ? `${color} text-emerald-950 shadow-sm cursor-pointer hover:opacity-80`
                            : "bg-emerald-400 text-emerald-950 shadow-sm cursor-pointer hover:opacity-80"
                          : day.isDisabled
                          ? "bg-white text-neutral-200 cursor-not-allowed"
                          : "bg-neutral-50 text-neutral-400 border border-neutral-100 cursor-default"
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <SheetContent side="right" className="w-[32rem] overflow-y-auto">
          {selectedDate && (
            <div className="space-y-6">
              <div className="border-b border-neutral-200 pb-4">
                <p className="text-xs uppercase text-neutral-500 mb-1">Workout Logs</p>
                <h2 className="text-2xl font-semibold text-neutral-900">
                  {new Date(selectedDate).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </h2>
              </div>

              {selectedLogs.length > 0 ? (
                <div className="space-y-6">
                  {selectedLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                      {/* Workout Header */}
                      <div className="bg-neutral-50 px-5 py-4 border-b border-neutral-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-neutral-900">{log.name}</h3>
                            {log.notes && (
                              <p className="text-sm text-neutral-600 mt-1.5">{log.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Time Info */}
                        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-neutral-200/50">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            <div>
                              <span className="text-xs text-neutral-500 block">Start</span>
                              <span className="text-sm font-semibold text-neutral-900">{formatTime(log.startTime)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <div>
                              <span className="text-xs text-neutral-500 block">End</span>
                              <span className="text-sm font-semibold text-neutral-900">{formatTime(log.endTime)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-neutral-400"></div>
                            <div>
                              <span className="text-xs text-neutral-500 block">Duration</span>
                              <span className="text-sm font-semibold text-neutral-900">
                                {formatDuration(log.startTime, log.endTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Exercises Section */}
                      {log.exercises && Array.isArray(log.exercises) && log.exercises.length > 0 && (
                        <div className="p-5 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-neutral-200"></div>
                            <p className="text-xs font-semibold uppercase text-neutral-500 px-2">
                              {log.exercises.length} Exercise{log.exercises.length !== 1 ? "s" : ""}
                            </p>
                            <div className="h-px flex-1 bg-neutral-200"></div>
                          </div>
                          
                          <div className="space-y-4">
                            {log.exercises.map((exercise: any, idx: number) => {
                              const exerciseId = exercise.exercise?.id || exercise.exerciseId || "";
                              const exerciseName = exercise.exercise?.name || exercise.name || `Exercise ${idx + 1}`;
                              const exerciseType = exercise.exercise?.type || exercise.type;
                              const exerciseFromLibrary = exerciseId ? exerciseMap[exerciseId] : undefined;
                              const animationUrl = exercise.exercise?.animationUrl || exerciseFromLibrary?.animationUrl || null;
                              const sets = exercise.sets && Array.isArray(exercise.sets) ? exercise.sets : [];
                              const completedSets = sets.filter((s: any) => s.checked).length;
                              
                              return (
                                <div key={idx} className="rounded-lg border border-neutral-200 bg-neutral-50/50 overflow-hidden">
                                  {/* Exercise Header with Animation */}
                                  <div className="flex items-start gap-4 p-4 bg-white border-b border-neutral-200">
                                    <div className="flex-shrink-0">
                                      <div className="h-16 w-16 rounded-lg overflow-hidden border border-neutral-200 bg-white">
                                        <AnimationPreview
                                          animationUrl={animationUrl}
                                          name={exerciseName}
                                          size="sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-base font-semibold text-neutral-900 mb-1">
                                        {exerciseName}
                                      </h4>
                                      <div className="flex items-center gap-3 text-xs text-neutral-600">
                                        <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                                          {exerciseType === "WR" ? "Weights & Reps" : exerciseType === "BW" ? "Bodyweight" : "Duration"}
                                        </span>
                                        {sets.length > 0 && (
                                          <span className="text-neutral-500">
                                            {completedSets}/{sets.length} sets completed
                                          </span>
                                        )}
                                      </div>
                                      {exercise.notes && (
                                        <p className="text-xs text-neutral-600 italic mt-1.5">
                                          {exercise.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Sets */}
                                  {sets.length > 0 ? (
                                    <div className="p-4 space-y-2">
                                      <div className="grid gap-2">
                                        {sets.map((set: any, setIdx: number) => (
                                          <div
                                            key={setIdx}
                                            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                                              set.checked
                                                ? "bg-emerald-50 border border-emerald-200"
                                                : "bg-white border border-neutral-200"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className={`text-xs font-medium ${
                                                set.checked ? "text-emerald-700" : "text-neutral-500"
                                              }`}>
                                                Set {setIdx + 1}
                                              </span>
                                              {set.checked && (
                                                <span className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                                  <span className="text-[10px] text-white">✓</span>
                                                </span>
                                              )}
                                            </div>
                                            <span className={`font-semibold ${
                                              set.checked ? "text-emerald-900" : "text-neutral-700"
                                            }`}>
                                              {formatSet(set, exerciseType)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-4 text-center">
                                      <p className="text-xs text-neutral-500">No sets recorded</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
                    <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 mb-1">No logs found</p>
                  <p className="text-xs text-neutral-500">No workout logs were recorded for this date.</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

