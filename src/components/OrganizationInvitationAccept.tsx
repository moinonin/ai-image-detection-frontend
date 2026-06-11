import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizationService } from '../services/api';

const OrganizationInvitationAccept: React.FC = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') || '';
  const [status, setStatus] = useState<'idle' | 'working' | 'accepted' | 'error'>(
    'idle'
  );
  const [message, setMessage] = useState('');
  const returnPath = `${location.pathname}${location.search}`;

  const handleAccept = async () => {
    if (!token) return;
    setStatus('working');
    setMessage('');
    try {
      const response = await organizationService.acceptOrganizationInvitation(token);
      setStatus('accepted');
      setMessage(response.message || 'Invitation accepted.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Could not accept this invitation.');
    }
  };

  return (
    <div className="organization-accept-page">
      <section className="organization-accept-panel">
        <p className="eyebrow">Team invitation</p>
        <h1>Join an organization</h1>

        {!token && (
          <div className="organization-notice error">
            <h2>Invitation link incomplete</h2>
            <p>This link does not contain an invitation token.</p>
          </div>
        )}

        {token && authLoading && <p>Checking your account.</p>}

        {token && !authLoading && !isAuthenticated && (
          <>
            <p>Sign in with the email address that received this invitation.</p>
            <Link
              className="primary-action"
              to={`/login?returnTo=${encodeURIComponent(returnPath)}`}
            >
              Sign in to continue
            </Link>
          </>
        )}

        {token && !authLoading && isAuthenticated && status === 'idle' && (
          <>
            <p>
              Continue as <strong>{user?.email}</strong>. The invitation must match
              this email address.
            </p>
            <button className="primary-action" type="button" onClick={handleAccept}>
              Accept invitation
            </button>
          </>
        )}

        {status === 'working' && <p>Adding you to the organization.</p>}

        {status === 'accepted' && (
          <div className="organization-notice success">
            <h2>Invitation accepted</h2>
            <p>{message}</p>
            <Link className="primary-action" to="/organization">
              Open organization
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="organization-notice error">
            <h2>Invitation not accepted</h2>
            <p>{message}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default OrganizationInvitationAccept;
