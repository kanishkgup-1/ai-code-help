import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navLinkClass = ({ isActive }) =>
  `nav-link${isActive ? " nav-link-active" : ""}`;

function Layout() {
  const { user } = useAuth();
  const { toggleTheme, isLight } = useTheme();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container nav-bar">
          <NavLink to="/" className="brand-mark">
            <span>CodeSphere</span>
            <span className="brand-badge">AI</span>
          </NavLink>

          <nav className="nav-links" aria-label="Main navigation">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/editor" className={navLinkClass}>
              Editor
            </NavLink>
            <NavLink to="/chat" className={navLinkClass}>
              Chat
            </NavLink>
            {user ? (
              <NavLink to="/profile" className="profile-link" aria-label="Open profile" title="Open profile">
                <div>{(user.name[0] + user.name.split(" ")[1]?.[0] || user.name[1]).toUpperCase()}</div>
                <span className="sr-only">Profile</span>
              </NavLink>
            ) : (
              <NavLink to="/auth" className={navLinkClass}>
                Log in
              </NavLink>
            )}

            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${isLight ? "dark" : "light"} mode`}
              aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
            >
              {isLight ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <p>Built for Python-first AI coding support.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
