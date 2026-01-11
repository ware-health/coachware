import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoutineTemplate } from "@/lib/types";
import { createTemplate } from "@/app/actions/templates";
import { Button } from "@/components/ui/button";
import { DeletePlanButton } from "@/components/delete-plan-button";
import { CreateTemplateCard } from "@/components/create-template-card";
import { ClientCalendar } from "@/components/client-calendar";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export default async function PlanDetailPage({
  params
}: {
  params: { planId: string };
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: plan } = await supabase
    .from("routine_plans")
    .select("*")
    .eq("id", params.planId)
    .eq("owner", user?.id)
    .single();

  if (!plan) {
    notFound();
  }

  // All plans must be client-linked now
  if (!plan.clientId) {
    notFound();
  }

  // Get the client info for navigation and display
  const clientId = plan.clientId;
  const { data: clientData } = await supabase
    .from("clients")
    .select("id, name, email, created_at")
    .eq("id", clientId)
    .single();
  
  const client = clientData || null;

  const { data: templates } = await supabase
    .from("routine_templates")
    .select("*")
    .eq("planId", params.planId)
    .eq("owner", user?.id)
    .order("createdAt", { ascending: false });

  const createTemplateAction = async (
    _prevState: { error?: string } | undefined,
    formData: FormData
  ) => {
    "use server";
    return await createTemplate(_prevState, formData);
  };

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "—";

  // Fetch logs for calendar
  const [logsResult, allTemplatesResult, plansResult] = await Promise.all([
    supabase.from("routine_logs").select("*").eq("owner", clientId),
    supabase
      .from("routine_templates")
      .select("id, planId")
      .eq("owner", user?.id),
    supabase
      .from("routine_plans")
      .select("id, name")
      .eq("owner", user?.id)
  ]);

  const routineLogs = logsResult.data;
  const allTemplates = allTemplatesResult.data;
  const allPlans = plansResult.data;

  // Create a map of templateId -> planId -> planName
  const templateToPlanMap = new Map<string, string>();
  (allTemplates || []).forEach((template: any) => {
    templateToPlanMap.set(template.id, template.planId);
  });

  const planIdToNameMap = new Map<string, string>();
  (allPlans || []).forEach((planItem: any) => {
    planIdToNameMap.set(planItem.id, planItem.name);
  });

  // Enrich logs with plan information
  const enrichedLogs = (routineLogs || []).map((log: any) => {
    const templateId = log.templateId;
    const planId = templateId ? templateToPlanMap.get(templateId) : null;
    const planName = planId ? planIdToNameMap.get(planId) : null;
    return {
      ...log,
      planName: planName || null
    };
  });

  const startDate = client?.created_at
    ? new Date(client.created_at as string)
    : new Date(new Date().getFullYear(), 0, 1);
  const endDate = new Date(new Date().getFullYear(), 11, 31);

  const logDates = new Set<string>();
  const logsByDate = new Map<string, any[]>();
  
  enrichedLogs.forEach((log: any) => {
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

  // Convert Maps to plain objects for client component
  const logColorMapObj: Record<string, string> = Object.fromEntries(logColorMap);
  const logsByDateObj: Record<string, any[]> = Object.fromEntries(
    Array.from(logsByDate.entries()).map(([date, logs]) => [date, logs])
  );

  // Build aligned month buckets from start month through year end.
  const monthBuckets: {
    label: string;
    year: number;
    month: number;
    days: { date: string; key: string; isLogged: boolean; isDisabled: boolean }[];
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
      return { date: date.toISOString(), key, isLogged, isDisabled };
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
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href={`/clients/${clientId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase text-neutral-500">Plan</p>
              {client && (
                <Link
                  href={`/clients/${clientId}`}
                  className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {client.name}
                </Link>
              )}
            </div>
            <h1 className="text-2xl font-semibold">{plan.name}</h1>
            {plan.notes ? (
              <p className="text-sm text-neutral-600">{plan.notes}</p>
            ) : null}
          </div>
          <CreateTemplateCard
            planId={params.planId}
            action={createTemplateAction}
            rounded
          />
        </div>
      </div>

      <div className="space-y-3">
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
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {templates && templates.length > 0 ? (
                  templates.map((template: RoutineTemplate) => (
                    <tr key={template.id} className="hover:bg-neutral-50">
                      <td className="relative px-4 py-3 text-sm font-semibold text-neutral-900">
                        <Link
                          href={`/plans/${params.planId}/templates/${template.id}`}
                          className="absolute inset-0"
                          aria-label={`Open ${template.name}`}
                        />
                        {template.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {template.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {formatDate(template.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {formatDate(template.updatedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-sm text-neutral-600">
                      No templates yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ClientCalendar
        monthBuckets={monthBuckets}
        logColorMap={logColorMapObj}
        logsByDate={logsByDateObj}
      />

      <div className="border-t border-neutral-200 pt-6">
        <DeletePlanButton planId={params.planId} planName={plan.name} clientId={clientId} />
      </div>
    </div>
  );
}



