import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="legal-page">
      <h1>Terms of Service</h1>
      <p className="legal-intro">
        By using VeriForensic, you agree to these terms. If you do not agree, do not use the service.
      </p>

      <section>
        <h2>Service Description</h2>
        <p>
          VeriForensic provides tools for cryptographic provenance embedding, verification, and
          optional media analysis. Results are provided for informational and verification workflows.
        </p>
      </section>

      <section>
        <h2>Acceptable Use</h2>
        <p>
          You may not use the service for unlawful purposes, to violate third-party rights, or to
          disrupt systems or misuse verification results.
        </p>
      </section>

      <section>
        <h2>Accounts and Access</h2>
        <p>
          You are responsible for maintaining the security of your account credentials and for all
          activity associated with your account.
        </p>
      </section>

      <section>
        <h2>Limitations</h2>
        <p>
          Verification results are provided without warranty. No automated system guarantees accuracy
          for every scenario. You should combine results with professional judgment.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms to reflect service changes. Continued use constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to support@veriforensic.com.
        </p>
      </section>
    </div>
  );
};

export default Terms;
