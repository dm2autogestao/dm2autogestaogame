import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = join(root, safePath);

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  const indexCandidate = join(candidate, "index.html");
  if (existsSync(indexCandidate)) {
    return indexCandidate;
  }

  return join(root, "index.html");
}

createServer((request, response) => {
  const filePath = resolvePath(request.url ?? "/");
  const ext = extname(filePath);
  response.writeHead(200, {
    "content-type": types[ext] ?? "application/octet-stream",
    "cache-control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`Static app running at http://${host}:${port}`);
});
