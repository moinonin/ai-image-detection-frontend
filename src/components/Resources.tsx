import React from 'react';
import { Link } from 'react-router-dom';

const Resources: React.FC = () => {
  return (
    <div className="resources">
      {/* Header Section */}
      <section className="resources-header">
        <h1>Analysis Resources</h1>
        <p className="resources-subtitle">
          Choose the right tool for your content analysis needs. From quick single checks 
          to comprehensive batch processing, we've got you covered.
        </p>
      </section>

      {/* Main Tools Grid */}
      <section className="tools-section">
        <div className="tools-grid">
          <div className="tool-card neon-blue">
            <div className="tool-icon">🔍</div>
            <h3>Single Analysis</h3>
            <p className="tool-description">
              Quick, precise analysis of individual documents, images, or text with detailed 
              AI detection reports. Perfect for one-off content verification.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Individual file analysis
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Real-time results
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Detailed confidence scores
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Multiple format support
              </div>
            </div>
            <Link to="/single" className="tool-cta">
              Start Single Analysis
            </Link>
          </div>

          <div className="tool-card neon-purple">
            <div className="tool-icon">📚</div>
            <h3>Batch Processing</h3>
            <p className="tool-description">
              Process multiple files simultaneously with our efficient batch analysis system. 
              Perfect for teams, agencies, and large-scale content verification.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Bulk file upload
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
                Export results
              </div>
            </div>
            <Link to="/batch" className="tool-cta">
              Start Batch Analysis
            </Link>
          </div>

          <div className="tool-card neon-green">
            <div className="tool-icon">🎥</div>
            <h3>Video Analysis</h3>
            <p className="tool-description">
              Advanced AI detection for video content, including frame-by-frame analysis, 
              audio transcription, and comprehensive media verification.
            </p>
            <div className="tool-features">
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Frame-level detection
              </div>
              <div className="feature-item">
                <span className="feature-check">✓</span>
                Audio analysis
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

      {/* Usage Stats */}
      <section className="usage-stats">
        <div className="stats-content">
          <h2>Trusted by Professionals</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Analyses This Month</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.7%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2.3s</div>
              <div className="stat-label">Average Processing Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Data Privacy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="support-section">
        <div className="support-content">
          <h2>Need Help Choosing?</h2>
          <p>
            Not sure which tool is right for your needs? Our support team is here to help 
            you select the perfect analysis solution for your specific requirements.
          </p>
          <div className="support-actions">
            <Link to="/about" className="support-link">
              Contact Support
            </Link>
            <a href="/docs" className="support-link secondary">
              View Documentation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resources;