import Link from "next/link";
import { createClientPlan } from "@/app/actions/client-plans";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { notFound, redirect } from "next/navigation";

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

  const [{ data: routineLogs }] = await Promise.all([
    supabase.from("routine_logs").select("*").eq("user_id", params.clientId)
  ]);

  const startDate = client?.created_at
    ? new Date(client.created_at as string)
    : new Date(new Date().getFullYear(), 0, 1);
  const endDate = new Date(new Date().getFullYear(), 11, 31);

  const logDates = new Set<string>();
  (routineLogs || []).forEach((log: any) => {
    const raw =
      log?.performed_at ||
      log?.session_date ||
      log?.logged_at ||
      log?.date ||
      log?.created_at;
    if (raw) {
      const iso = new Date(raw).toISOString().slice(0, 10);
      logDates.add(iso);
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

  const generateDays = (from: Date, to: Date) => {
    const days: { date: Date; key: string; isLogged: boolean }[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const iso = cursor.toISOString().slice(0, 10);
      days.push({
        date: new Date(cursor),
        key: iso,
        isLogged: logDates.has(iso)
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  };

  const allDays = generateDays(startDate, endDate);

  const months = allDays.reduce<Record<number, { label: string; days: typeof allDays }>>(
    (acc, day) => {
      const m = day.date.getMonth();
      if (!acc[m]) {
        acc[m] = {
          label: day.date.toLocaleString("default", { month: "short" }),
          days: []
        };
      }
      acc[m].days.push(day);
      return acc;
    },
    {}
  );

  const openCreate = searchParams?.createPlan === "1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-neutral-500">Client</p>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-neutral-600">{client.email}</p>
          <p className="text-sm text-neutral-600">
            Created:{" "}
            {client.created_at
              ? new Date(client.created_at as string).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })
              : "—"}
          </p>
        </div>
        <CreateClientPlanSheet clientId={params.clientId} defaultOpen={openCreate} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(months).map(([monthIdx, month]) => {
          const startOffset = ((month.days[0]?.date.getDay() ?? 0) + 6) % 7; // Monday start
          return (
            <div key={monthIdx} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">{month.label}</span>
                  <span className="text-xs text-neutral-500">
                    {month.days[0]?.date.getFullYear()}
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
                  <div key={`pad-${monthIdx}-${idx}`} className="h-9 w-9" />
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
                        isLogged && color
                          ? `${color} text-emerald-950 shadow-sm`
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
              {plans.length > 0 ? (
                plans.map((plan) => (
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
    </div>
  );
}

function CreateClientPlanSheet({
  clientId,
  defaultOpen = false
}: {
  clientId: string;
  defaultOpen?: boolean;
}) {
  return (
    <Sheet defaultOpen={defaultOpen}>
      <SheetTrigger asChild>
        <Button className="rounded-md px-4 py-2">Create routine plan</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[28rem]">
        <div className="flex h-full flex-col gap-4">
          <div>
            <p className="text-xs uppercase text-neutral-500">Create</p>
            <h3 className="text-lg font-semibold">New routine plan</h3>
            <p className="text-sm text-neutral-600">
              This plan will be linked to the selected client.
            </p>
          </div>
          <form action={createClientPlan} className="flex h-full flex-col gap-3">
            <input type="hidden" name="clientId" value={clientId} />
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" required placeholder="Client plan name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea name="notes" placeholder="Optional notes" />
            </div>
            <Button type="submit" className="mt-auto w-full">
              Create plan
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}



