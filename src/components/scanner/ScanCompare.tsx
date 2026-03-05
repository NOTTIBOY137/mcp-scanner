"use client";

import { useState, useEffect } from "react";

interface FindingSummary {
  ruleId: string;
  filePath: string;
  severity: string;
  title: string;
}

interface ComparisonData {
  oldScan: { id: string; grade: string | null; score: number | null; findingsCount: number | null; createdAt: string };
  newScan: { id: string; grade: string | null; score: number | null; findingsCount: number | null; createdAt: string };
  scoreDelta: number;
  gradeChanged: boolean;
  newFindings: FindingSummary[];
  fixedFindings: FindingSummary[];
}

export function ScanCompare({
  oldScanId,
  newScanId,
}: {
  oldScanId: string;
  newScanId: string;
}) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/scan/compare?oldScanId=${oldScanId}&newScanId=${newScanId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [oldScanId, newScanId]);

  if (loading) {
    return <div className="animate-pulse h-32 bg-[var(--bg-secondary)]/50 rounded-lg" />;
  }

  if (!data) {
    return <p className="text-sm text-[var(--text-secondary)]">Unable to load comparison.</p>;
  }

  const deltaColor = data.scoreDelta > 0 ? "text-green-400" : data.scoreDelta < 0 ? "text-red-400" : "text-[var(--text-secondary)]";
  const deltaSign = data.scoreDelta > 0 ? "+" : "";

  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold">Scan Comparison</h3>

      {/* Grade badges side by side */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Previous</p>
          <div className="text-2xl font-bold">{data.oldScan.grade ?? "—"}</div>
          <p className="text-xs">{data.oldScan.score ?? "—"}/100</p>
        </div>
        <div className="text-lg text-[var(--text-secondary)]">&rarr;</div>
        <div className="text-center">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Latest</p>
          <div className="text-2xl font-bold">{data.newScan.grade ?? "—"}</div>
          <p className="text-xs">{data.newScan.score ?? "—"}/100</p>
        </div>
        <div className={`text-lg font-bold ${deltaColor}`}>
          {deltaSign}{data.scoreDelta}
        </div>
      </div>

      {/* New findings */}
      {data.newFindings.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-red-400 mb-2">
            New Findings ({data.newFindings.length})
          </h4>
          <div className="space-y-1">
            {data.newFindings.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-red-500/10 rounded px-2 py-1">
                <span className="uppercase font-medium text-red-400">{f.severity}</span>
                <span className="truncate">{f.title}</span>
                <span className="text-[var(--text-secondary)] font-mono ml-auto">{f.filePath}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixed findings */}
      {data.fixedFindings.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-green-400 mb-2">
            Fixed ({data.fixedFindings.length})
          </h4>
          <div className="space-y-1">
            {data.fixedFindings.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-green-500/10 rounded px-2 py-1">
                <span className="uppercase font-medium text-green-400">{f.severity}</span>
                <span className="truncate line-through">{f.title}</span>
                <span className="text-[var(--text-secondary)] font-mono ml-auto">{f.filePath}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.newFindings.length === 0 && data.fixedFindings.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)]">No changes in findings between scans.</p>
      )}
    </div>
  );
}
