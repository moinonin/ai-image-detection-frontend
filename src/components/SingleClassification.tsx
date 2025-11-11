import React, { useState } from 'react';
import { classificationService } from '../services/api';
import { ClassificationResult, EmailResultsParams, ReportFormat } from '../types';

const SingleClassification: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [modelType, setModelType] = useState('ml');
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf'); // Add report format state
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
    try {
      const classificationResult = await classificationService.classifySingleImage(
        selectedFile, 
        modelType,
        reportFormat  // Add reportFormat parameter
      );
      setResult(classificationResult);
    } catch (error) {
      console.error('Classification failed:', error);
      alert('Classification failed. Please try again.');
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

  const handleDownloadPDF = (result: ClassificationResult): void => {
    // Enhanced PDF download handler
    console.log('Download PDF:', result);
    
    // If the backend returns a PDF blob directly, you can handle it here
    if (result.pdfBlob) {
      const url = window.URL.createObjectURL(result.pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `classification_report_${result.filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
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

        {result && (
          <div className="results-section">
            <h2>Analysis Results</h2>
            <div className={`result-card ${result.predicted_class.includes('AI') ? 'ai-detected' : 'human-detected'}`}>
              <div className="result-header">
                <h3>{result.filename}</h3>
                <span className="result-badge">
                  {result.predicted_class}
                </span>
              </div>
              
              <div className="confidence-meter">
                <div className="confidence-label">
                  Confidence: {(result.confidence! * 100).toFixed(2)}%
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{ 
                      width: `${result.confidence! * 100}%`,
                      backgroundColor: getConfidenceColor(result.confidence!)
                    }}
                  ></div>
                </div>
              </div>

              <div className="result-details">
                <div className="detail-item">
                  <span className="detail-label">Model Used:</span>
                  <span className="detail-value">{result.model.toUpperCase()}</span>
                </div>
                {result.probability != null && (
                  <div className="detail-item">
                    <span className="detail-label">Probability Score:</span>
                    <span className="detail-value">{result.probability.toFixed(4)}</span>
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

              {/* Updated Action Buttons */}
              <div className="action-buttons">
                <button 
                  className="email-btn futuristic-btn"
                  onClick={() => handleEmailResults({
                    confidence: result.confidence!,
                    predicted_class: result.predicted_class,
                    filename: result.filename,
                    model: result.model,
                    probability: result.probability,
                  })}
                >
                  <span className="btn-icon">✉️</span>
                  Email Results
                </button>
                
                {/* Show PDF download only if PDF format was used or available */}
                {(reportFormat === 'pdf' || result.pdfBlob) && (
                  <button 
                    className="pdf-btn futuristic-btn"
                    onClick={() => handleDownloadPDF(result)}
                  >
                    <span className="btn-icon">📄</span>
                    Download PDF Report
                  </button>
                )}
                
                {/* Optional: Add JSON download button */}
                {reportFormat === 'json' && (
                  <button 
                    className="json-btn futuristic-btn"
                    onClick={() => {
                      const dataStr = JSON.stringify(result, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `classification_${result.filename}.json`;
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleClassification;