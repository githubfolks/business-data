import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="logo">📊</span>
          Business Intelligence Platform
        </Link>
        <ul className="nav-links">
          <li><Link to="/search">Search</Link></li>
          <li><Link to="/analytics">Analytics</Link></li>
          <li><Link to="/recommendations">Recommendations</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
