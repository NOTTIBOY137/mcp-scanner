import { AlertTriangle, AlertCircle, Info, ShieldAlert, FileCode, Wrench } from "lucide-react";
import type { RuleMatch } from "@/types/scan";

const severityConfig: Record<string, { style: string; icon: typeof AlertTriangle }> = {
  critical: { style: "bg-red-500/15 text-red-400 border-red-500/25", icon: ShieldAlert },
  high: { style: "bg-orange-500/15 text-orange-400 border-orange-500/25", icon: AlertTriangle },
  medium: { style: "bg-amber-500/15 text-amber-400 border-amber-500/25", icon: AlertCircle },
  low: { style: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25", icon: Info },
  info: { style: "bg-zinc-900/15 text-muted border-white/10", icon: Info },
};

export function FindingCard({ finding }: { finding: RuleMatch }) {
  const config = severityConfig[finding.severity] ?? severityConfig.info;
  const Icon = config.icon;

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-medium text-foreground">{finding.title}</h4>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.style}`}
        >
          <Icon className="h-3 w-3" />
          {finding.severity}
        </span>
      </div>
      <p className="text-sm text-muted">{finding.description}</p>
      {(finding.filePath || finding.snippet) && (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-background">
          {finding.filePath && (
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">
                {finding.filePath}
                {finding.lineNumber ? `:${finding.lineNumber}` : ""}
              </span>
            </div>
          )}
          {finding.snippet && (
            <pre className="overflow-x-auto p-3 font-mono text-xs text-muted leading-relaxed">
              {finding.snippet}
            </pre>
          )}
        </div>
      )}
      {finding.remediation && (
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300">
            <Wrench className="h-3.5 w-3.5" />
            How to fix
          </summary>
          <p className="mt-2 text-sm text-muted border-l-2 border-emerald-700/50 pl-3">
            {finding.remediation}
          </p>
        </details>
      )}
    </div>
  );
}
