import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import SuggestionPanel from "../components/SuggestionPanel";
import { analyzeCode } from "../services/api";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  const { user } = useAuth();

  if (!user || user.tier !== "pro") {
    alert("Subscribe to Pro to access the editor.");
    return <Navigate to="/auth" replace />;
  }
  const [code, setCode] = useState(initialCode);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuggestionsOn, setIsSuggestionsOn] = useState(true);
  const lastAiCallAtRef = useRef(0);
  const lastAiReviewedCodeRef = useRef(initialCode);

  useEffect(() => {
    if (!isSuggestionsOn) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }
    const trimmed = code.trim();

    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const data = await analyzeCode(code, { useAi: false });
        setSuggestions(data.suggestions ?? []);
      } catch (analysisError) {
        setError(analysisError.message || "Unable to analyze code right now.");
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [isSuggestionsOn, code]);

  useEffect(() => {
    if (!isSuggestionsOn) {
      setSuggestions([]);
      setLoading(false);
      setError("");
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
        setLoading(true);
        setError("");
        const data = await analyzeCode(code, { useAi: true });
        setSuggestions(data.suggestions ?? []);
        if (data.aiUsed === true) {
          lastAiCallAtRef.current = Date.now();
          lastAiReviewedCodeRef.current = code;
        }
      } catch (analysisError) {
        setError(analysisError.message || "Unable to run AI review right now.");
      } finally {
        setLoading(false);
      }
    }, AI_ANALYSIS_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isSuggestionsOn, code]);

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
              <span>Monaco Editor</span>
            </div>
            <div className="editor-frame">
              <Editor
                height="70vh"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value ?? "")}
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
            <div className="panel-heading">
              <h2>Live Suggestions</h2>
              <button className="button button-secondary" type="button" onClick={() => setIsSuggestionsOn(!isSuggestionsOn)}>
                {isSuggestionsOn ? "Hide" : "Show"} Suggestions
              </button>
            </div>
            {isSuggestionsOn && (<SuggestionPanel suggestions={suggestions} loading={loading} error={error} />)}
          </aside>
        </div>
      </div>
    </div>
  );
}
export default EditorPage;
