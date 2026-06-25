import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { handleOptions, sendText } from "../shared/http";
import "./api";

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    handleOptions(response);
    return;
  }

  const url = new URL(request.url ?? "/", "http://127.0.0.1:8788");
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.resolve("dist", `.${requestedPath}`);

  if (!filePath.startsWith(path.resolve("dist"))) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const body = await fs.readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath)] ?? "application/octet-stream"
    });
    response.end(body);
  } catch {
    const index = await fs.readFile(path.resolve("dist/index.html"));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(index);
  }
});

server.listen(8788, "127.0.0.1", () => {
  console.log("XHS Trend Radar Web: http://127.0.0.1:8788");
});
