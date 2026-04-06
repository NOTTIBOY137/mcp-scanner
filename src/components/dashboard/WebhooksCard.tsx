"use client";

import { useState, useEffect } from "react";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export function WebhooksCard() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/webhooks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWebhooks(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createWebhook() {
    if (!newUrl) return;
    setCreating(true);
    setNewSecret(null);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewSecret(data.secret);
        setWebhooks((prev) => [
          ...prev,
          { id: data.id, url: data.url, events: data.events, active: true, createdAt: new Date().toISOString() },
        ]);
        setNewUrl("");
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleWebhook(id: string, active: boolean) {
    await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setWebhooks((prev) =>
      prev.map((wh) => (wh.id === id ? { ...wh, active: !active } : wh))
    );
  }

  async function deleteWebhook(id: string) {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setWebhooks((prev) => prev.filter((wh) => wh.id !== id));
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
      {/* Add webhook form */}
      <div className="flex gap-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://your-server.com/webhook"
          className="input flex-1 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={createWebhook}
          disabled={creating || !newUrl}
          className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {creating ? "Adding..." : "Add"}
        </button>
      </div>

      {/* Show secret after creation */}
      {newSecret && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p className="text-xs text-green-400 font-medium mb-1">
            Webhook secret (shown only once):
          </p>
          <code className="text-xs font-mono break-all text-foreground">{newSecret}</code>
        </div>
      )}

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <p className="text-sm text-muted">No webhooks configured yet.</p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-mono text-foreground truncate">{wh.url}</p>
                <p className="text-xs text-muted">{wh.events.join(", ")}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => toggleWebhook(wh.id, wh.active)}
                  className={`text-xs px-2 py-1 rounded-full ${
                    wh.active
                      ? "bg-green-500/15 text-green-400"
                      : "bg-zinc-800 text-muted"
                  }`}
                >
                  {wh.active ? "Active" : "Paused"}
                </button>
                <button
                  onClick={() => deleteWebhook(wh.id)}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-white/5 rounded-md px-2 py-1 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
