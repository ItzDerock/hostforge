import assert from "assert";
import { IncomingMessage } from "http";
import { NextRequest } from "next/server";

/**
 * Turns an node:http IncomingMessage into a next.js request
 * @param req The incoming request
 */
export function incomingRequestToNextRequest(req: IncomingMessage) {
  // copy headers to a new Headers object
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    headers.set(key, value as string);
  }

  // fix the body
  let body: ReadableStream<Uint8Array> | undefined = undefined;
  if (req.method === "POST") {
    body = new ReadableStream({
      start(controller) {
        req.on("data", (chunk) => {
          controller.enqueue(chunk);
        });

        req.on("end", () => {
          controller.close();
        });
      },
    });
  }

  // create the web request
  assert(req.url, "req.url is undefined");
  return new NextRequest(req.url, {
    method: req.method,
    body,
    headers,
  });
}
