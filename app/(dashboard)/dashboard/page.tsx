import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { exerciseLibrary } from "@/data/exercises";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

type PlanSummary = {
  id: string;
  name: string;
  notes: string | null;
  updatedAt: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const ownerId = session.user.id;

  const [
    { count: plansCount, data: plansData },
    { data: clientLinksData },
    { data: recentPlans }
  ] = await Promise.all([
    supabase
      .from("routine_plans")
      .select("*", { count: "exact" })
      .eq("owner", ownerId),
    supabase.from("client_plans").select("clientId, planId").eq("owner", ownerId),
    supabase
      .from("routine_plans")
      .select("id, name, notes, updatedAt")
      .eq("owner", ownerId)
      .order("createdAt", { ascending: false })
      .limit(5)
  ]);

  const exercisesCount = exerciseLibrary.length;
  const plansTotal = plansCount ?? plansData?.length ?? 0;
  const clientLinkRows = clientLinksData || [];
  const clientIds = Array.from(new Set(clientLinkRows.map((row: any) => row.clientId))).filter(
    Boolean
  );
  const clientsCount = clientIds.length;
  const linkedPlansCount = clientLinkRows.length;

  const cards = [
    { label: "Exercises", value: exercisesCount, hint: "From library", accent: "bg-blue-100 text-blue-800" },
    { label: "Plans", value: plansTotal, hint: "Owned by you", accent: "bg-green-100 text-green-800" },
    { label: "Client plans", value: linkedPlansCount, hint: "Linked via client_plans", accent: "bg-purple-100 text-purple-800" },
    { label: "Clients", value: clientsCount, hint: "Distinct linked clients", accent: "bg-amber-100 text-amber-800" }
  ];

  const recentPlanList: PlanSummary[] = recentPlans || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase text-neutral-500">Overview</p>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-600">
            Quick snapshot across exercises, plans, and client-linked plans.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/plans">
            <Button className="rounded-md">Create plan</Button>
          </Link>
          <Link href="/clients">
            <Button variant="outline" className="rounded-md">
              Manage clients
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="ghost" className="rounded-md">
              Browse exercises
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase text-neutral-500">{card.label}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${card.accent}`}>
                {card.hint}
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div>
            <p className="text-xs uppercase text-neutral-500">Clients</p>
            <h2 className="text-lg font-semibold text-neutral-900">Recent clients</h2>
          </div>
          <Link href="/clients" className="text-sm text-neutral-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="min-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                  Linked plan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {clientLinkRows.length > 0 ? (
                clientLinkRows.slice(0, 5).map((link: any, idx: number) => (
                  <tr key={`${link.planId}-${idx}`} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-neutral-900">
                      {link.clientId || "Client"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">
                      <Link href={`/plans/${link.planId}`} className="hover:underline">
                        {link.planId}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-sm text-neutral-600" colSpan={2}>
                    No client links yet. Create a client plan to see it here.
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


