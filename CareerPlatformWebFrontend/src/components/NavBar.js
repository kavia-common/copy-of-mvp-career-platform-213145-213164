import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * NavBar renders top navigation; adjusts based on authentication state.
 */
export default function NavBar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar" aria-label="Main">
      <div className="navbar-inner container">
        <Link className="brand" to={isAuthenticated ? '/roles' : '/login'} aria-label="Career Platform Home">
          Career Platform
        </Link>
        {isAuthenticated && (
          <ul className="nav-links" role="menubar" aria-label="Primary">
            <li role="none"><Link role="menuitem" to="/roles">Roles</Link></li>
            <li role="none"><Link role="menuitem" to="/assessment">Assessment</Link></li>
            <li role="none"><Link role="menuitem" to="/gap">Gap Analysis</Link></li>
            <li role="none"><Link role="menuitem" to="/plan">Development Plan</Link></li>
            <li role="none"><Link role="menuitem" to="/admin/templates">Templates</Link></li>
            <li role="none"><Link role="menuitem" to="/admin/audit">Audit Logs</Link></li>
          </ul>
        )}
        <div className="nav-actions">
          {isAuthenticated ? (
            <button className="btn" onClick={logout} aria-label="Log out">Logout</button>
          ) : (
            <>
              <Link className="btn" to="/login">Login</Link>
              <Link className="btn btn-secondary" to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
