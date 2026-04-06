import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { webhooks } from "@/db/schema";
import { eq } from "drizzle-orm";
// Payment gates removed — all features free for everyone

function isPrivateUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();

    // Block localhost variants
    if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]") {
      return true;
    }

    // Check IP addresses
    const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      // 127.x.x.x (loopback)
      if (a === 127) return true;
      // 10.x.x.x (RFC 1918)
      if (a === 10) return true;
      // 172.16-31.x.x (RFC 1918)
      if (a === 172 && b >= 16 && b <= 31) return true;
      // 192.168.x.x (RFC 1918)
      if (a === 192 && b === 168) return true;
      // 169.254.x.x (link-local / IMDS)
      if (a === 169 && b === 254) return true;
    }

    return false;
  } catch {
    return true; // Treat unparseable URLs as private
  }
}

const createWebhookSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  events: z
    .array(z.enum(["scan.completed", "scan.failed"]))
    .optional()
    .default(["scan.completed", "scan.failed"]),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userWebhooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.clerkUserId, userId));

  // Don't expose secrets in list
  const safe = userWebhooks.map(({ secret: _, ...wh }) => wh);
  return NextResponse.json(safe);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  if (isPrivateUrl(parsed.data.url)) {
    return NextResponse.json(
      { error: "Webhook URL must not point to a private or loopback address." },
      { status: 400 }
    );
  }

  const secret = crypto.randomBytes(32).toString("hex");
  const id = createId();

  await db.insert(webhooks).values({
    id,
    clerkUserId: userId,
    url: parsed.data.url,
    secret,
    events: parsed.data.events,
    active: true,
  });

  // Return secret only on creation
  return NextResponse.json({ id, secret, url: parsed.data.url, events: parsed.data.events }, { status: 201 });
}
