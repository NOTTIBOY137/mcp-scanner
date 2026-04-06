"use client";

import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { OWASPComplianceSummary } from "@/types/scan";

interface Props {
  compliance: OWASPComplianceSummary[];
  percentage: number;
}

const severityColor: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-amber-400",
  low: "text-cyan-400",
};

export function OWASPComplianceGrid({ compliance, percentage }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">OWASP MCP Top 10 Compliance</h3>
          <p className="text-sm text-muted">
            Coverage of the official OWASP MCP security framework
          </p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-2xl font-bold ${percentage >= 80 ? "text-emerald-400" : percentage >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {percentage}%
          </p>
          <p className="text-xs text-muted-foreground">Compliant</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {compliance.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
              item.compliant
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            {item.compliant ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : item.maxSeverity === "critical" ? (
              <XCircle className="h-5 w-5 shrink-0 text-red-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
                <span className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </span>
              </div>
              {!item.compliant && (
                <p className="text-xs mt-0.5">
                  <span className={severityColor[item.maxSeverity ?? "medium"]}>
                    {item.findingsCount} finding{item.findingsCount !== 1 ? "s" : ""}
                  </span>
                  {item.maxSeverity && (
                    <span className="text-muted-foreground">
                      {" "}(max: {item.maxSeverity})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
