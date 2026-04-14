import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { classificationService } from '../services/api';
import { ProvenanceStatus, ProvenanceVerifyResponse } from '../types';

type VerifyMode = 'signature' | 'email' | 'certificate';

function deriveStatus(result: ProvenanceVerifyResponse | null): ProvenanceStatus {
  if (!result) return 'unknown';

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

const ProvenanceVerify: React.FC = () => {
  const [mode, setMode] = useState<VerifyMode>('signature');
  const [signatureToken, setSignatureToken] = useState('');
  const [rawEmail, setRawEmail] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProvenanceVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetResult = () => {
    setResult(null);
    setError(null);
  };

  const handleModeChange = (nextMode: VerifyMode) => {
    setMode(nextMode);
    resetResult();
  };

  const handleEmailFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    setRawEmail(text);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    resetResult();

    try {
      let response: ProvenanceVerifyResponse;
      if (mode === 'signature') {
        if (!signatureToken.trim()) throw new Error('Paste a signature token first.');
        response = await classificationService.verifyProvenanceSignature(signatureToken.trim());
      } else if (mode === 'email') {
        if (!rawEmail.trim()) throw new Error('Paste or upload an email first.');
        response = await classificationService.verifyProvenanceEmail(rawEmail);
      } else {
        if (!certificateFile) throw new Error('Choose a PDF or DOCX certificate first.');
        response = await classificationService.verifyProvenanceCertificate(certificateFile);
      }

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
        <h1>Verify Provenance</h1>
        <p>Check sender tokens, raw emails, and stamped certificates for authentic proof.</p>
      </section>

      <div className="provenance-tabs" role="tablist" aria-label="Provenance verification modes">
        <button className={mode === 'signature' ? 'active' : ''} onClick={() => handleModeChange('signature')} type="button">
          Signature token
        </button>
        <button className={mode === 'email' ? 'active' : ''} onClick={() => handleModeChange('email')} type="button">
          Raw email
        </button>
        <button className={mode === 'certificate' ? 'active' : ''} onClick={() => handleModeChange('certificate')} type="button">
          Certificate
        </button>
      </div>

      <form className="upload-form provenance-form" onSubmit={handleSubmit}>
        {mode === 'signature' && (
          <div className="form-group">
            <label htmlFor="signature-token">Signature token</label>
            <textarea
              id="signature-token"
              value={signatureToken}
              onChange={(event) => setSignatureToken(event.target.value)}
              placeholder="v1c..."
              rows={5}
            />
          </div>
        )}

        {mode === 'email' && (
          <>
            <div className="form-group">
              <label htmlFor="email-upload">Upload .eml file</label>
              <input
                id="email-upload"
                className="model-select"
                type="file"
                accept=".eml,message/rfc822,text/plain"
                onChange={(event) => handleEmailFile(event.target.files?.[0])}
              />
            </div>
            <div className="form-group">
              <label htmlFor="raw-email">Raw email</label>
              <textarea
                id="raw-email"
                value={rawEmail}
                onChange={(event) => setRawEmail(event.target.value)}
                placeholder="Headers, blank line, body"
                rows={12}
              />
            </div>
          </>
        )}

        {mode === 'certificate' && (
          <div className="form-group">
            <label htmlFor="certificate-file">Certificate file</label>
            <input
              id="certificate-file"
              className="model-select"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setCertificateFile(event.target.files?.[0] || null)}
            />
            {certificateFile && <p className="form-help">Selected: {certificateFile.name}</p>}
          </div>
        )}

        <button className="analyze-btn" type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {error && (
        <div className="provenance-result status-upstream_error">
          <h2>Verification Error</h2>
          <p>{error}</p>
          {error.includes('Sign in') && <Link to="/login">Sign in</Link>}
        </div>
      )}

      {result && (
        <section className={`provenance-result status-${status}`}>
          <h2>{statusCopy(status)}</h2>
          <div className="result-details">
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value">{status}</span>
            </div>
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
