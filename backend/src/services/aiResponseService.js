import env from "../config/env.js";
import { createHttpError } from "../utils/httpError.js";

function summarizeCodeShape(code) {
  const lineCount = code.split(/\r?\n/).filter(Boolean).length;
  const hasFunctions = /\bdef\s+\w+\s*\(/.test(code);
  const hasClasses = /\bclass\s+\w+/.test(code);
  const hasLoops = /\bfor\b|\bwhile\b/.test(code);

  return { lineCount, hasFunctions, hasClasses, hasLoops };
}

function buildPlaceholderAnswer(code, question) {
  const summary = summarizeCodeShape(code);
  const observations = [];

  observations.push(`This snippet is about ${summary.lineCount} non-empty lines long.`);

  if (summary.hasFunctions) {
    observations.push("It defines at least one function, so the logic is already somewhat modular.");
  }

  if (summary.hasClasses) {
    observations.push("It includes class-based structure, which may be worth reviewing for responsibility boundaries.");
  }

  if (summary.hasLoops) {
    observations.push("It uses iterative control flow, so edge cases and collection sizes are worth checking.");
  }

  if (/\bprint\(/.test(code)) {
    observations.push("There are print statements present, which may be acceptable for scripts but not ideal for larger apps.");
  }

  return [
    `Question: ${question.trim()}`,
    "",
    "MVP placeholder response:",
    observations.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    "",
    "Suggested next steps:",
    "1. Review variable naming and function responsibilities.",
    "2. Add tests for edge cases and invalid inputs.",
    "3. Replace this placeholder service with a real LLM provider when ready."
  ].join("\n");
}

function isGeminiConfigured() {
  return Boolean(env.geminiApiKey);
}

function extractResponseText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  const textParts = [];

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      if (typeof part?.text === "string") {
        textParts.push(part.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function shouldRetryWithFallbackModel(status, payload) {
  const message = `${payload?.error?.message ?? payload?.message ?? ""}`.toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("temporarily unavailable")
  );
}

async function requestGeminiModel({ model, systemInstruction, prompt, maxOutputTokens = 200 }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.geminiApiKey
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens,
        temperature: 0.2,
        thinkingConfig: {
          thinkingBudget: Number.isNaN(env.geminiThinkingBudget) ? 0 : env.geminiThinkingBudget
        }
      }
    })
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = createHttpError(
      502,
      payload?.error?.message ||
        payload?.message ||
        `Gemini request failed with status ${response.status}.`
    );
    error.providerStatus = response.status;
    error.providerPayload = payload;
    throw error;
  }

  return payload;
}

async function callGeminiGenerateContent({ systemInstruction, prompt, maxOutputTokens = 200 }) {
  try {
    return await requestGeminiModel({
      model: env.geminiModel,
      systemInstruction,
      prompt,
      maxOutputTokens
    });
  } catch (error) {
    if (
      env.geminiFallbackModel &&
      env.geminiFallbackModel !== env.geminiModel &&
      shouldRetryWithFallbackModel(error.providerStatus, error.providerPayload)
    ) {
      return requestGeminiModel({
        model: env.geminiFallbackModel,
        systemInstruction,
        prompt,
        maxOutputTokens
      });
    }

    const message =
      error?.message ||
      "Gemini request failed.";
    throw createHttpError(502, message);
  }
}

function buildEditorSuggestionPrompt(code, staticSuggestions) {
  return [
    "Review this Python code and return only valid JSON.",
    "Respond with an object that has a single key named suggestions.",
    "suggestions must be an array of at most 3 objects.",
    "Each object must contain type, severity, title, and message.",
    "Allowed type values: syntax, quality, improvement.",
    "Allowed severity values: error, warning, info.",
    "Keep every title under 6 words and every message under 140 characters.",
    "Improvement suggestions must be about time complexity or space complexity only.",
    "Do not wrap the JSON in markdown.",
    "",
    "Static analysis context:",
    JSON.stringify(staticSuggestions),
    "",
    "Python code:",
    code
  ].join("\n");
}

function sanitizeJsonText(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  return trimmed;
}

export async function generateAiCodeSuggestions({ code, staticSuggestions }) {
  if (env.aiProvider === "placeholder") {
    return {
      suggestions: [],
      aiUsed: false,
      aiReason: "placeholder_provider"
    };
  }

  if (!isGeminiConfigured()) {
    return {
      suggestions: [],
      aiUsed: false,
      aiReason: "missing_api_key"
    };
  }

  const payload = await callGeminiGenerateContent({
    systemInstruction:
      "You are a Python code review assistant. Prioritize algorithmic efficiency. Only suggest improvements when they clearly reduce time complexity or space complexity.",
    prompt: buildEditorSuggestionPrompt(code, staticSuggestions),
    maxOutputTokens: 200
  });

  const text = extractResponseText(payload);

  if (!text) {
    return {
      suggestions: [],
      aiUsed: false,
      aiReason: "empty_ai_response"
    };
  }

  let parsed;

  try {
    parsed = JSON.parse(sanitizeJsonText(text));
  } catch (_error) {
    return {
      suggestions: [],
      aiUsed: false,
      aiReason: "invalid_json_response"
    };
  }

  const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

  return {
    suggestions: suggestions
      .filter(
        (item) =>
          item &&
          typeof item.title === "string" &&
          typeof item.message === "string" &&
          typeof item.type === "string" &&
          typeof item.severity === "string"
      )
      .slice(0, 3),
    aiUsed: true,
    aiReason: "google-ai-studio"
  };
}

export async function generateCodeAnswer({ code, question }) {
  if (env.aiProvider === "placeholder") {
    return buildPlaceholderAnswer(code, question);
  }

  if (!isGeminiConfigured()) {
    throw createHttpError(
      503,
      "Google AI Studio is not configured. Set GEMINI_API_KEY and keep AI_PROVIDER=google-ai-studio."
    );
  }

  const payload = await callGeminiGenerateContent({
    systemInstruction:
      "Give Minimal Answer",
    prompt: [
      "User question:",
      question.trim(),
      "",
      "Python code:",
      code
    ].join("\n"),
    maxOutputTokens: 200
  });

  const text = extractResponseText(payload);

  if (text) {
    return text;
  }

  return buildPlaceholderAnswer(code, question);
}
