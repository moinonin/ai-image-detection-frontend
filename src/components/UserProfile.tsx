import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [changePassword, setChangePassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (changePassword.newPassword !== changePassword.confirmPassword) {
      setMessage('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authService.changePassword(changePassword.currentPassword, changePassword.newPassword);
      setMessage('Password changed successfully!');
      setChangePassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage('Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile">
      <div className="page-header">
        <h1>User Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-container">
        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Information
          </button>
          <button 
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="profile-info">
              <div className="info-card">
                <h3>Account Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Username:</label>
                    <span>{user?.username}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{user?.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Full Name:</label>
                    <span>{user?.full_name || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Account Status:</label>
                    <span className={`status ${user?.is_active ? 'active' : 'inactive'}`}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <h3>Usage Statistics</h3>
                <div className="stats-grid">
                  <div className="stat">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Images Analyzed</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Batch Jobs</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">100%</div>
                    <div className="stat-label">Accuracy Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="password-change">
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={changePassword.currentPassword}
                    onChange={(e) => setChangePassword(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={changePassword.newPassword}
                    onChange={(e) => setChangePassword(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    className="form-input"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={changePassword.confirmPassword}
                    onChange={(e) => setChangePassword(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    className="form-input"
                    required
                    minLength={6}
                  />
                </div>

                {message && (
                  <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <button type="submit" disabled={loading} className="auth-btn">
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>

              <div className="password-tips">
                <h4>Password Requirements:</h4>
                <ul>
                  <li>Minimum 6 characters</li>
                  <li>Maximum 72 characters</li>
                  <li>Use a combination of letters, numbers, and symbols</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;