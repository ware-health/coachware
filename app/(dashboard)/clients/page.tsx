import Link from "next/link";

export default function ClientsPage() {
  const placeholderClients = [
    { id: "client-1", name: "Jane Doe", email: "jane@example.com", status: "Active" },
    { id: "client-2", name: "John Smith", email: "john@example.com", status: "Invited" },
    { id: "client-3", name: "Alex Lee", email: "alex@example.com", status: "Inactive" }
  ];

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
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
                {placeholderClients.map((client, idx) => (
                  <tr key={`${client.email}-${idx}`} className="hover:bg-neutral-50 relative">
                    <Link
                      href={`/clients/${client.id}`}
                      className="absolute inset-0"
                      aria-label={`Open ${client.name}`}
                    />
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">{client.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{client.email}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{client.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


