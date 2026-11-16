import { Router } from "express";
import { requireAuth } from "../controllers/authMiddleware.js";
import { getCooldownHandler, replaceCodeHandler } from "../controllers/replaceController.js";

const router = Router();

router.post("/", requireAuth, replaceCodeHandler);
router.get("/cooldown", requireAuth, getCooldownHandler);

export default router;
