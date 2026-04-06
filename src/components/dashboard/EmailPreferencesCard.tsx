"use client";

import { useState, useEffect } from "react";

export function EmailPreferencesCard() {
  const [scanAlerts, setScanAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/email-preferences")
      .then((r) => r.json())
      .then((data) => {
        setScanAlerts(data.scanAlerts ?? true);
        setMarketingEmails(data.marketingEmails ?? false);
      })
      .finally(() => setLoading(false));
  }, []);

  async function update(field: string, value: boolean) {
    await fetch("/api/email-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-48 bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between">
        <div>
          <span className="text-sm text-foreground">Scan alerts</span>
          <p className="text-xs text-muted">
            Get notified when scans complete on your claimed servers
          </p>
        </div>
        <button
          role="switch"
          aria-checked={scanAlerts}
          onClick={() => {
            setScanAlerts(!scanAlerts);
            update("scanAlerts", !scanAlerts);
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            scanAlerts ? "bg-brand-500" : "bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              scanAlerts ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </label>
      <label className="flex items-center justify-between">
        <div>
          <span className="text-sm text-foreground">Marketing emails</span>
          <p className="text-xs text-muted">
            Receive product updates and announcements
          </p>
        </div>
        <button
          role="switch"
          aria-checked={marketingEmails}
          onClick={() => {
            setMarketingEmails(!marketingEmails);
            update("marketingEmails", !marketingEmails);
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            marketingEmails ? "bg-brand-500" : "bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              marketingEmails ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </label>
    </div>
  );
}
