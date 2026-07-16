import cors from "cors";
import express from "express";
import env from "./config/env.js";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/analyze", analyzeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = error.message || "Internal server error.";

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({ error: message });
});

export default app;
