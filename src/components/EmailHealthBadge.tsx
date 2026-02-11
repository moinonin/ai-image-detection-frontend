import React, { useEffect, useState } from 'react';
import { classificationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const parseAdminEmails = (): string[] => {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
};

const EmailHealthBadge: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<{ configured: boolean; message: string } | null>(null);

  const admins = parseAdminEmails();
  const isAdmin = user?.email && admins.includes(user.email.toLowerCase());

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;
    classificationService
      .getEmailHealth()
      .then((data) => {
        if (mounted) setStatus({ configured: data.configured, message: data.message });
      })
      .catch((error) => {
        if (mounted) {
          setStatus({ configured: false, message: error.message || 'Email health check failed' });
        }
      });

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const configured = status?.configured ?? false;
  const label = status?.message || 'Checking SMTP...';

  return (
    <div className={`email-health-badge ${configured ? 'ok' : 'error'}`}>
      <span className="dot" />
      <span>{label}</span>
    </div>
  );
};

export default EmailHealthBadge;
