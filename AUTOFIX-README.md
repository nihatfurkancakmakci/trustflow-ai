# trusflowai Auto-Fix Kit

Otonom hata → düzeltme döngüsü. Sen bilgisayar başında durmayacaksın.
**Prompt üretimi local LM Studio (qwen2.5-coder-7b) ile — ücretsiz, cloud LLM yok.**

## Akış

```
Netlify build fail / GitHub push / cron health check / runtime error
        │
        ▼
GitHub Actions (auto-fix.yml) → hataları toplar
        │
        ▼
scripts/dispatch-to-antigravity.mjs
  → Ham errors + git diff + commits'i HMAC-imzalı POST eder
        │
        ▼  (senin makinen)
scripts/antigravity-trigger.py
  → LM Studio'ya (localhost:1234) sorar: "bu hatalara agent görevi yaz"
  → qwen2.5-coder cevabını Antigravity session'a push eder
        │
        ▼
Antigravity agent → kod düzeltir → branch → PR (label: antigravity-autofix)
        │
        ▼
auto-merge.yml → CI yeşilse otomatik merge → Netlify redeploy
```

## Ön koşullar

- **LM Studio** kurulu ve modelin yüklü:
  1. https://lmstudio.ai indir
  2. Discover sekmesinden `stefancosma/qwen2.5-coder-7b-instruct` indir
  3. Sol menüde **Developer** (server ikonu) → **Start Server** → port `1234`
  4. Model dropdown'dan qwen2.5-coder'ı seç
  5. Test: `curl http://localhost:1234/v1/models` → JSON dönmeli
