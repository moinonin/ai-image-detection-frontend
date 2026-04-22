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

  // const handleContactSales = () => {
  //   window.open('mailto:support@veriforensic.com', '_blank');
  // };

  // Get product by name pattern
  const getProductByName = (namePattern: string): PolarProduct | undefined => {
    return products.find(p => 
      p.name.toLowerCase().includes(namePattern.toLowerCase())
    );
  };

  // Main products
  const professionalProduct = getProductByName('professional') || getProductByName('pro');
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
      <h1>Provenance-First Pricing</h1>

      
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
        <div className="pricing-card">
          <h3>Free</h3>
          <p className="price">Free</p>
          <ul>
            <li><strong>{freeProduct ? freeProduct.limits.images : 4} image analyses</strong> per month</li>
            <li><strong>{freeProduct ? freeProduct.limits.videos : 1} video analysis</strong> per month</li>
            <li>Public provenance verification</li>
            <li>Signature, email, and certificate checks</li>
            <li>Hosted registry record lookup</li>
            <li>No certificate issuance</li>
            <li>Community support</li>
          </ul>
          <button 
            className="pricing-cta"
            onClick={() => {
              if (freeProduct) {
                handleSubscribe(freeProduct);
              } else {
                window.location.href = user ? '/resources' : '/register';
              }
            }}
            disabled={redirectingProduct === freeProduct?.id}
          >
            {redirectingProduct === freeProduct?.id ? 'Redirecting...' : 'Start Free'}
          </button>
        </div>

        <div className="pricing-card featured">
          <h3>Pro</h3>
          <p className="price">$299/month</p>
          <ul>
            <li><strong>{professionalProduct ? professionalProduct.limits.images : 500} image analyses</strong> per month</li>
            <li><strong>{professionalProduct ? professionalProduct.limits.videos : 50} video analyses</strong> per month</li>
            <li>Batch image processing</li>
            <li>Smart video frame sampling</li>
            <li>Advanced PDF reports with visual evidence</li>
            <li>Email and signature-token provenance workflows</li>
            <li>Personal signed document workflows</li>
            <li>Certificate issuance available on Team</li>
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
            {redirectingProduct === professionalProduct?.id ? 'Redirecting...' : 'Choose Pro'}
          </button>
          {!professionalProduct && (
            <p style={{ fontSize: '0.8em', color: '#666', marginTop: '10px' }}>
              Using fallback pricing
            </p>
          )}
        </div>

        <div className="pricing-card">
          <h3>Team</h3>
          <p className="price">$499/month</p>
          <ul>
            <li><strong>{teamProduct ? teamProduct.limits.images : 2000} image analyses</strong> per month</li>
            <li><strong>{teamProduct ? teamProduct.limits.videos : 200} video analyses</strong> per month</li>
            <li>Unlimited batch processing</li>
            <li>Full video analysis</li>
            <li>Valid certificate issuance with monthly renewal</li>
            <li>PDF/DOCX certificate provenance workflows</li>
            <li>Hosted registry records and verification URLs</li>
            <li>Revocation dashboard for issued documents</li>
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

      </div>

      <div className="sdk-integration-strip">
        <div>
          <p className="eyebrow">Custom integrations</p>
          <h3>Build on VeriForensic</h3>
        </div>
        <div className="sdk-actions">
          <a className="secondary-action" href="/ns-stego/BUILDING/index.html">Download SDK</a>
          <a className="secondary-action" href="/ns-stego/API_SPEC/index.html">API docs</a>
        </div>
      </div>

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
        <h3>Start with public verification</h3>
        <p>
          Verify public provenance records and run{' '}
          {freeProduct ? freeProduct.limits.images : 4} image and{' '}
          {freeProduct ? freeProduct.limits.videos : 1} video checks every month.
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
          disabled={redirectingProduct === freeProduct?.id}
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
