import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      servers: {
        findFirst: (...args: any[]) => mockFindFirst(...args),
      },
    },
  },
}));

vi.mock("@/db/schema", () => ({
  servers: { owner: "owner", repo: "repo" },
}));

vi.mock("@/types/grade", () => ({
  GRADE_THRESHOLDS: {
    A: { min: 90, color: "#22c55e", label: "Excellent" },
    B: { min: 75, color: "#3b82f6", label: "Good" },
    C: { min: 60, color: "#eab308", label: "Fair" },
    D: { min: 40, color: "#f97316", label: "Poor" },
    F: { min: 0, color: "#ef4444", label: "Failing" },
  },
}));

import { GET } from "@/app/api/badge/[...slug]/route";

describe("GET /api/badge/:owner/:repo.svg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for single-segment slug", async () => {
    const res = await GET(new Request("http://localhost/api/badge/owner"), {
      params: Promise.resolve({ slug: ["owner"] }),
    });
    expect(res.status).toBe(400);
  });

  it("returns SVG with grade for known server", async () => {
    mockFindFirst.mockResolvedValue({ latestGrade: "A", latestScore: 95 });
    const res = await GET(new Request("http://localhost/api/badge/o/r.svg"), {
      params: Promise.resolve({ slug: ["o", "r.svg"] }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    const body = await res.text();
    expect(body).toContain("A 95/100");
  });

  it("returns 'not scanned' for unknown server", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/badge/x/y.svg"), {
      params: Promise.resolve({ slug: ["x", "y.svg"] }),
    });
    const body = await res.text();
    expect(body).toContain("not scanned");
  });

  it("strips .svg suffix from slug", async () => {
    mockFindFirst.mockResolvedValue({ latestGrade: "B", latestScore: 80 });
    const res = await GET(new Request("http://localhost/api/badge/o/r.svg"), {
      params: Promise.resolve({ slug: ["o", "r.svg"] }),
    });
    const body = await res.text();
    expect(body).toContain("B 80/100");
  });

  it("includes Cache-Control header", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/badge/o/r"), {
      params: Promise.resolve({ slug: ["o", "r"] }),
    });
    expect(res.headers.get("Cache-Control")).toContain("max-age=3600");
  });

  it("includes ETag when grade is known", async () => {
    mockFindFirst.mockResolvedValue({ latestGrade: "C", latestScore: 65 });
    const res = await GET(new Request("http://localhost/api/badge/o/r"), {
      params: Promise.resolve({ slug: ["o", "r"] }),
    });
    expect(res.headers.get("ETag")).toBe('"C-65"');
  });
});
