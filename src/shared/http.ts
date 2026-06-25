import type { IncomingMessage, ServerResponse } from "node:http";

export async function readJsonBody<T>(request: IncomingMessage): Promise<T | null> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export function sendJson(response: ServerResponse, statusCode: number, value: unknown) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  response.end(`${JSON.stringify(value, null, 2)}\n`);
}

export function sendText(response: ServerResponse, statusCode: number, value: string, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  response.end(value);
}

export function handleOptions(response: ServerResponse) {
  response.writeHead(204, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  response.end();
}
