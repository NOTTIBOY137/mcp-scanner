import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center -mx-6 lg:-mx-8">
      {/* Left: WebGL canvas background */}
      <div className="hidden lg:block absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(99,102,241,0.08)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(6,182,212,0.05)_0%,_transparent_50%)]" />
      </div>

      <div className="w-full max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            Welcome back
          </h1>
          <p className="mt-2 text-zinc-400">
            Sign in to access your dashboard, API keys, and scan history.
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-zinc-900/50 border border-zinc-800 shadow-none backdrop-blur-sm",
              headerTitle: "text-zinc-50",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700",
              formFieldLabel: "text-zinc-300",
              formFieldInput: "bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500",
              formButtonPrimary: "bg-white text-black hover:bg-zinc-200",
              footerActionLink: "text-brand-400 hover:text-brand-300",
              dividerLine: "bg-zinc-800",
              dividerText: "text-zinc-500",
            },
          }}
        />
      </div>
    </div>
  );
}
