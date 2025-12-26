"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AuthState = { error?: string; success?: boolean };

// useFormState passes (prevState, formData)
export async function signInWithEmailPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { error: "Supabase env vars are missing" };
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();
  if (!supabase || !supabase.auth?.signInWithPassword) {
    return { error: "Supabase client unavailable" };
  }

  // Clear any stale session cookies before attempting sign-in.
  await supabase.auth.signOut();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/plans");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}

