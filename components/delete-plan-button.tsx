"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deletePlan } from "@/app/actions/plans";

type Props = {
  planId: string;
  planName: string;
};

export function DeletePlanButton({ planId, planName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    startTransition(async () => {
      const result = await deletePlan(planId);
      if (result.success) {
        // If we're on the plan detail page, redirect to plans list
        // Otherwise, just refresh the current page
        if (pathname?.startsWith(`/plans/${planId}`)) {
          router.push("/plans");
        } else {
          router.refresh();
        }
      } else {
        alert(result.error || "Failed to delete plan");
        setShowConfirm(false);
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
      disabled={pending}
      onClick={handleDelete}
    >
      {showConfirm ? (pending ? "Deleting..." : "Confirm Delete") : "Delete Plan"}
    </Button>
  );
}

