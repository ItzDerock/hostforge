import assert from "assert";
import { type IncomingMessage } from "http";
import { NextRequest } from "next/server.js";
import { getUrl } from "~/trpc/shared";

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

  // resolve URL
  assert(req.url, "req.url is undefined");
  const url = new URL(req.url, getUrl());

  // create the web request

  return new NextRequest(url.toString(), {
    method: req.method,
    body,
    headers,
  });
}
