import React, { useCallback, useEffect, useState } from 'react';
import { classificationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminEmailHealth: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<{ configured: boolean; message: string; details?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ failed_count: number; sent_count: number; window_seconds: number } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [failures, setFailures] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterRecipient, setFilterRecipient] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'user_email' | 'recipient_email'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classificationService.getEmailHealth();
      setStatus(data);
      const statsData = await classificationService.getEmailStats();
      setStats(statsData);
      const failureData = await classificationService.getEmailFailures({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        start: filterStart || undefined,
        end: filterEnd || undefined,
        user_email: filterUser || undefined,
        recipient_email: filterRecipient || undefined,
        sort_by: sortBy,
        sort_dir: sortDir
      });
      setFailures(failureData.failures || []);
      setTotalCount(failureData.total_count || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load email health');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [filterEnd, filterRecipient, filterStart, filterUser, page, pageSize, sortBy, sortDir]);

  useEffect(() => {
    if (!isAdmin) return;
    loadHealth();
  }, [isAdmin, loadHealth]);

  const applyFilters = () => {
    setPage(1);
  };

  const clearFilters = () => {
    setFilterStart('');
    setFilterEnd('');
    setFilterUser('');
    setFilterRecipient('');
    setSortBy('created_at');
    setSortDir('desc');
    setPage(1);
  };

  const downloadCsv = async () => {
    try {
      const blob = await classificationService.downloadEmailFailuresCsv({
        start: filterStart || undefined,
        end: filterEnd || undefined,
        user_email: filterUser || undefined,
        recipient_email: filterRecipient || undefined,
        sort_by: sortBy,
        sort_dir: sortDir
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'email_failures.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download CSV');
    }
  };

  useEffect(() => {
    if (user?.email && testEmail.trim() === '') {
      setTestEmail(user.email);
    }
  }, [user, testEmail]);

  const handleSendTest = async () => {
    if (!testEmail) {
      setTestStatus('Email is required.');
      return;
    }
    setTestStatus(null);
    try {
      const result = await classificationService.sendTestEmail(testEmail);
      setTestStatus(result.message || 'Test email sent.');
    } catch (err: any) {
      setTestStatus(err.message || 'Failed to send test email.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <h1>Admin</h1>
        <div className="admin-card">
          <p>Access denied. Admins only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Email Health</h1>
      <div className="admin-card">
        <div className={`health-row ${status?.configured ? 'ok' : 'error'}`}>
          <span className="dot" />
          <span>{status?.message || 'Checking SMTP...'}</span>
        </div>
        {stats && (
          <div className="admin-stats">
            <span>Failed (last {Math.round(stats.window_seconds / 60)}m): {stats.failed_count}</span>
            <span>Sent: {stats.sent_count}</span>
          </div>
        )}
        {error && <div className="admin-error">{error}</div>}
        {status?.details && (
          <pre className="admin-details">{JSON.stringify(status.details, null, 2)}</pre>
        )}
        <div className="admin-filters">
          <div className="filter-row">
            <label>
              Start
              <input type="datetime-local" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
            </label>
            <label>
              End
              <input type="datetime-local" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
            </label>
            <label>
              User
              <input type="text" value={filterUser} onChange={(e) => setFilterUser(e.target.value)} placeholder="user@domain" />
            </label>
            <label>
              Recipient
              <input type="text" value={filterRecipient} onChange={(e) => setFilterRecipient(e.target.value)} placeholder="recipient@domain" />
            </label>
            <label>
              Sort by
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="created_at">Created At</option>
                <option value="user_email">User Email</option>
                <option value="recipient_email">Recipient Email</option>
              </select>
            </label>
            <label>
              Sort dir
              <select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </label>
            <label>
              Page size
              <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value, 10))}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
          <div className="filter-actions">
            <button className="futuristic-btn" onClick={applyFilters} disabled={loading}>
              Apply Filters
            </button>
            <button className="futuristic-btn" onClick={clearFilters} disabled={loading}>
              Clear Filters
            </button>
            <button className="futuristic-btn" onClick={downloadCsv} disabled={loading}>
              Export CSV
            </button>
          </div>
        </div>
        {failures.length > 0 && (
          <div className="admin-failures">
            <h3>Recent Failures</h3>
            <div className="failure-list">
              {failures.map((f) => (
                <div key={f.id} className="failure-item">
                  <div>
                    <strong>{f.created_at}</strong> • {f.user_email} → {f.recipient_email}
                  </div>
                  <div>Type: {f.report_type} • File: {f.filename || 'N/A'}</div>
                  <div className="failure-error">{f.error_message || 'Unknown error'}</div>
                </div>
              ))}
            </div>
            <div className="pagination">
              <button className="futuristic-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Prev
              </button>
              <span>
                Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}
              </span>
              <button
                className="futuristic-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
              >
                Next
              </button>
            </div>
          </div>
        )}
        <div className="admin-test">
          <input
            type="email"
            placeholder="Send test email to..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="email-input"
          />
          <button className="futuristic-btn" onClick={handleSendTest} disabled={loading}>
            Send Test Email
          </button>
          {testStatus && <div className="email-status">{testStatus}</div>}
        </div>
        <button className="futuristic-btn" onClick={loadHealth} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

export default AdminEmailHealth;
