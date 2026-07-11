import { Router } from "express";
import { getCurrentUser, login, register } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", getCurrentUser);

export default router;
