import { redirect } from "next/navigation";

export default async function PlansPage() {
  // Redirect to clients page since all plans must be client-linked
  redirect("/clients");
}


