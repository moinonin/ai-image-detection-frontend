import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { classificationService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import lightLogo from '../../testlogos/lightsvg.svg';
import darkLogo from '../../testlogos/darksvg.svg';

type ThemeMode = 'light' | 'dark';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = window.localStorage.getItem('verif-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  const brandLogoSrc = theme === 'dark' 
    ? darkLogo
    : lightLogo;

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

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('verif-theme', theme);
  }, [theme]);

  return (
    <nav className="navbar">
      <div className="nav-content">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo-frame">
            <img key={theme} className="logo-img" src={brandLogoSrc} alt="VeriForensic logo" />
          </span>
          {/*<span className="logo-text">VeriF</span>*/}
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
            <Link to="/provenance/verify" className={isActive('/provenance/verify')} onClick={closeMenu}>
              Verify
            </Link>
          </li>
          {user && (
            <li>
              <Link to="/provenance/issue-certificate" className={isActive('/provenance/issue-certificate')} onClick={closeMenu}>
                Issue
              </Link>
            </li>
          )}
          {user && (
            <li>
              <Link to="/provenance/registry" className={isActive('/provenance/registry')} onClick={closeMenu}>
                Registry
              </Link>
            </li>
          )}
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
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="1.2rem" height="1.2rem">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="1.2rem" height="1.2rem">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </li>
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
