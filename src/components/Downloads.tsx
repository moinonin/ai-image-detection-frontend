import React from 'react';

const SyntaxCodeBlock: React.FC<{ tokens: { text: string; type: string }[] }> = ({ tokens }) => {
  const getColor = (type: string) => {
    switch (type) {
      case 'keyword': return '#c678dd';
      case 'class': return '#e5c07b';
      case 'function': return '#61afef';
      case 'string': return '#98c379';
      case 'comment': return '#5c6370';
      case 'variable': return '#e06c75';
      case 'arg': return '#d19a66';
      case 'punct': return '#abb2bf';
      default: return '#abb2bf';
    }
  };

  return (
    <pre style={{
      background: '#282c34',
      padding: '20px',
      borderRadius: '8px',
      overflowX: 'auto',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: '14px',
      lineHeight: '1.5',
      marginTop: '20px',
      boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.2)'
    }}>
      <code>
        {tokens.map((t, i) => (
          <span key={i} style={{ color: getColor(t.type) }}>{t.text}</span>
        ))}
      </code>
    </pre>
  );
};

const imageClassificatonSnippet = [
  { text: 'from ', type: 'keyword' },
  { text: 'veriforensic ', type: 'default' },
  { text: 'import ', type: 'keyword' },
  { text: 'Client\n\n', type: 'class' },
  { text: '# Initialize the client\n', type: 'comment' },
  { text: 'client', type: 'variable' },
  { text: ' = ', type: 'punct' },
  { text: 'Client', type: 'class' },
  { text: '(', type: 'punct' },
  { text: 'token', type: 'arg' },
  { text: '=', type: 'punct' },
  { text: '"YOUR_BEARER_TOKEN"', type: 'string' },
  { text: ')\n\n', type: 'punct' },
  { text: '# Perform single image classification\n', type: 'comment' },
  { text: 'result', type: 'variable' },
  { text: ' = ', type: 'punct' },
  { text: 'client', type: 'variable' },
  { text: '.', type: 'punct' },
  { text: 'classify_image', type: 'function' },
  { text: '(\n    ', type: 'punct' },
  { text: 'image_path', type: 'arg' },
  { text: '=', type: 'punct' },
  { text: '"evidence.jpg"', type: 'string' },
  { text: ',\n    ', type: 'punct' },
  { text: 'model_type', type: 'arg' },
  { text: '=', type: 'punct' },
  { text: '"ml"', type: 'string' },
  { text: '\n)\n', type: 'punct' },
  { text: 'print', type: 'function' },
  { text: '(', type: 'punct' },
  { text: 'result', type: 'variable' },
  { text: ')', type: 'punct' },
];

const stegoSnippet = [
  { text: 'from ', type: 'keyword' },
  { text: 'client ', type: 'default' },
  { text: 'import ', type: 'keyword' },
  { text: 'NicryptStegoClient\n\n', type: 'class' },
  { text: '# Initialize the stego client\n', type: 'comment' },
  { text: 'c', type: 'variable' },
  { text: ' = ', type: 'punct' },
  { text: 'NicryptStegoClient', type: 'class' },
  { text: '(\n    ', type: 'punct' },
  { text: 'base_url', type: 'arg' },
  { text: '=', type: 'punct' },
  { text: '"https://api.veriforensic.com/v1"', type: 'string' },
  { text: ',\n    ', type: 'punct' },
  { text: 'token', type: 'arg' },
  { text: '=', type: 'punct' },
  { text: '"YOUR_JWT"', type: 'string' },
  { text: '\n)\n\n', type: 'punct' },
  { text: '# Fetch provenance verdict\n', type: 'comment' },
  { text: 'resp', type: 'variable' },
  { text: ' = ', type: 'punct' },
  { text: 'c', type: 'variable' },
  { text: '.', type: 'punct' },
  { text: 'provenance_verdict', type: 'function' },
  { text: '(', type: 'punct' },
  { text: 'headers', type: 'arg' },
  { text: '=', type: 'punct' },
  { text: '{', type: 'punct' },
  { text: '"From"', type: 'string' },
  { text: ': ', type: 'punct' },
  { text: '"sender@example.com"', type: 'string' },
  { text: '})\n', type: 'punct' },
  { text: 'print', type: 'function' },
  { text: '(', type: 'punct' },
  { text: 'resp', type: 'variable' },
  { text: ')', type: 'punct' },
];

