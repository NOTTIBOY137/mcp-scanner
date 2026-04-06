"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string | null;
  plan: string | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export function ApiKeyCard({
  keys,
  maxKeys,
}: {
  keys: ApiKey[];
  maxKeys: number;
}) {
  const router = useRouter();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createKey() {
    setLoading(true);
    try {
      const res = await fetch("/dashboard/api-keys", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNewKey(data.key);
        router.refresh();
      } else {
        alert(data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteKey(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch("/dashboard/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Newly created key banner */}
      {newKey && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <p className="text-sm font-medium text-green-400 mb-2">
            API key created. Copy it now — you won&apos;t see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-mono text-foreground break-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Existing keys */}
      {keys.length === 0 && !newKey ? (
        <p className="text-sm text-muted">
          No API keys yet. Create one to start using the API.
        </p>
      ) : (
        keys.map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900 px-4 py-3"
          >
            <div>
              <code className="text-sm font-mono text-foreground">
                {key.keyPrefix}****
              </code>
              <span className="ml-3 text-xs text-muted">
                {key.name}
              </span>
              {key.lastUsedAt && (
                <span className="ml-3 text-xs text-muted">
                  Last used{" "}
                  {new Date(key.lastUsedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <button
              onClick={() => deleteKey(key.id)}
              disabled={deleting === key.id}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleting === key.id ? "Revoking..." : "Revoke"}
            </button>
          </div>
        ))
      )}

      {/* Create button */}
      {keys.length < maxKeys && (
        <button
          onClick={createKey}
          disabled={loading}
          className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Generate API Key"}
        </button>
      )}
    </div>
  );
}
