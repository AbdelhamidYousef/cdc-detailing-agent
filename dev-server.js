// Local stand-in for Vercel: serves /public and routes /api/<name> to api/<name>.js.
// Usage: node dev-server.js [port]
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.argv[2] || 8787);
const root = new URL(".", import.meta.url).pathname;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json" };

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://x");
  const api = pathname.match(/^\/api\/([a-z-]+)$/);
  try {
    if (api) {
      const mod = await import(join(root, "api", api[1] + ".js"));
      return await mod.default(req, res);
    }
    const file = normalize(join(root, "public", pathname === "/" ? "index.html" : pathname));
    if (!file.startsWith(join(root, "public"))) throw new Error("bad path");
    res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    res.end(await readFile(file));
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`http://127.0.0.1:${port}`));
