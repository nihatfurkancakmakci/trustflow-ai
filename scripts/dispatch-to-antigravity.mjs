#!/usr/bin/env node
// Ham hata bağlamını toplar ve Antigravity Trigger webhook'una HMAC imzalı
// POST eder. LLM işi (prompt üretimi) makinendeki antigravity-trigger.py
// içinde LM Studio ile yapılır — bu script bulutta çalıştığı için localhost'a
// erişemez.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createHmac, createHash } from "node:crypto";
import { execSync } from "node:child_process";

const {
  ANTIGRAVITY_WEBHOOK_URL,
  ANTIGRAVITY_WEBHOOK_SECRET,
  SLACK_WEBHOOK_URL,
  GITHUB_REPO,
  GITHUB_SHA,
  GITHUB_REF,
  GITHUB_RUN_ID,
  GITHUB_SERVER_URL,
  TRIGGER_EVENT,
} = process.env;

function exit(msg) {
  console.error("dispatch:", msg);
  process.exit(1);
}

if (!ANTIGRAVITY_WEBHOOK_URL) exit("ANTIGRAVITY_WEBHOOK_URL yok");
if (!ANTIGRAVITY_WEBHOOK_SECRET) exit("ANTIGRAVITY_WEBHOOK_SECRET yok");

function safeRead(path, max = 8000) {
  if (!existsSync(path)) return null;
  const content = readFileSync(path, "utf8");
  return content.length > max ? content.slice(0, max) + "\n...[truncated]" : content;
}

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// 1. Ham bağlamı topla (frontend/ alt dizininden oku)
const context = {
  trigger: TRIGGER_EVENT,
  repo: GITHUB_REPO,
  commit: GITHUB_SHA,
  ref: GITHUB_REF,
  run_url: GITHUB_RUN_ID
    ? `${GITHUB_SERVER_URL}/${GITHUB_REPO}/actions/runs/${GITHUB_RUN_ID}`
    : null,
  logs: {
    build: safeRead("frontend/.autofix/build.log"),
    typescript: safeRead("frontend/.autofix/tsc.log"),
    eslint: safeRead("frontend/.autofix/eslint.json", 4000),
    test: safeRead("frontend/.autofix/test.log"),
    netlify_deploy: safeRead("frontend/.autofix/netlify.json"),
    runtime: safeRead("frontend/.autofix/runtime.json"),
    health: safeRead("frontend/.autofix/health.log"),
  },
  recent_commits: safeExec("git log --oneline -20"),
  changed_files: safeExec("git diff --name-only HEAD~5..HEAD"),
  diff: safeExec("git diff HEAD~1 HEAD"),
};

// 2. Aynı hata daha önce dispatch edildiyse skip
const fingerprint = createHash("sha256")
  .update(JSON.stringify(context.logs))
  .digest("hex")
  .slice(0, 16);

mkdirSync(".autofix-cache", { recursive: true });
const cacheFile = `.autofix-cache/${fingerprint}.txt`;
if (existsSync(cacheFile)) {
  const last = parseInt(readFileSync(cacheFile, "utf8"), 10);
  if (Date.now() - last < 15 * 60 * 1000) {
    console.log(`[skip] aynı hata imzası son 15dk içinde dispatch edildi: ${fingerprint}`);
    process.exit(0);
  }
}
writeFileSync(cacheFile, String(Date.now()));

// 3. Antigravity webhook'una imzalı POST
const payload = JSON.stringify({
  fingerprint,
  ...context,
  timestamp: Date.now(),
});

const signature = createHmac("sha256", ANTIGRAVITY_WEBHOOK_SECRET)
  .update(payload)
  .digest("hex");

console.log("[antigravity] webhook'a POST ediliyor...");
const agResponse = await fetch(ANTIGRAVITY_WEBHOOK_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Autofix-Signature": signature,
    "X-Autofix-Fingerprint": fingerprint,
  },
  body: payload,
});

if (!agResponse.ok) {
  const body = await agResponse.text();
  exit(`Antigravity webhook ${agResponse.status}: ${body}`);
}

console.log("[ok] Antigravity görevi aldı. Fingerprint:", fingerprint);

// 4. Slack bildirimi (opsiyonel)
if (SLACK_WEBHOOK_URL) {
  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🤖 *trusflowai auto-fix tetiklendi*\n> Tetikleyici: \`${context.trigger}\`\n> Commit: \`${context.commit?.slice(0, 7)}\`\n> Fingerprint: \`${fingerprint}\`\n> Local LM Studio prompt üretiyor, Antigravity agent düzeltmeye başlıyor...`,
    }),
  }).catch((e) => console.warn("slack bildirimi başarısız:", e.message));
}
