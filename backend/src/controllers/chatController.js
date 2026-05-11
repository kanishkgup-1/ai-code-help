import { generateCodeAnswer } from "../services/aiResponseService.js";
import { validateChatRequest } from "../utils/validators.js";

export async function chatAboutCode(req, res, next) {
  try {
    validateChatRequest(req.body);
    const answer = await generateCodeAnswer(req.body);

    res.json({
      language: "python",
      answer
    });
  } catch (error) {
    next(error);
  }
}

