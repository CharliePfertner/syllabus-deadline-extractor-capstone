/**
 * Verification screenshot script.
 * Uses Chrome DevTools Protocol over Node's native WebSocket — no extra packages.
 * Run with: node scripts/screenshot.mjs
 */
import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';

const CHROME_EXE = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223;
const APP_URL    = 'http://localhost:5174';
const OUT_FILE   = 'screenshot-parsed.png';

const SAMPLE = [
  'HIST 101 — Spring 2026 Syllabus',
  'Week 3 Reading due Jan 20',
  'Quiz 1 - Feb 3',
  'Essay 1 due Feb 28',
  'Midterm Exam - Mar 15',
  'Due 04/10: Research Proposal',
  '05-01-2026 Final Paper',
  'Final Exam due May 15, 2026',
].join('\n');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchRetry(url, tries = 12, delay = 400) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch { /* not ready yet */ }
    await sleep(delay);
  }
  throw new Error(`Could not reach ${url}`);
}

// ── Launch Chrome ─────────────────────────────────────────────────────────────
const chrome = spawn(CHROME_EXE, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--window-size=1280,800',
  '--disable-extensions',
  APP_URL,
], { stdio: 'ignore' });

await sleep(1500);

// ── Get CDP WebSocket URL ─────────────────────────────────────────────────────
const [pageInfo] = await fetchRetry(`http://localhost:${DEBUG_PORT}/json/list`);
const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);

let msgId = 0;
const pending = new Map();
ws.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id !== undefined) { pending.get(msg.id)?.(msg); pending.delete(msg.id); }
});
await new Promise(r => ws.addEventListener('open', r));

function cdp(method, params = {}) {
  return new Promise(resolve => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// ── Wait for React to mount ───────────────────────────────────────────────────
await cdp('Page.enable');
await sleep(2000);

// ── Fill textarea (React-compatible: use native setter + dispatch input event) ─
await cdp('Runtime.evaluate', {
  expression: `(function() {
    const el = document.querySelector('#syllabus-text');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
      .set.call(el, ${JSON.stringify(SAMPLE)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  })()`,
});
await sleep(400);

// ── Click Parse Deadlines button ─────────────────────────────────────────────
await cdp('Runtime.evaluate', {
  expression: `Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.includes('Parse'))?.click()`,
});
await sleep(600);

// ── Capture screenshot ────────────────────────────────────────────────────────
const screenshotResp = await cdp('Page.captureScreenshot', { format: 'png' });
await writeFile(OUT_FILE, Buffer.from(screenshotResp.result.data, 'base64'));

// ── Read back deadlines state from DOM for console verification ───────────────
const countResp = await cdp('Runtime.evaluate', {
  expression: `document.querySelector('[id="results-heading"]')?.textContent?.trim() ?? 'results section not found'`,
  returnByValue: true,
});
console.log('\nResults heading text:', countResp.result.value);

chrome.kill();
ws.close();
console.log(`Screenshot saved → ${OUT_FILE}\n`);
