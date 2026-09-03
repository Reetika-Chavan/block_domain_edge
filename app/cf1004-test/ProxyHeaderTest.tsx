"use client";

import { useState } from "react";
import type { HeaderSizeBreakdown } from "@/lib/header-size";

const PROXY_HEADER_PREFIX = "x-cf1004-proxy-";

interface ProxyCheckResult {
  requestSideBytes: number[]; // sizes proxy.ts's own headers arrived at as seen by origin
  responseSideBytes: number[]; // sizes that survived the round trip back to the browser
  originBreakdown: HeaderSizeBreakdown;
}

export default function ProxyHeaderTest() {
  const [sizesInput, setSizesInput] = useState("2000,6000,12000");
  const [result, setResult] = useState<ProxyCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/cf1004-test/proxy-check?sizes=${encodeURIComponent(sizesInput)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setError(`Request failed: HTTP ${res.status}`);
        return;
      }
      const originBreakdown: HeaderSizeBreakdown = await res.json();

      const requestSideBytes = originBreakdown.headers
        .filter((h) => h.name.startsWith(PROXY_HEADER_PREFIX))
        .map((h) => h.bytes);

      const responseSideBytes: number[] = [];
      res.headers.forEach((value, name) => {
        if (name.startsWith(PROXY_HEADER_PREFIX)) {
          responseSideBytes.push(name.length + value.length + 4);
        }
      });

      setResult({ requestSideBytes, responseSideBytes, originBreakdown });

      // The server can't observe what the browser received on its own, so
      // report it back — this is what lands in the "response" checkpoint log.
      fetch("/cf1004-test/proxy-check/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizesRequested: sizesInput, requestSideBytes, responseSideBytes }),
        cache: "no-store",
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  return (
    <div className="rounded border border-zinc-300 dark:border-zinc-700 p-4 w-full flex flex-col gap-3">
      <p className="font-medium text-black dark:text-zinc-50">
        Proxy single-header limit test
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <code>proxy.ts</code> sets one <code>x-cf1004-proxy-N</code> header per
        size below — on the outgoing request (so origin reports what it
        actually received) and on the response (so the browser reports what
        survived the trip back out through nginx/Cloudflare). Compare the two
        to see whether the request path and response path have different
        single-header size limits.
      </p>
      <label className="flex items-center gap-2 text-sm text-black dark:text-zinc-50">
        Sizes (bytes, comma-separated):
        <input
          type="text"
          value={sizesInput}
          onChange={(e) => setSizesInput(e.target.value)}
          className="border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 w-56 bg-transparent"
        />
      </label>
      <button
        onClick={send}
        className="self-start rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1 underline"
      >
        Send request
      </button>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
      {result && (
        <div className="text-sm flex flex-col gap-1 text-black dark:text-zinc-50">
          <p>
            Received at origin (request side):{" "}
            <strong>{result.requestSideBytes.join(", ") || "none"}</strong> B
          </p>
          <p>
            Received back in browser (response side):{" "}
            <strong>{result.responseSideBytes.join(", ") || "none"}</strong> B
          </p>
          <p>Total header size at origin: {result.originBreakdown.totalHeaderKB} KB</p>
        </div>
      )}
    </div>
  );
}
