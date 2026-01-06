"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  date: Date;
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
  logColorMap: Map<string, string>;
  logsByDate: Map<string, Log[]>;
};

export function ClientCalendar({ monthBuckets, logColorMap, logsByDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedLogs = selectedDate ? logsByDate.get(selectedDate) || [] : [];

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
                  const dayNum = day.date.getDate();
                  const iso = day.key;
                  const isLogged = day.isLogged;
                  const color = logColorMap.get(iso);
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
        <SheetContent side="right" className="w-[28rem] overflow-y-auto">
          {selectedDate && (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase text-neutral-500">Workout Logs</p>
                <h2 className="text-xl font-semibold">
                  {new Date(selectedDate).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </h2>
              </div>

              {selectedLogs.length > 0 ? (
                <div className="space-y-4">
                  {selectedLogs.map((log) => (
                    <div key={log.id} className="rounded-lg border border-neutral-200 p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-neutral-900">{log.name}</h3>
                          {log.notes && (
                            <p className="text-sm text-neutral-600 mt-1">{log.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="text-neutral-500">Start:</span>{" "}
                          <span className="font-medium">{formatTime(log.startTime)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">End:</span>{" "}
                          <span className="font-medium">{formatTime(log.endTime)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Duration:</span>{" "}
                          <span className="font-medium">
                            {formatDuration(log.startTime, log.endTime)}
                          </span>
                        </div>
                      </div>

                      {log.exercises && Array.isArray(log.exercises) && log.exercises.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-neutral-100">
                          <p className="text-xs font-semibold uppercase text-neutral-500">
                            Exercises ({log.exercises.length})
                          </p>
                          <div className="space-y-2">
                            {log.exercises.map((exercise: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <div className="font-medium text-neutral-900">
                                  {exercise.exercise?.name || exercise.name || `Exercise ${idx + 1}`}
                                </div>
                                {exercise.sets && Array.isArray(exercise.sets) && (
                                  <div className="text-xs text-neutral-600 mt-1">
                                    {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <p>No logs found for this date.</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

