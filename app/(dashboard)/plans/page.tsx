import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RoutinePlan } from "@/lib/types";
import { createPlan } from "@/app/actions/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Create plan</h2>
          <form action={createPlanAction} className="space-y-3 border border-black p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" required placeholder="Push / Pull / Legs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea name="notes" placeholder="Optional notes" />
            </div>
            <Button type="submit">Create plan</Button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your plans</h2>
          <div className="space-y-2">
            {plans && plans.length > 0 ? (
              plans.map((plan: RoutinePlan) => (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="flex items-center justify-between border border-black px-4 py-3 hover:bg-neutral-100"
                >
                  <div>
                    <p className="text-sm font-semibold">{plan.name}</p>
                    {plan.notes ? (
                      <p className="text-xs text-neutral-600">{plan.notes}</p>
                    ) : null}
                  </div>
                  <span className="text-xs uppercase text-neutral-500">View</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-neutral-600">No plans yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


