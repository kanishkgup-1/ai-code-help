const CODE_STORAGE_KEY = "editor_code";
const SUGGESTIONS_STORAGE_KEY = "editor_session_suggestions";

/**
 * Get stored editor code from localStorage
 */
export function getSavedCode() {
  try {
    return localStorage.getItem(CODE_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to get code from localStorage:", err);
    return null;
  }
}

/**
 * Save editor code to localStorage
 */
export function saveCode(code) {
  try {
    localStorage.setItem(CODE_STORAGE_KEY, code ?? "");
  } catch (err) {
    console.warn("Failed to save code to localStorage:", err);
  }
}

/**
 * Remove stored editor code
 */
export function clearSavedCode() {
  try {
    localStorage.removeItem(CODE_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear code from localStorage:", err);
  }
}

/**
 * Get all accumulated suggestions for the current session from localStorage
 */
export function getSessionSuggestions() {
  try {
    const raw = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to read session suggestions from localStorage:", err);
    return [];
  }
}

/**
 * Accumulate new suggestions into localStorage, deduplicating by type, title, and message
 */
export function accumulateSessionSuggestions(newSuggestions) {
  if (!Array.isArray(newSuggestions) || newSuggestions.length === 0) {
    return getSessionSuggestions();
  }

  try {
    const existing = getSessionSuggestions();
    const existingSignatures = new Set(
      existing.map((s) => `${(s.type || "").trim()}:${(s.title || "").trim()}:${(s.message || "").trim()}`)
    );

    const toAdd = [];
    for (const item of newSuggestions) {
      if (!item || !item.title) continue;
      const sig = `${(item.type || "").trim()}:${(item.title || "").trim()}:${(item.message || "").trim()}`;
      if (!existingSignatures.has(sig)) {
        existingSignatures.add(sig);
        toAdd.push({
          id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: item.type || "general",
          severity: item.severity || "info",
          title: item.title,
          message: item.message || "",
          timestamp: new Date().toISOString()
        });
      }
    }

    if (toAdd.length > 0) {
      const updated = [...existing, ...toAdd];
      localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }

    return existing;
  } catch (err) {
    console.warn("Failed to accumulate session suggestions to localStorage:", err);
    return [];
  }
}

/**
 * Remove stored session suggestions
 */
export function clearSessionSuggestions() {
  try {
    localStorage.removeItem(SUGGESTIONS_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear session suggestions from localStorage:", err);
  }
}

/**
 * Clear both code and suggestions from localStorage
 */
export function clearAllSessionData() {
  clearSavedCode();
  clearSessionSuggestions();
}
