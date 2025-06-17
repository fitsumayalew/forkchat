import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Unauthenticated } from "convex/react";
import { Authenticated } from "convex/react";
import { SignInForm } from "@/components/SignInForm";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <>
      <Unauthenticated>
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
          <div className="w-full max-w-sm">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <Navigate to="/" />
      </Authenticated>
    </>
  );
}
