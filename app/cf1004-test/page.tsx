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
          Deploy this project on Contentstack Launch, then use the link below
          to set this domain&apos;s Cookie header to <strong>5 KB</strong>.
          The edge function logs the total incoming header size on every
          request, so you can see how much headroom is left before the
          platform&apos;s own layers push it over Cloudflare&apos;s{" "}
          <strong>8 KB</strong> cap and it starts failing with{" "}
          <code>HTTP 413 / CF1004</code>.
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
            Set cookies to 5 KB
          </a>
          <a href="/cf1004-test/clear" className="underline">
            Clear test cookies
          </a>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          The link resets the test cookies to exactly 5 KB via{" "}
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
