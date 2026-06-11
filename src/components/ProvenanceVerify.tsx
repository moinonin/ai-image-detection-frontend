import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { classificationService } from '../services/api';
import { ProvenanceStatus, ProvenanceVerifyResponse } from '../types';

function deriveStatus(result: ProvenanceVerifyResponse | null): ProvenanceStatus {
  if (!result) return 'unknown';

  const registryStatus = String(result.registry_status || result.registry?.status || '').toLowerCase();
  if (['revoked', 'expired', 'superseded', 'not_registered'].includes(registryStatus)) {
    return registryStatus as ProvenanceStatus;
  }

  const rawStatus = String(
    result.status ||
      result.metadata?.status ||
      result.metadata?.policy ||
      result.policy?.status ||
      ''
  ).toLowerCase();

  if (result.tampered === true || result.metadata?.tampered === true || rawStatus.includes('tamper')) {
    return 'tampered';
  }
  if (result.verified === true || result.valid === true || rawStatus === 'verified' || rawStatus === 'ok') {
    return 'verified';
  }
  if (result.verified === false || result.valid === false || rawStatus === 'unverified') {
    return 'unverified';
  }
  if (rawStatus === 'unsupported') {
    return 'unsupported';
  }
  return 'unknown';
}

function statusCopy(status: ProvenanceStatus): string {
  switch (status) {
    case 'verified':
      return 'Verified provenance was found.';
    case 'tampered':
      return 'The provenance check indicates tampering.';
    case 'revoked':
      return 'Proof was found, but this document has been revoked.';
    case 'expired':
      return 'Proof was found, but this document has expired.';
    case 'superseded':
      return 'Proof was found, but this document has been superseded.';
    case 'not_registered':
      return 'Proof was checked, but no matching registry record was found.';
    case 'unverified':
      return 'No valid provenance proof was confirmed.';
    case 'unsupported':
      return 'This input is not supported for provenance verification.';
    case 'upstream_error':
      return 'The verification service could not complete the check.';
    default:
      return 'The verification service returned additional details.';
  }
}

function StatusBadge({ status }: { status: ProvenanceStatus }) {
  switch (status) {
    case 'verified':
      return (
        <span className="status-icon-badge success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      );
    case 'tampered':
    case 'revoked':
    case 'upstream_error':
      return (
        <span className="status-icon-badge danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </span>
      );
    default:
      return (
        <span className="status-icon-badge warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
      );
  }
}

const ProvenanceVerify: React.FC = () => {
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProvenanceVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetResult = () => {
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    resetResult();

    try {
      if (!certificateFile) throw new Error('Choose a PDF or DOCX certificate first.');
      const response = await classificationService.verifyProvenanceCertificate(certificateFile);

      setResult(response);
    } catch (err: any) {
      const status = err.status === 401 ? 'Sign in to verify with the current service policy.' : err.message;
      setError(status || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const status = deriveStatus(result);

  return (
    <div className="provenance-service">
      <section className="page-header">
        <h1>Verify Certificate</h1>
        <p>Upload a stamped PDF or DOCX to check its embedded proof and current registry status.</p>
      </section>

      <form className="upload-form provenance-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="certificate-file">Certificate file</label>
          <input
            id="certificate-file"
            className="model-select"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              setCertificateFile(event.target.files?.[0] || null);
              resetResult();
            }}
          />
          {certificateFile && <p className="form-help">Selected: {certificateFile.name}</p>}
        </div>

        <button className="analyze-btn" type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Certificate'}
        </button>
      </form>

      {error && (
        <div className="provenance-result status-upstream_error">
          <div className="status-header">
            <StatusBadge status="upstream_error" />
            <h2>Verification Error</h2>
          </div>
          <p>{error}</p>
          {error.includes('Sign in') && <Link to="/login">Sign in</Link>}
        </div>
      )}

      {result && (
        <section className={`provenance-result status-${status}`}>
          <div className="status-header">
            <StatusBadge status={status} />
            <h2>{statusCopy(status)}</h2>
          </div>
          <div className="result-details">
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value">{status}</span>
            </div>
            {result.trust_decision && (
              <div className="detail-item">
                <span className="detail-label">Trust decision</span>
                <span className="detail-value">{String(result.trust_decision)}</span>
              </div>
            )}
            {result.verified !== undefined && (
              <div className="detail-item">
                <span className="detail-label">Embedded proof</span>
                <span className="detail-value">{result.verified ? 'verified' : 'not verified'}</span>
              </div>
            )}
            {result.registry_status && (
              <div className="detail-item">
                <span className="detail-label">Registry status</span>
                <span className="detail-value">{String(result.registry_status)}</span>
              </div>
            )}
            {result.registry?.title && (
              <div className="detail-item">
                <span className="detail-label">Registered title</span>
                <span className="detail-value">{String(result.registry.title)}</span>
              </div>
            )}
            {result.registry?.issuer_name && (
              <div className="detail-item">
                <span className="detail-label">Issuer</span>
                <span className="detail-value">{String(result.registry.issuer_name)}</span>
              </div>
            )}
            {result.verification_url && (
              <div className="detail-item detail-item-stack">
                <span className="detail-label">Registry record</span>
                <Link className="detail-value registry-url" to={`/provenance/registry/${result.registry?.document_id}`}>
                  {result.verification_url}
                </Link>
              </div>
            )}
            {result.message && (
              <div className="detail-item detail-item-stack">
                <span className="detail-label">Decision note</span>
                <span className="detail-value">{String(result.message)}</span>
              </div>
            )}
            {result.reason && (
              <div className="detail-item">
                <span className="detail-label">Reason</span>
                <span className="detail-value">{String(result.reason)}</span>
              </div>
            )}
            {result.request_id && (
              <div className="detail-item">
                <span className="detail-label">Request ID</span>
                <span className="detail-value">{result.request_id}</span>
              </div>
            )}
          </div>
          <details className="raw-details">
            <summary>Verification details</summary>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </details>
        </section>
      )}
    </div>
  );
};

export default ProvenanceVerify;
