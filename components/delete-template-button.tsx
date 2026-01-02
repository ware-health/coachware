"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteTemplate } from "@/app/actions/templates";

type Props = {
  templateId: string;
  planId: string;
  templateName: string;
};

export function DeleteTemplateButton({ templateId, planId, templateName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    startTransition(async () => {
      const result = await deleteTemplate({ templateId, planId });
      if (result.success) {
        router.push(`/plans/${planId}`);
        router.refresh();
      } else {
        alert(result.error || "Failed to delete template");
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
      {showConfirm ? (pending ? "Deleting..." : "Confirm Delete") : "Delete workout"}
    </Button>
  );
}

