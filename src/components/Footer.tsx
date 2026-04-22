import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        
        {/* Main Footer Sections */}
        <div className="footer-sections">
          
          {/* Brand & Mission */}
          <div className="footer-section">
            <div className="footer-logo">VeriForensic</div>
            <p className="footer-mission">
              Provenance-first trust for digital media.
              Embed proof, verify authenticity, and audit with confidence.
            </p>
            <div className="footer-meta-links">
              <a href="/ns-stego/WHITEPAPER_PROVENANCE/index.html">Whitepaper</a>
            </div>
          </div>

          {/* Investigation Tools */}
          <div className="footer-section">
            <h4>Provenance</h4>
            <ul className="footer-links">
              <li><Link to="/provenance/verify">Verify Provenance</Link></li>
              <li><Link to="/provenance/issue-certificate">Issue Certificate</Link></li>
              <li><Link to="/provenance/registry">Issuer Registry</Link></li>
            </ul>
          </div>

          {/* Training & Resources */}
          <div className="footer-section">
            <h4>Verification Tools</h4>
            <ul className="footer-links">
              <li><Link to="/resources#media-analysis-tools">Media Analysis</Link></li>
              <li><Link to="/single">Single Image</Link></li>
              <li><Link to="/batch">Batch Images</Link></li>
              <li><Link to="/videos">Video Analysis</Link></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="footer-section">
            <h4>Trust Center</h4>
            <ul className="footer-links">
              <li><a href="/ns-stego/AUDIT_LOGGING/index.html">Audit Logging</a></li>
              <li><a href="/ns-stego/KEY_MANAGEMENT/index.html">Key Management</a></li>
              <li><a href="/ns-stego/PRODUCTION_READINESS/index.html">Production Readiness</a></li>
              <li><a href="/ns-stego/QA/index.html">QA & Verification</a></li>
            </ul>
          </div>

          {/* Trust & Verification */}
          <div className="footer-section">
            <h4>Assurance</h4>
            <div className="trust-badges">
              <div className="trust-item">SSL secured</div>
              <div className="trust-item">Audit ready</div>
              <div className="trust-item">Legal compliance</div>
              <div className="trust-item">Evidence integrity</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - matches navbar styling */}
        <div className="footer-bottom">
          <div className="footer-legal">
            <span>&copy; {new Date().getFullYear()} VeriForensic. Provenance-First Media Trust.</span>
            <div className="legal-links">
              <Link to="/privacy" onClick={scrollToTop}>Evidence Privacy</Link>
              <Link to="/terms" onClick={scrollToTop}>Terms of Service</Link>
              <Link to="/compliance" onClick={scrollToTop}>Compliance</Link>
            </div>
          </div>
          
          {/* Forensic Certification Notice */}
          <div className="forensic-notice">
            <small>
              Cryptographic provenance. Evidence-grade audit trails. Verification workflows for high-trust environments.
            </small>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
