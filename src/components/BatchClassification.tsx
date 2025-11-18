import React, { useState, useRef, useEffect, useCallback } from 'react';
import { classificationService } from '../services/api';
import { 
  IndividualClassificationResult, 
  FileValidationError, 
  BatchJobResponse,
  BatchUsage,
  BatchAnalysisItem 
} from '../types';

// Constants
const MODEL_TYPES = ['ml', 'net', 'scalpel'] as const;
const MAX_FILE_SIZE_MB = 0.5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const POLLING_INTERVAL = 3000; // 3 seconds

// Helper function declared outside component
const normalizeResults = (jobResponse: BatchJobResponse | null): IndividualClassificationResult[] => {
  if (!jobResponse) {
    console.log('normalizeResults: jobResponse is null');
    return [];
  }

  console.log('=== NORMALIZING BATCH RESULTS ===');
  console.log('Full job response:', jobResponse);
  console.log('Available fields:', Object.keys(jobResponse));
  console.log('Analyses field:', jobResponse.analyses);
  console.log('Results field:', jobResponse.results);
  console.log('Individual analyses field:', jobResponse.individual_analyses);

  let normalized: IndividualClassificationResult[] = [];

  // Check all possible result locations with detailed logging
  if (jobResponse.analyses && jobResponse.analyses.length > 0) {
    console.log(`Found analyses array with ${jobResponse.analyses.length} items`);
    
    normalized = jobResponse.analyses.map((analysis: BatchAnalysisItem, index: number) => {
      console.log(`Processing analysis ${index + 1}:`, analysis);
      
      // Extract the analysis results
      const analysisResults = analysis.analysis_results;
      console.log(`Analysis ${index + 1} results:`, analysisResults);
      
      return {
        filename: analysis.filename || analysisResults.filename || `file_${index}`,
        model: analysisResults.model || 'unknown',
        analysis_type: analysisResults.analysis_type || 'batch',
        total_images: analysisResults.total_images || 1,
        analyzed_images: analysisResults.analyzed_images || 1,
        user: analysisResults.user || jobResponse.user || 'unknown',
        ai_detected: analysisResults.ai_detected !== undefined ? analysisResults.ai_detected : 
                     (analysisResults.predicted_class?.toLowerCase().includes('ai') || false),
        confidence: analysisResults.confidence || analysisResults.probability || 0,
        predicted_class: analysisResults.predicted_class || 'Unknown',
        probability: analysisResults.probability || analysisResults.confidence || 0,
        from_cache: analysis.from_cache || analysisResults.from_cache || false,
        cache_timestamp: analysis.timestamp || analysisResults.cache_timestamp || null,
        processing_time: analysisResults.processing_time || analysis.timestamp || new Date().toISOString(),
        // Legacy fields for compatibility
        is_ai: analysisResults.is_ai || analysisResults.ai_detected || false,
        predictedClass: analysisResults.predictedClass || analysisResults.predicted_class,
        model_slug: analysisResults.model_slug || analysisResults.model
      };
    });
  } 
  else if (jobResponse.results && jobResponse.results.length > 0) {
    console.log(`Found results array with ${jobResponse.results.length} items`);
    normalized = jobResponse.results.map((result, index) => ({
      ...result,
      // Ensure all required fields are present
      filename: result.filename || `file_${index}`,
      model: result.model || 'unknown',
      analysis_type: result.analysis_type || 'batch',
      total_images: result.total_images || 1,
      analyzed_images: result.analyzed_images || 1,
      user: result.user || jobResponse.user || 'unknown',
    }));
  }
  else if (jobResponse.individual_analyses && jobResponse.individual_analyses.length > 0) {
    console.log(`Found individual_analyses array with ${jobResponse.individual_analyses.length} items`);
    normalized = jobResponse.individual_analyses.map((result, index) => ({
      ...result,
      // Ensure all required fields are present
      filename: result.filename || `file_${index}`,
      model: result.model || 'unknown',
      analysis_type: result.analysis_type || 'batch',
      total_images: result.total_images || 1,
      analyzed_images: result.analyzed_images || 1,
      user: result.user || jobResponse.user || 'unknown',
    }));
  }
  else {
    console.log('No results found in any field. Available array fields:', {
      analyses: jobResponse.analyses?.length || 0,
      results: jobResponse.results?.length || 0,
      individual_analyses: jobResponse.individual_analyses?.length || 0
    });
  }

  console.log(`Normalized ${normalized.length} results`);
  if (normalized.length > 0) {
    console.log('First normalized result:', normalized[0]);
  }
  
  return normalized;
};

