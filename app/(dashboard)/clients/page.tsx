import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "—";

export default async function ClientsPage() {
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

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase text-neutral-500">Clients</p>
        <h1 className="text-2xl font-semibold">Client List</h1>
        <p className="text-sm text-neutral-600">Manage your clients and invitations.</p>
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
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {clients && clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-neutral-50 relative">
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">{client.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{client.email}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {formatDate(client.created_at as string | null | undefined)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-sm text-neutral-600" colSpan={3}>
                    No clients yet.
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


