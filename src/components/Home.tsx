import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Provenance-First Media Trust</h1>
          <p className="hero-subtitle">
            Embed cryptographic provenance at creation time and verify authenticity with confidence. 
            When the chain is verifiable, the truth is provable.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">A4+</span>
              <span className="stat-label">Proof Formats</span>
            </div>
            <div className="stat">
              <span className="stat-number">2nd</span>
              <span className="stat-label">Layer of Trust</span>
            </div>
            <div className="stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">Verifiable Integrity</span>
            </div>
          </div>
          <div className="cta-buttons">
            <a href="/ns-stego/" className="cta-button primary">
              Explore Provenance Docs
            </a>
            <Link to="/resources" className="cta-button secondary">
              Analyze Media (Optional)
            </Link>
          </div>
          <p className="cta-note">Embed provenance • Verify authenticity • Audit with confidence</p>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="value-section">
        <div className="value-content">
          <h2>Provenance Infrastructure for Real-World Trust</h2>
          <p className="value-description">
            Detection is important, but provenance is foundational. We embed cryptographic proof at the 
            source and provide verification pipelines that scale across teams, gateways, and workflows.
          </p>
          
          <div className="value-grid">
            <div className="value-card">
              <div className="value-icon">🔏</div>
              <h3>Embed Provenance</h3>
              <p>Cryptographically embed proof into images, documents, and emails at creation time.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🧾</div>
              <h3>Audit-Ready Verification</h3>
              <p>Verify authenticity with tamper-evident logs, chain-of-custody, and evidence-grade reporting.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🧪</div>
              <h3>Detection as a Backstop</h3>
              <p>AI detection remains available for unprovenanced media and legacy workflows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="trust-section">
        <div className="trust-content">
          <h2>Designed for High-Trust Workflows</h2>
          <div className="trust-grid">
            {/* News & Media */}
            <div className="trust-item media-outlet">
              <div className="trust-icon">📰</div>
              <h4>News Organizations</h4>
              <p>Used as a preliminary screening tool for user-generated content and social media verification before human fact-checking.</p>
              
              <div className="compliance-grid">
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Preliminary Screening</span>
                </div>
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Workflow Integration</span>
                </div>
              </div>
              
              <div className="use-cases">
                <span className="use-case">Social Media Verification</span>
                <span className="use-case">Breaking News</span>
                <span className="use-case">Source Checking</span>
              </div>
            </div>

            {/* Academic Research */}
            <div className="trust-item education-institution">
              <div className="trust-icon">🎓</div>
              <h4>Research Institutions</h4>
              <p>Researchers validate provenance protocols, steganographic embedding, and cryptographic verification at scale.</p>
              
              <div className="compliance-grid">
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Provenance Research</span>
                </div>
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Cryptographic Validation</span>
                </div>
              </div>
              
              <div className="use-cases">
                <span className="use-case">Stego Evaluation</span>
                <span className="use-case">Protocol Benchmarking</span>
                <span className="use-case">Audit Datasets</span>
              </div>
            </div>

            {/* Content Creators */}
            <div className="trust-item content-agency">
              <div className="trust-icon">🎬</div>
              <h4>Content Creators</h4>
              <p>Creative professionals verify outsourced content and maintain brand consistency across digital media assets.</p>
              
              <div className="compliance-grid">
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Brand Consistency</span>
                </div>
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Quality Control</span>
                </div>
              </div>
              
              <div className="use-cases">
                <span className="use-case">Asset Verification</span>
                <span className="use-case">Quality Assurance</span>
                <span className="use-case">Workflow Checks</span>
              </div>
            </div>

            {/* Legal & Insurance */}
            <div className="trust-item legal-firm">
              <div className="trust-icon">⚖️</div>
              <h4>Legal & Insurance</h4>
              <p>Evidence-grade provenance and tamper-evident logs support chain-of-custody and claims verification.</p>
              
              <div className="compliance-grid">
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Chain of Custody</span>
                </div>
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Audit-Ready Proof</span>
                </div>
              </div>
              
              <div className="use-cases">
                <span className="use-case">Evidence Validation</span>
                <span className="use-case">Claims Integrity</span>
                <span className="use-case">Disclosure Support</span>
              </div>
            </div>

            {/* Enterprise Security */}
            <div className="trust-item enterprise-client">
              <div className="trust-icon">🏢</div>
              <h4>Corporate Security</h4>
              <p>Encrypt provenance signals, embed stego proofs, and verify assets across internal security workflows.</p>
              
              <div className="compliance-grid">
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Asset Integrity</span>
                </div>
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Gateway Verification</span>
                </div>
              </div>
              
              <div className="use-cases">
                <span className="use-case">Secure Asset Trails</span>
                <span className="use-case">Encrypted Proofs</span>
                <span className="use-case">Risk Controls</span>
              </div>
            </div>

            {/* Government & NGOs */}
            <div className="trust-item government-agency">
              <div className="trust-icon">🏛️</div>
              <div className="security-clearance">MEDIA VERIFICATION</div>
              <h4>Government & NGOs</h4>
              <p>Provenance-backed verification and steganographic seals for sensitive communications and public trust.</p>
              
              <div className="compliance-grid">
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Operational Integrity</span>
                </div>
                <div className="compliance-item">
                  <span className="checkmark">✅</span>
                  <span>Verified Distribution</span>
                </div>
              </div>
              
              <div className="use-cases">
                <span className="use-case">Trusted Broadcasts</span>
                <span className="use-case">Stego Seals</span>
                <span className="use-case">Crisis Communications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Start Your Media Analysis Journey</h2>
          <p>Join professionals who use our tools as part of their comprehensive media verification workflow</p>
          <div className="cta-buttons">
            <Link to="/resources" className="cta-button primary">
              Try Analysis Tools
            </Link>
            <Link to="/pricing" className="cta-button secondary">
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
