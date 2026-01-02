import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoutineTemplate } from "@/lib/types";
import { createTemplate } from "@/app/actions/templates";
import { Button } from "@/components/ui/button";
import { DeletePlanButton } from "@/components/delete-plan-button";
import { CreateTemplateCard } from "@/components/create-template-card";
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

  // If this is a client plan, get the client info for navigation and display
  let clientId: string | null = null;
  let client: { id: string; name: string; email: string } | null = null;
  if (plan.clientId) {
    clientId = plan.clientId;
    const { data: clientData } = await supabase
      .from("clients")
      .select("id, name, email")
      .eq("id", clientId)
      .single();
    if (clientData) {
      client = clientData;
    }
  }

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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href={clientId ? `/clients/${clientId}` : "/plans"}>
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

      <div className="border-t border-neutral-200 pt-6">
        <DeletePlanButton planId={params.planId} planName={plan.name} />
      </div>
    </div>
  );
}



