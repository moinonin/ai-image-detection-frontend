import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { classificationService } from '../services/api';
import { ProvenanceRegistryRecord as RegistryRecord } from '../types';

const formatDate = (value?: string | null) => {
  if (!value) return 'None';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const statusClass = (status?: string) => {
  const normalized = (status || 'unknown').toLowerCase();
  if (normalized === 'active') return 'status-verified';
  if (normalized === 'revoked') return 'status-tampered';
  if (normalized === 'expired' || normalized === 'superseded') return 'status-unverified';
  return 'status-unknown';
};

const statusCopy = (status?: string) => {
  const normalized = (status || 'unknown').toLowerCase();
  if (normalized === 'active') return 'This document is active in the registry.';
  if (normalized === 'revoked') return 'This document has been revoked by the issuer.';
  if (normalized === 'expired') return 'This document has expired.';
  if (normalized === 'superseded') return 'This document has been superseded.';
  return 'The registry returned additional details.';
};

const ProvenanceRegistryRecord: React.FC = () => {
  const { documentId } = useParams();
  const [record, setRecord] = useState<RegistryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    let cancelled = false;

    const loadRecord = async () => {
      if (!documentId) {
        setError('Missing registry document id.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const nextRecord = await classificationService.getProvenanceRegistryRecord(documentId);
        if (!cancelled) {
          setRecord(nextRecord);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Registered document was not found.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRecord();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const copyUrl = async () => {
    const url = record?.verification_url || window.location.href;
    await navigator.clipboard.writeText(url);
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1800);
  };

  return (
    <div className="provenance-service">
      <section className="page-header">
        <h1>Registry Verification</h1>
        <p>Confirm whether an issued document is still recognized by the VeriForensic provenance registry.</p>
      </section>

      {loading && (
        <section className="provenance-result status-unknown">
          <h2>Checking registry</h2>
          <p>Looking up the issued document record.</p>
        </section>
      )}

      {error && !loading && (
        <section className="provenance-result status-upstream_error">
          <h2>Record Not Found</h2>
          <p>{error}</p>
          <Link to="/provenance/verify">Verify a stamped document instead</Link>
        </section>
      )}

      {record && !loading && (
        <section className={`provenance-result registry-record ${statusClass(record.status)}`}>
          <div className="registry-record-header">
            <div>
              <p className="eyebrow">Registered document</p>
              <h2>{record.title || 'Untitled document'}</h2>
              <p>{statusCopy(record.status)}</p>
            </div>
            <span className={`registry-status-pill ${record.status || 'unknown'}`}>
              {record.status || 'unknown'}
            </span>
          </div>

          <div className="result-details">
            <div className="detail-item">
              <span className="detail-label">Issuer</span>
              <span className="detail-value">{record.issuer_name || 'Not disclosed'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Document type</span>
              <span className="detail-value">{record.document_type || 'document'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Issued</span>
              <span className="detail-value">{formatDate(record.issued_at)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Expires</span>
              <span className="detail-value">{formatDate(record.expires_at)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Storage</span>
              <span className="detail-value">{record.storage_mode || 'registry_only'}</span>
            </div>
            <div className="detail-item detail-item-stack">
              <span className="detail-label">Document ID</span>
              <span className="detail-value">{record.document_id}</span>
            </div>
            {record.document_hash && (
              <div className="detail-item detail-item-stack">
                <span className="detail-label">Document fingerprint</span>
                <span className="detail-value hash-value">{record.document_hash}</span>
              </div>
            )}
            {record.revocation_reason && (
              <div className="detail-item detail-item-stack">
                <span className="detail-label">Revocation reason</span>
                <span className="detail-value">{record.revocation_reason}</span>
              </div>
            )}
            {record.supersedes_document_id && (
              <div className="detail-item detail-item-stack">
                <span className="detail-label">Supersedes</span>
                <span className="detail-value">
                  {record.supersedes_verification_url ? (
                    <a href={record.supersedes_verification_url}>{record.supersedes_document_id}</a>
                  ) : (
                    record.supersedes_document_id
                  )}
                </span>
              </div>
            )}
            {record.superseded_by_document_id && (
              <div className="detail-item detail-item-stack">
                <span className="detail-label">Superseded by</span>
                <span className="detail-value">
                  {record.superseded_by_verification_url ? (
                    <a href={record.superseded_by_verification_url}>{record.superseded_by_document_id}</a>
                  ) : (
                    record.superseded_by_document_id
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="registry-actions">
            <button className="secondary-action" type="button" onClick={copyUrl}>
              {copyState === 'copied' ? 'Copied' : 'Copy verification URL'}
            </button>
            <Link className="secondary-action" to="/provenance/verify">
              Verify stamped file
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProvenanceRegistryRecord;
