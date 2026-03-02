import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
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
            <div className="social-links">
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="LinkedIn">💼</a>
              <a href="#" aria-label="GitHub">🔗</a>
            </div>
          </div>

          {/* Investigation Tools */}
          <div className="footer-section">
            <h4>Provenance</h4>
            <ul className="footer-links">
              <li><a href="/ns-stego/">Docs Home</a></li>
              <li><a href="/ns-stego/SPEC/">SPEC</a></li>
              <li><a href="/ns-stego/API_SPEC/">API Spec</a></li>
              <li><a href="/ns-stego/DEPLOYMENT/">Deployment Guide</a></li>
            </ul>
          </div>

          {/* Training & Resources */}
          <div className="footer-section">
            <h4>Verification Tools</h4>
            <ul className="footer-links">
              <li><Link to="/resources">Media Analysis</Link></li>
              <li><Link to="/single">Single Image</Link></li>
              <li><Link to="/batch">Batch Images</Link></li>
              <li><Link to="/video">Video Analysis</Link></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="footer-section">
            <h4>Trust Center</h4>
            <ul className="footer-links">
              <li><a href="/ns-stego/AUDIT_LOGGING/">Audit Logging</a></li>
              <li><a href="/ns-stego/KEY_MANAGEMENT/">Key Management</a></li>
              <li><a href="/ns-stego/PRODUCTION_READINESS/">Production Readiness</a></li>
              <li><a href="/ns-stego/QA/">QA & Verification</a></li>
            </ul>
          </div>

          {/* Trust & Verification */}
          <div className="footer-section">
            <h4>Assurance</h4>
            <div className="trust-badges">
              <div className="trust-item">🔒 SSL Secured</div>
              <div className="trust-item">📊 Audit Ready</div>
              <div className="trust-item">⚖️ Legal Compliance</div>
              <div className="trust-item">🔍 Evidence Integrity</div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - matches navbar styling */}
        <div className="footer-bottom">
          <div className="footer-legal">
            <span>&copy; {new Date().getFullYear()} VeriForensic. Provenance-First Media Trust.</span>
            <div className="legal-links">
              <Link to="/privacy">Evidence Privacy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/compliance">Compliance</Link>
            </div>
          </div>
          
          {/* Forensic Certification Notice */}
          <div className="forensic-notice">
            <small>
              🔍 Cryptographic provenance • Evidence-grade audit trails • 
              Verification workflows designed for high-trust environments
            </small>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
