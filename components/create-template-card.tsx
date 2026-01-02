"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CreateTemplateForm } from "@/components/create-template-form";

type Props = {
  planId: string;
  action: (prevState: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | void>;
  rounded?: boolean;
};

export function CreateTemplateCard({ planId, action, rounded }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          className={rounded ? "rounded-md px-4 py-2" : ""}
          onClick={() => setOpen(true)}
        >
          + New template
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[28rem]">
        <CreateTemplateForm
          planId={planId}
          action={action}
          onSuccess={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

