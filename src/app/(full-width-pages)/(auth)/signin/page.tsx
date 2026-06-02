import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Connexion — B LINKS Admin",
  description: "Connexion à la console d'administration B LINKS",
};

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
