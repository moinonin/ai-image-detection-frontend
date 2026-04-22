import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { classificationService } from '../services/api';
import { ProvenanceRegistryRecord } from '../types';

const formatDate = (value?: string | null) => {
  if (!value) return 'None';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const ProvenanceRegistryDashboard: React.FC = () => {
  const [records, setRecords] = useState<ProvenanceRegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await classificationService.listProvenanceRegistry();
      setRecords(response.items || []);
    } catch (err: any) {
      setError(err.message || 'Could not load registered documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleRevoke = async (documentId: string) => {
    setWorkingId(documentId);
    setError(null);
    try {
      const updated = await classificationService.revokeProvenanceRegistryRecord(
        documentId,
        revokeReason.trim() || 'Revoked by issuer'
      );
      setRecords((current) =>
        current.map((record) => (record.document_id === documentId ? updated : record))
      );
      setRevokingId(null);
      setRevokeReason('');
    } catch (err: any) {
      setError(err.message || 'Could not revoke this document.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="provenance-service">
      <section className="page-header">
        <h1>Issued Documents</h1>
        <p>Review registered documents, open verification records, and revoke documents that should no longer verify as active.</p>
      </section>

      <div className="registry-toolbar">
        <Link className="secondary-action" to="/provenance/issue-certificate">
          Issue registered certificate
        </Link>
        <button className="secondary-action" type="button" onClick={loadRecords} disabled={loading}>
          {loading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {error && (
        <section className="provenance-result status-upstream_error">
          <h2>Registry Error</h2>
          <p>{error}</p>
        </section>
      )}

      {loading && (
        <section className="provenance-result status-unknown">
          <h2>Loading documents</h2>
          <p>Fetching registry records for your issuer account.</p>
        </section>
      )}

      {!loading && records.length === 0 && (
        <section className="provenance-result status-unknown">
          <h2>No Registered Documents Yet</h2>
          <p>Issue a certificate to create the first registry record.</p>
          <Link to="/provenance/issue-certificate">Issue certificate</Link>
        </section>
      )}

      {!loading && records.length > 0 && (
        <section className="registry-list" aria-label="Issued documents">
          {records.map((record) => (
            <article className="registry-list-item" key={record.document_id}>
              <div className="registry-list-main">
                <div>
                  <p className="eyebrow">{record.document_type || 'document'}</p>
                  <h2>{record.title || 'Untitled document'}</h2>
                  <p>
                    Issued {formatDate(record.issued_at)}
                    {record.expires_at ? ` · Expires ${formatDate(record.expires_at)}` : ''}
                  </p>
                </div>
                <span className={`registry-status-pill ${record.status || 'unknown'}`}>
                  {record.status || 'unknown'}
                </span>
              </div>

              <div className="registry-list-meta">
                <span>{record.document_id}</span>
                {record.document_hash && <span>{record.document_hash.slice(0, 20)}...</span>}
              </div>

              {revokingId === record.document_id && (
                <div className="revoke-panel">
                  <label htmlFor={`revoke-${record.document_id}`}>Revocation reason</label>
                  <textarea
                    id={`revoke-${record.document_id}`}
                    value={revokeReason}
                    onChange={(event) => setRevokeReason(event.target.value)}
                    placeholder="Document replaced, issued in error, or no longer valid."
                    rows={3}
                  />
                  <div className="registry-actions">
                    <button
                      className="danger-action"
                      type="button"
                      onClick={() => handleRevoke(record.document_id)}
                      disabled={workingId === record.document_id}
                    >
                      {workingId === record.document_id ? 'Revoking' : 'Confirm revoke'}
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => {
                        setRevokingId(null);
                        setRevokeReason('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="registry-actions">
                <Link className="secondary-action" to={`/provenance/registry/${record.document_id}`}>
                  Open record
                </Link>
                {record.verification_url && (
                  <a className="secondary-action" href={record.verification_url}>
                    Verification URL
                  </a>
                )}
                {record.status !== 'revoked' && (
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => setRevokingId(record.document_id)}
                  >
                    Revoke
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default ProvenanceRegistryDashboard;
