import { cookies } from "next/headers";
import MultiHeaderTest from "./MultiHeaderTest";
import ProxyHeaderTest from "./ProxyHeaderTest";

// Opts out of Next.js's Full Route Cache. Per the Launch caching guide, this alone
// does not change the wire Cache-Control header — Launch's CDN caches strictly on
// the literal Cache-Control header, which is set explicitly in middleware.ts.
export const dynamic = "force-dynamic";

const COOKIE_PREFIX = "cf1004_";

export default async function Cf1004TestPage() {
  // The "origin" checkpoint for this page is logged by proxy.ts, which runs
  // before this component on every /cf1004-test/* request — see proxy.ts.
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  const testCookies = all.filter((c) => c.name.startsWith(COOKIE_PREFIX));

  const cookieBytes = (name: string, value: string) => name.length + value.length + 2;
  const testBytes = testCookies.reduce((sum, c) => sum + cookieBytes(c.name, c.value), 0);
  const totalCookieHeaderBytes = all.reduce((sum, c) => sum + cookieBytes(c.name, c.value), 0);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          CF1004 Header Size Test
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Deploy this project on Contentstack Launch, then use the links below
          to set this domain&apos;s Cookie header to different sizes. The
          edge function logs the total incoming header size on every request,
          so you can see the exact byte count once the platform&apos;s own
          layers push the total past Cloudflare&apos;s limit and it starts
          failing with <code>HTTP 413 / CF1004</code>.
        </p>

        <div className="rounded border border-zinc-300 dark:border-zinc-700 p-4 w-full">
          <p>
            Test cookies set: <strong>{testCookies.length}</strong>
          </p>
          <p>
            Approx. test cookie bytes: <strong>{testBytes.toLocaleString()} B</strong>
          </p>
          <p>
            Approx. total Cookie header bytes:{" "}
            <strong>{totalCookieHeaderBytes.toLocaleString()} B</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {[5, 5.5, 6, 6.5, 7, 7.5, 8].map((kb) => (
            <a
              key={kb}
              href={`/cf1004-test/add-cookie?kb=${kb}`}
              className="underline"
            >
              Set cookies to {kb} KB
            </a>
          ))}
          <a href="/cf1004-test/clear" className="underline">
            Clear test cookies
          </a>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Each link resets the test cookies to that size via{" "}
          <code>Set-Cookie</code> and redirects back here, so the redirect
          request itself carries the resized header. Check the edge
          function&apos;s logs in the Launch dashboard on each request to see
          the total header size, the largest header, and — once you pick a
          size that trips <code>HTTP 413 / CF1004</code> — the last
          successful size right below it.
        </p>

        <MultiHeaderTest />
        <ProxyHeaderTest />
      </main>
    </div>
  );
}
