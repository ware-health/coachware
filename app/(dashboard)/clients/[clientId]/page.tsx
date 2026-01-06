import Link from "next/link";
import { createClientPlan } from "@/app/actions/client-plans";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CreateClientPlanForm } from "@/components/create-client-plan-form";
import { ClientCalendar } from "@/components/client-calendar";
import { notFound, redirect } from "next/navigation";
import { EnvelopeClosedIcon, CalendarIcon, PersonIcon } from "@radix-ui/react-icons";

type Props = {
  params: { clientId: string };
};

export default async function ClientDetailPage({
  params,
  searchParams
}: {
  params: { clientId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, email, created_at")
    .eq("id", params.clientId)
    .single();

  if (!client) {
    notFound();
  }

  const { data: plans } = await supabase
    .from("routine_plans")
    .select("*")
    .eq("owner", user.id)
    .eq("clientId", params.clientId)
    .order("createdAt", { ascending: false });
  const planRows = plans || [];

  const createClientPlanAction = async (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => {
    "use server";
    return await createClientPlan(formData);
  };

  const [{ data: routineLogs }] = await Promise.all([
    supabase.from("routine_logs").select("*").eq("owner", params.clientId)
  ]);

  const startDate = client?.created_at
    ? new Date(client.created_at as string)
    : new Date(new Date().getFullYear(), 0, 1);
  const endDate = new Date(new Date().getFullYear(), 11, 31);

  const logDates = new Set<string>();
  const logsByDate = new Map<string, any[]>();
  
  (routineLogs || []).forEach((log: any) => {
    // Use startTime as primary date field, fallback to createdAt
    const raw = log?.startTime || log?.createdAt;
    if (raw) {
      const iso = new Date(raw).toISOString().slice(0, 10);
      logDates.add(iso);
      
      // Group logs by date
      if (!logsByDate.has(iso)) {
        logsByDate.set(iso, []);
      }
      logsByDate.get(iso)!.push(log);
    }
  });

  // Map consecutive logged days to color bands for a heatmap-like look.
  const colorPalette = [
    "bg-emerald-200",
    "bg-emerald-300",
    "bg-emerald-400",
    "bg-emerald-500",
    "bg-emerald-600"
  ];
  const sortedLogIso = Array.from(logDates).sort();
  const logColorMap = new Map<string, string>();
  let segmentIndex = -1;
  let prevDate: Date | null = null;
  for (const iso of sortedLogIso) {
    const current = new Date(iso);
    const isConsecutive =
      prevDate && (current.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24) === 1;
    if (!isConsecutive) {
      segmentIndex += 1;
    }
    const color = colorPalette[segmentIndex % colorPalette.length];
    logColorMap.set(iso, color);
    prevDate = current;
  }

  // Latest attendance
  const latestLogIso = routineLogs
    ?.map((log: any) => {
      // Use startTime as primary date field, fallback to createdAt
      const raw = log?.startTime || log?.createdAt;
      return raw ? new Date(raw).toISOString() : null;
    })
    .filter(Boolean)
    .sort()
    .at(-1);

  const latestLogDate = latestLogIso ? new Date(latestLogIso) : null;
  const daysSinceLast =
    latestLogDate != null
      ? Math.max(0, Math.floor((Date.now() - latestLogDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

  // Build aligned month buckets from start month through year end.
  const monthBuckets: {
    label: string;
    year: number;
    month: number;
    days: { date: Date; key: string; isLogged: boolean; isDisabled: boolean }[];
  }[] = [];

  const monthCursor = new Date(startDate);
  monthCursor.setDate(1);

  while (monthCursor <= endDate) {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, idx) => {
      const date = new Date(year, month, idx + 1);
      const key = date.toISOString().slice(0, 10);
      const isLogged = logDates.has(key);
      const isDisabled = date < startDate || date > endDate;
      return { date, key, isLogged, isDisabled };
    });

    monthBuckets.push({
      label: monthCursor.toLocaleString("default", { month: "short" }),
      year,
      month,
      days
    });

    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-lg font-semibold text-white shadow-sm">
            {client.name?.[0]?.toUpperCase() ?? "C"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900">{client.name}</h1>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
              <EnvelopeClosedIcon className="h-4 w-4 text-neutral-400" />
              <span>{client.email}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">Joined</span>
                <span className="font-medium text-neutral-800">
                  {client.created_at
                    ? new Date(client.created_at as string).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric"
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PersonIcon className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-500">Attended</span>
                <span className="font-medium text-neutral-800">
                  {daysSinceLast != null ? `${daysSinceLast} days ago` : "No sessions yet"}
                </span>
              </div>
            </div>
          </div>
        </div>
        {planRows.length === 0 ? (
          <CreateClientPlanSheet clientId={params.clientId} action={createClientPlanAction} />
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-300">
        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                  Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {planRows.length > 0 ? (
                planRows.map((plan) => (
                  <tr key={plan.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">
                      <Link
                        href={`/plans/${plan.id}`}
                        className="text-neutral-900 hover:underline"
                      >
                        {plan.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {plan.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {plan.updatedAt
                        ? new Date(plan.updatedAt).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-sm text-neutral-600" colSpan={3}>
                    No client-specific plans yet. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {monthBuckets.map((month, idx) => {
          const startOffset = ((new Date(month.year, month.month, 1).getDay() ?? 0) + 6) % 7; // Monday start
          return (
            <div key={`${month.year}-${month.month}-${idx}`} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">{month.label}</span>
                  <span className="text-xs text-neutral-500">
                    {month.year}
                  </span>
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
                    <div
                      key={iso}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-[12px] font-semibold transition-colors ${
                        isLogged
                          ? color
                            ? `${color} text-emerald-950 shadow-sm`
                            : "bg-emerald-400 text-emerald-950 shadow-sm"
                          : day.isDisabled
                          ? "bg-white text-neutral-200"
                          : "bg-neutral-50 text-neutral-400 border border-neutral-100"
                      }`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateClientPlanSheet({
  clientId,
  action
}: {
  clientId: string;
  action: (prevState: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | void>;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="rounded-md px-4 py-2">Create routine plan</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[28rem]">
        <CreateClientPlanForm clientId={clientId} action={action} />
      </SheetContent>
    </Sheet>
  );
}



