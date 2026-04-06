"use client";

import dynamic from "next/dynamic";

export const LazyUserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserButton),
  {
    ssr: false,
    loading: () => (
      <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
    ),
  }
);

export const LazySignInButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignInButton),
  {
    ssr: false,
    loading: () => (
      <span className="text-sm text-muted-foreground opacity-50">Sign In</span>
    ),
  }
);
