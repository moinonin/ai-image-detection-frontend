import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="legal-page">
      <h1>Evidence Privacy</h1>
      <p className="legal-intro">
        This Evidence Privacy Notice explains how VeriForensic collects, uses, and protects
        information in connection with provenance embedding, verification, and related services.
      </p>

      <section>
        <h2>Information We Collect</h2>
        <p>
          We collect information you provide (such as name, email address, and account credentials),
          operational metadata required to deliver the service, and communications you send to support.
        </p>
      </section>

      <section>
        <h2>Media Handling</h2>
        <p>
          Media is processed solely for verification and provenance workflows. We do not sell media
          content. Where auditability is required, we retain only the minimum metadata necessary to
          verify integrity.
        </p>
      </section>

      <section>
        <h2>Cryptographic Provenance</h2>
        <p>
          Provenance data is embedded to enable authenticity verification. This may include
          cryptographic proofs and audit references designed to allow verification without exposing
          underlying content.
        </p>
      </section>

      <section>
        <h2>Data Retention</h2>
        <p>
          Retention is limited to operational needs and compliance requirements. You may request
          deletion of account data unless retention is required by law or audit obligations.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about privacy can be sent to support@veriforensic.com.
        </p>
      </section>

      <section>
        <h2>Last Updated</h2>
        <p>March 2, 2026</p>
      </section>
    </div>
  );
};

export default Privacy;
