"use client";

import { useState } from "react";
import Link from "next/link";
import { ScanCompare } from "./ScanCompare";

interface ScanEntry {
  id: string;
  grade: string | null;
  score: number | null;
  findingsCount: number | null;
  commitSha: string | null;
  createdAt: string;
}

export function ScanHistoryWithCompare({
  scanHistory,
}: {
  scanHistory: ScanEntry[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function startCompare() {
    if (selected.length === 2) setComparing(true);
  }

  function clearCompare() {
    setSelected([]);
    setComparing(false);
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scan History</h2>
        <div className="flex items-center gap-2">
          {selected.length === 2 && !comparing && (
            <button
              onClick={startCompare}
              className="rounded-lg bg-brand-500/15 px-3 py-1.5 text-xs font-medium text-brand-500 ring-1 ring-brand-500/30 hover:bg-brand-500/25 transition-colors"
            >
              Compare
            </button>
          )}
          {(selected.length > 0 || comparing) && (
            <button
              onClick={clearCompare}
              className="rounded-lg bg-zinc-900/15 px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-white/10 hover:bg-zinc-900/25 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {comparing && selected.length === 2 && (
        <div className="mb-4">
          <ScanCompare
            oldScanId={selected[0]}
            newScanId={selected[1]}
          />
        </div>
      )}

      {scanHistory.length === 0 ? (
        <p className="text-muted">No scans yet.</p>
      ) : (
        <div className="space-y-2">
          {scanHistory.map((scan) => (
            <div
              key={scan.id}
              className="card flex items-center justify-between transition-colors hover:border-brand-500"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(scan.id)}
                  onChange={() => toggleSelect(scan.id)}
                  disabled={
                    !selected.includes(scan.id) && selected.length >= 2
                  }
                  className="h-4 w-4 rounded border-white/10 bg-card text-brand-500 focus:ring-brand-500/30"
                />
                <Link
                  href={`/results/${scan.id}`}
                  className="flex items-center gap-3"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card text-sm font-bold">
                    {scan.grade ?? "?"}
                  </span>
                  <div>
                    <span className="text-sm font-medium">
                      Score: {scan.score ?? "\u2014"}/100
                    </span>
                    <span className="ml-3 text-xs text-muted">
                      {scan.findingsCount} findings
                    </span>
                  </div>
                </Link>
              </div>
              <div className="text-xs text-muted">
                {new Date(scan.createdAt).toLocaleDateString()}
                {scan.commitSha && (
                  <span className="ml-2 font-mono">
                    {scan.commitSha.slice(0, 7)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
