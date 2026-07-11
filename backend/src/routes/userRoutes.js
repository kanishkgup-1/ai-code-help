import { Router } from "express";
import { getCurrentUser, updateSubscription } from "../controllers/authController.js";
import { requireAuth } from "../controllers/authMiddleware.js";

const router = Router();

router.get("/me", requireAuth, getCurrentUser);
router.put("/me/subscription", requireAuth, updateSubscription);

export default router;
