import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoutineTemplate } from "@/lib/types";
import { createTemplate } from "@/app/actions/templates";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  const createTemplateAction = async (formData: FormData) => {
    "use server";
    await createTemplate(formData);
  };

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
        <CreateTemplateCard
          planId={params.planId}
          action={createTemplateAction}
          rounded
        />
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-sm text-neutral-600">
                      No templates yet.
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

function CreateTemplateCard({
  planId,
  action,
  rounded
}: {
  planId: string;
  action: (formData: FormData) => Promise<void>;
  rounded?: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          className={rounded ? "rounded-md px-4 py-2" : ""}
        >
          + New template
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[28rem]">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase text-neutral-500">Create</p>
            <h3 className="text-lg font-semibold">New template</h3>
          </div>
          <form action={action} className="space-y-3">
            <input type="hidden" name="planId" value={planId} />
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" required placeholder="Upper Body" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea name="notes" placeholder="Optional notes" />
            </div>
            <Button type="submit" className="w-full">
              Create template
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}


