"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

export function RescanButton({ serverId }: { serverId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRescan() {
    setLoading(true);
    try {
      const res = await fetch("/api/scan/rescan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/results/${data.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRescan}
      disabled={loading}
      className="btn-secondary inline-flex items-center gap-1.5 text-xs"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      {loading ? "Starting..." : "Re-scan"}
    </button>
  );
}
