import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe, priceToPlan } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type Stripe from "stripe";

function getSubPeriodEnd(stripeSub: Stripe.Subscription): Date | null {
  const itemEnd = stripeSub.items?.data?.[0]?.current_period_end;
  if (itemEnd) return new Date(itemEnd * 1000);
  return null;
}

async function syncApiKeyPlans(clerkUserId: string, plan: string) {
  await db
    .update(apiKeys)
    .set({ plan })
    .where(eq(apiKeys.clerkUserId, clerkUserId));
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clerkUserId = session.metadata?.clerkUserId;
  const plan = session.metadata?.plan;
  if (!clerkUserId || !plan) return;

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  const stripe = getStripe();
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);

  await db
    .insert(subscriptions)
    .values({
      id: createId(),
      clerkUserId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan,
      status: stripeSub.status,
      currentPeriodEnd: getSubPeriodEnd(stripeSub),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.clerkUserId,
      set: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: stripeSub.status,
        currentPeriodEnd: getSubPeriodEnd(stripeSub),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });

  await syncApiKeyPlans(clerkUserId, plan);
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const subscriptionId = stripeSub.id;
  const priceId = stripeSub.items.data[0]?.price?.id;
  const plan = priceId ? priceToPlan(priceId) : "free";
  const customerId = stripeSub.customer as string;

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId));

  if (rows.length === 0) return;

  const row = rows[0];

  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: subscriptionId,
      plan,
      status: stripeSub.status,
      currentPeriodEnd: getSubPeriodEnd(stripeSub),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  await syncApiKeyPlans(row.clerkUserId, getEffectivePlanFromStatus(stripeSub.status, plan));
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const customerId = stripeSub.customer as string;

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId));

  if (rows.length === 0) return;

  const row = rows[0];

  await db
    .update(subscriptions)
    .set({
      plan: "free",
      status: "canceled",
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));

  await syncApiKeyPlans(row.clerkUserId, "free");
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}

function getEffectivePlanFromStatus(status: string, plan: string): string {
  if (status === "active" || status === "trialing") return plan;
  return "free";
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
  }

  return NextResponse.json({ received: true });
}
