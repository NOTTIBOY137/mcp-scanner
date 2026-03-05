"use server";

import { redirect } from "next/navigation";

export async function initiateScan(formData: FormData) {
  const repoUrl = formData.get("repoUrl") as string;

  if (!repoUrl) {
    return { error: "Repository URL is required" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.error ?? "Scan failed" };
  }

  redirect(`/results/${data.id}`);
}
