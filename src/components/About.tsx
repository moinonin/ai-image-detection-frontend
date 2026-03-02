import React from 'react';

const About: React.FC = () => {
  return (
    <div className="about">
      <h1>About VeriForensic</h1>
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

export default About;
