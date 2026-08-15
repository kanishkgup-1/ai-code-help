import { randomUUID } from "crypto";
import CollabSession from "../models/CollabSession.js";
import { createHttpError } from "../utils/httpError.js";

export async function getCollaborationSession(req, res, next) {
    try {
        const session = await CollabSession.findOne({ participants: req.user.id }).populate("participants", "name");
        if (!session) throw createHttpError(404, "No collaboration session found for this user.");
        res.json({ session });
    } catch (error) {
        next(error);
    }
}

export async function createCollaborationSession(req, res, next) {
    try {
        const roomId = randomUUID().substring(0, 6);
        const code = typeof req.body.code === "string" ? req.body.code : "";
        const session = await CollabSession.create({ roomId, owner: req.user.id, participants: [req.user.id], code });
        await session.populate("participants", "name");
        res.status(201).json({ session });
    } catch (error) {
        next(error);
    }
}

export async function joinCollaborationSession(req, res, next) {
    try {
        const { roomId } = req.body;
        const session = await CollabSession.findOne({ roomId });
        if (!session) throw createHttpError(404, "Collaboration session not found.");
        if (!session.participants.some((id) => id.toString() === req.user.id.toString())) {
            if (session.participants.length >= 4) {
                throw createHttpError(409, "This collaboration room is full (maximum 4 people).");
            }
            session.participants.push(req.user.id);
        }
        await session.save();
        await session.populate("participants", "name");
        res.json({ session });
    } catch (error) {
        next(error);
    }
}

export async function leaveCollaborationSession(req, res, next) {
    try {
        const { roomId } = req.body;
        const session = await CollabSession.findOne({ roomId });
        if (!session) throw createHttpError(404, "Collaboration session not found.");
        session.participants = session.participants.filter((id) => id.toString() !== req.user.id.toString());
        await session.save();
        await session.populate("participants", "name");
        res.json({ session });
    } catch (error) {
        next(error);
    }
}
