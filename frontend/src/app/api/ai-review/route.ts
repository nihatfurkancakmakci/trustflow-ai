import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ReviewRequest {
  jobTitle: string;
  jobDescription: string;
  milestones?: {
    index: number;
    description: string;
    deliveryNotes: string;
    deliveryUrl?: string;
  }[];
  milestoneDescription?: string;
  deliveryNotes?: string;
  deliveryUrl?: string;
}

// ═══════════════════════════════════════════════════════════════
// GITHUB INTEGRATION — Kod Değişikliklerini ve Dosyaları Çekme
// ═══════════════════════════════════════════════════════════════

async function fetchGithubData(url: string): Promise<string> {
  if (!url || !url.includes("github.com")) return "";
  
  try {
    const commitMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/commit\/([^/]+)/);
    if (commitMatch) {
      const [, owner, repo, sha] = commitMatch;
      const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
        headers: { "User-Agent": "TrustFlow-AI-Reviewer" }
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const files = data.files?.map((f: any) => `- ${f.filename} (${f.status}): +${f.additions} -${f.deletions}`).join("\n") || "";
        return `GitHub Commit Info (SHA: ${sha}):\nMessage: ${data.commit?.message || "No message"}\nChanged Files:\n${files || "None"}`;
      }
    }

    const prMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/([^/]+)/);
    if (prMatch) {
      const [, owner, repo, prNum] = prMatch;
      const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNum}/files`, {
        headers: { "User-Agent": "TrustFlow-AI-Reviewer" }
      });
      if (apiRes.ok) {
        const files = await apiRes.json();
        const fileList = files.map((f: any) => `- ${f.filename} (${f.status}): +${f.additions} -${f.deletions}`).join("\n") || "";
        return `GitHub Pull Request Info (PR #${prNum}):\nChanged Files:\n${fileList || "None"}`;
      }
    }
    
    const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (repoMatch) {
      const [, owner, repo] = repoMatch;
      if (owner && repo && owner !== "repos" && repo !== "pulls" && repo !== "commits") {
        const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`, {
          headers: { "User-Agent": "TrustFlow-AI-Reviewer" }
        });
        if (apiRes.ok) {
          const commits = await apiRes.json();
          const commitList = commits.map((c: any) => `- ${c.commit?.message || "No message"} (${c.sha.slice(0, 7)})`).join("\n") || "";
          return `GitHub Repository Info:\nRecent Commits:\n${commitList || "None"}`;
        }
      }
    }
  } catch (error) {
    console.warn("[TrustFlow AI] GitHub metadata fetch failed:", error);
  }
  return "";
}

// ═══════════════════════════════════════════════════════════════
// KATMAN 1: LM STUDIO — YEREL MODEL (Geliştirme ortamı)
// ═══════════════════════════════════════════════════════════════

async function callLocalLLM(prompt: string): Promise<string | null> {
  const endpoint = process.env.LOCAL_LLM_ENDPOINT;
  if (!endpoint) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are TrustFlow AI, a delivery review engine for a Web3 freelance escrow platform on Stellar blockchain. Always respond with valid JSON only, no markdown, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        stream: false,
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[TrustFlow AI] LM Studio ${response.status}, sonraki katmana geçiliyor...`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return content;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[TrustFlow AI] LM Studio erişilemedi: ${msg}`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// KATMAN 2: GROQ — BULUT LLM (Canlı demo / Production)
// ═══════════════════════════════════════════════════════════════

async function callGroq(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are TrustFlow AI, a delivery review engine for a Web3 freelance escrow platform on Stellar blockchain. Always respond with valid JSON only, no markdown, no code fences, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.warn(`[TrustFlow AI] Groq ${response.status}, sonraki katmana geçiliyor...`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.warn("[TrustFlow AI] Groq erişilemedi:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// KATMAN 3: GOOGLE GEMINI — BULUT API (Yedek)
// ═══════════════════════════════════════════════════════════════

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[TrustFlow AI] Gemini ${response.status}, yerleşik motora geçiliyor...`);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.warn("[TrustFlow AI] Gemini erişilemedi:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// AKILLI MODEL SEÇİCİ — 4 katmanlı fallback zinciri
// ═══════════════════════════════════════════════════════════════

interface AIResult {
  text: string;
  engine: string;
  model: string;
}

async function callAI(prompt: string): Promise<AIResult | null> {
  // 1) Yerel LM Studio (geliştirme)
  const localResult = await callLocalLLM(prompt);
  if (localResult) {
    return {
      text: localResult,
      engine: "LM Studio + TrustFlow AI Engine v2.0",
      model: "Qwen2.5-Coder-7B (Local)",
    };
  }

  // 2) Groq bulut (production — Llama 3.3 70B)
  const groqResult = await callGroq(prompt);
  if (groqResult) {
    return {
      text: groqResult,
      engine: "Groq Cloud + TrustFlow AI Engine v2.0",
      model: "Llama 3.3 70B (Groq)",
    };
  }

  // 3) Gemini bulut (yedek)
  const geminiResult = await callGemini(prompt);
  if (geminiResult) {
    return {
      text: geminiResult,
      engine: "Google Gemini + TrustFlow AI Engine v2.0",
      model: "Gemini 2.0 Flash",
    };
  }

  // 4) Hepsi başarısız → null, yerleşik motor devreye girer
  return null;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT MÜHENDİSLİĞİ
// ═══════════════════════════════════════════════════════════════

function buildSinglePrompt(
  jobTitle: string,
  jobDescription: string,
  milestoneDesc: string,
  deliveryNotes: string,
  deliveryUrl?: string,
  gitData?: string
): string {
  return `Analyze this freelance delivery against the job requirements.

## Job Information
- Job Title: ${jobTitle}
- Job Description: ${jobDescription}
- Milestone Requirements: ${milestoneDesc}

## Freelancer's Delivery
- Delivery Notes: ${deliveryNotes}
${deliveryUrl ? `- Delivery URL: ${deliveryUrl}` : "- Delivery URL: Not provided"}
${gitData ? `\n### Retrieved GitHub Metadata:\n${gitData}\n` : ""}

## Instructions
Compare the delivery against the requirements (including files and code changes retrieved from GitHub if provided). Respond with ONLY this JSON:
{
  "score": <number 0-100>,
  "recommendation": "<APPROVE | REVISION_NEEDED | REJECT>",
  "summary": "<2-3 sentence assessment>",
  "requirementsCovered": ["<met requirements>"],
  "requirementsMissing": ["<missing requirements>"],
  "strengths": ["<strengths>"],
  "concerns": ["<concerns>"],
  "revisionSuggestions": ["<actionable suggestions>"],
  "aiConfidence": <number 60-95>
}

Scoring: 80-100=meets all, 60-79=minor gaps, 40-59=significant gaps, 0-39=reject.`;
}

function buildMultiPrompt(
  jobTitle: string,
  jobDescription: string,
  milestones: { index: number; description: string; deliveryNotes: string; deliveryUrl?: string }[]
): string {
  const milestonesText = milestones
    .map(
      (m) => `
### Milestone ${m.index + 1}
- Requirements: ${m.description}
- Delivery Notes: ${m.deliveryNotes}
${m.deliveryUrl ? `- Delivery URL: ${m.deliveryUrl}` : "- Delivery URL: Not provided"}`
    )
    .join("\n");

  return `Review MULTIPLE milestones for a freelance job.

## Job Information
- Job Title: ${jobTitle}
- Job Description: ${jobDescription}

## Milestones
${milestonesText}

## Instructions
Analyze each milestone individually, then give overall assessment. Respond with ONLY this JSON:
{
  "milestoneReviews": [
    {
      "milestoneIndex": <number>,
      "score": <number 0-100>,
      "recommendation": "<APPROVE | REVISION_NEEDED | REJECT>",
      "summary": "<1-2 sentence>",
      "requirementsCovered": ["<met>"],
      "requirementsMissing": ["<missing>"],
      "revisionSuggestions": ["<suggestions>"]
    }
  ],
  "overallScore": <number 0-100>,
  "overallRecommendation": "<APPROVE | REVISION_NEEDED | REJECT>",
  "overallSummary": "<2-3 sentence>",
  "strengths": ["<strengths>"],
  "concerns": ["<concerns>"],
  "revisionSuggestions": ["<suggestions>"],
  "aiConfidence": <number 60-95>
}`;
}

// ═══════════════════════════════════════════════════════════════
// KATMAN 4: YERLEŞİK ANALİZ MOTORU (Son Çare — Her Zaman Çalışır)
// ═══════════════════════════════════════════════════════════════

export function localAnalyze(
  jobTitle: string,
  jobDescription: string,
  milestoneDesc: string,
  deliveryNotes: string,
  deliveryUrl?: string
) {
  let score = 50;
  const strengths: string[] = [];
  const concerns: string[] = [];
  const revisionSuggestions: string[] = [];
  const requirementsCovered: string[] = [];
  const requirementsMissing: string[] = [];

  const notesLen = deliveryNotes?.length || 0;

  // ── Teslimat derinliği ──
  if (notesLen > 500) {
    score += 15;
    strengths.push("Comprehensive delivery notes provided with detailed explanations");
  } else if (notesLen > 200) {
    score += 10;
    strengths.push("Adequate delivery notes with reasonable detail");
  } else if (notesLen > 50) {
    score += 5;
  } else {
    score -= 10;
    concerns.push("Delivery notes are too brief — more detail would help the client understand the work done");
    revisionSuggestions.push("Expand delivery notes to at least 200 characters explaining what was done");
  }

  // ── URL analizi ──
  if (deliveryUrl) {
    const url = deliveryUrl.toLowerCase();
    if (url.includes("github.com") || url.includes("gitlab.com")) {
      score += 10;
      strengths.push("Source code repository linked for full transparency");
      requirementsCovered.push("Code deliverable provided");
    }
    if (url.includes("vercel.app") || url.includes("netlify.app") || url.includes("railway.app")) {
      score += 10;
      strengths.push("Live deployment URL provided — client can test immediately");
      requirementsCovered.push("Live demo available");
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      score += 5;
    }
  } else {
    score -= 5;
    concerns.push("No delivery URL provided — consider adding a link to your work");
    revisionSuggestions.push("Add a link to your repository, deployed app, or documentation");
  }

  // ── Gereksinim eşleştirme ──
  const jobWords = (jobDescription + " " + milestoneDesc).toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  const deliveryLower = deliveryNotes.toLowerCase();
  const uniqueJobWords = [...new Set(jobWords)];
  let matchCount = 0;

  for (const word of uniqueJobWords) {
    if (deliveryLower.includes(word)) {
      matchCount++;
      if (requirementsCovered.length < 5) requirementsCovered.push(`Mentioned: "${word}"`);
    } else {
      if (requirementsMissing.length < 3) requirementsMissing.push(`Not addressed: "${word}"`);
    }
  }

  const matchRatio = uniqueJobWords.length > 0 ? matchCount / uniqueJobWords.length : 0;
  if (matchRatio > 0.5) {
    score += 10;
    strengths.push("Delivery closely aligns with original job requirements");
  } else if (matchRatio > 0.25) {
    score += 5;
    strengths.push("Partial alignment with job requirements detected");
  } else {
    concerns.push("Delivery doesn't strongly reference original job requirements");
    revisionSuggestions.push("Explicitly address each requirement from the job description");
  }

  // ── Teknik derinlik ──
  const techTerms = [
    "api", "database", "deployed", "tested", "responsive", "optimized",
    "security", "performance", "documentation", "unit test", "integration",
    "stellar", "soroban", "smart contract", "blockchain", "escrow",
    "frontend", "backend", "authentication", "encryption",
  ];
  let techScore = 0;
  for (const term of techTerms) {
    if (deliveryLower.includes(term)) techScore++;
  }

  if (techScore >= 5) {
    score += 10;
    strengths.push(`Strong technical depth — ${techScore} technical aspects mentioned`);
  } else if (techScore >= 3) {
    score += 5;
    strengths.push("Some technical details included in delivery");
  } else {
    concerns.push("Limited technical details — consider mentioning technologies used");
  }

  score = Math.max(0, Math.min(100, score));

  let recommendation: "APPROVE" | "REVISION_NEEDED" | "REJECT";
  let summary: string;

  if (score >= 75) {
    recommendation = "APPROVE";
    summary = `This delivery demonstrates strong alignment with the project requirements for "${jobTitle}". The freelancer has provided sufficient detail and evidence of completed work. We recommend approving this milestone.`;
  } else if (score >= 45) {
    recommendation = "REVISION_NEEDED";
    summary = `The delivery for "${jobTitle}" shows partial completion but has areas that need improvement. We recommend requesting revisions on the noted concerns before final approval.`;
  } else {
    recommendation = "REJECT";
    summary = `This delivery for "${jobTitle}" does not sufficiently demonstrate completion of the milestone requirements. We recommend requesting a complete resubmission.`;
  }

  return {
    score,
    recommendation,
    summary,
    requirementsCovered: requirementsCovered.length > 0 ? requirementsCovered : ["Delivery was submitted on time"],
    requirementsMissing: requirementsMissing.length > 0 ? requirementsMissing : ["None detected — manual review recommended"],
    strengths: strengths.length > 0 ? strengths : ["Delivery submitted on time"],
    concerns: concerns.length > 0 ? concerns : ["No major concerns identified"],
    revisionSuggestions: revisionSuggestions.length > 0 ? revisionSuggestions : ["No revisions needed at this time"],
    aiConfidence: Math.min(85, 55 + techScore * 3 + (notesLen > 200 ? 10 : 0)),
  };
}

// ═══════════════════════════════════════════════════════════════
// API ROUTE HANDLERS
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body: ReviewRequest = await request.json();

    if (!body.jobTitle) {
      return NextResponse.json({ error: "Missing required field: jobTitle" }, { status: 400 });
    }

    let review;
    let engine = "TrustFlow Built-in Analyzer v2.0";
    let model = "TrustFlow Rule Engine";

    // ── Çoklu milestone modu ──
    if (body.milestones && body.milestones.length > 0) {
      const prompt = buildMultiPrompt(body.jobTitle, body.jobDescription || "", body.milestones);
      const aiResult = await callAI(prompt);

      if (aiResult) {
        try {
          review = JSON.parse(aiResult.text);
          engine = aiResult.engine;
          model = aiResult.model;
        } catch {
          console.warn("[TrustFlow AI] AI geçersiz JSON döndü, yerleşik motora geçiliyor");
          review = null;
        }
      }

      if (!review) {
        const milestoneReviews = body.milestones.map((m) => {
          const r = localAnalyze(body.jobTitle, body.jobDescription || "", m.description, m.deliveryNotes, m.deliveryUrl);
          return { milestoneIndex: m.index, ...r };
        });

        const avgScore = Math.round(milestoneReviews.reduce((s, r) => s + r.score, 0) / milestoneReviews.length);
        const overallRec = avgScore >= 75 ? "APPROVE" : avgScore >= 45 ? "REVISION_NEEDED" : "REJECT";

        review = {
          milestoneReviews,
          overallScore: avgScore,
          overallRecommendation: overallRec,
          overallSummary: `Analyzed ${milestoneReviews.length} milestones for "${body.jobTitle}". Average score: ${avgScore}/100.`,
          strengths: milestoneReviews.flatMap((r) => r.strengths).slice(0, 5),
          concerns: milestoneReviews.flatMap((r) => r.concerns).slice(0, 5),
          revisionSuggestions: milestoneReviews.flatMap((r) => r.revisionSuggestions).slice(0, 5),
          aiConfidence: Math.round(milestoneReviews.reduce((s, r) => s + r.aiConfidence, 0) / milestoneReviews.length),
        };
      }

      return NextResponse.json({ success: true, mode: "multi", review, timestamp: new Date().toISOString(), model, engine });
    }

    // ── Tekli milestone modu ──
    if (body.deliveryNotes) {
      const gitData = body.deliveryUrl ? await fetchGithubData(body.deliveryUrl) : "";
      
      const prompt = buildSinglePrompt(
        body.jobTitle,
        body.jobDescription || "",
        body.milestoneDescription || "",
        body.deliveryNotes,
        body.deliveryUrl,
        gitData
      );

      const aiResult = await callAI(prompt);

      if (aiResult) {
        try {
          review = JSON.parse(aiResult.text);
          engine = aiResult.engine;
          model = aiResult.model;
        } catch {
          console.warn("[TrustFlow AI] AI geçersiz JSON döndü, yerleşik motora geçiliyor");
          review = null;
        }
      }

      if (!review) {
        review = localAnalyze(
          body.jobTitle,
          body.jobDescription || "",
          body.milestoneDescription || "",
          body.deliveryNotes,
          body.deliveryUrl
        );
      }

      return NextResponse.json({ success: true, mode: "single", review, timestamp: new Date().toISOString(), model, engine });
    }

    return NextResponse.json({ error: "Missing delivery data. Provide either 'deliveryNotes' or 'milestones' array." }, { status: 400 });
  } catch (error) {
    console.error("[TrustFlow AI] Kritik hata:", error);
    return NextResponse.json({ success: false, error: "AI service temporarily unavailable. Please try again." }, { status: 503 });
  }
}

export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasLocal = !!process.env.LOCAL_LLM_ENDPOINT;

  return NextResponse.json({
    service: "TrustFlow AI Review Engine",
    version: "2.0.0",
    architecture: "4-Tier Hybrid AI",
    tiers: [
      { priority: 1, name: "LM Studio (Local LLM)", status: hasLocal ? "configured" : "not configured", note: "Development only" },
      { priority: 2, name: "Groq Cloud (Llama 3.3 70B)", status: hasGroq ? "configured" : "not configured", note: "Production — free, ~8ms response" },
      { priority: 3, name: "Google Gemini 2.0 Flash", status: hasGemini ? "configured" : "not configured", note: "Backup cloud LLM" },
      { priority: 4, name: "TrustFlow Built-in Analyzer", status: "always available", note: "Rule-based fallback, no API needed" },
    ],
    status: "operational",
    description: "4-tier hybrid AI: Local LLM → Groq Cloud → Gemini → Built-in. Always returns a result.",
  });
}
