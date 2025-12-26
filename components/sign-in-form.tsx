"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInWithEmailPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

const initialState = { error: "", success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

export function SignInForm() {
  const [state, formAction] = useFormState(signInWithEmailPassword, initialState);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (state?.error) setMessage(state.error);
    if (state?.success) setMessage("Signed in.");
  }, [state]);

  return (
    <form action={formAction} className="w-full space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input name="email" type="email" placeholder="you@example.com" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input
          name="password"
          type="password"
          placeholder="Enter password"
          required
        />
      </div>
      <SubmitButton />
      {message ? <p className="text-sm text-black">{message}</p> : null}
    </form>
  );
}


