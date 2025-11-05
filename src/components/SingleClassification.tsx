import React, { useState } from 'react';
import { classificationService } from '../services/api';
import { ClassificationResult } from '../types';

const SingleClassification: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelType, setModelType] = useState('ml');
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
      const classificationResult = await classificationService.classifySingleImage(selectedFile, modelType);
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
              />
              <div className="upload-content">
                <div className="upload-icon">📁</div>
                <p>
                  {selectedFile 
                    ? `Selected: ${selectedFile.name}`
                    : 'Drag & drop an image or click to browse'
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
                <option value="ml">Machine Learning Model</option>
                <option value="net">Neural Network Model</option>
                <option value="scalpel">Scalpel Model</option>
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
                {result.probability && (
                  <div className="detail-item">
                    <span className="detail-label">Probability Score:</span>
                    <span className="detail-value">{result.probability.toFixed(4)}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Analysis Type:</span>
                  <span className="detail-value">Single Image</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleClassification;