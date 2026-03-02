import React from 'react';

const Compliance: React.FC = () => {
  return (
    <div className="legal-page">
      <h1>Compliance</h1>
      <p className="legal-intro">
        VeriForensic is designed for high-trust workflows that require verifiable authenticity,
        auditability, and defensible evidence handling.
      </p>

      <section>
        <h2>Auditability</h2>
        <p>
          Provenance workflows generate evidence-grade logs and verifiable references to support
          audits, investigations, and regulatory reviews.
        </p>
      </section>

      <section>
        <h2>Security Practices</h2>
        <p>
          We use cryptographic verification mechanisms, access controls, and operational monitoring
          to protect data and maintain integrity.
        </p>
      </section>

      <section>
        <h2>Data Handling</h2>
        <p>
          We apply data minimization principles and limit retention to operational and compliance
          needs. Access to evidence logs is restricted to authorized users.
        </p>
      </section>

      <section>
        <h2>Responsible Use</h2>
        <p>
          Customers are responsible for using verification results within their own compliance
          programs and legal requirements.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For compliance inquiries, contact support@veriforensic.com.
        </p>
      </section>

      <section>
        <h2>Last Updated</h2>
        <p>March 2, 2026</p>
      </section>
    </div>
  );
};

export default Compliance;