const Downloads: React.FC = () => {
  const emailVerifierDownloads = [
    {
      title: 'Gmail Extension',
      icon: '✉️',
      description: 'Verifier package for Gmail users who need provenance checks inside webmail workflows.',
      filename: 'gmail-extension.zip',
      href: '/downloads/addons/gmail-extension.zip',
      button: 'Download Gmail Extension',
      color: '#0ea5e9',
      hoverColor: '#0284c7',
    },
    {
      title: 'Outlook Add-in',
      icon: '📨',
      description: 'Verifier add-in package for Outlook-based review and recipient workflows.',
      filename: 'outlook-addin.zip',
      href: '/downloads/addons/outlook-addin.zip',
      button: 'Download Outlook Add-in',
      color: '#2563eb',
      hoverColor: '#1d4ed8',
    },
    {
      title: 'Thunderbird Add-on',
      icon: '🧩',
      description: 'Installable Thunderbird add-on package for local email provenance verification.',
      filename: 'thunderbird-addon.xpi',
      href: '/downloads/addons/thunderbird-addon.xpi',
      button: 'Download Thunderbird Add-on',
      color: '#7c3aed',
      hoverColor: '#6d28d9',
    },
  ];

  return (
    <div className="downloads-page" style={{ padding: '60px 40px', maxWidth: '1000px', margin: '0 auto', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Downloads</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Download the latest VeriForensic client SDKs and tools to integrate advanced provenance verification and AI detection into your workflows.
        </p>
        <div style={{ display: 'inline-block', background: '#fef3c7', color: '#b45309', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500', marginTop: '20px' }}>
          ⚠️ Please Note: These SDKs are currently provided for Python explicitly.
        </div>
      </div>

      <div style={{ marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.8rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '30px', color: '#1e293b' }}>Image Classification API Client</h2>
        <p style={{ color: '#475569', marginBottom: '20px', fontSize: '1.05rem', lineHeight: '1.6' }}>The official Python library for securely interacting with the VeriForensic public classification APIs. Process single images, multi-image batches, and video files directly securely.</p>
        
        <div className="downloads-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
        }}>
          {/* veriforensic_client whl */}
          <div className="download-card" style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', marginRight: '15px' }}>📦</span>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>Python Wheel</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5', flexGrow: 1 }}>
              Pre-compiled binary package. Fastest way to install the classification client.
            </p>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', background: '#f8fafc', color: '#334155', padding: '12px', borderRadius: '6px', marginBottom: '25px', wordBreak: 'break-all', border: '1px solid #e2e8f0' }}>
              veriforensic_client-0.1.0-py3-none-any.whl
            </div>
            <a
              href="/downloads/veriforensic_client-0.1.0-py3-none-any.whl"
              download
              className="download-btn"
              style={{
                display: 'inline-block',
                background: '#0ea5e9',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                width: '100%',
                textAlign: 'center',
                transition: 'background 0.2s',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#0284c7'}
              onMouseOut={(e) => e.currentTarget.style.background = '#0ea5e9'}
            >
              Download Wheel
            </a>
          </div>

           {/* veriforensic_client tar.gz */}
          <div className="download-card" style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', marginRight: '15px' }}>🗜️</span>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>Source Tarball</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5', flexGrow: 1 }}>
              Source archive containing the original code. Use this to audit the classification wrapper.
            </p>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', background: '#f8fafc', color: '#334155', padding: '12px', borderRadius: '6px', marginBottom: '25px', wordBreak: 'break-all', border: '1px solid #e2e8f0' }}>
              veriforensic_client-0.1.0.tar.gz
            </div>
            <a
              href="/downloads/veriforensic_client-0.1.0.tar.gz"
              download
              className="download-btn"
              style={{
                display: 'inline-block',
                background: '#4f46e5',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                width: '100%',
                textAlign: 'center',
                transition: 'background 0.2s',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#4338ca'}
              onMouseOut={(e) => e.currentTarget.style.background = '#4f46e5'}
            >
              Download Tarball
            </a>
          </div>
        </div>
        
        <div style={{ marginTop: '30px', padding: '30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Image Classification Client Usage
          </h4>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569' }}>Install via pip locally or into your virtual environment:</p>
          <code style={{ background: '#e2e8f0', color: '#0f172a', padding: '6px 10px', borderRadius: '4px', fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}>pip install veriforensic_client-0.1.0-py3-none-any.whl</code>
          
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569' }}>Quick start snippet:</p>
          <SyntaxCodeBlock tokens={imageClassificatonSnippet} />
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.8rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '30px', color: '#1e293b' }}>Steganography Detection Client</h2>
        <p style={{ color: '#475569', marginBottom: '20px', fontSize: '1.05rem', lineHeight: '1.6' }}>A specialized client to help you securely search for cryptographic steganographical signatures hidden within digital files.</p>
        
        <div className="downloads-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
        }}>
          {/* nicrypt_stego_client-0.1.0-py3-none-any.whl */}
          <div className="download-card" style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', marginRight: '15px' }}>📦</span>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>Python Wheel</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5', flexGrow: 1 }}>
              Pre-compiled binary package. Easiest way to integrate steganography detection.
            </p>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', background: '#f8fafc', color: '#334155', padding: '12px', borderRadius: '6px', marginBottom: '25px', wordBreak: 'break-all', border: '1px solid #e2e8f0' }}>
              nicrypt_stego_client-0.1.0-py3-none-any.whl
            </div>
            <a
              href="/downloads/nicrypt_stego_client-0.1.0-py3-none-any.whl"
              download
              className="download-btn"
              style={{
                display: 'inline-block',
                background: '#059669',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                width: '100%',
                textAlign: 'center',
                transition: 'background 0.2s',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#047857'}
              onMouseOut={(e) => e.currentTarget.style.background = '#059669'}
            >
              Download Wheel
            </a>
          </div>

          {/* nicrypt_stego_client-0.1.0.tar.gz */}
          <div className="download-card" style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px', marginRight: '15px' }}>🗜️</span>
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>Source Tarball</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5', flexGrow: 1 }}>
              Source archive containing the original code. Audit internal implementation locally.
            </p>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', background: '#f8fafc', color: '#334155', padding: '12px', borderRadius: '6px', marginBottom: '25px', wordBreak: 'break-all', border: '1px solid #e2e8f0' }}>
              nicrypt_stego_client-0.1.0.tar.gz
            </div>
            <a
              href="/downloads/nicrypt_stego_client-0.1.0.tar.gz"
              download
              className="download-btn"
              style={{
                display: 'inline-block',
                background: '#0d9488',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                width: '100%',
                textAlign: 'center',
                transition: 'background 0.2s',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#0f766e'}
              onMouseOut={(e) => e.currentTarget.style.background = '#0d9488'}
            >
              Download Tarball
            </a>
          </div>
        </div>
        
        <div style={{ marginTop: '30px', padding: '30px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Steganography Detection Usage
          </h4>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569' }}>Install via pip locally or into your virtual environment:</p>
          <code style={{ background: '#e2e8f0', color: '#0f172a', padding: '6px 10px', borderRadius: '4px', fontSize: '13px', display: 'inline-block', marginBottom: '20px' }}>pip install nicrypt_stego_client-0.1.0-py3-none-any.whl</code>
          
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569' }}>Quick start snippet:</p>
          <SyntaxCodeBlock tokens={stegoSnippet} />
        </div>
      </div>

      <div style={{ marginTop: '80px' }}>
        <h2 style={{ fontSize: '1.8rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '30px', color: '#1e293b' }}>Email Verifier Extensions</h2>
        <p style={{ color: '#475569', marginBottom: '20px', fontSize: '1.05rem', lineHeight: '1.6' }}>Download recipient-side verifier packages for email provenance checks in common mailbox clients.</p>

        <div className="downloads-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
        }}>
          {emailVerifierDownloads.map((item) => (
            <div key={item.filename} className="download-card" style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px', marginRight: '15px' }}>{item.icon}</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>{item.title}</h3>
              </div>
              <p style={{ color: '#475569', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5', flexGrow: 1 }}>
                {item.description}
              </p>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', background: '#f8fafc', color: '#334155', padding: '12px', borderRadius: '6px', marginBottom: '25px', wordBreak: 'break-all', border: '1px solid #e2e8f0' }}>
                {item.filename}
              </div>
              <a
                href={item.href}
                download
                className="download-btn"
                style={{
                  display: 'inline-block',
                  background: item.color,
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  width: '100%',
                  textAlign: 'center',
                  transition: 'background 0.2s',
                  boxSizing: 'border-box'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = item.hoverColor}
                onMouseOut={(e) => e.currentTarget.style.background = item.color}
              >
                {item.button}
              </a>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '30px', padding: '26px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 14px 0', color: '#0f172a', fontSize: '1.15rem' }}>Manual Installation</h4>
          <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
            <strong>Gmail:</strong> Download and unzip the package. Open <code>chrome://extensions</code> or <code>edge://extensions</code>, enable <strong>Developer mode</strong>, select <strong>Load unpacked</strong>, then choose the extracted folder.
          </p>
          <p style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
            <strong>Outlook:</strong> Unzip the package and host its task-pane files over HTTPS. Update <code>SourceLocation</code> in <code>manifest.xml</code>, then upload that manifest through Outlook's custom add-in interface.
          </p>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
            <strong>Thunderbird:</strong> Open Add-ons Manager, choose <strong>Install Add-on From File</strong>, and select the downloaded <code>.xpi</code> package.
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default Downloads;
