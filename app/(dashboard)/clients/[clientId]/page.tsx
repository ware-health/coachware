import Link from "next/link";
import { createClientPlan } from "@/app/actions/client-plans";
import { createClient } from "@/lib/supabase/server";
import { RoutinePlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: { clientId: string };
};

export default async function ClientDetailPage({ params }: Props) {
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
    .eq("owner", session.user.id)
    .eq("clientId", params.clientId)
    .order("createdAt", { ascending: false });

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
        <CreateClientPlanSheet clientId={params.clientId} />
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

function CreateClientPlanSheet({ clientId }: { clientId: string }) {
  return (
    <Sheet>
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



