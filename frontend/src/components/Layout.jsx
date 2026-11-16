import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  `nav-link${isActive ? " nav-link-active" : ""}`;

function Layout() {
  const { user } = useAuth();
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
