import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8008';

interface PolarProduct {
  id: string;
  name: string;
  description: string;
  price_amount: number | null;
  price_currency: string | null;
  limits: {
    images: number;
    videos: number;
    analysis_type: string;
  };
  is_recurring: boolean;
  recurring_interval: string;
}

interface CheckoutSession {
  checkout_url: string;
  session_id: string;
  product_id: string;
  expires_at?: string;
}

const Pricing: React.FC = () => {
  const [products, setProducts] = useState<PolarProduct[]>([]);
  const [freeTier, setFreeTier] = useState<PolarProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [redirectingProduct, setRedirectingProduct] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch products from backend - THIS WAS WORKING
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [productsResponse, freeTierResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/products`),
          fetch(`${API_BASE_URL}/api/v1/products/free-tier`)
        ]);

        if (!productsResponse.ok) {
          throw new Error(`Products API returned ${productsResponse.status}`);
        }

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.products || []);
        }

        if (freeTierResponse.ok) {
          const freeTierData = await freeTierResponse.json();
          setFreeTier(freeTierData);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load pricing information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // THIS CHECKOUT LOGIC WAS WORKING - it successfully redirected to Polar
  const handleSubscribe = async (product: PolarProduct) => {
    setRedirectingProduct(product.id);
    setError(null);
    
    try {
      console.log(`🛒 Starting checkout for product: ${product.id}`);
      console.log(`📧 User email: ${user?.email}`);
      
      // Build URL with parameters - THIS WAS WORKING
      const params = new URLSearchParams({
        product_id: product.id
      });
      
      if (user?.email) {
        params.append('customer_email', user.email);
      }
      
      const url = `${API_BASE_URL}/api/v1/products/${product.id}/checkout?${params.toString()}`;
      console.log('🔗 Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        let errorDetail = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch (parseError) {
          errorDetail = await response.text() || errorDetail;
        }
        throw new Error(errorDetail);
      }

      const sessionData: CheckoutSession = await response.json();
      console.log('✅ Checkout URL received:', sessionData);
      
      if (sessionData.checkout_url) {
        // Open in same tab instead of new tab for better flow
        window.location.href = sessionData.checkout_url;
      } else {
        throw new Error('No checkout URL received from server');
      }
      
    } catch (error) {
      console.error('❌ Subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to get checkout URL: ${errorMessage}`);
      
      // Fallback after a delay
      setTimeout(() => {
        const fallbackUrl = generateDirectPolarUrl(product.id);
        console.log('🔄 Using fallback URL:', fallbackUrl);
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }, 2000);
    } finally {
      // Don't reset redirecting state immediately if we're waiting for fallback
      if (!error) {
        setTimeout(() => setRedirectingProduct(null), 3000);
      }
    }
  };

  // Generate direct Polar URL as last resort
  const generateDirectPolarUrl = (productId: string): string => {
    const organizationName = import.meta.env.VITE_POLAR_ORG || 'veriforensic-ai';
    const isSandbox = import.meta.env.VITE_POLAR_ENV === 'sandbox' || window.location.hostname === 'localhost';
    const polarBaseUrl = isSandbox ? 'https://sandbox.polar.sh' : 'https://polar.sh';
    return `${polarBaseUrl}/${organizationName}/subscribe/${productId}`;
  };

  const handleContactSales = () => {
    window.open('mailto:support@veriforensic.com', '_blank');
  };

  // Format price for display
  const formatPrice = (product: PolarProduct) => {
    if (!product.price_amount) return 'Free';
    const amount = product.price_amount / 100;
    return `$${amount}/${product.recurring_interval}`;
  };

  // Get product by name pattern
  const getProductByName = (namePattern: string): PolarProduct | undefined => {
    return products.find(p => 
      p.name.toLowerCase().includes(namePattern.toLowerCase())
    );
  };

  // Main products
  const explorerProduct = getProductByName('explorer');
  const professionalProduct = getProductByName('professional');
  const teamProduct = getProductByName('team');
  const freeProduct = freeTier || getProductByName('free');

  if (isLoading) {
    return (
      <div className="pricing">
        <div className="loading-state">
          <h1>Loading Pricing...</h1>
          <p>Fetching the latest subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing">
      <h1>Transparent Pricing</h1>
      <p className="pricing-subtitle">Pay only for what you use with clear, predictable pricing</p>
      
      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center',
          fontFamily: 'monospace',
          fontSize: '14px',
          wordBreak: 'break-word'
        }}>
          <strong>Error:</strong> {error}
          <br />
          <small>Check browser console for details</small>
        </div>
      )}
      
      <div className="pricing-cards">
        {/*
        // Free Tier (hidden for now)
        {freeProduct && (
          <div className="pricing-card">
            <h3>Free Tier</h3>
            <p className="price">{formatPrice(freeProduct)}</p>
            <ul>
              <li><strong>{freeProduct.limits.images} image analyses</strong> per month</li>
              <li><strong>{freeProduct.limits.videos} video analysis</strong> per month</li>
              <li>Single file processing</li>
              <li>Basic analysis reports</li>
              <li>Community support</li>
              <li>Standard processing</li>
            </ul>
            <button 
              className="pricing-cta"
              onClick={() => handleSubscribe(freeProduct)}
              disabled={redirectingProduct === freeProduct.id}
            >
              {redirectingProduct === freeProduct.id ? 'Redirecting...' : 'Start Free Forever'}
            </button>
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
              No credit card required
            </p>
          </div>
        )}
        */}

        {/* Explorer Plan */}
        <div className="pricing-card">
          <h3>Explorer</h3>
          <p className="price">
            {explorerProduct ? formatPrice(explorerProduct) : '$19/month'}
          </p>
          <ul>
            <li><strong>{explorerProduct ? explorerProduct.limits.images : 100} image analyses</strong> per month</li>
            <li><strong>{explorerProduct ? explorerProduct.limits.videos : 10} video analyses</strong> per month</li>
            <li>Single file processing</li>
            <li>Basic PDF reports</li>
            <li>Email support (48h response)</li>
            <li>Standard processing queue</li>
          </ul>
          <button 
            className="pricing-cta"
            onClick={() => {
              if (explorerProduct) {
                handleSubscribe(explorerProduct);
              } else {
                window.open(generateDirectPolarUrl('explorer'), '_blank');
              }
            }}
            disabled={redirectingProduct === explorerProduct?.id}
          >
            {redirectingProduct === explorerProduct?.id ? 'Redirecting...' : 'Start with Explorer'}
          </button>
          {!explorerProduct && (
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
              Using fallback pricing
            </p>
          )}
        </div>

        {/* Professional Plan - Main Offering */}
        <div className="pricing-card featured">
          <h3>Professional</h3>
          <p className="price">
            {professionalProduct ? formatPrice(professionalProduct) : '$79/month'}
          </p>
          <ul>
            <li><strong>{professionalProduct ? professionalProduct.limits.images : 500} image analyses</strong> per month</li>
            <li><strong>{professionalProduct ? professionalProduct.limits.videos : 50} video analyses</strong> per month</li>
            <li>Batch image processing</li>
            <li>Smart video frame sampling</li>
            <li>Advanced PDF reports with visual evidence</li>
            <li>Email reports to multiple recipients</li>
            <li>Priority support (24h response)</li>
            <li>Faster processing queue</li>
          </ul>
          <button 
            className="pricing-cta"
            onClick={() => {
              if (professionalProduct) {
                handleSubscribe(professionalProduct);
              } else {
                window.open(generateDirectPolarUrl('professional'), '_blank');
              }
            }}
            disabled={redirectingProduct === professionalProduct?.id}
          >
            {redirectingProduct === professionalProduct?.id ? 'Redirecting...' : 'Choose Professional'}
          </button>
          {!professionalProduct && (
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
              Using fallback pricing
            </p>
          )}
        </div>

        {/* Team Plan */}
        <div className="pricing-card">
          <h3>Team</h3>
          <p className="price">
            {teamProduct ? formatPrice(teamProduct) : '$199/month'}
          </p>
          <ul>
            <li><strong>{teamProduct ? teamProduct.limits.images : 2000} image analyses</strong> per month</li>
            <li><strong>{teamProduct ? teamProduct.limits.videos : 200} video analyses</strong> per month</li>
            <li>Unlimited batch processing</li>
            <li>Full video analysis</li>
            <li>Custom report branding</li>
            <li>3 team member seats</li>
            <li>Priority support (4h response)</li>
            <li>Dedicated processing resources</li>
          </ul>
          <button 
            className="pricing-cta"
            onClick={() => {
              if (teamProduct) {
                handleSubscribe(teamProduct);
              } else {
                window.open(generateDirectPolarUrl('team'), '_blank');
              }
            }}
            disabled={redirectingProduct === teamProduct?.id}
          >
            {redirectingProduct === teamProduct?.id ? 'Redirecting...' : 'Start Team Plan'}
          </button>
          {!teamProduct && (
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
              Using fallback pricing
            </p>
          )}
        </div>

        {/*
        // Enterprise - Custom (hidden for now)
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
          <button className="pricing-cta" onClick={handleContactSales}>
            Contact Sales
          </button>
        </div>
        */}
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
      <div className="free-trial-notice">
        <h3>Start Free Tier</h3>
        <p>
          Try all Professional features under free tier with{' '}
          {freeProduct ? freeProduct.limits.images : 4} free image and{' '}
          {freeProduct ? freeProduct.limits.videos : 1} video analyses every month
        </p>
        <button 
          className="trial-cta"
          onClick={() => {
            if (freeProduct) {
              handleSubscribe(freeProduct);
            } else {
              window.open(generateDirectPolarUrl('free'), '_blank');
            }
          }}
          disabled={!freeProduct || redirectingProduct === freeProduct.id}
        >
          {redirectingProduct === freeProduct?.id ? 'Redirecting...' : 'Start Free Forever'}
        </button>
        {!freeProduct && (
          <p style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.8)', marginTop: '10px' }}>
            Using fallback free tier
          </p>
        )}
      </div>

      {/* User context info */}
      {user && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <p>Signed in as: <strong>{user.email}</strong></p>
          <p style={{ fontSize: '0.9em', color: '#666', margin: '5px 0 0 0' }}>
            Your email will be used for subscription management
          </p>
        </div>
      )}
    </div>
  );
};

export default Pricing;
