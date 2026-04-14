import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { classificationService } from '../services/api';
import { ProvenanceIssueCertificateInput } from '../types';

const defaultMetadata = (): ProvenanceIssueCertificateInput => ({
  secret: '',
  issuer_id: '',
  cert_id: '',
  recipient_id: '',
  model_name: 'sshleifer/tiny-gpt2',
  bits_per_token: 4,
  timestamp: new Date().toISOString(),
});

const ProvenanceIssueCertificate: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<ProvenanceIssueCertificateInput>(defaultMetadata);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  const updateMetadata = (key: keyof ProvenanceIssueCertificateInput, value: string | number) => {
    setMetadata((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setRequiresUpgrade(false);

    if (!file) {
      setError('Choose a PDF or DOCX certificate first.');
      return;
    }
    if (!metadata.secret.trim()) {
      setError('Add the provenance secret to embed.');
      return;
    }

    setLoading(true);
    try {
      const issued = await classificationService.issueProvenanceCertificate(file, metadata);
      const url = window.URL.createObjectURL(issued.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = issued.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(`Stamped certificate downloaded as ${issued.filename}.`);
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
        <h1>Issue Certificate</h1>
        <p>Team plan feature. Embed renewable provenance metadata into an official PDF or DOCX and download the stamped result.</p>
      </section>

      <form className="upload-form provenance-form" onSubmit={handleSubmit}>
        <p className="form-help">
          Professional covers email and signature-token provenance workflows. Certificate issuance is reserved for Team subscriptions, and issuance credentials are handled server-side.
        </p>

        <div className="form-group">
          <label htmlFor="issue-file">Certificate file</label>
          <input
            id="issue-file"
            className="model-select"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          {file && <p className="form-help">Selected: {file.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="secret">Provenance secret</label>
          <textarea
            id="secret"
            value={metadata.secret}
            onChange={(event) => updateMetadata('secret', event.target.value)}
            placeholder="issuer|certificate-id|recipient|timestamp"
            rows={4}
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
            />
          </div>
          <div className="form-group">
            <label htmlFor="cert-id">Certificate ID</label>
            <input
              id="cert-id"
              value={metadata.cert_id}
              onChange={(event) => updateMetadata('cert_id', event.target.value)}
              placeholder="cert-2026-001"
            />
          </div>
          <div className="form-group">
            <label htmlFor="recipient-id">Recipient ID</label>
            <input
              id="recipient-id"
              value={metadata.recipient_id}
              onChange={(event) => updateMetadata('recipient_id', event.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="timestamp">Timestamp</label>
            <input
              id="timestamp"
              value={metadata.timestamp}
              onChange={(event) => updateMetadata('timestamp', event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="model-name">Model name</label>
            <input
              id="model-name"
              value={metadata.model_name}
              onChange={(event) => updateMetadata('model_name', event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bits-per-token">Bits per token</label>
            <input
              id="bits-per-token"
              type="number"
              min="1"
              max="8"
              value={metadata.bits_per_token}
              onChange={(event) => updateMetadata('bits_per_token', Number(event.target.value))}
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

      {success && (
        <div className="provenance-result status-verified">
          <h2>Certificate Issued</h2>
          <p>{success}</p>
          <Link to="/provenance/verify">Verify the stamped certificate</Link>
        </div>
      )}
    </div>
  );
};

export default ProvenanceIssueCertificate;
