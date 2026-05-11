import { Router } from "express";
import { analyzeCode } from "../controllers/analysisController.js";

const router = Router();

router.post("/", analyzeCode);

export default router;

