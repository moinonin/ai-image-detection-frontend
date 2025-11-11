import React from 'react';

const Pricing: React.FC = () => {
  return (
    <div className="pricing">
      <h1>Pricing Plans</h1>
      <div className="pricing-cards">
        <div className="pricing-card">
          <h3>Basic</h3>
          <p className="price">$9.99/month</p>
          <ul>
            <li>100 analyses per month</li>
            <li>Single file processing</li>
            <li>Standard support</li>
          </ul>
        </div>
        <div className="pricing-card featured">
          <h3>Pro</h3>
          <p className="price">$29.99/month</p>
          <ul>
            <li>Unlimited analyses</li>
            <li>Batch processing</li>
            <li>Video analysis</li>
            <li>Priority support</li>
          </ul>
        </div>
        <div className="pricing-card">
          <h3>Enterprise</h3>
          <p className="price">Custom</p>
          <ul>
            <li>Custom solutions</li>
            <li>API access</li>
            <li>Dedicated support</li>
            <li>White-label options</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Pricing;