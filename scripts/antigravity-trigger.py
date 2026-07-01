"""
Antigravity Trigger — trusflowai auto-fix döngüsünün agent tarafı.

Bilgisayarında çalışır. FastAPI ile /autofix webhook'u açar.
GitHub Actions'tan gelen imzalı ham hata bağlamını alır,
LM Studio'daki qwen2.5-coder ile Antigravity için prompt üretir,
sonucu aktif Antigravity session'una push eder.

Ön koşul:
    1. LM Studio çalışıyor: http://localhost:1234
       Model: stefancosma/qwen2.5-coder-7b-instruct (yüklü ve Server açık)
    2. Antigravity IDE ve google-antigravity SDK kurulu

Kurulum:
    pip install google-antigravity fastapi uvicorn httpx
    export ANTIGRAVITY_PROJECT_PATH=/path/to/trusflowai
    export ANTIGRAVITY_WEBHOOK_SECRET=<openssl rand -hex 32>
    python scripts/antigravity-trigger.py

Dış dünyaya aç (GitHub Actions için):
    cloudflared tunnel --url http://localhost:8787
    # URL'in sonuna /autofix ekle, GitHub secret ANTIGRAVITY_WEBHOOK_URL yap
"""

import hashlib
import hmac
import json
import os
import sys
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
import uvicorn

try:
    from google.antigravity import Agent  # type: ignore
except ImportError:
    print("HATA: google-antigravity kurulu değil. `pip install google-antigravity`", file=sys.stderr)
    sys.exit(1)


SECRET = os.environ.get("ANTIGRAVITY_WEBHOOK_SECRET")
PROJECT_PATH = os.environ.get("ANTIGRAVITY_PROJECT_PATH")
PORT = int(os.environ.get("PORT", "8787"))

LMSTUDIO_URL = os.environ.get("LMSTUDIO_URL", "http://localhost:1234/v1")
LMSTUDIO_MODEL = os.environ.get("LMSTUDIO_MODEL", "stefancosma/qwen2.5-coder-7b-instruct")

if not SECRET:
    print("HATA: ANTIGRAVITY_WEBHOOK_SECRET set edilmemiş", file=sys.stderr)
    sys.exit(1)
if not PROJECT_PATH:
    print("HATA: ANTIGRAVITY_PROJECT_PATH set edilmemiş", file=sys.stderr)
    sys.exit(1)


agent = Agent(
    project_path=PROJECT_PATH,
    name="trusflowai-autofix",
    system_prompt=(
        "Sen trusflowai projesinin otomatik düzeltme agent'ısın. "
        "Sana gelen her görev bir hata raporudur. Görev formatını takip et, "
        "kodu düzelt, testleri çalıştır, autofix/<fingerprint> adında branch aç, "
        "commit mesajını [antigravity-autofix] ile başlat, PR aç ve label olarak "
        "'antigravity-autofix' ekle. Başka hiçbir şey yapma."
    ),
)

app = FastAPI()


def verify_signature(body: bytes, signature: str | None) -> bool:
    if not signature:
        return False
    expected = hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


SYSTEM_PROMPT = """Sen Antigravity IDE'de çalışan kodlama agent'ına görev yazıyorsun.
trusflowai projesinde otomatik hata düzeltme döngüsündesin.

Aşağıdaki ham hataları analiz et ve şu formatta çıktı üret:

# Görev: <kısa başlık>

## Kök Neden
<hataların temel sebebi, 2-3 cümle>

## Etkilenen Dosyalar
- path/to/file.ts — <ne değişecek>

## Adım Adım Plan
1. ...
2. ...

## Kabul Kriterleri
- [ ] bun run build başarılı
- [ ] bunx tsgo --noEmit hata vermez
- [ ] ...

## Notlar
- Branch adı: autofix/<FINGERPRINT>
- Commit mesajı prefix: [antigravity-autofix]
- PR label: antigravity-autofix

TÜRKÇE yaz. Kısa, net, uygulanabilir ol. Tahmin değil analiz yap."""


