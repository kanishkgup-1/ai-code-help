import { request } from "./api";

export function getCollaborationSession(token) {
  return request("/collaboration/my-session", undefined, { method: "GET", token });
}

export function createCollaborationSession(token, code) {
  return request("/collaboration/create-session", { code }, { method: "POST", token });
}

export function joinCollaborationSession(token, roomId) {
  return request("/collaboration/join-session", { roomId }, { method: "POST", token });
}

export function leaveCollaborationSession(token, roomId) {
  return request("/collaboration/leave-session", { roomId }, { method: "POST", token });
}

export function createCollaborationSocket(token) {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const configuredUrl = import.meta.env.VITE_WS_BASE_URL;
  const baseUrl = configuredUrl || apiUrl.replace(/\/api\/?$/, "").replace(/^http/, "ws");
  return new WebSocket(`${baseUrl.replace(/\/$/, "")}/ws/collaboration?token=${encodeURIComponent(token)}`);
}
