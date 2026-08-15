import Editor from "@monaco-editor/react";
import { useContext, useEffect, useRef, useState } from "react";
import SuggestionPanel from "../components/SuggestionPanel";
import { analyzeCode } from "../services/api";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCollaborationSession, createCollaborationSession, joinCollaborationSession, leaveCollaborationSession, createCollaborationSocket } from "../services/collaboration";
import CollaborationBar from "../components/CollaborationBar";
import { EditorContext } from "../context/editorContext";
const initialCode = `# Code here...`;

const STATIC_ANALYSIS_DELAY_MS = 800;
const AI_ANALYSIS_DELAY_MS = 2000;
const AI_REVIEW_COOLDOWN_MS = 20000;
const MIN_NEW_MEANINGFUL_LINES = 5;

function getMeaningfulLines(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function countNewMeaningfulLines(currentCode, previousCode) {
  return Math.max(0, getMeaningfulLines(currentCode).length - getMeaningfulLines(previousCode).length);
}

function EditorPage() {
  const { user, token } = useAuth();
  const { editorPageData, setEditorPageData } = useContext(EditorContext);
  if (!user || user.tier !== "pro") {
    alert("Subscribe to Pro to access the editor.");
    return <Navigate to="/auth" replace />;
  }
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const socketRef = useRef(null);
  const lastAiCallAtRef = useRef(0);
  const lastAiReviewedCodeRef = useRef(initialCode);
  const {
    code,
    suggestions,
    loading,
    error,
    isSuggestionsOn,
    collaborationSession,
    isSessionOn
  } = editorPageData;
  const { owner, participants = [], roomId } = collaborationSession ?? {};
  const isOwner = String(owner?._id ?? owner ?? "") === String(user.id);

  useEffect(() => {
    getCollaborationSession(token)
      .then(({ session }) => setEditorPageData((prev) => ({ ...prev, collaborationSession: session, isSessionOn: true })))
      .catch(() => setEditorPageData((prev) => ({ ...prev, collaborationSession: null })));
  }, [token]);

  useEffect(() => {
    if (!roomId) return undefined;
    const socket = createCollaborationSocket(token);
    socketRef.current = socket;
    socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "join", roomId })));
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "room-state") {
        setEditorPageData((prev) => ({
          ...prev,
          code: message.code ?? "",
          collaborationSession: prev.collaborationSession ? { ...prev.collaborationSession, participants: message.participants ?? [] } : prev.collaborationSession
        }));
      }
      if (message.type === "participants") {
        setEditorPageData((prev) => ({
          ...prev,
          collaborationSession: prev.collaborationSession ? { ...prev.collaborationSession, participants: message.participants ?? [] } : prev.collaborationSession
        }));
      }
      if (message.type === "code") setEditorPageData((prev) => ({ ...prev, code: message.code ?? "" }));
      if (message.type === "analysis-started") setEditorPageData((prev) => ({ ...prev, loading: true, error: "" }));
      if (message.type === "suggestions") setEditorPageData((prev) => ({ ...prev, suggestions: message.suggestions ?? [], loading: false, error: "" }));
      if (message.type === "analysis-error" || message.type === "error") setEditorPageData((prev) => ({ ...prev, loading: false, error: message.error }));
    });
    return () => {
      socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [roomId, token, setEditorPageData]);

  useEffect(() => {
    if (collaborationSession) return undefined;
    if (!isSuggestionsOn) {
      setEditorPageData((prev) => ({ ...prev, suggestions: [], loading: false, error: "" }));
      return;
    }
    const trimmed = code.trim();

    if (!trimmed) {
      setEditorPageData((prev) => ({ ...prev, suggestions: [], loading: false, error: "" }));
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setEditorPageData((prev) => ({ ...prev, loading: true, error: "" }));
        const data = await analyzeCode(code, { useAi: false });
        setEditorPageData((prev) => ({ ...prev, suggestions: data.suggestions ?? [] }));
      } catch (analysisError) {
        setEditorPageData((prev) => ({ ...prev, error: analysisError.message || "Unable to analyze code right now." }));
      } finally {
        setEditorPageData((prev) => ({ ...prev, loading: false }));
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [isSuggestionsOn, code]);

  useEffect(() => {
    if (collaborationSession) return undefined;
    if (!isSuggestionsOn) {
      setEditorPageData((prev) => ({ ...prev, suggestions: [], loading: false, error: "" }));
      return;
    }
    const trimmed = code.trim();

    if (!trimmed) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      const now = Date.now();
      const codeChangedSinceLastAi = code !== lastAiReviewedCodeRef.current;
      const enoughNewMeaningfulLines =
        countNewMeaningfulLines(code, lastAiReviewedCodeRef.current) >= MIN_NEW_MEANINGFUL_LINES;
      const cooldownElapsed = now - lastAiCallAtRef.current >= AI_REVIEW_COOLDOWN_MS;

      if (!codeChangedSinceLastAi || !enoughNewMeaningfulLines || !cooldownElapsed) {
        return;
      }

      try {
        setEditorPageData((prev) => ({ ...prev, loading: true, error: "" }));
        const data = await analyzeCode(code, { useAi: true });
        setEditorPageData((prev) => ({ ...prev, suggestions: data.suggestions ?? [] }));
        if (data.aiUsed === true) {
          lastAiCallAtRef.current = Date.now();
          lastAiReviewedCodeRef.current = code;
        }
      } catch (analysisError) {
        setEditorPageData((prev) => ({ ...prev, error: analysisError.message || "Unable to run AI review right now." }));
      } finally {
        setEditorPageData((prev) => ({ ...prev, loading: false }));
      }
    }, AI_ANALYSIS_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isSuggestionsOn, code]);

  const handleInvite = async () => {
    try {
      let activeRoomId = roomId;
      if (!activeRoomId) {
        const { session } = await createCollaborationSession(token, code);
        setEditorPageData((prev) => ({ ...prev, collaborationSession: session }));
        activeRoomId = session.roomId;
      }

      await navigator.clipboard.writeText(activeRoomId);
      setEditorPageData((prev) => ({ ...prev, roomId: activeRoomId }));
      setCopied(true);
      setEditorPageData((prev) => ({ ...prev, isSessionOn: true }));
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  const handleJoin = async () => {
    try {
      const { session } = await joinCollaborationSession(token, inviteCode.trim());
      setEditorPageData((prev) => ({ ...prev, collaborationSession: session, isSessionOn: true }));
      setInviteCode("");
    } catch (error) {
      setEditorPageData((prev) => ({ ...prev, error: error.message || "Unable to join the room." }));
    }
  };
  const handleSession = async () => {
    try {
      await leaveCollaborationSession(token, roomId);
      setEditorPageData((prev) => ({ ...prev, collaborationSession: null, isSessionOn: false }));
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };
  return (
    <div className="page-section">
      <div className="container">
        <div className="page-heading">
          <span className="eyebrow">Live Python editor</span>
          <h1>Write Python and get focused suggestions</h1>
          <p>
            Static analysis runs after 800ms. AI reviews only run after 2 seconds
            idle time, 5 new meaningful lines, a 20-second cooldown, and code
            changes since the last AI review. Improvement suggestions focus on
            time or space complexity opportunities.
          </p>
        </div>

        <div className="editor-layout">
          <section className="editor-shell">
            <div className="editor-header">
              <h2>Python Editor</h2>
              {(!roomId || (isOwner && participants.length < 4)) ? <span><button className="button button-secondary" type="button" onClick={handleInvite}>{copied ? "Copied!" : "Invite+"}</button></span> : null}
            </div>
            <div className="editor-frame">
              <Editor
                height="70vh"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => {
                  const nextCode = value ?? "";
                  setEditorPageData((prev) => ({ ...prev, code: nextCode }));
                  if (roomId && socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({ type: "code-change", code: nextCode }));
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false
                }}
              />
            </div>
          </section>
          <aside className="suggestion-panel">
            <section className="aside-editor-section">
              <div>
                <div className="panel-heading">
                  <h2>Collaboration Room</h2>
                </div>
                <CollaborationBar participants={participants} isOwner={isOwner} inviteCode = {inviteCode} setInviteCode={setInviteCode} handleSession={handleSession} handleJoin={handleJoin} />
              </div>
            </section>
            <section className="aside-editor-section">
              <div className="panel-heading">
                <h2>Live Suggestions</h2>
                <button className="button button-secondary" type="button" onClick={() => setEditorPageData((prev) => ({ ...prev, isSuggestionsOn: !prev.isSuggestionsOn }))}>
                  {isSuggestionsOn ? "Hide" : "Show"}
                </button>
              </div>
              {isSuggestionsOn && (<SuggestionPanel suggestions={suggestions} loading={loading} error={error} />)}
            </section>
          </aside>
        </div>
      </div>
    </div >
  );
}
export default EditorPage;
