import React, { useState } from 'react';
import { classificationService } from '../services/api';
import { ClassificationResult, EmailResultsParams, ReportFormat } from '../types';

// Local type that matches what the API returns
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

const SingleClassification: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [modelType, setModelType] = useState('ml');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');
  const [result, setResult] = useState<SingleClassificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

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
        reportFormat 
      });
      
      const result = await classificationService.classifySingleImage(
        selectedFile, 
        modelType,
        reportFormat
      );
      
      console.log('API result:', result);
      
      if (result.analysis && Object.keys(result.analysis).length > 0) {
        setResult(result);
      } else {
        setError('No analysis data received from server');
      }
    } catch (error: any) {
      console.error('Classification failed:', error);
      
      // Handle specific error cases
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
    if (confidence > 0.8) return '#00ff00';
    if (confidence > 0.6) return '#ffff00';
    return '#ff4444';
  };

  const handleEmailResults = (result: EmailResultsParams): void => {
    console.log('Email results:', result);
  };

  const handleDownloadPDF = (): void => {
    if (result?.pdfBlob) {
      const url = window.URL.createObjectURL(result.pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `classification_report_${selectedFile?.name || 'result'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const analysisResult = result?.analysis;

  const getPredictedClass = (): string => {
    if (!analysisResult) return 'Unknown';
    
    // Check if we have the actual predicted_class from analysis
    if (analysisResult.predicted_class && analysisResult.predicted_class !== 'Analysis Complete') {
      return analysisResult.predicted_class;
    }
    
    // Fallback to checking is_ai flag if predicted_class is not available
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

  return (
    <div className="single-classification">
      <div className="page-header">
        <h1>Single Image Analysis</h1>
        <p>Upload an image to detect if it's AI-generated or human-created</p>
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

            <div className="report-format-selection">
              <label htmlFor="report-format">Report Format:</label>
              <select 
                id="report-format"
                value={reportFormat} 
                onChange={(e) => setReportFormat(e.target.value as ReportFormat)}
                className="report-format-select"
              >
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
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

        {(analysisResult || error) && (
          <div className="results-section">
            <h2>Analysis Results</h2>

            {analysisResult && !error ? (
              <div className={`result-card ${getAIDetectedClass()}`}>
                <div className="result-header">
                  <h3>{analysisResult.filename || selectedFile?.name || 'Unknown File'}</h3>
                  <span className="result-badge">{getPredictedClass()}</span>
                </div>

                {/* Show a warning if we're using fallback data */}
                {/*analysisResult.predicted_class === 'Analysis Complete' && (
                  <div className="data-warning">
                    <span className="warning-icon">⚠️</span>
                    <span>Showing basic analysis results. Full details available in PDF report.</span>
                  </div>
                )*/}

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

                <div className="action-buttons">
                  <button
                    className="email-btn futuristic-btn"
                    onClick={() =>
                      handleEmailResults({
                        confidence: analysisResult.confidence,
                        predicted_class: getPredictedClass(),
                        filename: analysisResult.filename || 'Unknown',
                        model: analysisResult.model || 'Unknown',
                        probability: analysisResult.probability,
                      })
                    }
                  >
                    <span className="btn-icon">✉️</span>
                    Email Results
                  </button>

                  {(reportFormat === "pdf" && result?.pdfBlob) && (
                    <button
                      className="pdf-btn futuristic-btn"
                      onClick={handleDownloadPDF}
                    >
                      <span className="btn-icon">📄</span>
                      Download PDF Report
                    </button>
                  )}

                  {reportFormat === "json" && (
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
                  )}
                </div>
              </div>
            ) : (
              // ERROR DISPLAY SECTION - REPLACED WITH PROPER ERROR HANDLING
              <div className="result-card error-detected">
                <div className="error-header">
                  <h3>❌ Analysis Failed</h3>
                </div>
                
                <div className="error-message">
                  <p>{error}</p>
                  
                  {/* Special handling for subscription required error */}
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
                  
                  {/* Show error details for file size errors */}
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