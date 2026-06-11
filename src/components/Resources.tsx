import React from 'react';
import { Link } from 'react-router-dom';

const Resources: React.FC = () => {
  return (
    <div className="resources">
      <section className="resources-header">
        <h1>Provenance Resources</h1>
        <p className="resources-subtitle">
          Verify certificates, issue trusted documents, manage their status, and
          integrate provenance into institutional workflows.
        </p>
      </section>

      <section className="tools-section">
        <div className="tools-grid">
          <div className="tool-card neon-green">
            <div className="tool-icon">✓</div>
            <h3>Verify Certificate</h3>
            <p className="tool-description">
              Upload a stamped PDF or DOCX file to check its embedded proof and
              current registry status.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                PDF and DOCX verification
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Embedded proof validation
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Registry status confirmation
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Revocation and expiry checks
              </div>
            </div>
            <Link to="/provenance/verify" className="tool-cta">
              Verify Certificate
            </Link>
          </div>

          <div className="tool-card neon-purple">
            <div className="tool-icon">□</div>
            <h3>Issue Certificate</h3>
            <p className="tool-description">
              Stamp official PDF or DOCX files and register them for hosted
              verification.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Issuer and recipient metadata
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Stamped file download
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Registry verification URL
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Team-controlled issuance
              </div>
            </div>
            <Link to="/provenance/issue-certificate" className="tool-cta">
              Issue Certificate
            </Link>
          </div>

          <div className="tool-card neon-blue">
            <div className="tool-icon">⌁</div>
            <h3>Issuer Registry</h3>
            <p className="tool-description">
              Review issued records, open public verification pages, and revoke
              documents that should no longer verify.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Issued document records
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Public verification links
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Revocation workflow
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Document lifecycle status
              </div>
            </div>
            <Link to="/provenance/registry" className="tool-cta">
              Open Registry
            </Link>
          </div>

          <div className="tool-card neon-blue">
            <div className="tool-icon">i</div>
            <h3>Integration Guides</h3>
            <p className="tool-description">
              Review API specifications, deployment guidance, audit controls,
              and SDK integration documentation.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                API specifications
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Deployment guidance
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Audit and key management
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                SDK workflows
              </div>
            </div>
            <a href="/ns-stego/index.html" className="tool-cta">
              Open Documentation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resources;
