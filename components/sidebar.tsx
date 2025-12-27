"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/plans", label: "Plans" },
  { href: "/clients", label: "Clients" }
];

export function Sidebar({ email }: { email?: string }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <aside className="fixed left-0 top-0 flex h-full w-60 flex-col border-r border-black border-r-neutral-300 bg-white px-4 py-6">
      <div className="mb-8 space-y-2">
        <img
          src="/brand-logos/logo.svg"
          alt="Coachware logo"
          className="h-8 w-auto invert"
        />
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium hover:bg-neutral-100",
              pathname.startsWith(link.href) && "bg-neutral-900 text-white"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-2 pt-4 text-sm">
        <p className="text-xs text-neutral-600">{email || "Signed in"}</p>
        <form
          action={() => {
            startTransition(() => {
              signOut();
            });
          }}
        >
          <Button type="submit" variant="outline" size="sm" className="w-full">
            {pending ? "Signing out..." : "Sign out"}
          </Button>
        </form>
      </div>
    </aside>
  );
}


