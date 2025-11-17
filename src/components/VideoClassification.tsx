import React, { useState } from 'react';
import { classificationService } from '../services/api';
import { VideoClassificationResponse, VideoSummary } from '../types';

type EmailResultProps = VideoSummary;

const VideoClassification: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [modelType, setModelType] = useState('ml');
  const [partialAnalysis, setPartialAnalysis] = useState(true);
  const [result, setResult] = useState<VideoClassificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

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
      
    } catch (error: any) {
      console.error('Video classification failed:', error);
      
      if (error.message.includes('402')) {
        setError('You have exhausted your free analyses. Please subscribe to continue using the service.');
        setErrorDetails({
          type: 'subscription_required',
          message: 'Upgrade your account to unlock more analyses'
        });
      } else if (error.name === 'FileSizeError' && error.details) {
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
    if (confidence > 80) return '#00ff00';
    if (confidence > 60) return '#ffff00';
    return '#ff4444';
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

  const handleEmailResults = (result: EmailResultProps): void => {
    console.log('Email video results:', result);
  };

  // Update the handleDownloadPDF function in your VideoClassification component
  // In your VideoClassification component, replace handleDownloadPDF with:
  const handleDownloadPDF = async (): Promise<void> => {
    if (!result) return;

    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleDownloadJSON = (): void => {
    if (!analysisResult) return;
    
    const dataStr = JSON.stringify(analysisResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_analysis_${analysisResult.filename || 'result'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="video-classification">
      <div className="page-header">
        <h1>Video Analysis</h1>
        <p>Upload a video to detect if it's AI-generated or human-created</p>
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
                  <h3>{analysisResult.filename || selectedFile?.name || 'Unknown File'}</h3>
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

                {/* Usage info from the top level */}
                {result?.usage && (
                  <div className="usage-info">
                    <div className="detail-item">
                      <span className="detail-label">Free Analyses Remaining:</span>
                      <span className="detail-value">{result.usage.free_analyses_remaining}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Used This Month:</span>
                      <span className="detail-value">{result.usage.free_analyses_used_this_month}</span>
                    </div>
                    {result.usage.subscription_used && (
                      <div className="detail-item">
                        <span className="detail-label">Subscription:</span>
                        <span className="detail-value">Active</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="action-buttons">
                  <button
                    className="email-btn futuristic-btn"
                    onClick={() => handleEmailResults(analysisResult)}
                  >
                    <span className="btn-icon">✉️</span>
                    Email Results
                  </button>

                  <button
                    className="pdf-btn futuristic-btn"
                    onClick={handleDownloadPDF}
                    disabled={loading}
                  >
                    <span className="btn-icon">📄</span>
                    {loading ? 'Generating PDF...' : 'Download PDF Report'}
                  </button>

                  <button
                    className="json-btn futuristic-btn"
                    onClick={handleDownloadJSON}
                  >
                    <span className="btn-icon">📊</span>
                    Download JSON
                  </button>
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
                  
                  {errorDetails?.type === 'subscription_required' && (
                  <div className="subscription-prompt">
                    <div className="upgrade-options">
                      <h4>✨ Upgrade Your Account</h4>
                      <p>You've used all your free analyses this month. Choose a plan to continue:</p>
                      
                      <div className="plan-actions">
                        <button 
                          className="plan-btn explorer"
                          onClick={() => window.location.href = '/pricing?plan=explorer'}
                        >
                          <span className="plan-name">Explorer Plan</span>
                          <span className="plan-price">$19/month</span>
                        </button>
                        <button 
                          className="plan-btn pro primary"
                          onClick={() => window.location.href = '/pricing?plan=pro'}
                        >
                          <span className="plan-name">Pro Plan</span>
                          <span className="plan-price">$79/month</span>
                        </button>
                      </div>

                      <div className="contact-support">
                        <p>Need help choosing? <a href="/contact">Contact our support team</a></p>
                      </div>
                    </div>
                  </div>
                  )}
                  
                  {errorDetails && errorDetails.type !== 'subscription_required' && (
                    <div className="error-details">
                      <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
                    </div>
                  )}
                </div>
                
                {errorDetails?.type !== 'subscriptition_required' && (
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

export default VideoClassification;