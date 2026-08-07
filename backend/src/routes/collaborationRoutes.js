import { Router } from "express";
import { createCollaborationSession, joinCollaborationSession, leaveCollaborationSession, getCollaborationSession} from "../controllers/collaborationController.js";
import { requireAuth } from "../controllers/authMiddleware.js";

const router = Router();

router.post("/create-session", requireAuth, createCollaborationSession);
router.post("/join-session", requireAuth, joinCollaborationSession);
router.post("/leave-session", requireAuth, leaveCollaborationSession);
router.get("/my-session", requireAuth, getCollaborationSession);

export default router;
