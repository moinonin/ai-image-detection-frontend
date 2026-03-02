// Updated Resources component with the models section
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getModels } from '../services/api';

interface Model {
  id: string;
  name: string;
  description: string;
}

const Resources: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await getModels();
        setModels(data.models);
      } catch (error) {
        console.error('Error fetching models:', error);
        // Fallback data in case API fails
        setModels([
          {
            id: "ML",
            name: "AICASSIE(ML)",
            description: "Excels at identifying human content with high precision (97.9% AI detection accuracy).\nMaintains strong overall performance (95.2%) accuracy while minimizing false positives."
          },
          {
            id: "NET",
            name: "AITASHA (NET)",
            description: "Highly sensitive AI detector with excellent recall (94.8%), catching nearly all AI content.\nTends to be aggressive, prioritizing comprehensive AI detection over precision, which results in more false positives."
          },
          {
            id: "SCALPEL",
            name: "AISUSSIE (SCALPEL)",
            description: "Well-balanced AI detector with excellent precision (98.3%) and strong overall accuracy (96.9%).\nReliably identifies AI content while rarely misclassifying human work, making it highly trustworthy."
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Function to get the appropriate neon color and icon based on model ID
  const getModelStyle = (modelId: string) => {
    switch (modelId) {
      case 'ML':
        return { colorClass: 'neon-blue', icon: '🧠' };
      case 'NET':
        return { colorClass: 'neon-purple', icon: '🕸️' };
      case 'SCALPEL':
        return { colorClass: 'neon-green', icon: '✂️' };
      default:
        return { colorClass: 'neon-blue', icon: '🤖' };
    }
  };

  return (
    <div className="resources">
      {/* Header Section */}
      <section className="resources-header">
        <h1>Provenance + Verification Tools</h1>
        <p className="resources-subtitle">
          Cryptographic provenance is the primary trust layer. Detection tools are available
          when provenance is missing or for legacy workflows.
        </p>
      </section>

      <section className="tools-section">
        <div className="tools-grid">
          <div className="tool-card neon-blue">
            <div className="tool-icon">🔏</div>
            <h3>Provenance Docs (ns-stego)</h3>
            <p className="tool-description">
              Embed cryptographic proof, verify authenticity, and integrate with gateways.
              Includes audit logging, SDK usage, and deployment guides.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Embed provenance at creation
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Verify and audit evidence trails
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Gateway + service integrations
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Enterprise-ready workflows
              </div>
            </div>
            <a href="/ns-stego/" className="tool-cta">
              Open Provenance Docs
            </a>
          </div>
        </div>
      </section>

      {/* Main Tools Grid */}
      <section className="tools-section">
        <div className="tools-grid">
          <div className="tool-card neon-blue">
            <div className="tool-icon">🖼️</div>
            <h3>Single Image Analysis</h3>
            <p className="tool-description">
              Quick, detailed analysis of individual images with comprehensive AI detection reports. 
              Perfect for one-off image verification and authenticity checks.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Individual image analysis
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Real-time results
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Multiple image formats (JPG, PNG, WEBP)
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Detailed confidence scores
              </div>
            </div>
            <Link to="/single" className="tool-cta">
              Analyze Single Image
            </Link>
          </div>

          <div className="tool-card neon-purple">
            <div className="tool-icon">🖼️📚</div>
            <h3>Batch Image Processing</h3>
            <p className="tool-description">
              Process multiple images simultaneously with our efficient batch analysis system. 
              Perfect for teams, agencies, and large-scale image verification projects.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Bulk image upload
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Background processing
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Real-time results
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Progress tracking
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Multiple image formats (JPG, PNG, WEBP)
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Detailed confidence scores
              </div>
            </div>
            <Link to="/batch" className="tool-cta">
              Process Many Images
            </Link>
          </div>

          <div className="tool-card neon-green">
            <div className="tool-icon">🎥</div>
            <h3>Video Analysis</h3>
            <p className="tool-description">
              Advanced AI detection for video content with flexible analysis options. 
              Choose between full frame-by-frame analysis or smart sampling for cost-effective verification.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Full video analysis
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Smart frame sampling
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Multiple video formats
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Timestamped results
              </div>
            </div>
            <Link to="/videos" className="tool-cta">
              Analyze Videos
            </Link>
          </div>
        </div>
      </section>

      {/* Available Models Section */}
      <section className="tools-section">
        <div className="models-content">
          <h2 className="av-models">Available AI Models</h2>
          <p className="resources-subtitle">
            Choose from our specialized AI detection models, each optimized for different use cases 
            and performance characteristics. Select the model that best fits your verification needs.
          </p>
          
          {loading ? (
            <div className="models-loading">
              <div className="loading-spinner"></div>
              <p>Loading available models...</p>
            </div>
          ) : (
            <div className="tools-grid">
              {models.map((model) => {
                const { colorClass, icon } = getModelStyle(model.id);
                return (
                  <div key={model.id} className={`tool-card ${colorClass}`}>
                    <div className="tool-icon">{icon}</div>
                    <h3>{model.name}</h3>
                    <p className="tool-description">
                      {model.description.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                          {line}
                          {index < model.description.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                    <div className="tool-features">
                      {model.id === 'ML' && (
                        <>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            97.9% AI Detection Accuracy
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            95.2% Overall Performance
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            High Precision
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            Minimal False Positives
                          </div>
                        </>
                      )}
                      {model.id === 'NET' && (
                        <>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            94.8% Recall Rate
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            Highly Sensitive
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            Comprehensive AI Detection
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            Aggressive Detection
                          </div>
                        </>
                      )}
                      {model.id === 'SCALPEL' && (
                        <>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            98.3% Precision
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            96.9% Overall Accuracy
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            Well-Balanced
                          </div>
                          <div className="feature-item">
                            <span className="feature-check">✓</span>
                            Highly Trustworthy
                          </div>
                        </>
                      )}
                    </div>
                    <div className="tool-cta disabled">
                      Model Active
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Report Features */}
      <section className="usage-stats">
        <div className="stats-content">
          <h2>Comprehensive Reporting</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">📄</div>
              <div className="stat-number">PDF Reports</div>
              <div className="stat-label">Detailed Analysis Export</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📧</div>
              <div className="stat-number">Email Delivery</div>
              <div className="stat-label">Send Reports Directly</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🔍</div>
              <div className="stat-number">Frame Sampling</div>
              <div className="stat-label">Cost-Effective Video Analysis</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⚡</div>
              <div className="stat-number">Fast Processing</div>
              <div className="stat-label">Quick Turnaround Times</div>
            </div>
          </div>
        </div>
      </section>

      {/* Media Formats Support */}
      <section className="support-section">
        <div className="support-content">
          <h2>Supported Media Formats</h2>
          <p>
            We specialize in image and video analysis with support for all major formats. 
            Get detailed AI detection results for your visual content with our specialized tools.
          </p>
          <div className="format-grid">
            <div className="format-category">
              <h4>📷 Images</h4>
              <div className="format-list">
                <span className="format-item">JPG/JPEG</span>
                <span className="format-item">PNG</span>
                <span className="format-item">WEBP</span>
                <span className="format-item">BMP</span>
                <span className="format-item">GIF</span>
              </div>
            </div>
            <div className="format-category">
              <h4>🎥 Videos</h4>
              <div className="format-list">
                <span className="format-item">MP4</span>
                <span className="format-item">MOV</span>
                <span className="format-item">AVI</span>
                <span className="format-item">WMV</span>
                <span className="format-item">WebM</span>
              </div>
            </div>
            <div className="format-category">
              <h4>📊 Reports</h4>
              <div className="format-list">
                <span className="format-item">PDF Download</span>
                <span className="format-item">Email Delivery</span>
                <span className="format-item">Confidence Scores</span>
                <span className="format-item">Visual Evidence</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resources;
