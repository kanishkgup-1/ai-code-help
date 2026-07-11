import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { createHttpError } from "../utils/httpError.js";

export function requireAuth(req, res, next) {
    try {
        const header = req.get("authorization");
        if (!header?.startsWith("Bearer ")) throw createHttpError(401, "Authentication is required.");
        if (!env.jwtSecret) throw new Error("JWT_SECRET must be set to use authentication.");

        const token = header.slice(7);
        const { sub } = jwt.verify(token, env.jwtSecret);
        req.user = { id: sub };
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return next(createHttpError(401, "Your session has expired. Please sign in again."));
        }
        next(error);
    }
}