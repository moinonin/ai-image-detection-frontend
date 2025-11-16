import React, { useState } from 'react';
import { classificationService, generatePDFReport } from '../services/api';
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
      
      // Always get JSON analysis data first
      const analysisResult = await classificationService.classifySingleImage(
        selectedFile, 
        modelType,
        'json'
      );
      
      console.log('Analysis result:', analysisResult);
      
      if (analysisResult.analysis && Object.keys(analysisResult.analysis).length > 0) {
        setResult(analysisResult);
        
        // If PDF was requested, get it separately
        if (reportFormat === 'pdf') {
          try {
            const pdfResult = await classificationService.classifySingleImage(
              selectedFile, 
              modelType,
              'pdf'
            );
            
            // Update the result with the PDF blob
            if (pdfResult.pdfBlob) {
              setResult(prev => prev ? { ...prev, pdfBlob: pdfResult.pdfBlob } : prev);
            }
          } catch (pdfError) {
            console.warn('PDF generation failed:', pdfError);
            setError('Analysis completed but PDF generation failed. You can still view the results below.');
          }
        }
      } else {
        setError('No analysis data received from server');
      }
    } catch (error: any) {
      console.error('Classification failed:', error);
      setError(error.message);
      if (error.name === 'FileSizeError' && error.details) {
        setErrorDetails(error.details);
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
    return analysisResult.predicted_class || 'Unknown';
  };

  const getAIDetectedClass = (): string => {
    const predictedClass = getPredictedClass();
    if (predictedClass === 'Unknown') return 'unknown-detected';
    return predictedClass.includes("AI") ? "ai-detected" : "human-detected";
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
                  <h3>{analysisResult.filename || 'Unknown File'}</h3>
                  <span className="result-badge">{getPredictedClass()}</span>
                </div>

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
              // Error display remains the same
              <div className="result-card error-detected">
                {/* ... error display code ... */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleClassification;