import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoutineTemplate } from "@/lib/types";
import { createTemplate } from "@/app/actions/templates";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function PlanDetailPage({
  params
}: {
  params: { planId: string };
}) {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { data: plan } = await supabase
    .from("routine_plans")
    .select("*")
    .eq("id", params.planId)
    .eq("owner", session?.user.id)
    .single();

  if (!plan) {
    notFound();
  }

  const { data: templates } = await supabase
    .from("routine_templates")
    .select("*")
    .eq("planId", params.planId)
    .eq("owner", session?.user.id)
    .order("createdAt", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-neutral-500">Plan</p>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          {plan.notes ? (
            <p className="text-sm text-neutral-600">{plan.notes}</p>
          ) : null}
        </div>
        <Button variant="outline" asChild>
          <Link href="/plans">Back to plans</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Create template</h2>
          <form action={createTemplate} className="space-y-3 border border-black p-4">
            <input type="hidden" name="planId" value={params.planId} />
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" required placeholder="Upper Body" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea name="notes" placeholder="Optional notes" />
            </div>
            <Button type="submit">Create template</Button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Templates</h2>
          <div className="space-y-2">
            {templates && templates.length > 0 ? (
              templates.map((template: RoutineTemplate) => (
                <Link
                  key={template.id}
                  href={`/plans/${params.planId}/templates/${template.id}`}
                  className="flex items-center justify-between border border-black px-4 py-3 hover:bg-neutral-100"
                >
                  <div>
                    <p className="text-sm font-semibold">{template.name}</p>
                    {template.notes ? (
                      <p className="text-xs text-neutral-600">{template.notes}</p>
                    ) : null}
                  </div>
                  <span className="text-xs uppercase text-neutral-500">Open</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-neutral-600">No templates yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


