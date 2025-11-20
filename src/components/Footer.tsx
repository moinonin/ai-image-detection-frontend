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
              Empowering digital truth through advanced forensic verification. 
              Trust the process, verify the evidence.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="LinkedIn">💼</a>
              <a href="#" aria-label="GitHub">🔗</a>
            </div>
          </div>

          {/* Investigation Tools */}
          <div className="footer-section">
            <h4>Forensic Tools</h4>
            <ul className="footer-links">
              <li><Link to="/tools/hash-verification">Hash Verification</Link></li>
              <li><Link to="/tools/metadata-analysis">Metadata Analysis</Link></li>
              <li><Link to="/tools/digital-timeline">Digital Timeline</Link></li>
              <li><Link to="/tools/evidence-tracker">Evidence Tracker</Link></li>
            </ul>
          </div>

          {/* Training & Resources */}
          <div className="footer-section">
            <h4>Forensic Resources</h4>
            <ul className="footer-links">
              <li><Link to="/resources/verification-guides">Verification Guides</Link></li>
              <li><Link to="/resources/case-studies">Case Studies</Link></li>
              <li><Link to="/resources/forensic-standards">Forensic Standards</Link></li>
              <li><Link to="/resources/compliance">Compliance Docs</Link></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="footer-section">
            <h4>Legal & Support</h4>
            <ul className="footer-links">
              <li><Link to="/forensic-standards">Chain of Custody</Link></li>
              <li><Link to="/expert-testimony">Expert Testimony</Link></li>
              <li><Link to="/support">Forensic Support</Link></li>
              <li><Link to="/certification">Certification</Link></li>
            </ul>
          </div>

          {/* Trust & Verification */}
          <div className="footer-section">
            <h4>Trust Center</h4>
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
            <span>&copy; {new Date().getFullYear()} VeriForensic. Digital Evidence Verification Platform.</span>
            <div className="legal-links">
              <Link to="/privacy">Evidence Privacy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/compliance">Compliance</Link>
            </div>
          </div>
          
          {/* Forensic Certification Notice */}
          <div className="forensic-notice">
            <small>
              🔍 Certified Digital Forensics Platform • Adheres to ISO 27037 standards • 
              All verification processes maintain legal chain of custody
            </small>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;