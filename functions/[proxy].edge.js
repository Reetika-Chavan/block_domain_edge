const CACHE_BUSTING_PARAMS = ["OWASP_CSRFTOKEN"];

export default function handler(request, _context) {
  const url = new URL(request.url);

  let strippedParam = false;
  for (const param of CACHE_BUSTING_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      strippedParam = true;
    }
  }

  if (strippedParam) {
    return fetch(new Request(url.toString(), request));
  }

  return fetch(request);
}
