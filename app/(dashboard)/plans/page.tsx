import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RoutinePlan } from "@/lib/types";
import { createPlan } from "@/app/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default async function PlansPage() {
  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { data: plans } = await supabase
    .from("routine_plans")
    .select("*")
    .eq("owner", session?.user.id)
    .order("createdAt", { ascending: false });

  const createPlanAction = async (formData: FormData) => {
    "use server";
    await createPlan(formData);
  };

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : "—";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-neutral-500">Plans</p>
          <h1 className="text-2xl font-semibold">Routine Plans</h1>
          <p className="text-sm text-neutral-600">
            Create plans that contain one or more routine templates.
          </p>
        </div>
        <CreatePlanCard createPlanAction={createPlanAction} />
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
                {plans && plans.length > 0 ? (
                  plans.map((plan: RoutinePlan) => (
                    <tr key={plan.id} className="hover:bg-neutral-50">
                      <td className="relative px-4 py-3 text-sm font-semibold text-neutral-900">
                        <Link
                          href={`/plans/${plan.id}`}
                          className="absolute inset-0"
                          aria-label={`Open ${plan.name}`}
                        />
                        {plan.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {plan.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {formatDate(plan.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {formatDate(plan.updatedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-sm text-neutral-600">
                      No plans yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePlanCard({
  createPlanAction
}: {
  createPlanAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default" className="rounded-md px-4 py-2">
          + New plan
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[28rem]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase text-neutral-500">Create</p>
            <h3 className="text-lg font-semibold">New plan</h3>
          </div>
          <form action={createPlanAction} className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" required placeholder="Push / Pull / Legs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea name="notes" placeholder="Optional notes" />
            </div>
            <Button type="submit" className="w-full">
              Create plan
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}


