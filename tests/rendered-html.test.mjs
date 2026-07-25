import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() { },
      passThroughOnException() { },
    },
  );
}

test("server-renders the mindlix.in landing page", async () => {
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const chatRoute = await readFile(
    new URL("../app/api/chat/route.ts", import.meta.url),
    "utf8",
  );
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>mindlix\.in/);
  assert.match(html, /Research the signal/);
  assert.match(html, /Ask Mindlix/);
  assert.match(html, /Business R&amp;D/);
  assert.match(html, /Lead generation/);
  assert.match(html, /Growth analytics/);
  assert.match(stylesheet, /prefers-reduced-motion/);
  assert.match(stylesheet, /\.chat-modal/);
  assert.match(chatRoute, /OPENAI_API_KEY/);
  assert.match(chatRoute, /store:\s*false/);
  assert.match(chatRoute, /gpt-5\.6-luna/);
  assert.doesNotMatch(chatRoute, /localStorage|sessionStorage|drizzle/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
