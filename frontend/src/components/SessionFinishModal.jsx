import { useMemo, useState } from "react";
import { downloadSuggestionsPdf } from "../utils/pdfGenerator";

export default function SessionFinishModal({
  isOpen,
  onClose,
  suggestions = [],
  onConfirmFinish
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  const counts = useMemo(() => {
    return {
      all: suggestions.length,
      syntax: suggestions.filter((s) => (s.type || "").toLowerCase() === "syntax").length,
      quality: suggestions.filter((s) => (s.type || "").toLowerCase() === "quality").length,
      improvement: suggestions.filter((s) => (s.type || "").toLowerCase() === "improvement").length
    };
  }, [suggestions]);

  const filteredSuggestions = useMemo(() => {
    if (activeFilter === "all") return suggestions;
    return suggestions.filter(
      (s) => (s.type || "").toLowerCase() === activeFilter.toLowerCase()
    );
  }, [suggestions, activeFilter]);

  if (!isOpen) return null;

  const handleDownloadPdf = (filterToUse = activeFilter) => {
    downloadSuggestionsPdf({
      suggestions,
      filterType: filterToUse,
      filename: `code-session-suggestions-${filterToUse}.pdf`
    });
  };

  const handleFinishAndClear = () => {
    onConfirmFinish();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Session Review</span>
            <h2>Session Suggestions Summary</h2>
            <p className="modal-subtitle">
              Total {suggestions.length} suggestions recorded in this session.
            </p>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${activeFilter === "all" ? "filter-tab-active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === "syntax" ? "filter-tab-active" : ""}`}
            onClick={() => setActiveFilter("syntax")}
          >
            Syntax ({counts.syntax})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === "quality" ? "filter-tab-active" : ""}`}
            onClick={() => setActiveFilter("quality")}
          >
            Quality ({counts.quality})
          </button>
          <button
            type="button"
            className={`filter-tab ${activeFilter === "improvement" ? "filter-tab-active" : ""}`}
            onClick={() => setActiveFilter("improvement")}
          >
            Improvement ({counts.improvement})
          </button>
        </div>

        {/* Suggestions Scroll Area */}
        <div className="modal-content-list">
          {filteredSuggestions.length === 0 ? (
            <div className="panel-status" style={{ textAlign: "center", margin: "2rem 0" }}>
              No suggestions found for category: <strong>{activeFilter.toUpperCase()}</strong>.
            </div>
          ) : (
            filteredSuggestions.map((item) => {
              const severityClass =
                item.severity === "error"
                  ? "severity-error"
                  : item.severity === "warning"
                  ? "severity-warning"
                  : "severity-info";

              return (
                <article key={item.id || `${item.type}-${item.title}`} className="suggestion-card">
                  <div className="suggestion-topline">
                    <span className="suggestion-type">{item.type}</span>
                    <span className={`severity-pill ${severityClass}`}>{item.severity}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.message}</p>
                </article>
              );
            })
          )}
        </div>

        {/* Actions Footer */}
        <div className="modal-footer">
          <div className="modal-footer-left">
            <button
              className="button button-primary"
              type="button"
              onClick={() => handleDownloadPdf(activeFilter)}
              title="Download PDF report for current filter"
            >
              Download PDF ({activeFilter.toUpperCase()})
            </button>
            {activeFilter !== "all" && (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => handleDownloadPdf("all")}
                title="Download complete PDF report for all categories"
              >
                Download All PDF
              </button>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="button button-secondary" type="button" onClick={onClose}>
              Back to Editor
            </button>
            <button
              className="button button-danger"
              type="button"
              style={{ margin: 0 }}
              onClick={handleFinishAndClear}
            >
              Finish & Clear Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
