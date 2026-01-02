"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

type Props = {
  clientId: string;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
};

const initialState = { error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="mt-auto w-full" disabled={pending}>
      {pending ? "Creating..." : "Create plan"}
    </Button>
  );
}

export function CreateClientPlanForm({ clientId, action }: Props) {
  const [state, formAction] = useFormState(action, initialState);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state?.error) {
      setError(state.error);
    } else {
      setError("");
    }
  }, [state]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="text-xs uppercase text-neutral-500">Create</p>
        <h3 className="text-lg font-semibold">New routine plan</h3>
        <p className="text-sm text-neutral-600">
          This plan will be linked to the selected client.
        </p>
      </div>
      <form action={formAction} className="flex h-full flex-col gap-3">
        <input type="hidden" name="clientId" value={clientId} />
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input name="name" required placeholder="Client plan name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea name="notes" placeholder="Optional notes" />
        </div>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}
        <SubmitButton />
      </form>
    </div>
  );
}

