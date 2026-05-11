import { createHttpError } from "./httpError.js";

function ensureString(value, fieldName) {
  if (typeof value !== "string") {
    throw createHttpError(400, `${fieldName} must be a string.`);
  }
}

export function validateAnalysisRequest(body) {
  ensureString(body?.code, "code");

  if (!body.code.trim()) {
    throw createHttpError(400, "code cannot be empty.");
  }

  if (body.useAi !== undefined && typeof body.useAi !== "boolean") {
    throw createHttpError(400, "useAi must be a boolean when provided.");
  }

  if (body.code.length > 20000) {
    throw createHttpError(400, "code is too large for the MVP analyzer.");
  }
}

export function validateChatRequest(body) {
  ensureString(body?.code, "code");
  ensureString(body?.question, "question");

  if (!body.code.trim()) {
    throw createHttpError(400, "code cannot be empty.");
  }

  if (!body.question.trim()) {
    throw createHttpError(400, "question cannot be empty.");
  }

  if (body.code.length > 30000) {
    throw createHttpError(400, "code is too large for the MVP chat endpoint.");
  }

  if (body.question.length > 1000) {
    throw createHttpError(400, "question is too large.");
  }
}
