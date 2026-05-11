import { NavLink, Outlet } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  `nav-link${isActive ? " nav-link-active" : ""}`;

function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container nav-bar">
          <NavLink to="/" className="brand-mark">
            <span className="brand-badge">AI</span>
            <span>Code Help</span>
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
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <p>Built for Python-first AI coding support.</p>
          <p>React, Monaco, Express, and a clean MVP structure.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;

