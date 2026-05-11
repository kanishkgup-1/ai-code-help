import { analyzePythonCode } from "../services/pythonAnalysisService.js";
import { validateAnalysisRequest } from "../utils/validators.js";

export async function analyzeCode(req, res, next) {
  try {
    validateAnalysisRequest(req.body);
    const result = await analyzePythonCode(req.body.code, {
      useAi: req.body.useAi === true
    });

    res.json({
      language: "python",
      suggestions: result.suggestions,
      aiUsed: result.aiUsed,
      aiReason: result.aiReason
    });
  } catch (error) {
    next(error);
  }
}
