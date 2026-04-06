import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Stripe integration has been removed. All features are free." },
    { status: 410 }
  );
}
