"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  planId: string;
  action: (prevState: { error?: string } | undefined, formData: FormData) => Promise<{ error?: string } | void>;
  onSuccess?: () => void;
};

const initialState = { error: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="mt-auto w-full" disabled={pending}>
      {pending ? "Creating..." : "Create template"}
    </Button>
  );
}

export function CreateTemplateForm({ planId, action, onSuccess }: Props) {
  const [state, formAction] = useFormState(action, initialState);
  const [error, setError] = useState("");
  const prevErrorRef = useRef<string | undefined>(initialState.error);
  const router = useRouter();

  useEffect(() => {
    const currentError = state?.error;
    const prevError = prevErrorRef.current;
    
    if (currentError) {
      setError(currentError);
    } else {
      setError("");
      // Success detection: went from initial state (error: "") to success state (no error property)
      if (prevError === "" && currentError === undefined && state && Object.keys(state).length === 0) {
        // Success - empty object means success
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      }
    }
    prevErrorRef.current = currentError;
  }, [state, onSuccess, router]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="text-xs uppercase text-neutral-500">Create</p>
        <h3 className="text-lg font-semibold">New template</h3>
      </div>
      <form action={formAction} className="flex h-full flex-col gap-3">
        <input type="hidden" name="planId" value={planId} />
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input name="name" required placeholder="Upper Body" />
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

