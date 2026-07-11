import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToPro } from "../services/api";

function ProfilePage() {
  const { user, token, signOut, updateUser } = useAuth();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <Navigate to="/auth" replace />;

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setError("");
    try {
      const { user: updatedUser } = await subscribeToPro(token);
      updateUser(updatedUser);
    } catch (requestError) {
      setError(
        requestError.message || "An error occurred during subscription."
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <section className="page-section">
      <div className="container">
        <div className="auth-card profile-card">
          <span className="eyebrow">Your account</span>
          <div className="profile-avatar" aria-hidden="true">{(user.name[0]+user.name.split(" ")[1]?.[0] || "").toUpperCase()}</div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          {user.tier === "free" && (
            <button
              className="button button-secondary1"
              type="button"
              onClick={handleSubscribe}
              disabled={isSubscribing}
            >
              {isSubscribing ? "Subscribing..." : "Subscribe to AI Code Help Pro"}
            </button>
          )}
          {error && <p className="panel-error">{error}</p>}
          <button className="button button-secondary" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
