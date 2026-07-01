#!/usr/bin/env node
// LM Studio kurulumunu doğrular:
//   1. localhost:1234 açık mı?
//   2. Model yüklü mü?
//   3. Örnek bir hata prompt'una cevap dönüyor mu?
//
// Kullanım:
//   node scripts/test-lmstudio.mjs

const URL = process.env.LMSTUDIO_URL || "http://localhost:1234/v1";
const MODEL = process.env.LMSTUDIO_MODEL || "stefancosma/qwen2.5-coder-7b-instruct";

async function main() {
  console.log(`[1/3] ${URL}/models — bağlantı testi...`);
  const models = await fetch(`${URL}/models`).catch((e) => {
    console.error("BAĞLANTI YOK. LM Studio açık mı? Server sekmesinde 'Start Server' bastın mı?");
    console.error(e.message);
    process.exit(1);
  });
  if (!models.ok) {
    console.error(`HATA: ${models.status}`);
    process.exit(1);
  }
  const list = await models.json();
  const ids = (list.data || []).map((m) => m.id);
  console.log(`   ✓ ${ids.length} model bulundu:`, ids.join(", "));

  console.log(`[2/3] ${MODEL} yüklü mü?`);
  if (!ids.includes(MODEL)) {
    console.warn(`   ⚠ '${MODEL}' listede yok. LM Studio → My Models → Load bas.`);
    console.warn(`   Yine de test devam ediyor (varsayılan modelle)...`);
  } else {
    console.log(`   ✓ Yüklü`);
  }

  console.log(`[3/3] Örnek bir hata prompt'u gönderiyorum...`);
  const t0 = Date.now();
  const resp = await fetch(`${URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "Kısa cevap ver, Türkçe. Antigravity coding agent'a görev formatı üret." },
        {
          role: "user",
          content:
            "Hata: `Type 'string' is not assignable to type 'number'` — src/app.ts:12. Nasıl düzeltilir? 3 satırda.",
        },
      ],
      temperature: 0.2,
      stream: false,
    }),
  });

  if (!resp.ok) {
    console.error(`HATA: ${resp.status}`, await resp.text());
    process.exit(1);
  }
  const data = await resp.json();
  const answer = data.choices?.[0]?.message?.content;
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`   ✓ Cevap alındı (${dt}s):\n`);
  console.log("---");
  console.log(answer);
  console.log("---");
  console.log("\n✅ LM Studio hazır. Şimdi antigravity-trigger.py'yi başlatabilirsin.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
