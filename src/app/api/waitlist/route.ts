import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { waitlist } from "@/db/schema";
import { waitlistRateLimit } from "@/lib/rate-limit";

const waitlistSchema = z.object({
  email: z.string().email(),
  plan: z.enum(["pro", "team", "enterprise"]),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  try {
    // Rate limit
    const { success } = await waitlistRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }
  } catch {
    // If Redis unavailable, continue
  }

  const body = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email or plan." },
      { status: 400 }
    );
  }

  const { email, plan } = parsed.data;

  try {
    await db
      .insert(waitlist)
      .values({ id: createId(), email, plan })
      .onConflictDoUpdate({
        target: waitlist.email,
        set: { plan },
      });
  } catch {
    return NextResponse.json(
      { error: "Failed to join waitlist." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
