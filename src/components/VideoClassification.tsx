import React, { useState, useEffect } from 'react';
import { classificationService } from '../services/api';
import { usageService } from '../services/api'; // Import from api or directly from usageService
import { VideoClassificationResponse, CurrentUsageResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import EmailHealthBadge from './EmailHealthBadge';
import { useToast } from '../contexts/ToastContext';

function truncateFilename(name: string, maxChars: number = 50): string {
  const n = String(name);
  if (n.length <= maxChars) return n;
  if (maxChars <= 3) return n.slice(0, maxChars);
  return `${n.slice(0, maxChars - 3)}...`;
}

const VideoClassification: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [modelType, setModelType] = useState('ml');
  const [partialAnalysis, setPartialAnalysis] = useState(true);
  const [result, setResult] = useState<VideoClassificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [currentUsage, setCurrentUsage] = useState<CurrentUsageResponse | null>(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailFailed, setEmailFailed] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

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
      setResult(null);
      setError(null);
      setErrorDetails(null);
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
      setResult(null);
      setError(null);
      setErrorDetails(null);
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
      console.log('Sending video request with:', { 
        file: selectedFile.name, 
        modelType, 
        partialAnalysis 
      });
      
      const response = await classificationService.classifyVideo(
        selectedFile, 
        modelType, 
        partialAnalysis
      );
      
      console.log('Video API result:', response);
      setResult(response);
      
      // Refresh current usage after successful analysis
      await fetchCurrentUsage();
      
    } catch (error: any) {
      console.error('Video classification failed:', error);
      
      if (error.status === 402 || error.message?.includes('USAGE_LIMIT_EXCEEDED')) {
        setError('You have exhausted your free video analyses. Please subscribe to continue using the service.');
        setErrorDetails({
          type: 'subscription_required',
          message: 'Upgrade your account to unlock more video analyses',
          usageData: error.usageData
        });
        // Refresh usage data to get current state
        await fetchCurrentUsage();
      } else if (result?.usage?.oversized_files === true) {
        setError(error.message);
        setErrorDetails(error.details);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 80) return 'var(--vf-success)';
    if (confidence > 60) return 'var(--vf-warning)';
    return 'var(--vf-danger)';
  };

  // Get the first analysis result from the array
  const analysisData = result?.analyses?.[0];
  const analysisResult = analysisData?.analysis_results;

  const getAIDetectedClass = (): string => {
    if (!analysisResult?.dominant_class) return 'unknown-detected';
    
    const dominantClass = analysisResult.dominant_class.toLowerCase();
    if (dominantClass.includes('ai') || dominantClass.includes('generated')) {
      return 'ai-detected';
    }
    return 'human-detected';
  };

  // NEW: Check if user has exceeded video usage limits using CURRENT usage data
  const hasExceededVideoUsage = (): boolean => {
    if (!currentUsage) return false;
    
    const { remaining_this_month, current_plan } = currentUsage.usage;
    
    // For free plan, show upgrade when video analyses are depleted
    if (current_plan === 'free') {
      return remaining_this_month.video <= 0;
    }
    
    // For paid plans, you might have different logic
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

  const handleDownloadPDF = async (): Promise<void> => {
    if (!result) return;

    setIsDownloadingPdf(true);
    try {
      console.log('Full result structure:', JSON.stringify(result, null, 2));
      console.log('Analyses array:', result.analyses);
      console.log('First analysis:', result.analyses?.[0]);
      console.log('Analysis results:', result.analyses?.[0]?.analysis_results);
      console.log('Downloading PDF with existing results...');
      
      const pdfBlob = await classificationService.downloadVideoPDFFromResult(result);
      
      console.log('PDF blob size:', pdfBlob.size);
      
      if (pdfBlob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video_analysis_report_${selectedFile?.name.split('.')[0] || 'result'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
    } catch (error: any) {
      console.error('PDF download failed:', error);
      setError(`PDF download failed: ${error.message}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (user?.email && emailRecipient.trim() === '') {
      setEmailRecipient(user.email);
    }
  }, [user, emailRecipient]);

  const handleEmailReport = async (): Promise<void> => {
    if (!result) return;
    if (!emailRecipient) {
      setEmailError('Email is required.');
      return;
    }
    setEmailError(null);
    setShowEmailConfirm(true);
  };

  const confirmEmailReport = async (): Promise<void> => {
    if (!result || !emailRecipient) return;
    setEmailStatus(null);
    try {
      const response = await classificationService.emailReport(emailRecipient, result, 'video');
      setEmailStatus('Report sent.');
      setEmailFailed(false);
      if (response.rate_limit) {
        toast.push(
          `Emails remaining: ${response.rate_limit.remaining} (resets in ${response.rate_limit.reset_after_seconds}s)`,
          'info'
        );
      }
      toast.push('Video report emailed successfully.', 'success');
    } catch (error: any) {
      setEmailStatus(error.message || 'Failed to send report.');
      setEmailFailed(true);
      toast.push(error.message || 'Failed to send report.', 'error');
    } finally {
      setShowEmailConfirm(false);
    }
  };

  // Download JSON intentionally disabled (internal-only).
  // const handleDownloadJSON = (): void => {
  //   if (!analysisResult) return;
  //
  //   const dataStr = JSON.stringify(analysisResult, null, 2);
  //   const dataBlob = new Blob([dataStr], { type: 'application/json' });
  //   const url = URL.createObjectURL(dataBlob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `video_analysis_${analysisResult.filename || 'result'}.json`;
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };

  // Upgrade prompt component - ONLY shown when hasExceededVideoUsage is true
  const UpgradePrompt = () => (
    <div className="subscription-prompt">
      <div className="upgrade-options">
        <h4>✨ Upgrade Your Account</h4>
        <p>You've used all your free video analyses this month. Choose a plan to continue:</p>
        
        <div className="plan-actions">
          <button 
            className="plan-btn pro primary"
            onClick={() => window.location.href = '/pricing?plan=pro'}>
            <span className="plan-name">Pro Plan</span>
            <span className="plan-price">$299/month</span>
            <span className="plan-features">Analysis plus personal provenance</span>
          </button>
          <button 
            className="plan-btn team"
            onClick={() => window.location.href = '/pricing?plan=team'}>
            <span className="plan-name">Team Plan</span>
            <span className="plan-price">$499/month</span>
            <span className="plan-features">Registry and certificate issuance</span>
          </button>
        </div>

        <div className="contact-support">
          <p>Need help choosing? <a href="/team">Contact our team</a></p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="video-classification">
      <div className="page-header">
        <h1>Video Analysis</h1>
        <p>Upload a video to detect if it's AI-generated or human-created</p>
        
        {/* Usage Information Banner - Always show when we have current usage data */}
        {usageData && (
          <div className="usage-banner">
            <div className="usage-stats">
              <span className="usage-item">
                <strong>Plan:</strong> {usageData.currentPlan.toUpperCase()}
              </span>
              <span className="usage-item">
                <strong>Videos Used:</strong> {usageData.videoUsed}/{usageData.videoLimit}
              </span>
              <span className="usage-item">
                <strong>Videos Remaining:</strong> {usageData.videoRemaining}
              </span>
              {usageData.imageLimit > 0 && (
                <span className="usage-item">
                  <strong>Images Used:</strong> {usageData.imageUsed}/{usageData.imageLimit}
                </span>
              )}
            </div>
            
            {/* Only show upgrade CTA in banner when video limits are exceeded */}
            {hasExceededVideoUsage() && showUpgradeBanner && (
              <div className="upgrade-cta-banner">
                <div className="urgent-upgrade">
                  <span className="warning-icon">⚠️</span>
                  <span>You've used all free video analyses. </span>
                  <button 
                    className="upgrade-link-btn"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Upgrade for more videos
                  </button>
                  <button 
                    className="banner-close"
                    onClick={() => setShowUpgradeBanner(false)}
                    aria-label="Close banner"
                  >
                    ×
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
                accept="video/*,.mp4,.avi,.mov,.mkv,.webm,.flv,.wmv"
                onChange={handleFileChange}
                className="file-input"
                style={{ display: 'none' }}
              />
              <div className="upload-content">
                <div className="upload-icon">🎥</div>
                <p>
                  {selectedFile 
                    ? `Selected: ${selectedFile.name}`
                    : 'Drag & drop a video or use the button below to browse'
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

            <div className="analysis-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={partialAnalysis}
                  onChange={(e) => setPartialAnalysis(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkmark"></span>
                Partial Analysis (Faster, analyzes sample frames)
              </label>
              <div className="option-description">
                {partialAnalysis 
                  ? 'Analyzes 50 frames at 10-frame intervals'
                  : 'Analyzes all frames for comprehensive results'
                }
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!selectedFile || loading}
              className="analyze-btn"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing Video...
                </>
              ) : (
                'Analyze Video'
              )}
            </button>
          </form>
        </div>

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
                  <span className="result-badge">
                    {analysisResult.dominant_class || 'Analysis Complete'}
                  </span>
                </div>

                {/* Cache info from the analysis data */}
                {analysisData && (
                  <div className="cache-info">
                    <div className="detail-item">
                      <span className="detail-label">Cache Status:</span>
                      <span className="detail-value">
                        {analysisData.from_cache ? 'Cached Result' : 'Fresh Analysis'}
                      </span>
                    </div>
                    {analysisData.timestamp && (
                      <div className="detail-item">
                        <span className="detail-label">Analysis Time:</span>
                        <span className="detail-value">
                          {new Date(analysisData.timestamp).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Confidence meters */}
                <div className="confidence-meters">
                  <div className="confidence-meter">
                    <div className="confidence-label">
                      AI Confidence: {analysisResult.confidence_ai}%
                    </div>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${analysisResult.confidence_ai}%`,
                          backgroundColor: getConfidenceColor(analysisResult.confidence_ai),
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="confidence-meter">
                    <div className="confidence-label">
                      Human Confidence: {analysisResult.confidence_human}%
                    </div>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${analysisResult.confidence_human}%`,
                          backgroundColor: getConfidenceColor(analysisResult.confidence_human),
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="result-details">
                  <div className="detail-item">
                    <span className="detail-label">Model Used:</span>
                    <span className="detail-value">{analysisResult.model?.toUpperCase() || modelType.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Analysis Type:</span>
                    <span className="detail-value">{analysisResult.analysis_type || (partialAnalysis ? 'Partial' : 'Full')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Analysis Detail:</span>
                    <span className="detail-value">{analysisResult["analysis detail"] || (partialAnalysis ? 'Partial video analysis' : 'Full video analysis')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Frames Analyzed:</span>
                    <span className="detail-value">{analysisResult.total_frames_analyzed}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">AI Frames:</span>
                    <span className="detail-value">{analysisResult.ai_frames}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Human Frames:</span>
                    <span className="detail-value">{analysisResult.human_frames}</span>
                  </div>
                  {analysisResult.average_ai_confidence > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Avg AI Confidence:</span>
                      <span className="detail-value">{(analysisResult.average_ai_confidence * 100).toFixed(2)}%</span>
                    </div>
                  )}
                  {analysisResult.average_human_confidence > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Avg Human Confidence:</span>
                      <span className="detail-value">{(analysisResult.average_human_confidence * 100).toFixed(2)}%</span>
                    </div>
                  )}
                  
                  {/* Show features if available */}
                  {analysisResult.features && (
                    <>
                      <div className="detail-section">
                        <h4>Technical Features:</h4>
                        {Object.entries(analysisResult.features).map(([key, value]) => (
                          <div key={key} className="detail-item">
                            <span className="detail-label">{key.replace(/_/g, ' ')}:</span>
                            <span className="detail-value">{typeof value === 'number' ? value.toFixed(4) : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Show current usage information */}
                {usageData && (
                  <div className="usage-info">
                    <div className="detail-item">
                      <span className="detail-label">Current Plan:</span>
                      <span className="detail-value">{usageData.currentPlan.toUpperCase()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Videos Remaining:</span>
                      <span className="detail-value">{usageData.videoRemaining}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Used This Month:</span>
                      <span className="detail-value">{usageData.videoUsed}/{usageData.videoLimit}</span>
                    </div>
                  </div>
                )}

                {/* ONLY show upgrade prompt when current video usage is exceeded */}
                {hasExceededVideoUsage() && <UpgradePrompt />}

                {/* Action buttons */}
                
                {analysisResult && (
                  <div className="pdf-banner">
                    <div className="pdf-banner-text">
                      <h3>Download Video Report</h3>
                      <p>
                        Summary: {analysisResult.dominant_class || 'N/A'} • Frames {analysisResult.total_frames_analyzed || 0} • AI {analysisResult.ai_frames || 0}
                      </p>
                    </div>
                    <button
                      className="pdf-btn futuristic-btn"
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPdf}
                    >
                      <span className="btn-icon">📄</span>
                      {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
                    </button>
                  </div>
                )}

                <div className="action-buttons">
                  <EmailHealthBadge />
                  {/*
                    Download JSON button intentionally disabled (internal-only).
                    Uncomment when ready to expose raw JSON downloads.
                  */}
                  {/* <button
                    className="json-btn futuristic-btn"
                    onClick={handleDownloadJSON}
                  >
                    <span className="btn-icon">📊</span>
                    Download JSON
                  </button> */}

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
              // Error display
              <div className="result-card error-detected">
                <div className="error-header">
                  <h3>❌ Analysis Failed</h3>
                </div>
                
                <div className="error-message">
                  <p>{error}</p>
                  
                  {/* ONLY show upgrade prompt for subscription required errors */}
                  {errorDetails?.type === 'subscription_required' && <UpgradePrompt />}
                  
                  {errorDetails && errorDetails.type !== 'subscription_required' && (
                    <div className="error-details">
                      <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
                    </div>
                  )}
                </div>
                
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
        {result?.usage.oversized_files && (
          <div className="compact-warning-banner">
            <div className="warning-stripes"></div>
            <div className="warning-content">
              <span className="warning-pulse"></span>
              <span className="warning-message">
                ⚠ One or more files exceeded the 30 MB upload limit
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoClassification;