- **Antigravity IDE** + `google-antigravity` Python SDK
- **cloudflared** veya **ngrok** (webhook'u dış dünyaya açmak için)

## Kurulum (~20 dk)

### 1. Kit'i trusflowai reposuna kopyala

```bash
cd path/to/trusflowai
cp -r path/to/trusflowai-autofix-kit/.github .
cp -r path/to/trusflowai-autofix-kit/scripts .
cp -r path/to/trusflowai-autofix-kit/netlify .
cp    path/to/trusflowai-autofix-kit/public/error-reporter.js public/
```

`index.html`'in `<head>`'ine ekle:
```html
<script src="/error-reporter.js" defer></script>
```

Netlify Dashboard → Site settings → Deploy notifications:
- **Outgoing webhook** ekle:
  - Event: `Deploy failed`
  - URL: `https://api.github.com/repos/<KULLANICI>/trusflowai/dispatches`
  - Header: `Authorization: token <GH_PAT>`, `Accept: application/vnd.github+json`
  - Payload: `{"event_type":"netlify_build_failed"}`

### 2. LM Studio'yu test et

```bash
node scripts/test-lmstudio.mjs
```

Şuna benzer bir çıktı görmelisin:
```
[1/3] http://localhost:1234/v1/models — bağlantı testi...
   ✓ 1 model bulundu: stefancosma/qwen2.5-coder-7b-instruct
[2/3] stefancosma/qwen2.5-coder-7b-instruct yüklü mü?
   ✓ Yüklü
[3/3] Örnek bir hata prompt'u gönderiyorum...
   ✓ Cevap alındı (4.2s): ...
✅ LM Studio hazır.
```

Hata alırsan LM Studio'da model yüklü ve server açık olduğundan emin ol.

### 3. Antigravity trigger'ı başlat

```bash
pip install google-antigravity fastapi uvicorn httpx
export ANTIGRAVITY_PROJECT_PATH=/path/to/trusflowai
export ANTIGRAVITY_WEBHOOK_SECRET=$(openssl rand -hex 32)
# Bu değeri bir yere kaydet — GitHub secret olarak da kullanacaksın
echo $ANTIGRAVITY_WEBHOOK_SECRET

python scripts/antigravity-trigger.py
```

Çıktı:
```
[antigravity-trigger] port 8787 dinleniyor
[antigravity-trigger] LM Studio: http://localhost:1234/v1 model=stefancosma/...
```

Terminal'i açık bırak.

### 4. Webhook'u dış dünyaya aç (yeni terminal)

```bash
cloudflared tunnel --url http://localhost:8787
```

Çıktıda `https://<random>.trycloudflare.com` göreceksin. Bu URL'in sonuna
`/autofix` ekle ve **GitHub secret** olarak kaydet.

### 5. GitHub secrets

`trusflowai` → Settings → Secrets and variables → Actions:

| Secret | Değer | Zorunlu |
|---|---|---|
| `ANTIGRAVITY_WEBHOOK_URL` | 4. adımdaki cloudflared URL + `/autofix` | ✅ |
| `ANTIGRAVITY_WEBHOOK_SECRET` | 3. adımdaki `openssl rand` çıktısı | ✅ |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | opsiyonel |

**Not:** Lovable API key, Netlify token vb. artık gerekmiyor — LLM işi local.

### 6. GitHub App izni

Settings → Actions → General → Workflow permissions:
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

### 7. Test et

Bilerek bir TypeScript hatası commit'le:
```ts
const x: number = "bilerek yanlış";
```

Push et. 2-3 dakika içinde:
1. Actions'ta `auto-fix` workflow'u yeşil (hata toplandı, dispatch edildi)
2. `antigravity-trigger.py` terminal'inde: `[autofix] görev alındı ... [lmstudio] prompt üretildi`
3. Antigravity IDE'de yeni session açılır
4. Agent PR açar, `auto-merge` merge eder

## Sürekli çalıştırma

LM Studio ve `antigravity-trigger.py` senin makinende açık kalmalı.
Bilgisayar kapanınca döngü durur.

**macOS:** `launchd` plist ile arka planda; **Linux:** `systemd` user service;
**basit yol:** `pm2` (Node ekosistemi ama Python'u da çalıştırır):
```bash
npm i -g pm2
pm2 start "python scripts/antigravity-trigger.py" --name autofix-trigger
pm2 start "cloudflared tunnel --url http://localhost:8787" --name autofix-tunnel
pm2 save
pm2 startup   # boot'ta otomatik başlatma
```

## Sonsuz döngü koruması

- Agent'ın açtığı PR'lar `antigravity-autofix` label'lı → workflow bunlarda tekrar dispatch etmez
- 15 dakikada aynı hata imzası tekrar dispatch edilmez (`.autofix-cache/`)
- Webhook HMAC imza doğrular

## Sorun giderme

| Sorun | Çözüm |
|---|---|
| Workflow başlıyor ama trigger ulaşmıyor | `cloudflared` açık mı, URL doğru mu (sonu `/autofix`) |
| `[lmstudio] HATA` → fallback | LM Studio Server'ı çalışıyor mu? `node scripts/test-lmstudio.mjs` |
| Agent PR açmıyor | `antigravity-trigger.py` log'u, git remote auth var mı |
| Auto-merge çalışmıyor | Repo settings → Branch protection → "Allow auto-merge" |
| Prompt üretimi çok yavaş | 7B model RAM'e bağlı; daha küçük varyant (`qwen2.5-coder-3b`) dene |

## Dosyalar

| Dosya | Ne yapar |
|---|---|
| `.github/workflows/auto-fix.yml` | Hata toplar, dispatch script'ini çağırır |
| `.github/workflows/auto-merge.yml` | Agent PR'larını yeşilse otomatik merge eder |
| `scripts/dispatch-to-antigravity.mjs` | Ham hataları HMAC-imzalı webhook'a POST eder |
| `scripts/antigravity-trigger.py` | LM Studio ile prompt üretir + Antigravity session'a push |
| `scripts/test-lmstudio.mjs` | LM Studio kurulum sağlık kontrolü |
| `netlify/functions/report-error.ts` | Runtime hataları → GitHub dispatch |
| `public/error-reporter.js` | Tarayıcı `window.onerror` yakalar |
