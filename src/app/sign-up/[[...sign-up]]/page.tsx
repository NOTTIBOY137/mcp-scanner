import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign Up", robots: { index: false, follow: false } };

export default function SignUpPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center pt-12 pb-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-2 text-muted">Free forever. No credit card required.</p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "bg-card border border-white/10 shadow-none rounded-xl",
            headerTitle: "text-foreground text-xl font-semibold",
            headerSubtitle: "text-muted",
            socialButtonsBlockButton: "bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10 rounded-lg",
            formFieldLabel: "text-muted text-sm",
            formFieldInput: "bg-zinc-900 border-white/10 text-foreground rounded-lg",
            formButtonPrimary: "bg-white text-black hover:bg-gray-200 rounded-lg font-medium",
            footerActionLink: "text-brand-400 hover:text-brand-300",
            dividerLine: "bg-white/10",
            dividerText: "text-muted-foreground",
            footer: "hidden",
          },
        }}
      />
    </div>
  );
}
