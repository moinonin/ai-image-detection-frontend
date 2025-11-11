import React, { useState } from 'react';
import { classificationService } from '../services/api';
import { VideoSummary, isCachedResponse} from '../types';

type EmailResultProps = VideoSummary;

const VideoClassification: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [modelType, setModelType] = useState('ml');
  const [partialAnalysis, setPartialAnalysis] = useState(true);
  const [result, setResult] = useState<VideoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  //const [reportFormat] = useState<ReportFormat>('pdf');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [usedCache, setUsedCache] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      // Reset states when new file is selected
      setAnalysisComplete(false);
      setUsedCache(false);
      setResult(null);
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
      // Reset states when new file is selected
      setAnalysisComplete(false);
      setUsedCache(false);
      setResult(null);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedFile) return;

  setLoading(true);
  setResult(null);
  setAnalysisComplete(false);
  setUsedCache(false);
  
  try {
    // Remove the reportFormat parameter since it's not needed
    const response = await classificationService.classifyVideo(
      selectedFile, 
      modelType, 
      partialAnalysis
    );
    
    // Handle both response formats using type guard
    let analysisResults: VideoSummary;
    let cacheUsed = false;
    
    if (isCachedResponse(response)) {
      analysisResults = response.analysis_results;
      cacheUsed = response.from_cache || response.cache_used;
    } else {
      analysisResults = response;
      cacheUsed = false;
    }
    
    setResult(analysisResults);
    setUsedCache(cacheUsed);
    setAnalysisComplete(true);
    
  } catch (error: any) {
    // Error handling...
  } finally {
    setLoading(false);
  }
};

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 80) return '#00ff00';
    if (confidence > 60) return '#ffff00';
    return '#ff4444';
  };

  const handleEmailResults = async (result: EmailResultProps): Promise<void> => {
    try {
      console.log('Emailing results:', result);
      alert('Email functionality would be implemented here');
    } catch (error) {
      console.error('Failed to email results:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleDownloadPDF = async (): Promise<void> => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      console.log('Downloading PDF report...');
      const pdfBlob = await classificationService.downloadVideoPDF(
        selectedFile,
        modelType,
        partialAnalysis
      );
      
      // Create and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `video_analysis_report_${selectedFile.name.split('.')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
    } catch (error: any) {
      console.error('PDF download failed:', error);
      alert('PDF download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  {/*const handleDownloadJSON = (result: VideoSummary): void => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_analysis_${result.filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };*/}

  // Reset analysis state when settings change
  React.useEffect(() => {
    if (analysisComplete) {
      setAnalysisComplete(false);
      setUsedCache(false);
    }
  }, [modelType, partialAnalysis]);

  // Get button text based on current state
  const getButtonText = () => {
    if (loading) {
      return (
        <>
          <div className="spinner"></div>
          Analyzing Video...
        </>
      );
    }
    
    if (analysisComplete) {
      if (usedCache) {
        return 'Analysis Complete (Cached)';
      } else {
        return 'Analysis Complete';
      }
    }
    
    return 'Analyze Video';
  };

  // Get button class based on state
  const getButtonClass = () => {
    let className = 'analyze-btn';
    if (analysisComplete && !loading) {
      className += ' analysis-complete';
    }
    return className;
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
              disabled={!selectedFile || (loading && !analysisComplete)}
              className={getButtonClass()}
            >
              {getButtonText()}
            </button>
          </form>
        </div>

        {result && analysisComplete && (
          <div className="results-section">
            <div className="results-header">
              <h2>Video Analysis Results</h2>
              {usedCache && (
                <div className="cache-indicator">
                  <span className="cache-badge">Cached Results</span>
                  <span className="cache-info">Using previously analyzed data</span>
                </div>
              )}
            </div>
            
            {/* Check if we have valid classification results or error response */}
            {result.dominant_class ? (
              // Normal classification results
              <div className={`result-card ${result.dominant_class.includes('AI') ? 'ai-detected' : 'human-detected'}`}>
                <div className="result-header">
                  <h3>{result.filename}</h3>
                  <span className="result-badge">
                    {result.dominant_class}
                  </span>
                </div>
                
                <div className="confidence-meters">
                  <div className="confidence-meter">
                    <div className="confidence-label">
                      AI Confidence: {result.confidence_ai}%
                    </div>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ 
                          width: `${result.confidence_ai}%`,
                          backgroundColor: getConfidenceColor(result.confidence_ai)
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="confidence-meter">
                    <div className="confidence-label">
                      Human Confidence: {result.confidence_human}%
                    </div>
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill"
                        style={{ 
                          width: `${result.confidence_human}%`,
                          backgroundColor: getConfidenceColor(result.confidence_human)
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="result-details">
                  <div className="detail-item">
                    <span className="detail-label">Model Used:</span>
                    <span className="detail-value">{result.model?.toUpperCase() || modelType.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Analysis Type:</span>
                    <span className="detail-value">{result.analysis_type || (partialAnalysis ? 'Partial' : 'Full')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Analysis Detail:</span>
                    <span className="detail-value">{result['analysis detail'] || (partialAnalysis ? 'Partial video analysis' : 'Full video analysis')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Frames Analyzed:</span>
                    <span className="detail-value">{result.total_frames_analyzed}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">AI Frames:</span>
                    <span className="detail-value">{result.ai_frames}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Human Frames:</span>
                    <span className="detail-value">{result.human_frames}</span>
                  </div>
                  {result.average_ai_confidence > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Avg AI Confidence:</span>
                      <span className="detail-value">{(result.average_ai_confidence * 100).toFixed(2)}%</span>
                    </div>
                  )}
                  {result.average_human_confidence > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Avg Human Confidence:</span>
                      <span className="detail-value">{(result.average_human_confidence * 100).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="action-buttons">
                  <button 
                    className="email-btn futuristic-btn"
                    onClick={() => handleEmailResults(result)}
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
                  
                  {/*<button 
                    className="json-btn futuristic-btn"
                    onClick={() => handleDownloadJSON(result)}
                  >
                    <span className="btn-icon">📊</span>
                    Download JSON
                  </button>*/}
                </div>
              </div>
            ) : result.summary ? (
              // Large file error response
              <div className="result-card error">
                <div className="result-header">
                  <h3>File Processing Summary</h3>
                  <span className="result-badge error-badge">
                    Large Files Detected
                  </span>
                </div>
                
                <div className="error-summary">
                  <p><strong>The following issues were encountered while processing your upload:</strong></p>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-label">Accepted Files:</span>
                      <span className="stat-value accepted">{result.summary.accepted}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Rejected Files:</span>
                      <span className="stat-value rejected">{result.summary.rejected}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Uploaded Size:</span>
                      <span className="stat-value">{result.summary.total_uploaded_MB} MB</span>
                    </div>
                  </div>
                </div>

                {result.details && result.details.length > 0 && (
                  <div className="file-details">
                    <h4>File Details:</h4>
                    <div className="file-list">
                      {result.details.map((file, index) => (
                        <div key={index} className={`file-item ${file.status}`}>
                          <div className="file-info">
                            <div className="file-name">{file.file_name || `File ${index + 1}`}</div>
                            <div className="file-status">
                              <span className={`status-badge ${file.status}`}>
                                {file.status.toUpperCase()}
                              </span>
                              {file.file_size_MB && (
                                <span className="file-size">({file.file_size_MB} MB)</span>
                              )}
                            </div>
                          </div>
                          {file.message && (
                            <div className="file-message">{file.message}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="error-help">
                  <p><strong>Recommended Actions:</strong></p>
                  <ul>
                    <li>Try uploading smaller video files</li>
                    <li>Check your internet connection for large uploads</li>
                    <li>Contact support if you need to process large videos regularly</li>
                  </ul>
                </div>
              </div>
            ) : (
              // Fallback for unexpected result format
              <div className="result-card error">
                <div className="result-header">
                  <h3>Processing Error</h3>
                  <span className="result-badge error-badge">
                    Unknown Error
                  </span>
                </div>
                <div className="error-message">
                  <p>Unable to process the video file. The file may be corrupted, in an unsupported format, or there was a server error.</p>
                  <p>Please try again with a different file or contact support if the issue persists.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoClassification;