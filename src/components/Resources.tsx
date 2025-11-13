import React from 'react';
import { Link } from 'react-router-dom';

const Resources: React.FC = () => {
  return (
    <div className="resources">
      {/* Header Section */}
      <section className="resources-header">
        <h1>Media Analysis Tools</h1>
        <p className="resources-subtitle">
          Advanced AI detection for images and videos. From quick single image checks 
          to comprehensive video analysis, choose the right tool for your media verification needs.
        </p>
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
                Progress tracking
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Export PDF reports
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