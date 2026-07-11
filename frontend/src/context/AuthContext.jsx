import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "ai-code-help-auth";

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);

  const signIn = (nextSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession({ token: null, user: null });
  };

  const updateUser = (user) => {
    if (!session.token) return;
    signIn({ token: session.token, user });
  };

  useEffect(() => {
    if (!session.token) return;
    getCurrentUser(session.token)
      .then(({ user }) => signIn({ token: session.token, user }))
      .catch(signOut);
  }, []);

  const value = useMemo(
    () => ({ user: session.user, token: session.token, signIn, signOut, updateUser }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
