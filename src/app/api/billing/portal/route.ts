import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "All features are now free. Billing portal is no longer needed." },
    { status: 410 }
  );
}
