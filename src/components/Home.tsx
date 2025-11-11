import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Where Cutting-Edge Technology Meets Uncompromising Due Diligence</h1>
          <p className="hero-subtitle">
            Enterprise-grade AI content analysis at startup prices. Get military-grade accuracy 
            without the enterprise price tag.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">99.7%</span>
              <span className="stat-label">Accuracy Rate</span>
            </div>
            <div className="stat">
              <span className="stat-number">10x</span>
              <span className="stat-label">More Affordable</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Real-time Analysis</span>
            </div>
          </div>
          <Link to="/resources" className="cta-button">
            Start Analyzing Free
          </Link>
          <p className="cta-note">No credit card required • First 100 analyses free</p>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="value-section">
        <div className="value-content">
          <h2>Professional-Grade Detection, Surprisingly Affordable</h2>
          <p className="value-description">
            Why pay enterprise prices when you can get the same military-grade AI detection 
            technology for a fraction of the cost? We've democratized access to cutting-edge 
            content analysis without compromising on quality or accuracy.
          </p>
          
          <div className="value-grid">
            <div className="value-card">
              <div className="value-icon">💰</div>
              <h3>Transparent Pricing</h3>
              <p>No hidden fees, no surprise charges. Pay only for what you use with our straightforward pricing model.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Get results in seconds, not hours. Our optimized infrastructure delivers rapid analysis without delays.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🛡️</div>
              <h3>Enterprise Security</h3>
              <p>Bank-level encryption and privacy protection for all your sensitive documents and content.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
        {/* Trust Indicators */}
        <section className="trust-section">
        <div className="trust-content">
            <h2>Trusted by Industry Leaders Worldwide</h2>
            <div className="trust-grid">
            {/* Educational Institutions */}
            <div className="trust-item education-institution">
                <div className="trust-icon">🎓</div>
                <h4>Educational Institutions</h4>
                <p>Universities and schools leverage our AI detection for academic integrity, plagiarism prevention, and research validation across all disciplines.</p>
                
                <div className="compliance-grid">
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>FERPA Compliant</span>
                </div>
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>LMS Integration</span>
                </div>
                </div>
                
                <div className="use-cases">
                <span className="use-case">Academic Integrity</span>
                <span className="use-case">Research Validation</span>
                <span className="use-case">Plagiarism Detection</span>
                </div>
            </div>

            {/* Content Agencies */}
            <div className="trust-item content-agency">
                <div className="trust-icon">🎬</div>
                <h4>Content Agencies</h4>
                <p>Creative agencies and marketing firms utilize our tools for content authenticity verification, brand safety, and creative asset protection.</p>
                
                <div className="compliance-grid">
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>Brand Safety</span>
                </div>
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>Copyright Protection</span>
                </div>
                </div>
                
                <div className="use-cases">
                <span className="use-case">Content Verification</span>
                <span className="use-case">Brand Safety</span>
                <span className="use-case">Asset Protection</span>
                </div>
            </div>

            {/* Legal Firms */}
            <div className="trust-item legal-firm">
                <div className="trust-icon">⚖️</div>
                <h4>Legal Firms</h4>
                <p>Law firms and legal departments depend on our forensic analysis for evidence authentication, document verification, and due diligence.</p>
                
                <div className="compliance-grid">
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>eDiscovery Ready</span>
                </div>
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>Legal Chain of Custody</span>
                </div>
                </div>
                
                <div className="use-cases">
                <span className="use-case">Evidence Authentication</span>
                <span className="use-case">Document Verification</span>
                <span className="use-case">Due Diligence</span>
                </div>
            </div>

            {/* Enterprise Clients */}
            <div className="trust-item enterprise-client">
                <div className="trust-icon">🏢</div>
                <h4>Enterprise Clients</h4>
                <p>Fortune 500 companies rely on our enterprise-grade security, compliance frameworks, and scalable AI detection for global operations.</p>
                
                <div className="compliance-grid">
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>SOC 2 Type II</span>
                </div>
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>GDPR Compliant</span>
                </div>
                </div>
                
                <div className="use-cases">
                <span className="use-case">Global Compliance</span>
                <span className="use-case">Risk Management</span>
                <span className="use-case">Scalable Security</span>
                </div>
            </div>

            {/* Government Agencies */}
            <div className="trust-item government-agency">
                <div className="trust-icon">🏛️</div>
                <div className="security-clearance">TOP SECRET // REL TO USA</div>
                <h4>Government & Defense</h4>
                <p>Classified document verification, intelligence analysis, and secure communications monitoring for federal agencies and defense contractors.</p>
                
                <div className="compliance-grid">
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>FISMA High Compliant</span>
                </div>
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>DoD IL4 Ready</span>
                </div>
                </div>
                
                <div className="use-cases">
                <span className="use-case">Document Authentication</span>
                <span className="use-case">Intelligence Analysis</span>
                <span className="use-case">Secure Comms</span>
                </div>
            </div>

            {/* New Media Outlets */}
            <div className="trust-item media-outlet">
                <div className="trust-icon">📰</div>
                <h4>News Media Outlets</h4>
                <p>Digital publishers and news organizations use our real-time verification for breaking news, deepfake detection, and content authenticity.</p>
                
                <div className="compliance-grid">
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>Real-time Verification</span>
                </div>
                <div className="compliance-item">
                    <span className="checkmark">✅</span>
                    <span>Deepfake Detection</span>
                </div>
                </div>
                
                <div className="use-cases">
                <span className="use-case">Breaking News</span>
                <span className="use-case">Content Authenticity</span>
                <span className="use-case">Fact Checking</span>
                </div>
                
                <div className="media-badges">
                <span className="badge live">LIVE VERIFICATION</span>
                <span className="badge breaking">BREAKING NEWS</span>
                </div>
            </div>
            </div>
        </div>
        </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to Experience Professional AI Detection?</h2>
          <p>Join thousands of satisfied users who trust AIDetect for their content analysis needs</p>
          <div className="cta-buttons">
            <Link to="/resources" className="cta-button primary">
              Start Free Trial
            </Link>
            <Link to="/pricing" className="cta-button secondary">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;