const BatchClassification: React.FC = () => {
  // State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [model, setModel] = useState<string>('scalpel');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<BatchJobResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const [currentUsage, setCurrentUsage] = useState<BatchUsage | null>(null);
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Derived state
  const normalizedResults = normalizeResults(jobStatus);

  // Effects
  useEffect(() => {
    fetchCurrentUsage();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Data fetching
  const fetchCurrentUsage = async () => {
    try {
      // Try to get current usage from the classification service
      const usage = await classificationService.getCurrentUsage();
      console.log('Fetched current usage:', usage);
      setCurrentUsage(usage);
      checkUsageLimits(usage, selectedFiles.length);
    } catch (error) {
      console.warn('Could not fetch current usage:', error);
      // Set default usage if API fails
      setCurrentUsage({
        free_analyses_used_this_month: 0,
        free_analyses_remaining: 5, // Default free analyses
        subscription_used: false,
        account_id: null
      });
    }
  };

  // Validation functions
  const validateFiles = useCallback((files: File[]): FileValidationError | null => {
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE_BYTES);
    
    if (oversizedFiles.length === 0) return null;

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
  }, []);

  // Usage management
  const checkUsageLimits = useCallback((usage: BatchUsage, fileCount: number) => {
    console.log('Checking usage limits:', { usage, fileCount });
    
    if (usage.subscription_used) {
      setUsageWarning(null);
      return;
    }

    const remaining = usage.free_analyses_remaining;
    if (remaining <= 0) {
      setUsageWarning('You have exceeded your free analysis limit. Please upgrade to a subscription to continue.');
    } else if (fileCount > remaining) {
      setUsageWarning(`You have ${remaining} free analyses remaining but selected ${fileCount} files. Only the first ${remaining} files will be processed.`);
    } else {
      setUsageWarning(null);
    }
  }, []);

  // Job management
  const pollJobStatus = async (jobId: string) => {
    try {
      console.log(`Polling job status for: ${jobId}`);
      const status = await classificationService.getBatchJobStatus(jobId);
      
      console.log('=== POLLING RESPONSE ===');
      console.log('Job status:', status.status);
      console.log('Processed:', status.processed, '/', status.total_images);
      console.log('Has analyses:', !!status.analyses, 'Count:', status.analyses?.length);
      console.log('Has results:', !!status.results, 'Count:', status.results?.length);
      console.log('Has individual_analyses:', !!status.individual_analyses, 'Count:', status.individual_analyses?.length);
      console.log('Has usage:', !!status.usage);
      
      setJobStatus(status);

      // Update current usage if available in job status
      if (status.usage) {
        console.log('Updating usage from job status:', status.usage);
        setCurrentUsage(status.usage);
      }

      // Stop polling if job is completed or failed
      if (status.status === 'completed' || status.status === 'failed') {
        stopPolling();
        setLoading(false);
        setProcessingComplete(true);
        
        console.log('=== JOB COMPLETED ===');
        console.log('Final status:', status);
        console.log('Normalized results count:', normalizeResults(status).length);
        
        // Update usage after job completion
        if (status.usage) {
          setCurrentUsage(status.usage);
        } else {
          // If no usage in response, refetch current usage
          fetchCurrentUsage();
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  };

  const startPolling = (jobId: string) => {
    // Poll immediately first time
    pollJobStatus(jobId);
    
    // Then set up interval for subsequent polls
    pollingInterval.current = setInterval(() => pollJobStatus(jobId), POLLING_INTERVAL);
  };

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // File handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    
    const files = Array.from(event.target.files);
    const validationResult = validateFiles(files);
    
    setSelectedFiles(files);
    setValidationError(validationResult);
    
    // Check usage limits when files change
    if (currentUsage) {
      checkUsageLimits(currentUsage, files.length);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!e.dataTransfer.files?.length) return;
    
    const files = Array.from(e.dataTransfer.files);
    const validationResult = validateFiles(files);
    
    setSelectedFiles(files);
    setValidationError(validationResult);
    
    // Check usage limits when files change
    if (currentUsage) {
      checkUsageLimits(currentUsage, files.length);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setValidationError(validateFiles(newFiles));
    
    // Check usage limits when files change
    if (currentUsage) {
      checkUsageLimits(currentUsage, newFiles.length);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    const clientValidationError = validateFiles(selectedFiles);
    if (clientValidationError) {
      setValidationError(clientValidationError);
      return;
    }

    // Check usage limits
    let filesToProcess = selectedFiles;
    if (currentUsage && !currentUsage.subscription_used) {
      if (currentUsage.free_analyses_remaining <= 0) {
        setUsageWarning('You have exceeded your free analysis limit. Please upgrade to a subscription to continue.');
        return;
      }
      
      if (selectedFiles.length > currentUsage.free_analyses_remaining) {
        filesToProcess = selectedFiles.slice(0, currentUsage.free_analyses_remaining);
        setUsageWarning(`Processing only ${filesToProcess.length} of ${selectedFiles.length} files due to usage limits.`);
        // Don't setSelectedFiles here to avoid confusing the user
      }
    }

    setLoading(true);
    setValidationError(null);
    setJobStatus(null);
    setJobId(null);
    setUsageWarning(null);
    setProcessingComplete(false);

    try {
      console.log('Starting async batch job with:', {
        fileCount: filesToProcess.length,
        model: model,
        files: filesToProcess.map(f => f.name),
        currentUsage: currentUsage
      });

      const response = await classificationService.startBatchJob(filesToProcess, model);
      console.log('Batch job started:', response);
      setJobId(response.job_id);
      startPolling(response.job_id);
    } catch (error: any) {
      console.error('Failed to start batch job:', error);
      
      if (error.message?.includes('USAGE_LIMIT_EXCEEDED')) {
        const errorMessage = error.message.replace('USAGE_LIMIT_EXCEEDED: ', '');
        setUsageWarning(errorMessage);
        // Refetch usage to get current state
        fetchCurrentUsage();
      } else if (error.error && error.summary && error.details) {
        setValidationError(error as FileValidationError);
      } else {
        alert('Failed to start batch processing. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleProceedWithAcceptedFiles = () => {
    if (!validationError) return;

    const acceptedFiles = selectedFiles.filter(file => 
      validationError.details.some(detail => 
        detail.filename === file.name && detail.status === 'accepted'
      )
    );

    if (acceptedFiles.length === 0) {
      alert('No accepted files to proceed with.');
      return;
    }

    setSelectedFiles(acceptedFiles);
    setValidationError(null);
    setLoading(true);

    classificationService.startBatchJob(acceptedFiles, model)
      .then(response => {
        setJobId(response.job_id);
        startPolling(response.job_id);
      })
      .catch(error => {
        console.error('Failed with accepted files:', error);
        if (error.error && error.summary && error.details) {
          setValidationError(error as FileValidationError);
        } else {
          alert('Failed to start batch processing. Please try again.');
        }
        setLoading(false);
      });
  };

  // Download handlers
  const handleDownloadBatchPDF = async () => {
    if (!jobStatus) {
      console.error('No job status available for PDF download');
      return;
    }
    
    try {
      const pdfBlob = await classificationService.downloadBatchPDF(jobStatus);
      downloadBlob(pdfBlob, `batch-classification-report-${jobStatus.job_id}.pdf`);
    } catch (error: any) {
      console.error('Batch PDF download failed:', error);
      alert(`Failed to download PDF: ${error.message}`);
    }
  };

  const handleDownloadBatchJSON = () => {
    if (!jobStatus) {
      console.error('No job status available for JSON download');
      return;
    }
    
    try {
      const jsonString = JSON.stringify(jobStatus, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      downloadBlob(blob, `batch-classification-report-${jobStatus.job_id}.json`);
    } catch (error) {
      console.error('Batch JSON download failed:', error);
      alert('Failed to download JSON file');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // UI helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'var(--warning-color)';
      case 'completed': return 'var(--success-color)';
      case 'failed': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const renderUsageWarning = () => {
    if (!usageWarning) return null;

    return (
      <div className="usage-warning">
        <div className="warning-header">
          <span className="warning-icon">⚠️</span>
          <h4>Usage Limit Warning</h4>
        </div>
        <p>{usageWarning}</p>
        {currentUsage && !currentUsage.subscription_used && currentUsage.free_analyses_remaining <= 0 && (
          <div className="upgrade-actions">
            <button 
              className="upgrade-btn futuristic-btn"
              onClick={() => {
                // Redirect to subscription page or show upgrade modal
                alert('Redirecting to subscription page...');
                // window.location.href = '/subscription';
              }}
            >
              <span className="btn-icon">⭐</span>
              Upgrade to Subscription
            </button>
            <button 
              className="dismiss-warning"
              onClick={() => setUsageWarning(null)}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFileItem = (file: File, index: number) => {
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
  };

  const renderValidationError = () => {
    if (!validationError) return null;

    return (
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
    );
  };

  const renderResultsGrid = () => {
    if (!normalizedResults.length) {
      if (jobStatus?.status === 'completed') {
        return (
          <div className="no-results">
            <p>No analysis results were returned.</p>
            <div className="debug-info">
              <p><strong>Debug Information:</strong></p>
              <p>Job Status: {jobStatus.status}</p>
              <p>Processed: {jobStatus.processed} / {jobStatus.total_images}</p>
              <p>Analyses field: {jobStatus.analyses ? `${jobStatus.analyses.length} items` : 'Not present'}</p>
              <p>Results field: {jobStatus.results ? `${jobStatus.results.length} items` : 'Not present'}</p>
            </div>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="results-preview">
        <div className="results-header">
          <h4>Analysis Results ({normalizedResults.length} images):</h4>
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

        <div className="results-grid">
          {normalizedResults.map((result, index) => (
            <div key={index} className="result-item">
              <span className="filename">{result.filename}</span>
              <span className={`prediction ${result.ai_detected ? 'ai' : 'human'}`}>
                {result.predicted_class}
              </span>
              <span className="confidence">
                {result.confidence != null ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
              </span>
              {result.from_cache && (
                <span className="cache-indicator" title="From cache">💾</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="batch-classification">
      <div className="page-header">
        <h1>Batch Image Analysis</h1>
        <p>Process multiple images simultaneously with advanced AI models</p>
        <p className="file-size-info">Maximum file size: {MAX_FILE_SIZE_MB} MB per file</p>
      </div>

      {/* Usage Information */}
      <div className="usage-display">
        <div className="usage-card">
          <h3>Your Usage</h3>
          <div className="usage-stats">
            <div className="usage-stat">
              <span className="stat-label">Free Analyses Used:</span>
              <span className="stat-value">
                {currentUsage ? currentUsage.free_analyses_used_this_month : 'Loading...'}
              </span>
            </div>
            <div className="usage-stat">
              <span className="stat-label">Free Analyses Remaining:</span>
              <span className={`stat-value ${currentUsage && currentUsage.free_analyses_remaining === 0 ? 'zero' : ''}`}>
                {currentUsage ? currentUsage.free_analyses_remaining : 'Loading...'}
              </span>
            </div>
            <div className="usage-stat">
              <span className="stat-label">Subscription:</span>
              <span className={`stat-value ${currentUsage && currentUsage.subscription_used ? 'active' : 'inactive'}`}>
                {currentUsage ? (currentUsage.subscription_used ? 'Active' : 'Not Active') : 'Loading...'}
              </span>
            </div>
          </div>
          {currentUsage && !currentUsage.subscription_used && currentUsage.free_analyses_remaining === 0 && (
            <div className="upgrade-prompt">
              <p>You've used all your free analyses! Upgrade to continue.</p>
            </div>
          )}
        </div>
      </div>

      {renderUsageWarning()}

      <div className="batch-container">
        {/* Upload Section */}
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
                <label className="browse-btn" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </label>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h4>Selected Files:</h4>
                <div className="files-list">
                  {selectedFiles.map(renderFileItem)}
                </div>
              </div>
            )}

            {renderValidationError()}

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

        {/* Job Status Section */}
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

              {/* Usage information from job status */}
              {jobStatus.usage && (
                <div className="usage-info">
                  <h4>Usage After This Job</h4>
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
                  className="pdf-btn futuristic-btn"
                  onClick={handleDownloadBatchPDF}
                  disabled={jobStatus.status !== 'completed'}
                >
                  <span className="btn-icon">📄</span>
                  {jobStatus.status === 'completed' ? 'Download Batch PDF' : 'Processing...'}
                </button>
                <button 
                  className="json-btn futuristic-btn"
                  onClick={handleDownloadBatchJSON}
                  disabled={jobStatus.status !== 'completed'}
                >
                  <span className="btn-icon">📊</span>
                  {jobStatus.status === 'completed' ? 'Download Batch JSON' : 'Processing...'}
                </button>
              </div>

              {renderResultsGrid()}

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