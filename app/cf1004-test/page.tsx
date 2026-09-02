import { cookies } from "next/headers";

const COOKIE_PREFIX = "cf1004_";

export default async function Cf1004TestPage() {
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
          to set this domain&apos;s Cookie header to an exact size. Cloudflare
          caps total request headers at <strong>8 KB</strong>, so requests at
          or above that should start failing with{" "}
          <code>HTTP 413 / CF1004</code> instead of loading.
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
          <a href="/cf1004-test/add-cookie?kb=4" className="underline">
            Set to 4 KB
          </a>
          <a href="/cf1004-test/add-cookie?kb=7" className="underline">
            Set to 7 KB
          </a>
          <a href="/cf1004-test/add-cookie?kb=8" className="underline">
            Set to 8 KB
          </a>
          <a href="/cf1004-test/add-cookie?kb=9" className="underline">
            Set to 9 KB
          </a>
          <a href="/cf1004-test/add-cookie?kb=12" className="underline">
            Set to 12 KB
          </a>
          <a href="/cf1004-test/clear" className="underline">
            Clear test cookies
          </a>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Each link resets the test cookies to exactly that many 1 KB cookies
          via <code>Set-Cookie</code> and redirects back here, so the redirect
          request itself carries the resized header — that request is where
          you should expect the 413 to appear once you cross 8 KB. Try 7 KB
          (should load) then 8 or 9 KB (should 413) to confirm the boundary.
        </p>
      </main>
    </div>
  );
}
