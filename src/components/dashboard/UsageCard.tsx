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
      <div className="card animate-pulse">
        <div className="h-4 w-48 bg-[var(--bg-tertiary)] rounded mb-4" />
        <div className="h-32 bg-[var(--bg-tertiary)]/50 rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <p className="text-sm text-[var(--text-secondary)]">Unable to load usage data.</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.daily.map((d) => d.count), 1);
  const usagePercent = Math.min(
    (data.currentPeriodUsage / Math.max(data.limit, 1)) * 100,
    100
  );

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">API Usage</h3>
        <span className="text-xs text-[var(--text-secondary)] capitalize">{data.plan} plan</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
          <span>{data.currentPeriodUsage.toLocaleString()} requests</span>
          <span>{data.limit.toLocaleString()} limit</span>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-yellow-500" : "bg-[var(--accent)]"
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
              className="flex-1 bg-[var(--accent)]/60 hover:bg-[var(--accent)] rounded-t transition-colors"
              style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "2px" : "0" }}
              title={`${d.date}: ${d.count} requests`}
            />
          ))}
        </div>
      )}

      {/* Top endpoints */}
      {data.topEndpoints.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2">Top Endpoints</h4>
          <div className="space-y-1">
            {data.topEndpoints.map((ep) => (
              <div key={ep.endpoint} className="flex justify-between text-xs">
                <span className="font-mono truncate">{ep.endpoint}</span>
                <span className="text-[var(--text-secondary)] ml-2">{ep.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
