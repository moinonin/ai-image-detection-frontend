import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    resetPassword, 
    resetLoading, 
    resetMessage, 
    verifyResetToken, 
    clearResetMessage 
  } = useAuth();
  
  const tokenFromUrl = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [localError, setLocalError] = useState('');

  // Auto-verify token on component mount
  useEffect(() => {
    const checkToken = async () => {
      if (!tokenFromUrl) {
        setTokenValid(false);
        setVerifying(false);
        return;
      }

      try {
        const isValid = await verifyResetToken(tokenFromUrl);
        setTokenValid(isValid);
      } catch (error) {
        console.error('Token verification error:', error);
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    checkToken();

    // Cleanup function - clears message when component unmounts
    return () => {
      clearResetMessage();
    };
  }, [tokenFromUrl, verifyResetToken, clearResetMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    if (!tokenFromUrl) {
      setLocalError('No reset token found');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return;
    }

    try {
      // Now resetPassword returns a boolean that we can check
      const success = await resetPassword(tokenFromUrl, formData.newPassword);
      
      if (success) {
        setFormData({ newPassword: '', confirmPassword: '' });
        
        // Redirect to login after success
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
      // If success is false, the error message is already set in the context
    } catch (error) {
      // This catch block might not be needed anymore since resetPassword handles errors internally
      console.error('Reset password error:', error);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear local error when user starts typing
    if (localError) setLocalError('');
  };

  // Helper to check if form is valid
  const isFormValid = formData.newPassword === formData.confirmPassword && 
                     formData.newPassword.length >= 6;

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">⏳</div>
            <h1>Verifying Reset Link</h1>
            <p className="auth-subtitle">Please wait while we verify your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenFromUrl) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">❌</div>
            <h1>Invalid Reset Link</h1>
            <p className="auth-subtitle">This reset link is missing the required token</p>
          </div>

          <div className="message error">
            Please use the complete reset link from your email, or request a new one.
          </div>

          <div className="auth-link">
            <p>
              <Link to="/forgot-password">Request New Reset Link</Link>
            </p>
            <p>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">⚠️</div>
            <h1>Invalid Reset Token</h1>
            <p className="auth-subtitle">This reset link is invalid or has expired</p>
          </div>

          <div className="message error">
            This reset token is no longer valid. Please request a new password reset link.
          </div>

          <div className="auth-link">
            <p>
              <Link to="/forgot-password">Request New Reset Link</Link>
            </p>
            <p>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔄</div>
          <h1>Create New Password</h1>
          <p className="auth-subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange('newPassword')}
              className="form-input"
              required
              minLength={6}
              placeholder="Enter your new password"
              disabled={resetLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              className="form-input"
              required
              minLength={6}
              placeholder="Confirm your new password"
              disabled={resetLoading}
            />
          </div>

          {/* Show local validation errors */}
          {localError && (
            <div className="message error">
              {localError}
            </div>
          )}

          {/* Show API response messages */}
          {resetMessage && (
            <div className={`message ${resetMessage.includes('successfully') ? 'success' : 'error'}`}>
              {resetMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={resetLoading || !isFormValid}
            className="auth-btn"
          >
            {resetLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-link">
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
          <p>
            Need a new token? <Link to="/forgot-password">Request Reset Token</Link>
          </p>
        </div>

        <div className="password-tips">
          <h4>Password Tips:</h4>
          <ul>
            <li>Use at least 6 characters</li>
            <li>Don't reuse old passwords</li>
            <li>Consider using a password manager</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;