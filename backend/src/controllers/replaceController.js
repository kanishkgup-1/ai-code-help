 import env from "../config/env.js";
import { generateCodeReplacement } from "../services/replaceService.js";
import { getReplaceCooldown, setReplaceCooldown } from "../services/cooldownService.js";
import { createHttpError } from "../utils/httpError.js";

function validateReplacePayload(body) {
  if (typeof body?.code !== "string" || !body.code.trim()) {
    throw createHttpError(400, "code must be a non-empty string.");
  }
  if (body.code.length > 30000) {
    throw createHttpError(400, "code is too large for the replace endpoint.");
  }
}

export async function replaceCodeHandler(req, res, next) {
  try {
    const userId = req.user?.id || req.ip;
    const remaining = await getReplaceCooldown(userId);

    if (remaining > 0) {
      return res.status(429).json({
        error: `Replace cooldown active. Please wait ${remaining}s before replacing again.`,
        remainingCooldown: remaining
      });
    }

    validateReplacePayload(req.body);

    const replacedCode = await generateCodeReplacement({ code: req.body.code });

    await setReplaceCooldown(userId, env.replaceCooldownSeconds);

    res.json({
      language: "python",
      code: replacedCode,
      cooldownRemaining: env.replaceCooldownSeconds
    });
  } catch (error) {
    next(error);
  }
}

export async function getCooldownHandler(req, res, next) {
  try {
    const userId = req.user?.id || req.ip;
    const remaining = await getReplaceCooldown(userId);

    res.json({
      cooldownRemaining: remaining
    });
  } catch (error) {
    next(error);
  }
}
