import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { servers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { GRADE_THRESHOLDS, type Grade } from "@/types/grade";

const BADGE_COLORS: Record<Grade, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

const UNKNOWN_COLOR = "#9f9f9f";

function generateBadgeSvg(grade: string | null, score: number | null): string {
  const label = "MCP Security";
  const value = grade ? `${grade} ${score}/100` : "not scanned";
  const color = grade
    ? (BADGE_COLORS[grade as Grade] ?? UNKNOWN_COLOR)
    : UNKNOWN_COLOR;

  // Approximate 6.5px per character for Verdana 11px, with 10px padding
  const labelWidth = Math.max(label.length * 6.5 + 10, 85);
  const valueWidth = Math.max(value.length * 6.5 + 10, 60);
  const totalWidth = labelWidth + valueWidth;
  const labelX = labelWidth / 2;
  const valueX = labelWidth + valueWidth / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110" text-rendering="geometricPrecision">
    <text aria-hidden="true" x="${labelX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${label}</text>
    <text x="${labelX * 10}" y="140" transform="scale(.1)" fill="#fff">${label}</text>
    <text aria-hidden="true" x="${valueX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${value}</text>
    <text x="${valueX * 10}" y="140" transform="scale(.1)" fill="#fff">${value}</text>
  </g>
</svg>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  // Handle "owner/repo.svg" or "owner/repo"
  let slugPath = slug.join("/");
  slugPath = slugPath.replace(/\.svg$/, "");

  const parts = slugPath.split("/");
  if (parts.length < 2) {
    return new NextResponse(
      "Invalid path. Use /api/badge/owner/repo.svg",
      { status: 400 }
    );
  }

  const owner = parts[0];
  const repo = parts[1];

  const server = await db.query.servers.findFirst({
    where: and(eq(servers.owner, owner), eq(servers.repo, repo)),
  });

  const grade = server?.latestGrade ?? null;
  const score = server?.latestScore ?? null;

  const svg = generateBadgeSvg(grade, score);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      ...(grade ? { ETag: `"${grade}-${score}"` } : {}),
    },
  });
}
