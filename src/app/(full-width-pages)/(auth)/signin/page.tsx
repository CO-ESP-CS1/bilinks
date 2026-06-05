import SignInForm from "@/components/auth/SignInForm";
import { signInPageMetadata } from "@/config/metadata";
import { Suspense } from "react";

export const metadata = signInPageMetadata();

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">
          Chargement…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
