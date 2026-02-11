import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { classificationService } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setIsMenuOpen(false);
  };

  const handleSendTestEmail = async () => {
    if (!user?.email) return;
    try {
      const result = await classificationService.sendTestEmail(user.email);
      toast.push(result.message || 'Test email sent.', 'success');
      if (result.rate_limit) {
        toast.push(
          `Emails remaining: ${result.rate_limit.remaining} (resets in ${result.rate_limit.reset_after_seconds}s)`,
          'info'
        );
      }
      setIsMenuOpen(false);
    } catch (error: any) {
      toast.push(error.message || 'Failed to send test email.', 'error');
    }
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

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;
  const [emailFailCount, setEmailFailCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    classificationService
      .getEmailStats()
      .then((stats) => setEmailFailCount(stats.failed_count))
      .catch(() => setEmailFailCount(null));
  }, [isAdmin]);

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
          {user && (
            <li>
              <Link to="/profile" className={isActive('/profile')} onClick={closeMenu}>
                Profile
              </Link>
            </li>
          )}
          {user && isAdmin && (
            <li>
              <Link to="/admin/email" className={isActive('/admin/email')} onClick={closeMenu}>
                Admin
                {emailFailCount !== null && emailFailCount > 0 && (
                  <span className="nav-badge">{emailFailCount}</span>
                )}
              </Link>
            </li>
          )}
          {user && isAdmin && (
            <li>
              <button 
                onClick={handleSendTestEmail}
                className="nav-test-btn"
              >
                Send Test Email
              </button>
            </li>
          )}
          <li>
            {user ? (
              <button 
                onClick={handleLogout}
                className="logout-btn"
              >
                Logout
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="logout-btn"
              >
                Login
              </button>
            )}
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
