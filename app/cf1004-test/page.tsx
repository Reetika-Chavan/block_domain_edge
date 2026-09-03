import { cookies, headers } from "next/headers";
import { computeHeaderSizeBreakdown } from "@/lib/header-size";

// Opts out of Next.js's Full Route Cache. Per the Launch caching guide, this alone
// does not change the wire Cache-Control header — Launch's CDN caches strictly on
// the literal Cache-Control header, which is set explicitly in middleware.ts.
export const dynamic = "force-dynamic";

const COOKIE_PREFIX = "cf1004_";

export default async function Cf1004TestPage() {
  const headerStore = await headers();
  // This page runs on origin compute, downstream of both the edge function and
  // nginx. It's the only point in this repo where nginx's own additions
  // (x-launch-customer-auth, x-launch-origin-auth, AWS/GCP signing headers) are
  // visible, since they're injected after the edge function's fetch(request) call.
  console.log(JSON.stringify(computeHeaderSizeBreakdown(headerStore)));

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
          Deploy this project on Contentstack Launch, then use the link below
          to set this domain&apos;s Cookie header to <strong>5.0 KB</strong>.
          The edge function logs the total incoming header size on every
          request, so you can see the exact byte count once the
          platform&apos;s own layers push the total past Cloudflare&apos;s
          limit and it starts failing with <code>HTTP 413 / CF1004</code>.
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
          <a href="/cf1004-test/add-cookie" className="underline">
            Set cookies to 5.0 KB
          </a>
          <a href="/cf1004-test/clear" className="underline">
            Clear test cookies
          </a>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          The link resets the test cookies to exactly 5.0 KB via{" "}
          <code>Set-Cookie</code> and redirects back here, so the redirect
          request itself carries the resized header. Check the edge
          function&apos;s logs in the Launch dashboard for the{" "}
          <code>cf1004_header_size</code> entry on each request to see the
          total header size and how much of it isn&apos;t from these test
          cookies.
        </p>
      </main>
    </div>
  );
}
