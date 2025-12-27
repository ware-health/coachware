import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { exerciseLibrary } from "@/data/exercises";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
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

  const ownerId = user.id;

  const [
    { count: plansCount, data: plansData },
    { count: clientPlansCount },
    { data: clientsData, count: clientsCountExact }
  ] = await Promise.all([
    supabase
      .from("routine_plans")
      .select("*", { count: "exact" })
      .eq("owner", ownerId)
      .is("clientId", null),
    supabase
      .from("routine_plans")
      .select("*", { head: true, count: "exact" })
      .eq("owner", ownerId)
      .not("clientId", "is", null),
    supabase
      .from("clients")
      .select("id, email, name, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const exercisesCount = exerciseLibrary.length;
  const plansTotal = plansCount ?? plansData?.length ?? 0;
  const clientPlansTotal = clientPlansCount ?? 0;
  const recentClients = clientsData || [];
  const clientsCount = clientsCountExact ?? recentClients.length;

  const cards = [
    { label: "Exercises", value: exercisesCount, hint: "From library", accent: "bg-blue-100 text-blue-800" },
    {
      label: "Plans",
      value: plansTotal,
      hint: "Not client-linked",
      accent: "bg-green-100 text-green-800"
    },
    {
      label: "Client plans",
      value: clientPlansTotal,
      hint: "Plans assigned to clients",
      accent: "bg-purple-100 text-purple-800"
    },
    {
      label: "Clients",
      value: clientsCount,
      hint: "Recent clients",
      accent: "bg-amber-100 text-amber-800"
    }
  ];

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
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {recentClients.length > 0 ? (
                recentClients.slice(0, 5).map((client: any) => (
                  <tr key={client.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{client.email}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {client.created_at
                        ? new Date(client.created_at as string).toLocaleDateString(undefined, {
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
                    No clients yet. Add a client to see them here.
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


