"use client";

import { useState, useEffect } from "react";

interface UsageData {
  daily: { date: string; count: number }[];
  currentPeriodUsage: number;
  limit: number;
  plan: string;
  topEndpoints: { endpoint: string; count: number }[];
}

export function UsageCard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage?days=30")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-48 bg-zinc-800 rounded mb-4" />
        <div className="h-32 bg-zinc-800/50 rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted">Unable to load usage data.</p>
    );
  }

  const maxCount = Math.max(...data.daily.map((d) => d.count), 1);
  const usagePercent = Math.min(
    (data.currentPeriodUsage / Math.max(data.limit, 1)) * 100,
    100
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">API Usage</h3>
        <span className="text-xs text-muted capitalize font-mono">{data.plan} plan</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted mb-1">
          <span className="font-mono">{data.currentPeriodUsage.toLocaleString()} requests</span>
          <span className="font-mono">{data.limit.toLocaleString()} limit</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-yellow-500" : "bg-brand-500"
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {/* Bar chart */}
      {data.daily.length > 0 && (
        <div className="flex items-end gap-px h-24">
          {data.daily.slice(-30).map((d) => (
            <div
              key={d.date}
              className="flex-1 bg-zinc-600 hover:bg-zinc-500 rounded-t transition-colors"
              style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "2px" : "0" }}
              title={`${d.date}: ${d.count} requests`}
            />
          ))}
        </div>
      )}

      {/* Top endpoints */}
      {data.topEndpoints.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted mb-2">Top Endpoints</h4>
          <div className="space-y-1">
            {data.topEndpoints.map((ep) => (
              <div key={ep.endpoint} className="flex justify-between text-xs">
                <span className="font-mono text-foreground truncate">{ep.endpoint}</span>
                <span className="text-muted font-mono ml-2">{ep.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
