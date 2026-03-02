import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="legal-page">
      <h1>Evidence Privacy</h1>
      <p className="legal-intro">
        VeriForensic provides provenance-first verification. We minimize data exposure and
        store only what is required to deliver verification results and auditability.
      </p>

      <section>
        <h2>What We Collect</h2>
        <p>
          We collect account details you provide during registration, operational metadata
          required to deliver the service, and optional support communications you send us.
        </p>
      </section>

      <section>
        <h2>How Media Is Handled</h2>
        <p>
          Media is processed for verification. We do not sell media content. Where provenance
          requires evidence logs, we store only the minimum metadata necessary to verify integrity.
        </p>
      </section>

      <section>
        <h2>Cryptographic Provenance</h2>
        <p>
          Provenance data is embedded to support authenticity verification. This can include
          cryptographic proofs and audit references that enable verification without exposing content.
        </p>
      </section>

      <section>
        <h2>Data Retention</h2>
        <p>
          Retention is limited to operational needs and compliance requirements. You can request
          deletion of account data unless retention is required by law or audit obligations.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about privacy can be sent to support@veriforensic.com.
        </p>
      </section>
    </div>
  );
};

export default Privacy;
