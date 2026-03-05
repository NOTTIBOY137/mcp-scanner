import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { flushUsageToPostgres } from "@/lib/usage";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flushed = await flushUsageToPostgres();
  return NextResponse.json({ flushed });
}
