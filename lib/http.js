// Small helpers shared by the API routes.
export function send(res, status, body) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", status === 200 ? "public, max-age=60" : "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = status;
  res.end(status === 204 ? "" : JSON.stringify(body, null, 2));
}

export function query(req) {
  return Object.fromEntries(new URL(req.url, "http://x").searchParams);
}

export function preflight(req, res) {
  if (req.method === "OPTIONS") { send(res, 204, {}); return true; }
  if (req.method !== "GET") { send(res, 405, { error: "Use GET" }); return true; }
  return false;
}
