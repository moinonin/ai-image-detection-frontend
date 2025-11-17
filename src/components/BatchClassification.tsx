import React, { useState, useRef } from 'react';
import { classificationService } from '../services/api';
import { BatchJob, IndividualClassificationResult, FileValidationError, BatchAnalysisItem, BatchUsage } from '../types';

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
  const [pdfLoading, setPdfLoading] = useState(false);
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

  // Helper function to normalize analysis data from different sources
  const getNormalizedResults = (jobStatus: BatchJob | null): IndividualClassificationResult[] => {
    if (!jobStatus) return [];
    
    console.log('=== NORMALIZING RESULTS ===');
    console.log('Available data sources:', {
      analyses: jobStatus.analyses?.length || 0,
      individual_analyses: jobStatus.individual_analyses?.length || 0,
      results: jobStatus.results?.length || 0
    });
    
    // Priority 1: Direct analyses array (new backend format)
    if (jobStatus.analyses && jobStatus.analyses.length > 0) {
      console.log('Using analyses array with', jobStatus.analyses.length, 'items');
      return jobStatus.analyses.map((analysis: BatchAnalysisItem) => {
        const result = {
          ...analysis.analysis_results,
          // Ensure consistent field names
          is_ai: analysis.analysis_results.ai_detected,
          predicted_class: analysis.analysis_results.predicted_class,
          confidence: analysis.analysis_results.confidence,
          probability: analysis.analysis_results.probability,
          model: analysis.analysis_results.model,
          from_cache: analysis.from_cache,
          cache_timestamp: analysis.analysis_results.cache_timestamp,
          processing_time: analysis.analysis_results.processing_time
        };
        console.log('Normalized analysis result:', result);
        return result;
      });
    }
    
    // Priority 2: Individual analyses (fallback)
    if (jobStatus.individual_analyses && jobStatus.individual_analyses.length > 0) {
      console.log('Using individual_analyses array with', jobStatus.individual_analyses.length, 'items');
      return jobStatus.individual_analyses;
    }
    
    // Priority 3: Results (legacy fallback)
    if (jobStatus.results && jobStatus.results.length > 0) {
      console.log('Using results array with', jobStatus.results.length, 'items');
      return jobStatus.results;
    }
    
    console.log('No results found in any data source');
    return [];
  };

  const renderDownloadButton = () => {
    if (reportFormat === 'pdf') {
      return (
        <button 
          className="pdf-btn futuristic-btn"
          //onClick={() => handleDownloadBatchPDF(jobStatus)}
          onClick={handleDownloadBatchPDF}
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
          onClick={() => handleDownloadBatchPDF()}
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
        const status = await classificationService.getBatchJobStatus(jobId, true);
        console.log('=== BATCH JOB STATUS DEBUG ===');
        console.log('Full status object:', status);
        console.log('Status:', status.status);
        console.log('Analyses exists:', !!status.analyses);
        console.log('Analyses length:', status.analyses?.length);
        console.log('Individual analyses exists:', !!status.individual_analyses);
        console.log('Individual analyses length:', status.individual_analyses?.length);
        console.log('Results exists:', !!status.results);
        console.log('Results length:', status.results?.length);
        console.log('Processed:', status.processed, 'Total images:', status.total_images);
        
        if (status.analyses && status.analyses.length > 0) {
          console.log('First analysis item:', status.analyses[0]);
        }
        
        setJobStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          console.log('=== JOB COMPLETED ===');
          console.log('Final status:', status);
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

  const handleDownloadBatchPDF = async (): Promise<void> => {
    if (!jobId) return;

    setPdfLoading(true);
    try {
      console.log('Downloading batch PDF report for job:', jobId);
      const pdfBlob = await classificationService.downloadBatchPDF(jobId);
      
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

  const normalizedResults = getNormalizedResults(jobStatus);

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

              {/* Usage Information */}
              {jobStatus.usage && (
                <div className="usage-info">
                  <h4>Usage Summary</h4>
                  <div className="usage-stats">
                    <div className="usage-item">
                      <span className="usage-label">Free Analyses Used:</span>
                      <span className="usage-value">{jobStatus.usage.free_analyses_used_this_month}</span>
                    </div>
                    <div className="usage-item">
                      <span className="usage-label">Free Analyses Remaining:</span>
                      <span className="usage-value">{jobStatus.usage.free_analyses_remaining}</span>
                    </div>
                    <div className="usage-item">
                      <span className="usage-label">Subscription:</span>
                      <span className="usage-value">
                        {jobStatus.usage.subscription_used ? 'Active' : 'Not Active'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

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
              
              {/* Enhanced Results Section */}
              {normalizedResults.length > 0 ? (
                <div className="results-preview">
                  <div className="results-header">
                    <h4>Analysis Results ({normalizedResults.length} images):</h4>
                    {jobStatus.analyses && (
                      <div className="data-source-indicator">
                        <small>Showing results from batch analysis</small>
                      </div>
                    )}
                  </div>
                  
                  <div className="batch-summary">
                    <div className="summary-stats">
                      <div className="stat-item ai">
                        <span className="stat-label">AI Generated:</span>
                        <span className="stat-value">
                          {normalizedResults.filter(r => r.ai_detected).length}
                        </span>
                      </div>
                      <div className="stat-item human">
                        <span className="stat-label">Human Created:</span>
                        <span className="stat-value">
                          {normalizedResults.filter(r => !r.ai_detected).length}
                        </span>
                      </div>
                      <div className="stat-item cached">
                        <span className="stat-label">From Cache:</span>
                        <span className="stat-value">
                          {normalizedResults.filter(r => r.from_cache).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {normalizedResults.length > 0 ? (
                  <div className="results-grid">
                    {normalizedResults
                      .slice(0, isExpanded ? normalizedResults.length : 5)
                      .map((result: IndividualClassificationResult, index: number) => (
                        <div key={index} className="result-container">
                          <div 
                            className={`result-item ${expandedIndex === index ? 'expanded' : ''}`}
                            onClick={() => toggleExpand(index)}
                          >
                            <span className="filename">{result.filename}</span>
                            <span className={`prediction ${result.ai_detected ? 'ai' : 'human'}`}>
                              {result.predicted_class}
                            </span>
                            {result.from_cache && (
                              <span className="cache-indicator" title="From cache">💾</span>
                            )}
                          </div>
                          
                          {expandedIndex === index && (
                            <div className="result-details-expanded">
                              <div className={`result-card ${result.ai_detected ? 'ai-detected' : 'human-detected'}`}>
                                <div className="result-header">
                                  <h3>{result.filename}</h3>
                                  <div className="result-badges">
                                    <span className="result-badge">
                                      {result.predicted_class}
                                    </span>
                                    {result.from_cache && (
                                      <span className="cache-badge" title="From cache">💾 Cached</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="confidence-meter">
                                  <div className="confidence-label">
                                    Confidence: {result.confidence != null ? 
                                      `${(result.confidence * 100).toFixed(2)}%` : 'N/A'}
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
                                    <span className="detail-label">AI Detection:</span>
                                    <span className="detail-value">
                                      {result.ai_detected ? 'AI Generated' : 'Human Created'}
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Model Used:</span>
                                    <span className="detail-value">{result.model?.toUpperCase() || 'Unknown'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Confidence:</span>
                                    <span className="detail-value">
                                      {result.confidence != null ? 
                                        `${(result.confidence * 100).toFixed(2)}%` : 'N/A'}
                                    </span>
                                  </div>
                                  {result.processing_time && (
                                    <div className="detail-item">
                                      <span className="detail-label">Processed:</span>
                                      <span className="detail-value">
                                        {new Date(result.processing_time).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  {result.from_cache && result.cache_timestamp && (
                                    <div className="detail-item">
                                      <span className="detail-label">Cached:</span>
                                      <span className="detail-value">
                                        {new Date(result.cache_timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="result-actions">
                                  <button 
                                    className="download-pdf-btn futuristic-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadPDF(result);
                                    }}
                                  >
                                    <span className="btn-icon">📄</span>
                                    Download PDF
                                  </button>
                                  <button 
                                    className="email-btn futuristic-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEmailResults(result);
                                    }}
                                  >
                                    <span className="btn-icon">✉️</span>
                                    Email Result
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>) : jobStatus.status === 'completed' ? (
                  <div className="no-results">
                    <div className="error-header">
                      <h3>⚠️ No Analysis Results Available</h3>
                      <p>The job completed successfully but no analysis results were returned.</p>
                    </div>
                    
                    <div className="debug-info">
                      <h4>Debug Information:</h4>
                      <div className="debug-details">
                        <div className="debug-item">
                          <strong>Job ID:</strong> {jobId}
                        </div>
                        <div className="debug-item">
                          <strong>Processed:</strong> {jobStatus.processed} / {jobStatus.total_images}
                        </div>
                        <div className="debug-item">
                          <strong>Analyses Field:</strong> {jobStatus.analyses ? `${jobStatus.analyses.length} items` : 'Not present'}
                        </div>
                        <div className="debug-item">
                          <strong>Individual Analyses:</strong> {jobStatus.individual_analyses ? `${jobStatus.individual_analyses.length} items` : 'Not present'}
                        </div>
                        <div className="debug-item">
                          <strong>Results Field:</strong> {jobStatus.results ? `${jobStatus.results.length} items` : 'Not present'}
                        </div>
                        {jobStatus.error && (
                          <div className="debug-item error">
                            <strong>Error:</strong> {jobStatus.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="recovery-actions">
                      <button 
                        className="retry-btn futuristic-btn"
                        onClick={() => jobId && pollJobStatus(jobId)}
                      >
                        <span className="btn-icon">🔄</span>
                        Retry Fetching Results
                      </button>
                      <button 
                        className="support-btn"
                        onClick={() => {
                          const debugInfo = {
                            jobId,
                            jobStatus: {
                              status: jobStatus.status,
                              processed: jobStatus.processed,
                              total_images: jobStatus.total_images,
                              hasAnalyses: !!jobStatus.analyses,
                              hasIndividualAnalyses: !!jobStatus.individual_analyses,
                              hasResults: !!jobStatus.results,
                              error: jobStatus.error
                            }
                          };
                          console.log('Support Debug Info:', debugInfo);
                          alert('Debug information logged to console. Please share this with support.');
                        }}
                      >
                        <span className="btn-icon">📋</span>
                        Get Debug Info for Support
                      </button>
                    </div>
                  </div>
                ) : null}
                  
                  {normalizedResults.length > 5 && (
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
                            <span>Show all {normalizedResults.length} results</span>
                            <span className="expand-icon">▼</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : jobStatus.status === 'completed' ? (
                <div className="no-results">
                  <p>No analysis results available. The job completed but no results were returned.</p>
                  {jobStatus.results_note && (
                    <p className="results-note">{jobStatus.results_note}</p>
                  )}
                </div>
              ) : null}

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