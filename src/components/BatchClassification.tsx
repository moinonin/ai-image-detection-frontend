import React, { useState, useRef, useEffect } from 'react';
import { classificationService, } from '../services/api';
import { 
  BatchJob, 
  IndividualClassificationResult,
  BatchJobResponse,
  AnalysisData,
  BatchAnalysesResponse,
  BatchAnalysisResult
} from '../types';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift()!;
  return null;
}

interface FileValidationError {
  error: string;
  summary: {
    accepted: number;
    rejected: number;
    total_uploaded_MB: number;
    max_size: number;
    max_file_size_MB: number;
  };
  details: Array<{
    filename: string;
    status: 'accepted' | 'rejected';
    file_size_MB: number;
    reason?: string;
  }>;
  accepted_files: any[];
}

// Extended BatchJob type with debug info
interface BatchJobWithDebug extends BatchJob {
  _debug?: {
    analyses_count: number;
    analysis_count_in_db: number;
    include_analyses_param: boolean;
    job_data_status: string;
    results_source: string | null;
  };
}

const BatchClassification: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [model, setModel] = useState('scalpel');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<BatchJobWithDebug | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportFormat: 'pdf' | 'json' = 'pdf';
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  
  // Client-side file size validation constants
  const MAX_FILE_SIZE_MB = 0.5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  // Results state
  //const [analyses, setAnalyses] = useState<IndividualClassificationResult[]>([]);
  const [analyses, setAnalyses] = useState<BatchAnalysisResult[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

// Add this adapter function
// Add the adapter function
  const adaptToIndividualClassificationResult = (
    batchResult: BatchAnalysisResult
  ): IndividualClassificationResult => {
    return {
      // Core properties
      filename: batchResult.filename,
      predicted_class: batchResult.predicted_class,
      is_ai: batchResult.is_ai,
      confidence: batchResult.confidence,
      probability: batchResult.probability,
      model: batchResult.model,
      features: batchResult.features,
      
      // Required properties from IndividualClassificationResult
      analysis_type: batchResult.analysis_type || 'batch',
      total_images: batchResult.total_images || 1,
      analyzed_images: batchResult.analyzed_images || 1,
      user: batchResult.user || 'batch_user',
      
      // Missing properties with sensible defaults
      ai_detected: batchResult.is_ai,
      from_cache: batchResult.from_cache !== undefined ? batchResult.from_cache : false,
      cache_timestamp: batchResult.cache_timestamp || null,
      processing_time: batchResult.processing_time || new Date().toISOString()
    };
  };
  
  // Update the getDebugInfo function with better typing
  const getDebugInfo = (): { 
    analysesInDb: number; 
    analysesCount: number; 
    includeAnalyses: boolean; 
    resultsSource: string | null; 
    jobStatus: string 
  } | null => {
    if (!jobStatus?._debug) return null;
    
    return {
      analysesInDb: jobStatus._debug.analysis_count_in_db ?? 0,
      analysesCount: jobStatus._debug.analyses_count ?? 0,
      includeAnalyses: jobStatus._debug.include_analyses_param ?? false,
      resultsSource: jobStatus._debug.results_source,
      jobStatus: jobStatus._debug.job_data_status
    };
  };

  // Fetch analyses when job completes but results are empty
  useEffect(() => {
    // Update the fetchAnalysesForJob function with proper types
    const fetchAnalysesForJob = async () => {
      const debugInfo = getDebugInfo();
      
      if (
        jobStatus?.status === 'completed' && 
        debugInfo && 
        debugInfo.analysesInDb > 0 && 
        (!jobStatus.results || jobStatus.results.length === 0) &&
        analyses.length === 0 &&
        !isLoadingAnalyses
      ) {
        setIsLoadingAnalyses(true);
        setError(null);
        
        try {
          console.log(`Fetching ${debugInfo.analysesInDb} analyses for job ${jobStatus.job_id}`);
          
          const endpoints = [
            `/api/v1/classify/batch/status/${jobStatus.job_id}?include_analyses=true`,
            `/api/v1/classify/new-batch/status/${jobStatus.job_id}?include_analyses=true`
          ];

          let analysesData: BatchAnalysisResult[] | null = null;
          
          for (const endpoint of endpoints) {
            try {
              console.log(`Testing endpoint: ${endpoint}`);
              const response = await classificationService.get<any>(endpoint);
              console.log(`✅ ${endpoint} returned:`, response);
              
              let extractedData: BatchAnalysisResult[] = [];
              
              // Handle different response structures
              if (response.analyses && Array.isArray(response.analyses)) {
                extractedData = response.analyses
                  .map((item: any) => item.analysis || item)
                  .filter(Boolean);
              } else if (response.results && Array.isArray(response.results)) {
                extractedData = response.results
                  .map((item: any) => item.analysis_results || item)
                  .filter(Boolean);
              }
              
              if (extractedData.length > 0) {
                analysesData = extractedData;
                console.log(`✅ Found ${analysesData.length} analyses from ${endpoint}`);
                break;
              }
            } catch (err) {
              console.log(`❌ ${endpoint} failed:`, err);
            }
          }

          if (analysesData && analysesData.length > 0) {
            // Clean and normalize the data
            const cleanedAnalyses: BatchAnalysisResult[] = analysesData
              .map((item: any) => {
                const analysis = item.analysis || item.analysis_results || item;
                
                return {
                  filename: analysis.filename || item.filename || 'Unknown',
                  predicted_class: analysis.predicted_class || item.predicted_class || 'Unknown',
                  is_ai: analysis.is_ai !== undefined ? analysis.is_ai : 
                        (item.is_ai !== undefined ? item.is_ai : 
                        (analysis.predicted_class?.toLowerCase().includes('ai') || false)),
                  confidence: analysis.confidence !== undefined ? analysis.confidence : 
                            (item.confidence !== undefined ? item.confidence : null),
                  probability: analysis.probability !== undefined ? analysis.probability : 
                              (item.probability !== undefined ? item.probability : null),
                  model: analysis.model || item.model || model,
                  features: analysis.features || item.features || {},
                  analysis_type: 'batch',
                  total_images: 1,
                  analyzed_images: 1,
                  user: jobStatus?.user || 'batch_user'
                };
              })
              .filter((item: BatchAnalysisResult) => item.filename !== 'Unknown');

            setAnalyses(cleanedAnalyses);
            console.log(`✅ Set ${cleanedAnalyses.length} cleaned analyses in state`);
          } else {
            throw new Error('No analyses found in any endpoint');
          }
        } catch (err: any) {
          console.error('Failed to fetch analyses:', err);
          setError(err.message || 'Failed to fetch analyses');
        } finally {
          setIsLoadingAnalyses(false);
        }
      }
    };

    fetchAnalysesForJob();
  }, [jobStatus, analyses.length, isLoadingAnalyses]);

  // Update getDisplayResults with better typing
  const getDisplayResults = (): BatchAnalysisResult[] => {
    if (analyses.length > 0) {
      return analyses;
    }
    
    if (jobStatus?.results && Array.isArray(jobStatus.results)) {
      return jobStatus.results
        .map((result: any) => {
          const analysis = result.analysis_results || result.analysis || result;
          return {
            filename: analysis.filename || result.filename || 'Unknown',
            predicted_class: analysis.predicted_class || result.predicted_class || 'Unknown',
            is_ai: analysis.is_ai !== undefined ? analysis.is_ai : 
                  (result.is_ai !== undefined ? result.is_ai : false),
            confidence: analysis.confidence !== undefined ? analysis.confidence : 
                      (result.confidence !== undefined ? result.confidence : null),
            probability: analysis.probability !== undefined ? analysis.probability : 
                        (result.probability !== undefined ? result.probability : null),
            model: analysis.model || result.model || model,
            features: analysis.features || result.features || {},
            analysis_type: 'batch',
            total_images: 1,
            analyzed_images: 1,
            user: jobStatus?.user || 'batch_user'
          };
        })
        .filter((item: BatchAnalysisResult) => item.filename !== 'Unknown');
    }
    
    return [];
  };

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
          disabled={!jobStatus || getDisplayResults().length === 0}
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

    const clientValidationError = validateFiles(selectedFiles);
    if (clientValidationError) {
      setValidationError(clientValidationError);
      return;
    }

    setLoading(true);
    setValidationError(null);
    setJobStatus(null);
    setJobId(null);
    setAnalyses([]);
    setError(null);

    try {
      const response = await classificationService.startBatchJob(selectedFiles, model);
      setJobId(response.job_id);
      pollJobStatus(response.job_id);
    } catch (error: any) {
      console.error('Failed to start batch job:', error);
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
    setAnalyses([]);
    setError(null);

    classificationService.startBatchJob(acceptedFiles, model)
      .then(response => {
        setJobId(response.job_id);
        pollJobStatus(response.job_id);
      })
      .catch(error => {
        console.error('Failed to start batch job with accepted files:', error);
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
        // USE THE SPECIFIC STATUS ENDPOINT
        const response = await classificationService.get<BatchJobResponse>(
          `/api/v1/classify/batch/status/${jobId}`
        );
        
        console.log('Polling response:', response);
        
        if (response && (response.status || response.job_id)) {
          setJobStatus(response as BatchJobWithDebug);
          
          if (response.status === 'completed' || response.status === 'failed') {
            clearInterval(interval);
            setLoading(false);
          }
        } else {
          console.error('Invalid job status response');
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

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return '#00ff00';
    if (confidence > 0.6) return '#ffff00';
    return '#ff4444';
  };

  const handleEmailBatchResults = async (jobStatus: BatchJobWithDebug): Promise<void> => {
    try {
      console.log('Emailing batch results:', jobStatus);
      alert('Batch email functionality would be implemented here');
    } catch (error) {
      console.error('Failed to email batch results:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleDownloadBatchPDF = async (jobStatus: BatchJobWithDebug | null): Promise<void> => {
    if (!jobStatus) return;

    setPdfLoading(true);
    try {
      console.log('Downloading batch PDF report...');
      // Convert BatchJobWithDebug to the expected type for the service
      const pdfBlob = await classificationService.downloadBatchPDF(
        selectedFiles,
        model,
        jobStatus as unknown as BatchJobResponse
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

  const handleDownloadPDF = async (result: BatchAnalysisResult): Promise<void> => {
    try {
      console.log('📤 Generating PDF for individual result:', {
        filename: result.filename,
      });

      const individualResult = adaptToIndividualClassificationResult(result);
      const pdfBlob = await generatePDFReport([individualResult], 'individual');
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analysis_${result.filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      console.log('Individual PDF downloaded successfully');
    } catch (error: any) {
      console.error('Individual PDF download failed:', error);
      alert(error.message || 'PDF download failed. Please try again.');
    }
  };

  const generatePDFReport = async (results: IndividualClassificationResult[], reportType: string = 'individual') => {
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

  const displayResults = getDisplayResults();
  const debugInfo = getDebugInfo();

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
                <label className="browse-btn" onClick={() => fileInputRef.current?.click()}>
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

              {/* Debug Information */}
              {debugInfo && (
                <div className="debug-info">
                  <p><strong>Debug Info:</strong></p>
                  <p>Analyses in DB: {debugInfo.analysesInDb}</p>
                  <p>Analyses count: {debugInfo.analysesCount}</p>
                  <p>Results source: {debugInfo.resultsSource || 'null'}</p>
                </div>
              )}

              {jobStatus.results_note && (
                <div className="results-note">
                  <strong>Note:</strong> {jobStatus.results_note}
                </div>
              )}

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

              {/* Loading state for analyses */}
              {isLoadingAnalyses && (
                <div className="analyses-loading">
                  <div className="spinner"></div>
                  Loading analysis results...
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="error-message">
                  <strong>Error loading results:</strong> {error}
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
              
              {/* Results Display */}
              {displayResults.length > 0 && (
                <div className="results-preview">
                  <h4>Results Preview ({displayResults.length} analyses):</h4>
                  <div className="results-grid">
                    {displayResults
                      .slice(0, isExpanded ? displayResults.length : 5)
                      .map((result: BatchAnalysisResult, index: number) => {
                        // Debug log to see what we're working with
                        console.log(`Result ${index}:`, result);
                        
                        // Safely extract values with proper fallbacks
                        const filename = result.filename || `Image ${index + 1}`;
                        const predictedClass = result.predicted_class || 'Unknown';
                        const isAI = result.is_ai !== undefined 
                          ? result.is_ai 
                          : predictedClass.toLowerCase().includes('ai');
                        const confidence = result.confidence !== undefined ? result.confidence : null;
                        const probability = result.probability !== undefined ? result.probability : null;
                        const modelUsed = result.model || model;
                        
                        return (
                          <div key={index} className="result-container">
                            <div 
                              className={`result-item ${expandedIndex === index ? 'expanded' : ''}`}
                              onClick={() => toggleExpand(index)}
                            >
                              <span className="filename">{filename}</span>
                              <span className={`prediction ${isAI ? 'batch-ai' : 'batch-human'}`}>
                                {predictedClass}
                              </span>
                            </div>
                            
                            {expandedIndex === index && (
                              <div className="result-details-expanded">
                                <div className={`result-card ${isAI ? 'batch-ai-detected' : 'batch-human-detected'}`}>
                                  <div className="result-header">
                                    <h3>{filename}</h3>
                                    <span className={`result-badge ${isAI ? 'batch-ai-badge' : 'batch-human-badge'}`}>
                                      {predictedClass}
                                    </span>
                                  </div>
                                  
                                  <div className="confidence-meter">
                                    <div className="confidence-label">
                                      Confidence: {confidence !== null ? `${(confidence * 100).toFixed(2)}%` : 'N/A'}
                                    </div>
                                    {confidence !== null && (
                                      <div className="confidence-bar">
                                        <div 
                                          className="confidence-fill"
                                          style={{ 
                                            width: `${(confidence || 0) * 100}%`,
                                            backgroundColor: getConfidenceColor(confidence || 0)
                                          }}
                                        ></div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="result-details">
                                    <div className="detail-item">
                                      <span className="detail-label">Model Used:</span>
                                      <span className="detail-value">{modelUsed.toUpperCase()}</span>
                                    </div>
                                    {probability !== null && (
                                      <div className="detail-item">
                                        <span className="detail-label">Probability Score:</span>
                                        <span className="detail-value">{probability.toFixed(4)}</span>
                                      </div>
                                    )}
                                    <div className="detail-item">
                                      <span className="detail-label">Analysis Type:</span>
                                      <span className="detail-value">Batch Analysis</span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">AI Detected:</span>
                                      <span className="detail-value">{isAI ? 'Yes' : 'No'}</span>
                                    </div>
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
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  
                  {displayResults.length > 5 && (
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
                            <span>Show all {displayResults.length} results</span>
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