import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config();

const clientOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const vercelProjectSlug = process.env.VERCEL_PROJECT_SLUG ?? "ai-code-help-frontend";

function isAllowedVercelOrigin(origin) {
  try {
    const { protocol, hostname } = new URL(origin);
    return (
      protocol === "https:" &&
      (hostname === `${vercelProjectSlug}.vercel.app` ||
        (hostname.startsWith(`${vercelProjectSlug}-`) && hostname.endsWith(".vercel.app")))
    );
  } catch {
    return false;
  }
}

const env = {
  port: Number.parseInt(process.env.PORT ?? "5000", 10),
  clientOrigins,
  isAllowedOrigin(origin) {
    return clientOrigins.includes(origin) || isAllowedVercelOrigin(origin);
  },
  mongoUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  pythonBin: process.env.PYTHON_BIN ?? "python",
  aiProvider: process.env.AI_PROVIDER ?? "google-ai-studio",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite",
  geminiFallbackModel: process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.5-flash-lite",
  geminiThinkingBudget: Number.parseInt(process.env.GEMINI_THINKING_BUDGET ?? "0", 10)
};

export default env;
