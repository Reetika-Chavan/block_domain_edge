export async function GET() {
  const body = "# Already Markdown\n\nThis origin response is already markdown and should pass through unmodified.\n";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