def build_user_message(payload: dict[str, Any]) -> str:
    logs = payload.get("logs", {}) or {}
    return f"""Tetikleyici: {payload.get('trigger')}
Repo: {payload.get('repo')}
Commit: {payload.get('commit')}
Fingerprint: {payload.get('fingerprint')}
Run URL: {payload.get('run_url')}

--- BUILD LOG ---
{logs.get('build') or '(yok)'}

--- TYPESCRIPT ---
{logs.get('typescript') or '(yok)'}

--- ESLINT ---
{logs.get('eslint') or '(yok)'}

--- TEST ---
{logs.get('test') or '(yok)'}

--- RUNTIME (tarayıcıdan) ---
{logs.get('runtime') or '(yok)'}

--- HEALTH CHECK ---
{logs.get('health') or '(yok)'}

--- SON COMMIT'LER ---
{payload.get('recent_commits') or '(yok)'}

--- SON DEĞİŞEN DOSYALAR ---
{payload.get('changed_files') or '(yok)'}

--- SON DIFF ---
{(payload.get('diff') or '')[:6000]}"""


async def call_lmstudio(payload: dict[str, Any]) -> str:
    """LM Studio'ya prompt üret. Ulaşılamazsa fallback template döner."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{LMSTUDIO_URL}/chat/completions",
                json={
                    "model": LMSTUDIO_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": build_user_message(payload)},
                    ],
                    "temperature": 0.2,
                    "stream": False,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            prompt = data["choices"][0]["message"]["content"]
            print(f"[lmstudio] prompt üretildi ({len(prompt)} char)")
            return prompt
    except Exception as e:
        print(f"[lmstudio] HATA: {e} — fallback template'e geçiliyor", file=sys.stderr)
        return fallback_prompt(payload)


def fallback_prompt(payload: dict[str, Any]) -> str:
    """LM Studio yoksa: agent'a ham hataları yolla, kendi analiz etsin."""
    return f"""# Görev: Otomatik hata düzeltme (fallback)

LM Studio bağlantısı yok — ham hataları sen analiz et.

## Bağlam
- Tetikleyici: {payload.get('trigger')}
- Commit: {payload.get('commit')}
- Fingerprint: {payload.get('fingerprint')}

## Ham Hatalar
```
{build_user_message(payload)}
```

## Yapılacak
1. Yukarıdaki logları oku, kök nedeni bul
2. Kodu düzelt
3. `bun run build` ve `bunx tsgo --noEmit` yeşile dönsün
4. Branch: `autofix/{payload.get('fingerprint')}`
5. Commit mesajı: `[antigravity-autofix] <özet>`
6. PR aç, label: `antigravity-autofix`
"""


@app.post("/autofix")
async def autofix(
    request: Request,
    x_autofix_signature: str | None = Header(default=None),
    x_autofix_fingerprint: str | None = Header(default=None),
) -> dict[str, Any]:
    body = await request.body()
    if not verify_signature(body, x_autofix_signature):
        raise HTTPException(status_code=401, detail="invalid signature")

    payload = json.loads(body)
    fingerprint = payload.get("fingerprint") or x_autofix_fingerprint or "unknown"
    trigger = payload.get("trigger", "unknown")
    commit = (payload.get("commit") or "")[:7]

    print(f"[autofix] görev alındı: fp={fingerprint} trigger={trigger} commit={commit}")

    # 1) LM Studio ile prompt üret
    prompt = await call_lmstudio(payload)

    # 2) Antigravity session'a push
    session = await agent.get_or_create_session(name=f"autofix-{fingerprint}")
    await session.send_message(prompt)

    print(f"[autofix] agent session'a push edildi: {session.id}")
    return {"ok": True, "session_id": session.id, "fingerprint": fingerprint}


@app.get("/health")
async def health() -> dict[str, Any]:
    lm_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{LMSTUDIO_URL}/models")
            lm_ok = r.status_code == 200
    except Exception:
        pass
    return {"status": "ok", "agent": agent.name, "lmstudio": lm_ok}


if __name__ == "__main__":
    print(f"[antigravity-trigger] port {PORT} dinleniyor")
    print(f"[antigravity-trigger] project: {PROJECT_PATH}")
    print(f"[antigravity-trigger] LM Studio: {LMSTUDIO_URL} model={LMSTUDIO_MODEL}")
    print(f"[antigravity-trigger] webhook path: /autofix")
    print("[antigravity-trigger] cloudflared/ngrok ile expose et ve URL'i GitHub secret'ına koy.")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
