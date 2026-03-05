import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, PLAN_PRICE_MAP } from "@/lib/stripe";
import { getUserSubscription, getEffectivePlan } from "@/lib/subscriptions";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const plan = body.plan as string;

  if (!plan || !PLAN_PRICE_MAP[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const sub = await getUserSubscription(userId);
  const effective = getEffectivePlan(sub);
  if (effective !== "free") {
    return NextResponse.json(
      { error: "You already have an active paid subscription. Manage it from the billing portal." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PLAN_PRICE_MAP[plan], quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    metadata: { clerkUserId: userId, plan },
  });

  return NextResponse.json({ url: session.url });
}
