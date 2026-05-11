import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config();

const env = {
  port: Number.parseInt(process.env.PORT ?? "5000", 10),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  pythonBin: process.env.PYTHON_BIN ?? "python",
  aiProvider: process.env.AI_PROVIDER ?? "google-ai-studio",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash",
  geminiThinkingBudget: Number.parseInt(process.env.GEMINI_THINKING_BUDGET ?? "0", 10)
};

export default env;
