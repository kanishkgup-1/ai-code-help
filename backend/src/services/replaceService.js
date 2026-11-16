import env from "../config/env.js";
import { createHttpError } from "../utils/httpError.js";

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

async function requestGeminiModel({ model, systemInstruction, prompt, maxOutputTokens = 2048 }) {
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

async function callGeminiGenerateContent({ systemInstruction, prompt, maxOutputTokens = 2048 }) {
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

    const message = error?.message || "Gemini request failed.";
    throw createHttpError(502, message);
  }
}

function sanitizeCodeText(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:python|py)?\r?\n?/i, "")
      .replace(/\r?\n?```$/i, "")
      .trim();
  }
  return trimmed;
}

function buildPlaceholderReplacement(code) {
  return [
    "# Code refactored by AI placeholder service",
    code
  ].join("\n");
}

export async function generateCodeReplacement({ code }) {
  if (env.aiProvider === "placeholder") {
    return buildPlaceholderReplacement(code);
  }

  if (!isGeminiConfigured()) {
    throw createHttpError(
      503,
      "Google AI Studio is not configured. Set GEMINI_API_KEY and keep AI_PROVIDER=google-ai-studio."
    );
  }

  const payload = await callGeminiGenerateContent({
    systemInstruction:
      "You are an expert Python software engineer. Your task is to refactor, optimize, and replace the user's Python code. Improve algorithmic time and space complexity, fix syntax or logic bugs, adhere to clean PEP 8 standards, and keep or add necessary comments. Output ONLY the raw replacement Python code without markdown code blocks, backticks, or explanatory filler.",
    prompt: [
      "Refactor and improve the following Python code:",
      "",
      code
    ].join("\n"),
    maxOutputTokens: 2048
  });

  const text = extractResponseText(payload);
  if (!text) {
    throw createHttpError(502, "AI service returned an empty replacement.");
  }

  return sanitizeCodeText(text);
}  
