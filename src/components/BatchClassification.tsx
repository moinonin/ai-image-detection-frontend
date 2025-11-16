import React, { useState, useRef } from 'react';
import { classificationService } from '../services/api';
import { BatchJob, IndividualClassificationResult, FileValidationError } from '../types';

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
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);

  // Client-side file size validation constants
  const MAX_FILE_SIZE_MB = 0.5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const validateFiles = (files: File[]): FileValidationError | null => {
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE_BYTES);
    
    if (oversizedFiles.length === 0) {
      return null;
    }

    return {
      error: "Some files exceed size limits",
      summary: {
        accepted: files.length - oversizedFiles.length,
        rejected: oversizedFiles.length,
        total_uploaded_MB: files.reduce((acc, file) => acc + (file.size / (1024 * 1024)), 0),
        max_size: 5,
        max_file_size_MB: MAX_FILE_SIZE_MB
      },
      details: files.map(file => ({
        filename: file.name,
        status: file.size > MAX_FILE_SIZE_BYTES ? 'rejected' : 'accepted',
        file_size_MB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        reason: file.size > MAX_FILE_SIZE_BYTES ? `Exceeded size limit (max ${MAX_FILE_SIZE_MB} MB per file)` : undefined
      })),
      accepted_files: files.filter(file => file.size <= MAX_FILE_SIZE_BYTES)
    };
  };

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
      const files = Array.from(event.target.files);
      
      // Validate files immediately when selected
      const validationResult = validateFiles(files);
      if (validationResult) {
        setValidationError(validationResult);
        // Still set selected files so user can see all files, but validation error will prevent submission
        setSelectedFiles(files);
      } else {
        setSelectedFiles(files);
        setValidationError(null);
      }
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
      const files = Array.from(e.dataTransfer.files);
      
      // Validate files immediately when dropped
      const validationResult = validateFiles(files);
      if (validationResult) {
        setValidationError(validationResult);
        setSelectedFiles(files);
      } else {
        setSelectedFiles(files);
        setValidationError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    // Check for client-side validation errors before submitting
    const clientValidationError = validateFiles(selectedFiles);
    if (clientValidationError) {
      setValidationError(clientValidationError);
      return; // Prevent submission
    }

    setLoading(true);
    setValidationError(null);
    setJobStatus(null);
    setJobId(null);

    try {
      const response = await classificationService.startBatchJob(
        selectedFiles, 
        model
      );
      setJobId(response.job_id);
      pollJobStatus(response.job_id);
    } catch (error: any) {
      console.error('Failed to start batch job:', error);
      
      // Check if this is a file validation error (from backend or client-side)
      if (error.error && error.summary && error.details) {
        setValidationError(error as FileValidationError);
      } else {
        alert('Failed to start batch processing. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleProceedWithAcceptedFiles = () => {
    if (!validationError) return;

    // Filter selected files to only include accepted ones
    const acceptedFilenames = validationError.details
      .filter(file => file.status === 'accepted')
      .map(file => file.filename);

    const acceptedFiles = selectedFiles.filter(file => 
      acceptedFilenames.includes(file.name)
    );

    if (acceptedFiles.length === 0) {
      alert('No accepted files to proceed with.');
      return;
    }

    setSelectedFiles(acceptedFiles);
    setValidationError(null);
    setLoading(true);

    // Retry the submission with only accepted files
    classificationService.startBatchJob(acceptedFiles, model)
      .then(response => {
        setJobId(response.job_id);
        pollJobStatus(response.job_id);
      })
      .catch(error => {
        console.error('Failed to start batch job with accepted files:', error);
        
        // Handle backend validation error even with filtered files
        if (error.error && error.summary && error.details) {
          setValidationError(error as FileValidationError);
        } else {
          alert('Failed to start batch processing. Please try again.');
        }
        setLoading(false);
      });
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        // Include individual_analyses in the request
        const status = await classificationService.getBatchJobStatus(jobId, true);
        console.log('=== BATCH JOB STATUS ===');
        console.log('Status:', status.status);
        console.log('Results array exists:', !!status.results);
        console.log('Results length:', status.results?.length);
        console.log('Individual analyses exists:', !!status.individual_analyses);
        console.log('Individual analyses length:', status.individual_analyses?.length);
        
        if (status.results && status.results.length > 0) {
          console.log('First result keys:', Object.keys(status.results[0]));
        }
        if (status.individual_analyses && status.individual_analyses.length > 0) {
          console.log('First individual analysis keys:', Object.keys(status.individual_analyses[0]));
        }
        
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
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // Revalidate after removal
    const validationResult = validateFiles(newFiles);
    setValidationError(validationResult);
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

  const handleDownloadPDF = async (
    resultOrResults: IndividualClassificationResult | IndividualClassificationResult[]
  ): Promise<void> => {
    try {
      const results = Array.isArray(resultOrResults) ? resultOrResults : [resultOrResults];
      
      console.log('📤 Generating PDF for individual result:', {
        filename: results[0].filename,
        resultsCount: results.length
      });

      const pdfBlob = await generatePDFReport(results, 'individual');

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
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('auth_token') ||
                  getCookie('auth_token');
    
    console.log('📤 Calling PDF endpoint with authentication');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
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
        <p className="file-size-info">Maximum file size: {MAX_FILE_SIZE_MB} MB per file</p>
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
                <p className="file-size-note">Max file size: {MAX_FILE_SIZE_MB} MB</p>
                <label htmlFor={fileInputRef.current?.id || 'file-upload'} className="browse-btn" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </label>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h4>Selected Files:</h4>
                <div className="files-list">
                  {selectedFiles.map((file, index) => {
                    const fileSizeMB = file.size / (1024 * 1024);
                    const isOversized = fileSizeMB > MAX_FILE_SIZE_MB;
                    
                    return (
                      <div key={index} className={`file-item ${isOversized ? 'oversized' : ''}`}>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({fileSizeMB.toFixed(2)} MB)</span>
                        <button 
                          type="button" 
                          className="remove-file"
                          onClick={() => removeFile(index)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* File Validation Error Display */}
            {validationError && (
              <div className="validation-error">
                <div className="error-header">
                  <h3>📁 File Validation Results</h3>
                  <span className="error-badge">{validationError.error}</span>
                </div>
                
                <div className="validation-summary">
                  <div className="summary-item accepted">
                    <span className="summary-label">Accepted:</span>
                    <span className="summary-value">{validationError.summary.accepted}</span>
                  </div>
                  <div className="summary-item rejected">
                    <span className="summary-label">Rejected:</span>
                    <span className="summary-value">{validationError.summary.rejected}</span>
                  </div>
                  <div className="summary-item size">
                    <span className="summary-label">Max File Size:</span>
                    <span className="summary-value">{validationError.summary.max_file_size_MB} MB</span>
                  </div>
                </div>

                <div className="file-details">
                  <h4>File Details:</h4>
                  {validationError.details.map((file, index) => (
                    <div key={index} className={`file-detail ${file.status}`}>
                      <span className="file-name">{file.filename}</span>
                      <span className="file-size">{file.file_size_MB.toFixed(2)} MB</span>
                      <span className={`file-status ${file.status}`}>
                        {file.status === 'accepted' ? '✓' : '✗'} {file.status}
                      </span>
                      {file.reason && <span className="file-reason">{file.reason}</span>}
                    </div>
                  ))}
                </div>

                <div className="validation-actions">
                  {validationError.summary.accepted > 0 && (
                    <button 
                      type="button"
                      className="proceed-btn futuristic-btn"
                      onClick={handleProceedWithAcceptedFiles}
                    >
                      <span className="btn-icon">🚀</span>
                      Proceed with {validationError.summary.accepted} Accepted Files
                    </button>
                  )}
                  <button 
                    type="button"
                    className="dismiss-btn"
                    onClick={() => setValidationError(null)}
                  >
                    Dismiss
                  </button>
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
              disabled={selectedFiles.length === 0 || loading || !!(validationError && validationError.summary.accepted === 0)}
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

              <div className="action-buttons">
                <button 
                  className="email-btn futuristic-btn"
                  onClick={() => handleEmailBatchResults(jobStatus)}
                >
                  <span className="btn-icon">✉️</span>
                  Email Batch Report
                </button>
                
                {renderDownloadButton()}
              </div>
              
              {/* Enhanced Results Section with Fallback Logic */}
              {(() => {
                // Use individual_analyses if available, fallback to results
                const displayData = jobStatus.individual_analyses || jobStatus.results || [];
                
                return displayData.length > 0 ? (
                  <div className="results-preview">
                    <div className="results-header">
                      <h4>Results Preview:</h4>
                      {jobStatus.individual_analyses && (
                        <div className="data-source-indicator">
                          <small>
                            Showing {displayData.length} results from individual analyses
                          </small>
                        </div>
                      )}
                    </div>
                    <div className="results-grid">
                      {displayData
                        .slice(0, isExpanded ? displayData.length : 5)
                        .map((result: any, index: number) => {
                          // Normalize data from both sources (individual_analyses vs results)
                          const displayResult = {
                            filename: result.filename,
                            // Handle different field names between sources
                            predicted_class: result.predicted_class || result.predictedClass,
                            confidence: result.confidence ?? result.probability, // Use confidence, fallback to probability
                            probability: result.probability,
                            model: result.model || result.model_slug || model, // Multiple possible field names
                            is_ai: result.is_ai ?? result.isAI, // Handle both snake_case and camelCase
                            ground_truth: result.ground_truth || result.groundTruth
                          };
                          
                          return (
                            <div key={index} className="result-container">
                              <div 
                                className={`result-item ${expandedIndex === index ? 'expanded' : ''}`}
                                onClick={() => toggleExpand(index)}
                              >
                                <span className="filename">{displayResult.filename || `Image ${index + 1}`}</span>
                                {/* Use is_ai for classification instead of string parsing */}
                                <span className={`prediction ${displayResult.is_ai ? 'ai' : 'human'}`}>
                                  {displayResult.predicted_class || (displayResult.is_ai ? 'AI Generated' : 'Human Created')}
                                </span>
                              </div>
                              
                              {expandedIndex === index && (
                                <div className="result-details-expanded">
                                  <div className={`result-card ${displayResult.is_ai ? 'ai-detected' : 'human-detected'}`}>
                                    <div className="result-header">
                                      <h3>{displayResult.filename || `Image ${index + 1}`}</h3>
                                      <span className="result-badge">
                                        {displayResult.predicted_class || (displayResult.is_ai ? 'AI Generated' : 'Human Created')}
                                      </span>
                                    </div>
                                    
                                    <div className="confidence-meter">
                                      <div className="confidence-label">
                                        Confidence: {displayResult.confidence != null ? `${(displayResult.confidence * 100).toFixed(2)}%` : 'N/A'}
                                      </div>
                                      <div className="confidence-bar">
                                        <div 
                                          className="confidence-fill"
                                          style={{ 
                                            width: `${(displayResult.confidence || 0) * 100}%`,
                                            backgroundColor: getConfidenceColor(displayResult.confidence || 0)
                                          }}
                                        ></div>
                                      </div>
                                    </div>

                                    <div className="result-details">
                                      <div className="detail-item">
                                        <span className="detail-label">AI Detection:</span>
                                        <span className="detail-value">{displayResult.is_ai ? 'AI Generated' : 'Human Created'}</span>
                                      </div>
                                      <div className="detail-item">
                                        <span className="detail-label">Model Used:</span>
                                        <span className="detail-value">{displayResult.model?.toUpperCase() || 'Unknown'}</span>
                                      </div>
                                      {displayResult.probability != null && (
                                        <div className="detail-item">
                                          <span className="detail-label">Probability Score:</span>
                                          <span className="detail-value">{displayResult.probability.toFixed(4)}</span>
                                        </div>
                                      )}
                                      {displayResult.ground_truth && (
                                        <div className="detail-item">
                                          <span className="detail-label">Ground Truth:</span>
                                          <span className="detail-value">{displayResult.ground_truth}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    
                    {displayData.length > 5 && (
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
                              <span>Show all {displayData.length} results</span>
                              <span className="expand-icon">▼</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : jobStatus.status === 'completed' ? (
                  <div className="no-results">
                    <p>
                      {jobStatus.results_note || "No results available. The job completed but no individual file details were returned."}
                    </p>
                    {jobStatus.results_source && (
                      <p className="results-source">Data source: {jobStatus.results_source}</p>
                    )}
                  </div>
                ) : null;
              })()}

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