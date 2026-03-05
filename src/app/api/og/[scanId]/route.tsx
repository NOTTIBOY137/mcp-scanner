import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { scans, servers } from "@/db/schema";
import { eq } from "drizzle-orm";

const gradeColors: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  F: "#ef4444",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;

  const scan = await db.query.scans.findFirst({
    where: eq(scans.id, scanId),
  });

  if (!scan) {
    return new Response("Scan not found", { status: 404 });
  }

  const server = await db.query.servers.findFirst({
    where: eq(servers.id, scan.serverId),
  });

  const grade = scan.grade ?? "?";
  const score = scan.score ?? 0;
  const serverName = server?.name ?? "Unknown Server";
  const findingsCount = scan.findingsCount ?? 0;
  const gradeColor = gradeColors[grade] ?? "#64748b";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#080b12",
          color: "white",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: `linear-gradient(to right, ${gradeColor}00, ${gradeColor}, ${gradeColor}00)`,
            display: "flex",
          }}
        />

        {/* Grade circle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "140px",
            height: "140px",
            borderRadius: "70px",
            backgroundColor: gradeColor + "20",
            color: gradeColor,
            fontSize: "72px",
            fontWeight: 700,
            boxShadow: `0 0 40px ${gradeColor}30`,
          }}
        >
          {grade}
        </div>

        <div
          style={{
            fontSize: "40px",
            fontWeight: 700,
            marginTop: "28px",
            color: "#e2e8f0",
            display: "flex",
          }}
        >
          {serverName}
        </div>

        <div
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            marginTop: "16px",
            display: "flex",
            fontFamily: "monospace",
          }}
        >
          {score} / 100
        </div>

        <div
          style={{
            fontSize: "20px",
            color: "#64748b",
            marginTop: "12px",
            display: "flex",
          }}
        >
          {findingsCount} security finding{findingsCount !== 1 ? "s" : ""} detected
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "18px",
            color: "#475569",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4L8 12v10c0 11 6.8 21.2 16 24 9.2-2.8 16-13 16-24V12L24 4z"
              fill="#06b6d420"
              stroke="#06b6d4"
              strokeWidth="2"
            />
            <path
              d="M18 24l4 4 8-8"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          MCP Scanner — The MCP Trust Registry
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
