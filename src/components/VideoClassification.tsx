import React, { useState } from 'react';
import { classificationService } from '../services/api';
import { VideoSummary, ReportFormat} from '../types';

type EmailResultProps = VideoSummary;

const VideoClassification: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [modelType, setModelType] = useState('ml');
  const [partialAnalysis, setPartialAnalysis] = useState(true);
  const [result, setResult] = useState<VideoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [reportFormat] = useState<ReportFormat>('pdf'); // Changed from 'json'
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

    console.log('=== DEBUG VIDEO UPLOAD ===');
    console.log('File:', selectedFile);
    console.log('File name:', selectedFile.name);
    console.log('File type:', selectedFile.type);
    console.log('File size:', selectedFile.size);
    console.log('Model:', modelType);
    console.log('Partial:', partialAnalysis);

    setLoading(true);
    setResult(null);
    
    try {
      const videoResult = await classificationService.classifyVideo(
        selectedFile, 
        modelType, 
        partialAnalysis
      );
      console.log('=== SUCCESS ===');
      console.log('Result:', videoResult);
      setResult(videoResult);
    } catch (error: any) {
      console.log('=== ERROR DETAILS ===');
      console.log('Full error:', error);
      console.log('Error message:', error.message);
      
      let errorMessage = 'Video analysis failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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
      // Implement email functionality here
      // This could be an API call to your backend email service
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
      a.download = `video_analysis_report_${selectedFile.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
    } catch (error: any) {
      console.error('PDF download failed:', error);
      alert('PDF download failed. Please try again.');
    }
  };
  const handleDownloadJSON = (result: VideoSummary): void => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video_analysis_${result.filename}.json`;
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
              />
              <div className="upload-content">
                <div className="upload-icon">🎥</div>
                <p>
                  {selectedFile 
                    ? `Selected: ${selectedFile.name}`
                    : 'Drag & drop a video or click to browse'
                  }
                </p>
                <button type="button" className="browse-btn">
                  Browse Files
                </button>
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

        {result && (
          <div className="results-section">
            <h2>Video Analysis Results</h2>
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
                  <span className="detail-value">{result.model.toUpperCase()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Analysis Type:</span>
                  <span className="detail-value">{result.analysis_type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Analysis Detail:</span>
                  <span className="detail-value">{result['analysis detail']}</span>
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
              {/* Action Buttons - Apply SingleClassification pattern */}
              <div className="action-buttons">
                <button 
                  className="email-btn futuristic-btn"
                  onClick={() => handleEmailResults(result)}
                >
                  <span className="btn-icon">✉️</span>
                  Email Results
                </button>
                
                {/* Show PDF download only if PDF format was used or available */}
                {reportFormat === 'pdf' && (
                  <button 
                    className="pdf-btn futuristic-btn"
                    onClick={() => handleDownloadPDF()}
                  >
                    <span className="btn-icon">📄</span>
                    Download PDF Report
                  </button>
                )}
                
                {/* Show JSON download only if JSON format was used */}
                {reportFormat === 'json' && (
                  <button 
                    className="json-btn futuristic-btn"
                    onClick={() => handleDownloadJSON(result)}
                  >
                    <span className="btn-icon">📊</span>
                    Download JSON
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoClassification;