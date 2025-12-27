import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
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

  const email = user.email || undefined;

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Sidebar email={email} />
      <main className="ml-60 flex min-h-screen flex-col">
        <div className="flex-1 px-8 py-6">{children}</div>
      </main>
    </div>
  );
}


