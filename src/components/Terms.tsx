import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="legal-page">
      <h1>Terms of Service</h1>
      <p className="legal-intro">
        These Terms of Service govern your access to and use of VeriForensic. By accessing or using
        the service, you agree to be bound by these terms.
      </p>

      <section>
        <h2>Service Description</h2>
        <p>
          VeriForensic provides tools for cryptographic provenance embedding, verification, and
          optional media analysis. Outputs are provided for informational and verification workflows.
        </p>
      </section>

      <section>
        <h2>Acceptable Use</h2>
        <p>
          You may not use the service for unlawful purposes, to infringe third-party rights, to
          disrupt systems, or to misrepresent verification results.
        </p>
      </section>

      <section>
        <h2>Accounts and Access</h2>
        <p>
          You are responsible for maintaining the confidentiality of your credentials and for all
          activity that occurs under your account.
        </p>
      </section>

      <section>
        <h2>Limitations and Disclaimer</h2>
        <p>
          Verification results are provided “as is” and without warranty. No automated system
          guarantees accuracy for every scenario. You should combine results with professional
          judgment and applicable policies.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms to reflect service changes. Continued use after updates constitutes
          acceptance of the revised terms.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to support@veriforensic.com.
        </p>
      </section>

      <section>
        <h2>Last Updated</h2>
        <p>March 2, 2026</p>
      </section>
    </div>
  );
};

export default Terms;
