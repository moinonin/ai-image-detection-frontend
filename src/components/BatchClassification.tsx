import React, { useState, useRef } from 'react';
import { classificationService } from '../services/api';
import { BatchJob } from '../types';

const BatchClassification: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  /*const [model, setModel] = useState('ml');*/
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [model, setModel] = useState('scalpel');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<BatchJob | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setLoading(true);
    try {
      const response = await classificationService.startBatchJob(selectedFiles, model);
      setJobId(response.job_id);
      // Start polling for status
      pollJobStatus(response.job_id);
    } catch (error) {
      console.error('Failed to start batch job:', error);
      alert('Failed to start batch processing. Please try again.');
      setLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await classificationService.getBatchJobStatus(jobId);
        setJobStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'var(--warning-color)';
      case 'completed': return 'var(--success-color)';
      case 'failed': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
    }
  };
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return '#00ff00';
    if (confidence > 0.6) return '#ffff00';
    return '#ff4444';
  };

  const handleEmailBatchResults = (jobStatus: BatchJob): void => {
    // Implement batch email functionality
    console.log('Email batch results:', jobStatus);
  };

  interface BatchPDFHandler {
    (jobStatus: BatchJob | null): void;
  }

  const handleDownloadBatchPDF: BatchPDFHandler = (jobStatus: BatchJob | null): void => {
    // Implement batch PDF download functionality
    console.log('Download batch PDF:', jobStatus);
  };

  const handleEmailResults = (result: any) => {
    // Implement single result email functionality
    console.log('Email single result:', result);
  };

  const handleDownloadPDF = (result: any) => {
    // Implement single PDF download functionality
    console.log('Download single PDF:', result);
  };

  return (
    <div className="batch-classification">
      <div className="page-header">
        <h1>Batch Image Analysis</h1>
        <p>Process multiple images simultaneously with advanced AI models</p>
      </div>

      <div className="batch-container">
        <div className="upload-section">
          <form onSubmit={handleSubmit} className="upload-form">
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <div className="upload-content">
                <div className="upload-icon">📂</div>
                <p>
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} files selected`
                    : 'Drag & drop images or click to browse'
                  }
                </p>
                <button type="button" className="browse-btn" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </button>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h4>Selected Files:</h4>
                <div className="files-list">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button 
                        type="button" 
                        className="remove-file"
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="model-selection">
              <label htmlFor="batch-model">Detection Model:</label>
              <select 
                id="batch-model"
                value={model} 
                onChange={(e) => setModel(e.target.value)}
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
              disabled={selectedFiles.length === 0 || loading}
              className="analyze-btn"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing {selectedFiles.length} Images...
                </>
              ) : (
                `Process ${selectedFiles.length} Images`
              )}
            </button>
          </form>
        </div>

        {jobStatus && (
                    <div className="job-status">
                      <h2>Batch Processing Status</h2>
                      <div className="status-card">
                        <div className="status-header">
                          <h3>Job: {jobId}</h3>
                          <span 
                            className="status-badge"
                            style={{ color: getStatusColor(jobStatus.status) }}
                          >
                            {jobStatus.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="progress-section">
                          <div className="progress-info">
                            <span>Processed: {jobStatus.processed} / {jobStatus.total_images}</span>
                            <span>{Math.round((jobStatus.processed / jobStatus.total_images) * 100)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ 
                                width: `${(jobStatus.processed / jobStatus.total_images) * 100}%`,
                                backgroundColor: getStatusColor(jobStatus.status)
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Batch-level action buttons */}
                        <div className="action-buttons">
                          <button 
                            className="email-btn futuristic-btn"
                            onClick={() => handleEmailBatchResults(jobStatus)}
                          >
                            <span className="btn-icon">✉️</span>
                            Email Batch Report
                          </button>
                          <button 
                            className="pdf-btn futuristic-btn"
                            onClick={() => handleDownloadBatchPDF(jobStatus)}
                          >
                            <span className="btn-icon">📄</span>
                            Download Batch PDF
                          </button>
                        </div>
                        
                        {jobStatus.results && (
                          <div className="results-preview">
                            <h4>Results Preview:</h4>
                            <div className="results-grid">
                              {jobStatus.results
                                .slice(0, isExpanded ? jobStatus.results.length : 5)
                                .map((result: any, index: number) => (
                                  <div key={index} className="result-container">
                                    {/* Clickable summary item - maintains your current layout */}
                                    <div 
                                      className={`result-item ${expandedIndex === index ? 'expanded' : ''}`}
                                      onClick={() => toggleExpand(index)}
                                    >
                                      <span className="filename">{result.filename || `Image ${index + 1}`}</span>
                                      <span className={`prediction ${result.predicted_class.includes('AI') ? 'ai' : 'human'}`}>
                                        {result.predicted_class}
                                      </span>
                                    </div>
                                    
                                    {/* Expanded details card - appears below the item in grid */}
                                    {expandedIndex === index && (
                                      <div className="result-details-expanded">
                                        <div className={`result-card ${result.predicted_class.includes('AI') ? 'ai-detected' : 'human-detected'}`}>
                                          <div className="result-header">
                                            <h3>{result.filename}</h3>
                                            <span className="result-badge">
                                              {result.predicted_class}
                                            </span>
                                          {/* Individual result action buttons */}
                                          <div className="action-buttons">
                                            <button 
                                              className="email-btn futuristic-btn"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEmailResults(result);
                                              }}
                                            >
                                              <span className="btn-icon">✉️</span>
                                              Email This Result
                                            </button>
                                            <button 
                                              className="pdf-btn futuristic-btn"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadPDF(result);
                                              }}
                                            >
                                              <span className="btn-icon">📄</span>
                                              Download This PDF
                                            </button>
                                          </div>
                                          </div>
                                          
                                          <div className="confidence-meter">
                                            <div className="confidence-label">
                                              Confidence: {result.confidence != null ? `${(result.confidence * 100).toFixed(2)}%` : 'N/A'}
                                            </div>
                                            <div className="confidence-bar">
                                              <div 
                                                className="confidence-fill"
                                                style={{ 
                                                  width: `${(result.confidence || 0) * 100}%`,
                                                  backgroundColor: getConfidenceColor(result.confidence || 0)
                                                }}
                                              ></div>
                                            </div>
                                          </div>

                                          <div className="result-details">
                                            <div className="detail-item">
                                              <span className="detail-label">Model Used:</span>
                                              <span className="detail-value">{result.model?.toUpperCase()}</span>
                                            </div>
                                            {result.probability != null && (
                                              <div className="detail-item">
                                                <span className="detail-label">Probability Score:</span>
                                                <span className="detail-value">{result.probability.toFixed(4)}</span>
                                              </div>
                                            )}
                                            <div className="detail-item">
                                              <span className="detail-label">Analysis Type:</span>
                                              <span className="detail-value">Batch Analysis</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                            
                            {jobStatus.results.length > 5 && (
                              <div className="results-expand">
                                <button 
                                  className="expand-button"
                                  onClick={() => setIsExpanded(!isExpanded)}
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Show less</span>
                                      <span className="expand-icon">▲</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Show all {jobStatus.results.length} results</span>
                                      <span className="expand-icon">▼</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {jobStatus.error && (
                          <div className="error-message">
                            <strong>Error:</strong> {jobStatus.error}
                          </div>
                        )}
                      </div>
                    </div>)}
      </div>
    </div>
  );
};

export default BatchClassification;