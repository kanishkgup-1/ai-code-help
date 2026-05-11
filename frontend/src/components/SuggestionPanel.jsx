function SuggestionPanel({ suggestions, loading, error }) {
  return (
    <aside className="suggestion-panel">
      <div className="panel-heading">
        <h2>Live Suggestions</h2>
      </div>

      {loading ? <div className="panel-status">Analyzing code...</div> : null}
      {error ? <div className="panel-error">{error}</div> : null}

      {!loading && !error && suggestions.length === 0 ? (
        <div className="panel-status">Start typing Python code to get suggestions.</div>
      ) : null}

      <div className="suggestion-list">
        {suggestions.map((item, index) => (
          <article className="suggestion-card" key={`${item.title}-${index}`}>
            <div className="suggestion-topline">
              <span className={`severity-pill severity-${item.severity}`}>
                {item.severity}
              </span>
              <span className="suggestion-type">{item.type}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.message}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

export default SuggestionPanel;
