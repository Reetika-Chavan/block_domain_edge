export default async function handler(request, context) {
  const modifiedUrl = new URL(request.url);
  const route = modifiedUrl.pathname;

  if (route === "/about") {
    const redirectUrl = new URL("/contact.html", request.url);
    return Response.redirect(redirectUrl, 302);
  }

  return fetch(request);
}
