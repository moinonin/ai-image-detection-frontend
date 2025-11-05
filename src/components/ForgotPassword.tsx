import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await authService.forgotPassword(email);
      setMessage('If the email exists, a reset token has been sent to your email address.');
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔒</div>
          <h1>Reset Your Password</h1>
          <p className="auth-subtitle">Enter your email to receive a reset token</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              placeholder="Enter your registered email"
            />
          </div>

          {message && (
            <div className="message info">
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Sending Reset Token...' : 'Send Reset Token'}
          </button>
        </form>

        <div className="auth-link">
          <p>
            Remember your password? <Link to="/login">Back to Login</Link>
          </p>
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>

        <div className="reset-info">
          <h4>What happens next?</h4>
          <ul>
            <li>You'll receive an email with a reset token</li>
            <li>The token expires in 15 minutes</li>
            <li>Check your spam folder if you don't see the email</li>
            <li>Use the token on the reset password page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;