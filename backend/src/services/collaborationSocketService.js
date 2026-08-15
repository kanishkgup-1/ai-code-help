import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import env from "../config/env.js";
import CollabSession from "../models/CollabSession.js";
import { analyzePythonCode } from "./pythonAnalysisService.js";

const STATIC_ANALYSIS_DELAY_MS = 800;
const AI_ANALYSIS_DELAY_MS = 2000;
const AI_REVIEW_COOLDOWN_MS = 20000;
const MIN_NEW_MEANINGFUL_LINES = 5;

function getMeaningfulLines(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
}

function countNewMeaningfulLines(currentCode, previousCode) {
  return Math.max(0, getMeaningfulLines(currentCode).length - getMeaningfulLines(previousCode).length);
}

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

export function attachCollaborationWebSocketServer(server) {
  const rooms = new Map();
  const wss = new WebSocketServer({ noServer: true });

  function broadcast(room, message) {
    room.clients.forEach((client) => send(client, message));
  }

  function clearRoomTimers(room) {
    clearTimeout(room.staticTimer);
    clearTimeout(room.aiTimer);
  }

  async function runStaticAnalysis(room, code) {
    try {
      const result = await analyzePythonCode(code, { useAi: false });
      if (room.code === code) broadcast(room, { type: "suggestions", suggestions: result.suggestions, aiUsed: false });
    } catch (error) {
      if (room.code === code) broadcast(room, { type: "analysis-error", error: "Unable to analyze code right now." });
      console.error("Room static analysis failed:", error.message);
    }
  }

  async function runAiAnalysis(room, code) {
    const now = Date.now();
    if (
      room.code !== code ||
      code === room.lastAiReviewedCode ||
      countNewMeaningfulLines(code, room.lastAiReviewedCode) < MIN_NEW_MEANINGFUL_LINES ||
      now - room.lastAiCallAt < AI_REVIEW_COOLDOWN_MS
    ) return;

    try {
      const result = await analyzePythonCode(code, { useAi: true });
      if (room.code !== code) return;
      broadcast(room, { type: "suggestions", suggestions: result.suggestions, aiUsed: result.aiUsed });
      if (result.aiUsed) {
        room.lastAiCallAt = Date.now();
        room.lastAiReviewedCode = code;
      }
    } catch (error) {
      if (room.code === code) broadcast(room, { type: "analysis-error", error: "Unable to run AI review right now." });
      console.error("Room AI analysis failed:", error.message);
    }
  }

  function scheduleAnalysis(room) {
    clearRoomTimers(room);
    const code = room.code;
    if (!code.trim()) {
      broadcast(room, { type: "suggestions", suggestions: [], aiUsed: false });
      return;
    }
    broadcast(room, { type: "analysis-started" });
    room.staticTimer = setTimeout(() => runStaticAnalysis(room, code), STATIC_ANALYSIS_DELAY_MS);
    room.aiTimer = setTimeout(() => runAiAnalysis(room, code), AI_ANALYSIS_DELAY_MS);
  }

  async function joinRoom(socket, roomId) {
    const session = await CollabSession.findOne({ roomId }).populate("participants", "name");
    if (!session || !session.participants.some((participant) => participant._id.toString() === socket.userId)) {
      send(socket, { type: "error", error: "You are not a member of this collaboration room." });
      return;
    }

    let room = rooms.get(roomId);
    const isNewRoom = !room;
    if (!room) {
      room = {
        clients: new Set(),
        code: session.code ?? "",
        lastAiCallAt: 0,
        lastAiReviewedCode: session.code ?? "",
        staticTimer: null,
        aiTimer: null
      };
      rooms.set(roomId, room);
    }
    socket.roomId = roomId;
    room.clients.add(socket);
    send(socket, { type: "room-state", code: room.code, participants: session.participants });
    broadcast(room, { type: "participants", participants: session.participants });
    if (isNewRoom) scheduleAnalysis(room);
  }

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname !== "/ws/collaboration") return;
    const origin = request.headers.origin;
    if (origin && !env.isAllowedOrigin(origin)) return socket.destroy();
    try {
      if (!env.jwtSecret) throw new Error("JWT_SECRET must be set.");
      const { sub } = jwt.verify(url.searchParams.get("token") ?? "", env.jwtSecret);
      wss.handleUpgrade(request, socket, head, (websocket) => {
        websocket.userId = sub;
        wss.emit("connection", websocket);
      });
    } catch {
      socket.destroy();
    }
  });

  wss.on("connection", (socket) => {
    socket.on("message", async (rawMessage) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        if (message.type === "join" && typeof message.roomId === "string") await joinRoom(socket, message.roomId);
        if (message.type === "code-change" && typeof message.code === "string" && socket.roomId) {
          const room = rooms.get(socket.roomId);
          if (!room || !room.clients.has(socket)) return;
          room.code = message.code;
          broadcast(room, { type: "code", code: room.code });
          scheduleAnalysis(room);
          CollabSession.updateOne({ roomId: socket.roomId }, { $set: { code: room.code } }).catch((error) => console.error("Unable to save room code:", error.message));
        }
      } catch (error) {
        send(socket, { type: "error", error: "Invalid collaboration message." });
      }
    });
    socket.on("close", () => {
      const room = rooms.get(socket.roomId);
      if (!room) return;
      room.clients.delete(socket);
      if (room.clients.size === 0) {
        clearRoomTimers(room);
        rooms.delete(socket.roomId);
      }
    });
  });
}
