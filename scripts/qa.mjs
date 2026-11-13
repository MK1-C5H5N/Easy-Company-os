// Tiny screenshot/QA harness using Chrome DevTools Protocol.
// No npm dependencies: Node 22+ has a global WebSocket and fetch.
//
// Usage:
//   node scripts/qa.mjs --url http://127.0.0.1:4173/#/dashboard --out .preview/shot.png
//   node scripts/qa.mjs --url ... --width 390 --height 844 --mobile

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const url = arg("url", "http://127.0.0.1:4173/#/dashboard");
const out = resolve(arg("out", ".preview/screenshot.png"));
const width = Number(arg("width", 1440));
const height = Number(arg("height", 1100));
const mobile = flag("mobile");
const expression = arg("eval", "");
const waitMs = Number(arg("wait", 1200));
const port = 9300 + Math.floor(Math.random() * 500);

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chrome) {
  console.error("Chrome/Edge not found. Set CHROME_PATH.");
  process.exit(1);
}

const profile = `${os.tmpdir()}/opc-qa-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await sleep(100);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

let socket;
let sequence = 0;
const pending = new Map();
const events = new Map();

function send(method, params = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const id = ++sequence;
    pending.set(id, { resolvePromise, rejectPromise });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

function waitEvent(name, timeout = 5000) {
  return new Promise((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error(`Timeout waiting for ${name}`)), timeout);
    events.set(name, (payload) => {
      clearTimeout(timer);
      events.delete(name);
      resolvePromise(payload);
    });
  });
}

async function main() {
  await waitForDebugger();
  const targetResponse = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
  const target = await targetResponse.json();

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolvePromise, rejectPromise) => {
    socket.addEventListener("open", resolvePromise, { once: true });
    socket.addEventListener("error", rejectPromise, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolvePromise, rejectPromise } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rejectPromise(new Error(message.error.message));
      else resolvePromise(message.result);
      return;
    }
    if (message.method && events.has(message.method)) {
      events.get(message.method)(message.params);
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await send("Page.navigate", { url });
  await sleep(waitMs);

  if (expression) {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      console.error("eval error:", result.exceptionDetails.text);
    } else {
      console.log("eval:", JSON.stringify(result.result?.value));
    }
    await sleep(500);
  }

  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(data, "base64"));
  console.log(`saved ${out} (${width}x${height}${mobile ? ", mobile" : ""})`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await send("Browser.close");
    } catch {
      // ignore
    }
    browser.kill();
    setTimeout(() => process.exit(process.exitCode || 0), 200);
  });
