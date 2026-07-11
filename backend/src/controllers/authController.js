import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import { createHttpError } from "../utils/httpError.js";

function validateCredentials({ name, email, password }, requireName = false) {
  if (requireName && (typeof name !== "string" || name.trim().length < 2)) {
    throw createHttpError(400, "Name must be at least 2 characters.");
  }
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw createHttpError(400, "Please provide a valid email address.");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw createHttpError(400, "Password must be at least 8 characters.");
  }
}

function serializeUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, tier: user.tier };
}

function createToken(user) {
  if (!env.jwtSecret) throw new Error("JWT_SECRET must be set to use authentication.");
  return jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: "7d" });
}

export async function register(req, res, next) {
  try {
    validateCredentials(req.body, true);
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const exists = await User.exists({ email });
    if (exists) throw createHttpError(409, "An account with this email already exists.");

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ token: createToken(user), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateSubscription(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw createHttpError(404, "User not found.");
    user.tier = "pro";
    await user.save();
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    validateCredentials(req.body);
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      throw createHttpError(401, "Invalid email or password.");
    }
    res.json({ token: createToken(user), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const header = req.get("authorization");
    if (!header?.startsWith("Bearer ")) throw createHttpError(401, "Authentication is required.");
    if (!env.jwtSecret) throw new Error("JWT_SECRET must be set to use authentication.");
    const { sub } = jwt.verify(header.slice(7), env.jwtSecret);
    const user = await User.findById(sub);
    if (!user) throw createHttpError(401, "Account no longer exists.");
    res.json({ user: serializeUser(user) });
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(createHttpError(401, "Your session has expired. Please sign in again."));
      return;
    }
    next(error);
  }
}
