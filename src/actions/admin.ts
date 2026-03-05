"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleServerVerified(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const allowed = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allowed.includes(userId)) {
    throw new Error("Forbidden");
  }

  const serverId = formData.get("serverId") as string;
  const verified = formData.get("verified") === "true";

  if (!serverId) throw new Error("Missing serverId");

  await db
    .update(servers)
    .set({ isVerified: verified, updatedAt: new Date() })
    .where(eq(servers.id, serverId));

  revalidatePath("/admin/servers");
}
