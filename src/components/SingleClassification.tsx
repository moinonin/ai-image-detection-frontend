import React, { useState, useEffect } from 'react';
import { classificationService } from '../services/api';
import { usageService } from '../services/usageService'; 
import { ReportFormat, ClassificationResult, CurrentUsageResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import EmailHealthBadge from './EmailHealthBadge';
import { useToast } from '../contexts/ToastContext';

// Use the same type structure as the API returns
type SingleClassificationResponse = {
  analysis: ClassificationResult;
  cache_info: {
    from_cache: boolean;
    cache_timestamp: string | null;
  };
  usage: {
    free_analyses_used_this_month: number;
    free_analyses_remaining: number;
    subscription_used: boolean;
    account_id: string | null;
  };
  pdfBlob?: Blob;
};

function truncateFilename(name: string, maxChars: number = 50): string {
  const n = String(name);
  if (n.length <= maxChars) return n;
  if (maxChars <= 3) return n.slice(0, maxChars);
  return `${n.slice(0, maxChars - 3)}...`;
}

const SingleClassification: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [modelType, setModelType] = useState('ml');
  const reportFormat: ReportFormat = 'pdf';
  const [result, setResult] = useState<SingleClassificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [currentUsage, setCurrentUsage] = useState<CurrentUsageResponse | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [emailFailed, setEmailFailed] = useState(false);

  // Fetch current usage on component mount
  useEffect(() => {
    fetchCurrentUsage();
  }, []);

  const fetchCurrentUsage = async () => {
    try {
      const usage = await usageService.getCurrentUsage();
      setCurrentUsage(usage);
    } catch (error) {
      console.error('Failed to fetch current usage:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setErrorDetails(null);
    
    try {
      console.log('Sending request with:', { 
        file: selectedFile.name, 
        modelType, 
        reportFormat: 'json'
      });
      
      const response = await classificationService.classifySingleImage(
        selectedFile, 
        modelType,
        'json'
      );
      
      console.log('API response:', response);
      
      // Type assertion to ensure the response matches our expected type
      const typedResponse = response as SingleClassificationResponse;
      
      if (typedResponse.analysis && Object.keys(typedResponse.analysis).length > 0) {
        setResult(typedResponse);
        
        // Refresh current usage after successful analysis
        await fetchCurrentUsage();
      } else {
        setError('No analysis data received from server');
      }
    } catch (error: any) {
      console.error('Classification failed:', error);
      
      // Handle specific error cases
      if (error.status === 402 || error.message?.includes('USAGE_LIMIT_EXCEEDED')) {
        setError('You have exhausted your free analyses. Please subscribe to continue using the service.');
        setErrorDetails({
          type: 'subscription_required',
          message: 'Upgrade your account to unlock more analyses',
          usageData: error.usageData
        });
        // Refresh usage data to get current state
        await fetchCurrentUsage();
      } else if (error.name === 'FileSizeError' && error.details) {
        setError(error.message);
        setErrorDetails(error.details);
      } else {
        setError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return '#00ff00';
    if (confidence > 0.6) return '#ffff00';
    return '#ff4444';
  };

  const handleDownloadPDF = async (): Promise<void> => {
    if (!result?.analysis) return;

    setLoading(true);
    try {
      console.log('Downloading PDF using API service method...');
      
      const pdfBlob = await classificationService.downloadImagePDFFromResult(result.analysis);
      
      console.log('PDF blob size:', pdfBlob.size);
      
      if (pdfBlob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `image_analysis_${selectedFile?.name.split('.')[0] || 'result'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
    } catch (error: any) {
      console.error('PDF download failed:', error);
      setError(`PDF download failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReport = async (): Promise<void> => {
    if (!analysisResult) return;
    if (!emailRecipient) {
      setEmailError('Email is required.');
      return;
    }
    setEmailError(null);
    setShowEmailConfirm(true);
  };

  const confirmEmailReport = async (): Promise<void> => {
    if (!analysisResult || !emailRecipient) return;
    setEmailStatus(null);
    try {
      const result = await classificationService.emailReport(emailRecipient, analysisResult, 'individual');
      setEmailStatus('Report sent.');
      setEmailFailed(false);
      if (result.rate_limit) {
        toast.push(
          `Emails remaining: ${result.rate_limit.remaining} (resets in ${result.rate_limit.reset_after_seconds}s)`,
          'info'
        );
      }
      toast.push('Report emailed successfully.', 'success');
    } catch (error: any) {
      setEmailStatus(error.message || 'Failed to send report.');
      setEmailFailed(true);
      toast.push(error.message || 'Failed to send report.', 'error');
    } finally {
      setShowEmailConfirm(false);
    }
  };

  const analysisResult = result?.analysis;

  useEffect(() => {
    if (user?.email && emailRecipient.trim() === '') {
      setEmailRecipient(user.email);
    }
  }, [user, emailRecipient]);

  const getPredictedClass = (): string => {
    if (!analysisResult) return 'Unknown';
    
    if (analysisResult.predicted_class && analysisResult.predicted_class !== 'Analysis Complete') {
      return analysisResult.predicted_class;
    }
    
    if (analysisResult.is_ai !== undefined) {
      return analysisResult.is_ai ? 'AI Generated' : 'Human Created';
    }
    
    return 'Unknown';
  };

  const getAIDetectedClass = (): string => {
    const predictedClass = getPredictedClass().toLowerCase();
    
    if (predictedClass === 'unknown') return 'unknown-detected';
    if (predictedClass.includes('ai') || predictedClass.includes('generated')) {
      return 'ai-detected';
    }
    return 'human-detected';
  };

  // NEW: Check if user has exceeded image usage limits using CURRENT usage data
  const hasExceededImageUsage = (): boolean => {
    if (!currentUsage) return false;
    
    const { remaining_this_month, current_plan } = currentUsage.usage;
    
    // For free plan, show upgrade when image analyses are depleted
    if (current_plan === 'free') {
      return remaining_this_month.image <= 0;
    }
    
    // For paid plans, you might have different logic
    // For now, we only show upgrade prompts for free plan users
    return false;
  };

  // NEW: Get usage display values from CURRENT usage
  const getUsageDisplayData = () => {
    if (!currentUsage) return null;
    
    const { current_plan, plan_limits, used_this_month, remaining_this_month } = currentUsage.usage;
    
    return {
      currentPlan: current_plan,
      imageUsed: used_this_month.image,
      imageLimit: plan_limits.image,
      imageRemaining: remaining_this_month.image,
      videoUsed: used_this_month.video,
      videoLimit: plan_limits.video,
      videoRemaining: remaining_this_month.video,
      hasSubscription: current_plan !== 'free'
    };
  };

  const usageData = getUsageDisplayData();

  // Upgrade prompt component - ONLY shown when hasExceededImageUsage is true
  const UpgradePrompt = () => (
    <div className="subscription-prompt">
      <div className="upgrade-options">
        <h4>✨ Upgrade Your Account</h4>
        <p>You've used all your free image analyses this month. Choose a plan to continue:</p>
        
        <div className="plan-actions">
          <button 
            className="plan-btn explorer"
            onClick={() => window.location.href = '/pricing?plan=explorer'}>
            <span className="plan-name">Explorer Plan</span>
            <span className="plan-price">$19/month</span>
            <span className="plan-features">50 images/month</span>
          </button>
          <button 
            className="plan-btn pro primary"
            onClick={() => window.location.href = '/pricing?plan=pro'}>
            <span className="plan-name">Pro Plan</span>
            <span className="plan-price">$79/month</span>
            <span className="plan-features">Unlimited images</span>
          </button>
        </div>

        <div className="contact-support">
          <p>Need help choosing? <a href="/about">Contact our support team</a></p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="single-classification">
      <div className="page-header">
        <h1>Single Image Analysis</h1>
        <p>Upload an image to detect if it's AI-generated or human-created</p>
        
        {/* Usage Information Banner - Always show when we have current usage data */}
        {usageData && (
          <div className="usage-banner">
            <div className="usage-stats">
              <span className="usage-item">
                <strong>Plan:</strong> {usageData.currentPlan.toUpperCase()}
              </span>
              <span className="usage-item">
                <strong>Images Used:</strong> {usageData.imageUsed}/{usageData.imageLimit}
              </span>
              <span className="usage-item">
                <strong>Images Remaining:</strong> {usageData.imageRemaining}
              </span>
              {usageData.videoLimit > 0 && (
                <span className="usage-item">
                  <strong>Videos Used:</strong> {usageData.videoUsed}/{usageData.videoLimit}
                </span>
              )}
            </div>
            
            {/* Only show upgrade CTA in banner when image limits are exceeded */}
            {hasExceededImageUsage() && (
              <div className="upgrade-cta-banner">
                <div className="urgent-upgrade">
                  <span className="warning-icon">⚠️</span>
                  <span>You've used all free image analyses. </span>
                  <button 
                    className="upgrade-link-btn"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Upgrade for unlimited access
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="classification-container">
        <div className="upload-section">
          <form onSubmit={handleSubmit} className="upload-form">
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                style={{ display: 'none' }}
              />
              <div className="upload-content">
                <div className="upload-icon">📁</div>
                <p>
                  {selectedFile 
                    ? `Selected: ${selectedFile.name}`
                    : 'Drag & drop an image or use the button below to browse'
                  }
                </p>
                <label htmlFor="file-upload" className="browse-btn">
                  Browse Files
                </label>
              </div>
            </div>

            <div className="model-selection">
              <label htmlFor="model-type">Detection Model:</label>
              <select 
                id="model-type"
                value={modelType} 
                onChange={(e) => setModelType(e.target.value)}
                className="model-select"
              >
                {MODEL_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={!selectedFile || loading}
              className="analyze-btn"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing...
                </>
              ) : (
                'Analyze Image'
              )}
            </button>
          </form>
        </div>

        {/* Only show results section when we have analysis results OR an error */}
        {(analysisResult || error) && (
          <div className="results-section">
            <h2>Analysis Results</h2>

            {analysisResult && !error ? (
              <div className={`result-card ${getAIDetectedClass()}`}>
                <div className="result-header">
                  {(() => {
                    const fullFilename = analysisResult.filename || selectedFile?.name || 'Unknown File';
                    const displayFilename = truncateFilename(fullFilename, 50);
                    return <h3 title={fullFilename}>{displayFilename}</h3>;
                  })()}
                  <span className="result-badge">{getPredictedClass()}</span>
                </div>

                {result?.cache_info && (
                  <div className="cache-info">
                    <div className="detail-item">
                      <span className="detail-label">Cache Status:</span>
                      <span className="detail-value">
                        {result.cache_info.from_cache ? 'Cached Result' : 'Fresh Analysis'}
                      </span>
                    </div>
                    {result.cache_info.cache_timestamp && (
                      <div className="detail-item">
                        <span className="detail-label">Cache Time:</span>
                        <span className="detail-value">
                          {new Date(result.cache_info.cache_timestamp).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {analysisResult.confidence && (
                  <div className="confidence-meter">
                    <div className="confidence-label">
                      Confidence: {(analysisResult.confidence * 100).toFixed(2)}%
                    </div>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${analysisResult.confidence * 100}%`,
                          backgroundColor: getConfidenceColor(analysisResult.confidence),
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="result-details">
                  <div className="detail-item">
                    <span className="detail-label">Model Used:</span>
                    <span className="detail-value">{analysisResult.model?.toUpperCase() || 'Unknown'}</span>
                  </div>
                  {analysisResult.probability != null && (
                    <div className="detail-item">
                      <span className="detail-label">Probability Score:</span>
                      <span className="detail-value">{analysisResult.probability.toFixed(4)}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Report Format:</span>
                    <span className="detail-value">{reportFormat.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Analysis Type:</span>
                    <span className="detail-value">Single Image</span>
                  </div>
                </div>

                {/* Show current usage information */}
                {usageData && (
                  <div className="usage-info">
                    <div className="detail-item">
                      <span className="detail-label">Current Plan:</span>
                      <span className="detail-value">{usageData.currentPlan.toUpperCase()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Images Remaining:</span>
                      <span className="detail-value">{usageData.imageRemaining}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Used This Month:</span>
                      <span className="detail-value">{usageData.imageUsed}/{usageData.imageLimit}</span>
                    </div>
                  </div>
                )}

                {/* ONLY show upgrade prompt when current image usage is exceeded */}
                {hasExceededImageUsage() && <UpgradePrompt />}

                {analysisResult && (
                  <div className="pdf-banner">
                    <div className="pdf-banner-text">
                      <h3>Download Professional Report</h3>
                      <p>
                        Summary: {getPredictedClass()} • Confidence {analysisResult.confidence?.toFixed(2) ?? 'N/A'}
                        {analysisResult.model ? ` • Model ${analysisResult.model}` : ''}
                      </p>
                    </div>
                    <button
                      className="pdf-btn futuristic-btn"
                      onClick={handleDownloadPDF}
                      disabled={loading}
                    >
                      <span className="btn-icon">📄</span>
                      {loading ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                  </div>
                )}

                <div className="action-buttons">
                  <EmailHealthBadge />
                  {/*
                    Download JSON button intentionally disabled (internal-only).
                    Uncomment when ready to expose raw JSON downloads.
                  */}
                  {/* {analysisResult && (
                    <button
                      className="json-btn futuristic-btn"
                      onClick={() => {
                        const dataStr = JSON.stringify(analysisResult, null, 2);
                        const dataBlob = new Blob([dataStr], { type: "application/json" });
                        const url = URL.createObjectURL(dataBlob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `classification_${analysisResult.filename || 'result'}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <span className="btn-icon">📊</span>
                      Download JSON
                    </button>
                  )} */}

                  {analysisResult && (
                    <div className="email-report">
                      <div className="email-display">
                        <span className="email-label">Email report to:</span>
                        <span className="email-value">{emailRecipient || 'No email on account'}</span>
                      </div>
                      <div className="email-note">
                        Reports can only be emailed to your account address.
                      </div>
                      {emailError && (
                        <div className="email-error">
                          {emailError}
                        </div>
                      )}
                      <button
                        className="email-btn futuristic-btn"
                        onClick={handleEmailReport}
                        disabled={loading || !emailRecipient}
                      >
                        <span className="btn-icon">✉️</span>
                        Send Report
                      </button>
                      {emailFailed && (
                        <button
                          className="retry-btn futuristic-btn"
                          onClick={handleEmailReport}
                          disabled={loading || !emailRecipient}
                        >
                          Resend
                        </button>
                      )}
                    </div>
                  )}
                  {showEmailConfirm && (
                    <div className="modal-backdrop">
                      <div className="modal-card">
                        <h3>Send Report?</h3>
                        <p>We will email the report to <strong>{emailRecipient}</strong>.</p>
                        <div className="modal-actions">
                          <button className="futuristic-btn" onClick={confirmEmailReport} disabled={loading}>
                            Confirm
                          </button>
                          <button className="retry-btn futuristic-btn" onClick={() => setShowEmailConfirm(false)} disabled={loading}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {emailStatus && (
                    <div className="email-status">
                      {emailStatus}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // ERROR DISPLAY SECTION
              <div className="result-card error-detected">
                <div className="error-header">
                  <h3>❌ Analysis Failed</h3>
                </div>
                
                <div className="error-message">
                  <p>{error}</p>
                  
                  {/* ONLY show upgrade prompt for subscription required errors */}
                  {errorDetails?.type === 'subscription_required' && <UpgradePrompt />}
                  
                  {/* Show error details for other errors */}
                  {errorDetails && errorDetails.type !== 'subscription_required' && (
                    <div className="error-details">
                      <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
                    </div>
                  )}
                </div>
                
                {/* Retry button for non-subscription errors */}
                {errorDetails?.type !== 'subscription_required' && (
                  <div className="action-buttons">
                    <button 
                      className="retry-btn futuristic-btn"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      <span className="btn-icon">🔄</span>
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleClassification;
