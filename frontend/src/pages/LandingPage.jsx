import { Link } from "react-router-dom";
import FeatureCard from "../components/FeatureCard";

const features = [
  {
    eyebrow: "Live Editor",
    title: "Python suggestions as you type",
    description:
      "Write Python in Monaco Editor and get concise feedback on syntax, quality, and improvement opportunities."
  },
  {
    eyebrow: "Bug Detection",
    title: "Catch issues early",
    description:
      "Surface likely syntax problems, risky patterns, and simple quality concerns before they turn into bigger debugging sessions."
  },
  {
    eyebrow: "AI Chat",
    title: "Discuss full Python files",
    description:
      "Paste larger snippets, ask targeted questions, and get readable guidance for explanation, optimization, and simplification."
  }
];

function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Python-first coding help</span>
            <h1>Build, debug, and improve Python code with an AI-assisted workflow.</h1>
            <p className="hero-text">
              A focused MVP for developers who want fast code feedback in the editor
              and a separate AI chat space for deeper code discussions.
            </p>
            <div className="hero-actions">
              <Link to="/editor" className="button button-primary">
                Open Editor
              </Link>
              <Link to="/chat" className="button button-secondary">
                Go to Chat
              </Link>
            </div>
          </div>

          {
            /*
            <div className="hero-panel">
            <div className="hero-snippet">
              <span className="snippet-label">MVP Focus</span>
              <ul>
                <li>Monaco-powered Python editor</li>
                <li>Fast API-based code analysis</li>
                <li>Chat workflow for full-snippet questions</li>
                <li>Frontend on Vercel, backend on Render</li>
              </ul>
            </div>
          </div>
            */
          }
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-copy">
            <span className="eyebrow">Core workflow</span>
            <h2>Two focused ways to work with Python code</h2>
            <p>
              Use the live editor for immediate guidance, then switch to chat when
              you want explanation, debugging help, or refactoring advice on bigger
              blocks of code.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;

