import React from 'react';

const Team: React.FC = () => {
  return (
    <div className="about">
      <h1>Veriforensic Team</h1>
      
      <div className="team-profiles" style={{ 
        display: 'flex', 
        gap: '3rem', 
        justifyContent: 'center', 
        margin: '3rem auto', 
        flexWrap: 'wrap',
        maxWidth: '1000px'
      }}>
        {/* Profile 1 */}
        <div className="team-member" style={{ textAlign: 'center', maxWidth: '300px' }}>
          <div style={{ 
            width: '180px', 
            height: '180px', 
            borderRadius: '50%', 
            background: 'var(--vf-surface)', 
            border: '4px solid var(--vf-border)',
            margin: '0 auto 1.5rem', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'linear-gradient(135deg, var(--vf-blue) 0%, #0043ce 100%)' 
            }}></div>
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--vf-text)' }}> Jane Doe</h3>
          <p style={{ color: 'var(--vf-blue)', fontWeight: '600', margin: '0 0 1rem' }}>
            Ph.D. in Computer Science
          </p>
          <p style={{ color: 'var(--vf-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Lead Cryptographer specializing in secure multi-party computation and media provenance.
          </p>
        </div>
        
        {/* Profile 2 */}
        <div className="team-member" style={{ textAlign: 'center', maxWidth: '300px' }}>
          <div style={{ 
            width: '180px', 
            height: '180px', 
            borderRadius: '50%', 
            background: 'var(--vf-surface)', 
            border: '4px solid var(--vf-border)',
            margin: '0 auto 1.5rem', 
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src="/nr-profile.jpg" 
              alt="Nick Rotich" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--vf-text)' }}>Nick Rotich</h3>
          <p style={{ color: 'var(--vf-blue)', fontWeight: '600', margin: '0 0 1rem' }}>
            M.S. in Machine Learning
          </p>
          <p style={{ color: 'var(--vf-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            AI Research Director focused on adversarial forensics and generative model detection.
          </p>
        </div>
      </div>

      <div className="about-content">
        <section>
          <h2>Our Mission</h2>
          <p>
            VeriForensic is building a provenance-first trust layer for digital media. 
            We embed cryptographic proof at the source and verify authenticity across 
            workflows, gateways, and audit trails.
          </p>
        </section>

        <section>
          <h2>Our Commitment to Trust</h2>
          <div className="trust-principles">
            <div className="principle">
              <h3>Transparency</h3>
              <p>
                We believe you deserve to understand how proof is embedded and verified. 
                Our protocols are documented and our limitations are clearly stated.
              </p>
            </div>
            <div className="principle">
              <h3>Accuracy</h3>
              <p>
                We continuously validate cryptographic verification paths and update 
                our systems as new threats and manipulation techniques emerge.
              </p>
            </div>
            <div className="principle">
              <h3>Privacy</h3>
              <p>
                Your content is processed with strict confidentiality. 
                We prioritize minimal data exposure and evidence-grade logging.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p className="contact-intro">
            Have questions about our technology or concerns about digital content?
            We're here to help.
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> support@veriforensic.com</p>
            <p><strong>Phone:</strong> +44 (748) 216-8597</p>
            <p><strong>Address:</strong> 731, Sewal Highway, CV6 7JN</p>
            <p><strong>City:</strong> Coventry, United Kingdom</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Team;
