import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "All features are now free. No checkout needed." },
    { status: 410 }
  );
}
