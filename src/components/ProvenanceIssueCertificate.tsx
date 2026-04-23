import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { classificationService } from '../services/api';
import { ProvenanceIssueCertificateInput } from '../types';

const defaultMetadata = (): ProvenanceIssueCertificateInput => ({
  secret: '',
  title: '',
  document_type: 'certificate',
  issuer_id: '',
  cert_id: '',
  recipient_id: '',
  recipient_name: '',
  recipient_email: '',
  expires_at: '',
  metadata_visibility: 'public_safe',
  model_name: 'sshleifer/tiny-gpt2',
  timestamp: new Date().toISOString(),
});

type IssuedRegistryState = {
  filename: string;
  documentId?: string;
  verificationUrl?: string;
  status?: string;
  storageMode?: string;
};

const ProvenanceIssueCertificate: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<ProvenanceIssueCertificateInput>(defaultMetadata);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedRecord, setIssuedRecord] = useState<IssuedRegistryState | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  useEffect(() => {
    if (loading) return;

    const refreshTimestamp = () => {
      setMetadata((current) => ({ ...current, timestamp: new Date().toISOString() }));
    };

    refreshTimestamp();
    const interval = window.setInterval(refreshTimestamp, 1000);
    return () => window.clearInterval(interval);
  }, [loading]);

  const updateMetadata = (key: keyof ProvenanceIssueCertificateInput, value: string | number) => {
    setMetadata((current) => ({ ...current, [key]: value }));
  };

  const handleCopyVerificationUrl = async () => {
    if (!issuedRecord?.verificationUrl) return;
    await navigator.clipboard.writeText(issuedRecord.verificationUrl);
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1800);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIssuedRecord(null);
    setCopyState('idle');
    setRequiresUpgrade(false);

    if (!file) {
      setError('Choose a PDF or DOCX certificate first.');
      return;
    }
    if (!metadata.secret.trim()) {
      setError('Add the provenance secret to embed.');
      return;
    }
    if (!metadata.title?.trim()) {
      setError('Add a document title for the registry record.');
      return;
    }
    const requiredFields: Array<[keyof ProvenanceIssueCertificateInput, string]> = [
      ['document_type', 'Add the document type.'],
      ['issuer_id', 'Add the issuer ID.'],
      ['cert_id', 'Add the certificate ID.'],
      ['recipient_id', 'Add the recipient ID.'],
      ['recipient_name', 'Add the recipient name.'],
      ['recipient_email', 'Add the recipient email.'],
      ['model_name', 'Add the model name.'],
      ['metadata_visibility', 'Choose a visibility setting.'],
    ];
    for (const [field, message] of requiredFields) {
      if (!String(metadata[field] || '').trim()) {
        setError(message);
        return;
      }
    }

    setLoading(true);
    try {
      const issued = await classificationService.issueProvenanceCertificate(file, {
        ...metadata,
        timestamp: new Date().toISOString(),
      });
      const url = window.URL.createObjectURL(issued.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = issued.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setIssuedRecord({
        filename: issued.filename,
        documentId: issued.documentId,
        verificationUrl: issued.verificationUrl,
        status: issued.status,
        storageMode: issued.storageMode,
      });
    } catch (err: any) {
      setRequiresUpgrade(err.status === 402 || err.status === 403);
      setError(err.message || 'Certificate issuance failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="provenance-service">
      <section className="page-header">
        <h1>Issue Registered Certificate</h1>
        <p>Team plan feature. Stamp an official PDF or DOCX, register its fingerprint, and share a hosted verification record.</p>
      </section>

      <form className="upload-form provenance-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="issue-file">Certificate file</label>
          <input
            id="issue-file"
            className="model-select"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          {file && <p className="form-help">Selected: {file.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="title">Registry title</label>
          <input
            id="title"
            value={metadata.title}
            onChange={(event) => updateMetadata('title', event.target.value)}
            placeholder="Official transcript for Jane Doe"
            required
          />
        </div>

        <div className="provenance-grid">
          <div className="form-group">
            <label htmlFor="document-type">Document type</label>
            <input
              id="document-type"
              value={metadata.document_type}
              onChange={(event) => updateMetadata('document_type', event.target.value)}
              placeholder="certificate"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="metadata-visibility">Public visibility</label>
            <select
              id="metadata-visibility"
              className="model-select"
              value={metadata.metadata_visibility}
              onChange={(event) => updateMetadata('metadata_visibility', event.target.value)}
              required
            >
              <option value="public_safe">Public safe summary</option>
              <option value="recipient_only">Recipient only</option>
              <option value="issuer_only">Issuer only</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="secret">Provenance secret</label>
          <textarea
            id="secret"
            value={metadata.secret}
            onChange={(event) => updateMetadata('secret', event.target.value)}
            placeholder="issuer|certificate-id|recipient|timestamp"
            rows={4}
            required
          />
        </div>

        <div className="provenance-grid">
          <div className="form-group">
            <label htmlFor="issuer-id">Issuer ID</label>
            <input
              id="issuer-id"
              value={metadata.issuer_id}
              onChange={(event) => updateMetadata('issuer_id', event.target.value)}
              placeholder="university-a"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cert-id">Certificate ID</label>
            <input
              id="cert-id"
              value={metadata.cert_id}
              onChange={(event) => updateMetadata('cert_id', event.target.value)}
              placeholder="cert-2026-001"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="recipient-id">Recipient ID</label>
            <input
              id="recipient-id"
              value={metadata.recipient_id}
              onChange={(event) => updateMetadata('recipient_id', event.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="recipient-name">Recipient name</label>
            <input
              id="recipient-name"
              value={metadata.recipient_name}
              onChange={(event) => updateMetadata('recipient_name', event.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="recipient-email">Recipient email</label>
            <input
              id="recipient-email"
              type="email"
              value={metadata.recipient_email}
              onChange={(event) => updateMetadata('recipient_email', event.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expires-at">Expiry date</label>
            <input
              id="expires-at"
              type="datetime-local"
              value={metadata.expires_at}
              onChange={(event) => updateMetadata('expires_at', event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="timestamp">Timestamp</label>
            <input
              id="timestamp"
              className="muted-input"
              value={metadata.timestamp}
              readOnly
              aria-readonly="true"
            />
          </div>
          <div className="form-group">
            <label htmlFor="model-name">Model name</label>
            <input
              id="model-name"
              className="muted-input"
              value={metadata.model_name}
              readOnly
              aria-readonly="true"
              required
            />
          </div>
        </div>

        <button className="analyze-btn" type="submit" disabled={loading}>
          {loading ? 'Issuing...' : 'Issue Stamped Certificate'}
        </button>
      </form>

      {error && (
        <div className="provenance-result status-upstream_error">
          <h2>Issuance Error</h2>
          <p>{error}</p>
          {requiresUpgrade && <Link to="/pricing">View plans</Link>}
        </div>
      )}

      {issuedRecord && (
        <div className="provenance-result status-verified">
          <h2>Registered Certificate Issued</h2>
          <p>Stamped certificate downloaded as {issuedRecord.filename}.</p>
          <div className="result-details">
            {issuedRecord.documentId && (
              <div className="detail-item">
                <span className="detail-label">Document ID</span>
                <span className="detail-value">{issuedRecord.documentId}</span>
              </div>
            )}
            {issuedRecord.status && (
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">{issuedRecord.status}</span>
              </div>
            )}
            {issuedRecord.storageMode && (
              <div className="detail-item">
                <span className="detail-label">Storage mode</span>
                <span className="detail-value">{issuedRecord.storageMode}</span>
              </div>
            )}
            {issuedRecord.verificationUrl && (
              <div className="detail-item detail-item-stack">
                <span className="detail-label">Verification URL</span>
                <a className="detail-value registry-url" href={issuedRecord.verificationUrl}>
                  {issuedRecord.verificationUrl}
                </a>
              </div>
            )}
          </div>
          <div className="registry-actions">
            {issuedRecord.verificationUrl && (
              <button className="secondary-action" type="button" onClick={handleCopyVerificationUrl}>
                {copyState === 'copied' ? 'Copied' : 'Copy verification URL'}
              </button>
            )}
            {issuedRecord.documentId && (
              <Link className="secondary-action" to={`/provenance/registry/${issuedRecord.documentId}`}>
                Open registry record
              </Link>
            )}
            <Link className="secondary-action" to="/provenance/verify">
              Verify stamped file
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvenanceIssueCertificate;
