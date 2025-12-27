import { SignInForm } from "@/components/sign-in-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-neutral-300 bg-white p-8">
        <div className="space-y-3 text-left">
          <img
            src="/brand-logos/logo.svg"
            alt="Coachware logo"
            className="h-10 w-auto invert"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Sign in</h1>
          </div>
        </div>
        <SignInForm />
        <p className="text-xs text-neutral-500">
          By signing in you agree to our{" "}
          <Link href="#" className="underline">
            terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}


