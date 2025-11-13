import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-content">
        <Link to="/" className="logo" onClick={closeMenu}>
          VeriForensic
        </Link>
        
        {/* Hamburger Menu Button */}
        <div 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>

        {/* Navigation Links */}
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" className={isActive('/')} onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/resources" className={isActive('/resources')} onClick={closeMenu}>
              Resources
            </Link>
          </li>
          <li>
            <Link to="/pricing" className={isActive('/pricing')} onClick={closeMenu}>
              Pricing
            </Link>
          </li>
          <li>
            <Link to="/about" className={isActive('/about')} onClick={closeMenu}>
              About
            </Link>
          </li>
          <li>
            <Link to="/profile" className={isActive('/profile')} onClick={closeMenu}>
              Profile
            </Link>
          </li>
          <li>
            <button 
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </button>
          </li>
        </ul>

        {/* Optional: Backdrop for mobile */}
        {isMenuOpen && (
          <div 
            className="menu-backdrop"
            onClick={closeMenu}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;