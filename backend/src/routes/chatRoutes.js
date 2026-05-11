import { Router } from "express";
import { chatAboutCode } from "../controllers/chatController.js";

const router = Router();

router.post("/", chatAboutCode);

export default router;

