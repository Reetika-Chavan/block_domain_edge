export async function GET(request: Request) {
  const url = new URL(request.url);
  const bytes = Number(url.searchParams.get("bytes") || "1000");

  const unit = "Lorem ipsum dolor sit amet. ";
  const repeats = Math.ceil(bytes / unit.length);
  const filler = unit.repeat(repeats);
  const body = `<html><body><h1>Size Test</h1><p>${filler}</p></body></html>`;
  const byteLength = new TextEncoder().encode(body).length;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": String(byteLength),
    },
  });
}
