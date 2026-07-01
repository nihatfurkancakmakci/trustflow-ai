// Tarayıcıdaki runtime hataları alır ve GitHub repository_dispatch tetikler.
// GitHub Actions'daki auto-fix workflow'u bunu yakalayıp Antigravity'ye yollar.

import type { Handler } from "@netlify/functions";
import { createHash } from "crypto";

// Basit in-memory rate limit (function invocation'lar arası paylaşılmaz ama
// yine de aynı istek içi tekrarları engeller). Kalıcı rate limit için
// dispatch-to-antigravity.mjs zaten fingerprint kontrolü yapıyor.
const RATE_WINDOW_MS = 5 * 60 * 1000;
const seen = new Map<string, number>();

export const handler: Handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "method not allowed" };
  }

  let payload: {
    message?: string;
    stack?: string;
    url?: string;
    userAgent?: string;
    line?: number;
    col?: number;
  };
  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, headers: cors, body: "bad json" };
  }

  if (!payload.message) {
    return { statusCode: 400, headers: cors, body: "message required" };
  }

  // Aynı hatayı 5dk içinde tekrar dispatch etme
  const fp = createHash("sha256")
    .update(`${payload.message}|${payload.stack?.slice(0, 500) ?? ""}`)
    .digest("hex")
    .slice(0, 16);
  const now = Date.now();
  const last = seen.get(fp);
  if (last && now - last < RATE_WINDOW_MS) {
    return { statusCode: 202, headers: cors, body: "rate_limited" };
  }
  seen.set(fp, now);

  const GH_TOKEN = process.env.GH_DISPATCH_TOKEN;
  const GH_REPO = process.env.GH_REPO; // "kullanici/trusflowai"
  if (!GH_TOKEN || !GH_REPO) {
    console.error("GH_DISPATCH_TOKEN veya GH_REPO eksik");
    return { statusCode: 500, headers: cors, body: "server not configured" };
  }

  const dispatch = await fetch(
    `https://api.github.com/repos/${GH_REPO}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "runtime_error",
        client_payload: payload,
      }),
    },
  );

  if (!dispatch.ok) {
    const body = await dispatch.text();
    console.error("github dispatch failed", dispatch.status, body);
    return { statusCode: 502, headers: cors, body: "dispatch failed" };
  }

  return { statusCode: 202, headers: cors, body: JSON.stringify({ ok: true, fingerprint: fp }) };
};
