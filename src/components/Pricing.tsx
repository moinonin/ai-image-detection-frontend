import React from 'react';

const Pricing: React.FC = () => {
  return (
    <div className="pricing">
      <h1>Transparent Pricing</h1>
      <p className="pricing-subtitle">Pay only for what you use with clear, predictable pricing</p>
      
      <div className="pricing-cards">
        {/* Explorer Plan - Entry Level */}
        <div className="pricing-card">
          <h3>Explorer</h3>
          <p className="price">$19/month</p>
          <ul>
            <li><strong>100 image analyses</strong> per month</li>
            <li><strong>3 video analyses</strong> (up to 5 min)</li>
            <li>Single file processing</li>
            <li>Basic PDF reports</li>
            <li>Email support (48h response)</li>
            <li>Standard processing queue</li>
          </ul>
          <button className="pricing-cta">Start with Explorer</button>
        </div>

        {/* Professional Plan - Main Offering */}
        <div className="pricing-card featured">
          <h3>Professional</h3>
          <p className="price">$79/month</p>
          <ul>
            <li><strong>500 image analyses</strong> per month</li>
            <li><strong>20 video analyses</strong> (up to 30 min)</li>
            <li>Batch image processing (up to 10 files)</li>
            <li>Smart video frame sampling</li>
            <li>Advanced PDF reports with visual evidence</li>
            <li>Email reports to multiple recipients</li>
            <li>Priority support (24h response)</li>
            <li>Faster processing queue</li>
          </ul>
          <button className="pricing-cta">Choose Professional</button>
        </div>

        {/* Team Plan - For Small Businesses */}
        <div className="pricing-card">
          <h3>Team</h3>
          <p className="price">$199/month</p>
          <ul>
            <li><strong>2,000 image analyses</strong> per month</li>
            <li><strong>50 video analyses</strong> (up to 60 min)</li>
            <li>Unlimited batch processing</li>
            <li>Full video analysis (no sampling)</li>
            <li>Custom report branding</li>
            <li>3 team member seats</li>
            <li>Priority support (4h response)</li>
            <li>Dedicated processing resources</li>
          </ul>
          <button className="pricing-cta">Start Team Plan</button>
        </div>

        {/* Enterprise - Custom */}
        <div className="pricing-card enterprise">
          <h3>Enterprise</h3>
          <p className="price">Custom</p>
          <ul>
            <li>Custom analysis limits</li>
            <li>API access licensing</li>
            <li>White-label solutions</li>
            <li>Dedicated infrastructure</li>
            <li>SLAs and custom contracts</li>
            <li>24/7 dedicated support</li>
            <li>On-premise deployment options</li>
            <li>Custom model training</li>
          </ul>
          <button className="pricing-cta">Contact Sales</button>
        </div>
      </div>

      {/* Pay-as-you-go option */}
      <div className="usage-based-pricing">
        <h3>Need more flexibility?</h3>
        <div className="usage-grid">
          <div className="usage-tier">
            <h4>Additional Images</h4>
            <p>$0.10 per image</p>
          </div>
          <div className="usage-tier">
            <h4>Additional Videos</h4>
            <p>$2.00 per minute</p>
          </div>
          <div className="usage-tier">
            <h4>Bulk Discounts</h4>
            <p>Available for annual plans</p>
          </div>
        </div>
      </div>

      {/* Free Trial Notice */}
      <div className="free-trial-notice" onClick={() => window.location.href = '/register'}>
        <h3>Start with a Free Trial</h3>
        <p>Try all Professional features for 14 days with 5 free image analyses and 1 video analysis</p>
        <button className="trial-cta">Start Free Trial</button>
      </div>
    </div>
  );
};

export default Pricing;