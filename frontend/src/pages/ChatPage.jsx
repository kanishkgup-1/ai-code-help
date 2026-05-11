import { useState } from "react";
import { askCodeQuestion } from "../services/api";

const starterCode = `def total_price(items):
    total = 0
    for item in items:
        total += item["price"]
    return total
`;

function ChatPage() {
  const [code, setCode] = useState(starterCode);
  const [question, setQuestion] = useState("Explain this code and suggest improvements.");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      const data = await askCodeQuestion({ code, question });
      setResponse(data.answer ?? "");
    } catch (requestError) {
      setError(requestError.message || "Unable to get a response right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-section">
      <div className="container chat-page">
        <div className="page-heading">
          <span className="eyebrow">AI code chat</span>
          <h1>Paste full Python code and ask focused questions</h1>
          <p>
            Use this page for larger snippets and natural-language questions such as
            explaining logic, finding bugs, or suggesting improvements.
          </p>
        </div>

        <div className="chat-layout">
          <form className="chat-form" onSubmit={handleSubmit}>
            <label className="input-group">
              <span>Python code</span>
              <textarea
                className="code-textarea"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Paste Python code here..."
                rows={16}
              />
            </label>

            <label className="input-group">
              <span>Your question</span>
              <input
                className="text-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: Find bugs and simplify this code."
              />
            </label>

            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Ask AI"}
            </button>

            {error ? <div className="panel-error">{error}</div> : null}
          </form>

          <section className="chat-response">
            <div className="chat-bubble chat-bubble-user">
              <h2>Prompt</h2>
              <p>{question || "Your question will appear here."}</p>
            </div>

            <div className="chat-bubble chat-bubble-assistant">
              <h2>Assistant</h2>
              <p className="chat-answer">
                {response ||
                  "Submit your code and question to receive a structured response."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

