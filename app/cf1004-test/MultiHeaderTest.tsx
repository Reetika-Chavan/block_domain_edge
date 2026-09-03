"use client";

import { useState } from "react";
import type { HeaderSizeBreakdown } from "@/lib/header-size";

// Fixed reference points so the biggest-header pick can be sanity-checked by
// eye: "large" should win whenever it's set above ~1.5KB, "medium" otherwise.
const FIXED_HEADER_BYTES: Record<string, number> = {
  "x-cf1004-test-small": 400,
  "x-cf1004-test-medium": 1500,
};

export default function MultiHeaderTest() {
  const [largeBytes, setLargeBytes] = useState(3000);
  const [result, setResult] = useState<HeaderSizeBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/cf1004-test/multi-header", {
        headers: {
          ...Object.fromEntries(
            Object.entries(FIXED_HEADER_BYTES).map(([name, size]) => [
              name,
              "x".repeat(size),
            ]),
          ),
          "x-cf1004-test-large": "x".repeat(largeBytes),
        },
        cache: "no-store",
      });
      if (!res.ok) {
        setError(`Request failed: HTTP ${res.status}`);
        return;
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  return (
    <div className="rounded border border-zinc-300 dark:border-zinc-700 p-4 w-full flex flex-col gap-3">
      <p className="font-medium text-black dark:text-zinc-50">
        Multi-header test
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Sends <code>x-cf1004-test-small</code> (0.4KB) and{" "}
        <code>x-cf1004-test-medium</code> (1.5KB) alongside{" "}
        <code>x-cf1004-test-large</code> at the size below, plus whatever
        cookies are currently set, so you can confirm the breakdown correctly
        ranks headers and picks out the biggest one.
      </p>
      <label className="flex items-center gap-2 text-sm text-black dark:text-zinc-50">
        x-cf1004-test-large size (bytes):
        <input
          type="number"
          value={largeBytes}
          onChange={(e) => setLargeBytes(Number(e.target.value))}
          className="border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 w-28 bg-transparent"
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
            Largest header:{" "}
            <strong>
              {result.largestHeader?.name} ({result.largestHeader?.bytes} B)
            </strong>
          </p>
          <p>Total header size: {result.totalHeaderKB} KB</p>
          <ul className="list-disc pl-5">
            {result.headers.slice(0, 8).map((h) => (
              <li key={h.name}>
                {h.name}: {h.bytes} B
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
