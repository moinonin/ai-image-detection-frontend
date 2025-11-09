import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-content">
        <Link to="/" className="logo">
          AIDetect
        </Link>
        
        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive('/')}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/single" className={isActive('/single')}>
              Single Analysis
            </Link>
          </li>
          <li>
            <Link to="/batch" className={isActive('/batch')}>
              Batch Analysis
            </Link>
          </li>
          <li>
            <Link to="/videos" className={isActive('/videos')}>
              Video Analysis
            </Link>
          </li>
          <li>
            <Link to="/profile" className={isActive('/profile')}>
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
      </div>
    </nav>
  );
};

export default Navbar;