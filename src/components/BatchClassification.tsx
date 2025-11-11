import React, { useState, useRef } from 'react';
import { classificationService } from '../services/api';
import { BatchJob, IndividualClassificationResult } from '../types';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift()!;
  return null;
}

const BatchClassification: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [model, setModel] = useState('scalpel');
  const [loading, setLoading] = useState(false);
  const [, setPdfLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<BatchJob | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportFormat: 'pdf' | 'json' = 'pdf';

  const renderDownloadButton = () => {
    if (reportFormat === 'pdf') {
      return (
        <button 
          className="pdf-btn futuristic-btn"
          onClick={() => handleDownloadBatchPDF(jobStatus)}
        >
          <span className="btn-icon">📄</span>
          Download Batch PDF
        </button>
      );
    }
    if (reportFormat === 'json') {
      return (
        <button 
          className="pdf-btn futuristic-btn"
          onClick={() => handleDownloadBatchPDF(jobStatus!)}
          disabled={!jobStatus}
        >
          <span className="btn-icon">📄</span>
          Download Batch PDF
        </button>
      );
    }
    return null;
  };

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
      const response = await classificationService.startBatchJob(
        selectedFiles, 
        model
      );
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

  const handleEmailBatchResults = async (jobStatus: BatchJob): Promise<void> => {
    try {
      console.log('Emailing batch results:', jobStatus);
      // Implement batch email functionality
      alert('Batch email functionality would be implemented here');
    } catch (error) {
      console.error('Failed to email batch results:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleDownloadBatchPDF = async (jobStatus: BatchJob | null): Promise<void> => {
    if (!jobStatus || !selectedFiles.length) return;

    setPdfLoading(true);
    try {
      console.log('Downloading batch PDF report...');
      const pdfBlob = await classificationService.downloadBatchPDF(
        selectedFiles,
        model
      );
      
      // Create and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `batch_analysis_report_${jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('Batch PDF downloaded successfully');
    } catch (error: any) {
      console.error('Batch PDF download failed:', error);
      alert('Batch PDF download failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  {/*const handleDownloadBatchJSON = (jobStatus: BatchJob): void => {
    const dataStr = JSON.stringify(jobStatus, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_classification_${jobId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };*/}

  {/*const handleDownloadPDF = async (result: any): Promise<void> => {
    setPdfLoading(true);
    try {
      const pdfBlob = await classificationService.downloadBatchPDF([result], model);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${result.filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('PDF download failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };*/}

const handleDownloadPDF = async (
  resultOrResults: IndividualClassificationResult | IndividualClassificationResult[]
): Promise<void> => {
  try {
    const results = Array.isArray(resultOrResults) ? resultOrResults : [resultOrResults];
    
    console.log('📤 Generating PDF for individual result:', {
      filename: results[0].filename,
      resultsCount: results.length
    });

    // Use the API function instead of direct fetch
    const pdfBlob = await generatePDFReport(results, 'individual');

    // Create and trigger download
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `analysis_${results[0].filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('Individual PDF downloaded successfully');
  } catch (error: any) {
    console.error('Individual PDF download failed:', error);
    alert(error.message || 'PDF download failed. Please try again.');
  }
};

const generatePDFReport = async (results: any[], reportType: string = 'individual') => {
  // Get the authentication token (adjust based on how you store it)
  const token = localStorage.getItem('auth_token') || 
                sessionStorage.getItem('auth_token') ||
                getCookie('auth_token'); // Use whatever method you use
  
  console.log('📤 Calling PDF endpoint with authentication');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch('/api/v1/generate-pdf', {
    method: 'POST',
    headers,
    body: JSON.stringify({ results, reportType }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PDF generation failed:', response.status, errorText);
    
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    throw new Error(`Failed to generate PDF: ${response.status}`);
  }
  
  return response.blob();
};

const handleEmailResults = (result: any) => {
  console.log('Email single result:', result);
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
                style={{ display: 'none' }}
              />
              <div className="upload-content">
                <div className="upload-icon">📂</div>
                <p>
                  {selectedFiles.length > 0 
                    ? `${selectedFiles.length} files selected`
                    : 'Drag & drop images or use the button below to browse'
                  }
                </p>
                <label htmlFor={fileInputRef.current?.id || 'file-upload'} className="browse-btn" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </label>
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

              {/* Batch-level action buttons - User decides after seeing results */}
              <div className="action-buttons">
                <button 
                  className="email-btn futuristic-btn"
                  onClick={() => handleEmailBatchResults(jobStatus)}
                >
                  <span className="btn-icon">✉️</span>
                  Email Batch Report
                </button>
                
                {/* Show PDF download only if PDF format was used or available */}
                {renderDownloadButton()}
              </div>
              
              {jobStatus.results && (
                <div className="results-preview">
                  <h4>Results Preview:</h4>
                  <div className="results-grid">
                    {jobStatus.results
                      .slice(0, isExpanded ? jobStatus.results.length : 5)
                      .map((result: any, index: number) => (
                        <div key={index} className="result-container">
                          <div 
                            className={`result-item ${expandedIndex === index ? 'expanded' : ''}`}
                            onClick={() => toggleExpand(index)}
                          >
                            <span className="filename">{result.filename || `Image ${index + 1}`}</span>
                            <span className={`prediction ${result.predicted_class.includes('AI') ? 'ai' : 'human'}`}>
                              {result.predicted_class}
                            </span>
                          </div>
                          
                          {expandedIndex === index && (
                            <div className="result-details-expanded">
                              <div className={`result-card ${result.predicted_class.includes('AI') ? 'ai-detected' : 'human-detected'}`}>
                                <div className="result-header">
                                  <h3>{result.filename}</h3>
                                  <span className="result-badge">
                                    {result.predicted_class}
                                  </span>
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
                                {/* Individual result action buttons - Apply SingleClassification pattern
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
                                  {reportFormat === 'pdf' && (
                                    <button 
                                      className="pdf-btn futuristic-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('🖱️ Button clicked for:', result.filename);
                                        handleDownloadPDF(result);
                                      }}
                                    >
                                      <span className="btn-icon">📄</span>
                                      Download This PDF
                                    </button>
                                  )}
                                  {/* Show JSON download only if JSON format was used */}
                                  {/*renderDownloadButton()}
                                </div> */}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchClassification;
