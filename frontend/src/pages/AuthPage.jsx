import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginAccount, registerAccount } from "../services/api";

function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/profile" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const session = isRegistering
        ? await registerAccount({ name, email, password })
        : await loginAccount({ email, password });
      signIn(session);
      navigate("/profile", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

    return(
        <section className="page-section">
          <div className="container auth-layout">
            <form className="auth-card" onSubmit={handleSubmit}>
                <span className="eyebrow">Welcome</span>
                <h1>{isRegistering ? "Create your account" : "Welcome back"}</h1>
                <p>Save your account details and pick up where you left off.</p>
                {isRegistering && <div className="input-group">
                    <label htmlFor="name">Name</label>
                    <input
                        className="text-input"
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength="2"
                    />
                </div>}
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        className="text-input"
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                        className="text-input"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="8"
                    />
                </div>
                {error && <p className="panel-error" role="alert">{error}</p>}
                <button className="button button-primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Please wait..." : isRegistering ? "Sign up" : "Log in"}
                </button>
                <button className="auth-toggle" type="button" onClick={() => { setIsRegistering(!isRegistering); setError(""); }}>
                  {isRegistering ? "Already have an account? Log in" : "New here? Create an account"}
                </button>
            </form>
          </div>
        </section>
    )
}

export default AuthPage;
