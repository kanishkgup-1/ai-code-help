import { request } from "./api";

export function getCollaborationSession(token) {
  return request("/collaboration/my-session", undefined, { method: "GET", token });
}

export function createCollaborationSession(token) {
  return request("/collaboration/create-session", undefined, { method: "POST", token });
}

export function joinCollaborationSession(token, roomId) {
  return request("/collaboration/join-session", { roomId }, { method: "POST", token });
}

export function leaveCollaborationSession(token, roomId) {
  return request("/collaboration/leave-session", { roomId }, { method: "POST", token });
}
