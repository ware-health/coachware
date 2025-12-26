import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateExerciseList } from "@/components/template-exercise-list";
import { TemplateExerciseActions } from "@/components/template-exercise-actions";
import { exerciseLibrary } from "@/data/exercises";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function TemplateDetailPage({
  params
}: {
  params: { planId: string; templateId: string };
}) {
  const supabase = await createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const { data: template } = await supabase
    .from("routine_templates")
    .select("*")
    .eq("id", params.templateId)
    .eq("planId", params.planId)
    .eq("owner", session?.user.id)
    .single();

  if (!template) {
    notFound();
  }

  const updateMeta = async (formData: FormData) => {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const supabase = await createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("routine_templates")
      .update({ name, notes })
      .eq("id", params.templateId)
      .eq("owner", session.user.id);

    if (error) return { error: error.message };
    revalidatePath(`/plans/${params.planId}/templates/${params.templateId}`);
    return { success: true };
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-neutral-500">Template</p>
          <h1 className="text-2xl font-semibold">{template.name}</h1>
          {template.notes ? (
            <p className="text-sm text-neutral-600">{template.notes}</p>
          ) : null}
        </div>
        <Button variant="outline" asChild>
          <a href={`/plans/${params.planId}`}>Back to plan</a>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Template details</h2>
          <form action={updateMeta} className="space-y-3 border border-black p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" defaultValue={template.name} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea name="notes" defaultValue={template.notes || ""} />
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Exercises</h2>
            <TemplateExerciseActions
              planId={params.planId}
              templateId={params.templateId}
              exercises={exerciseLibrary}
            />
          </div>
          <TemplateExerciseList
            planId={params.planId}
            templateId={params.templateId}
            exercises={template.exercises || []}
          />
        </section>
      </div>
    </div>
  );
}


