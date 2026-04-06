import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "MCP Scanner";
  const description = searchParams.get("description") || "Security scanner for MCP servers";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          padding: "60px 80px",
        }}
      >
        <div style={{ fontSize: 32, color: "#6366F1", fontWeight: 700, marginBottom: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="36" height="36" viewBox="0 0 32 36" fill="none">
            <path d="M16 2L30 8V20Q30 30 16 34Q2 30 2 20V8Z" fill="#6366F1"/>
            <path d="M10 17L14 21L22 13" fill="none" stroke="#0a0a0a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          MCP Scanner
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, color: "#ffffff", textAlign: "center", lineHeight: 1.2, maxWidth: 900 }}>
          {title}
        </div>
        <div style={{ fontSize: 24, color: "#a1a1aa", textAlign: "center", marginTop: 20, maxWidth: 700 }}>
          {description}
        </div>
        <div style={{ fontSize: 18, color: "#6366F1", marginTop: 40 }}>
          mcp-scanner-kappa.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
