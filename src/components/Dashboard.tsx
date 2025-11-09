import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { classificationService } from '../services/api';
import { ModelInfo } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const data = await classificationService.getModels();
        setModels(data.models);
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>AI Media Detection Platform</h1>
        <p className="welcome-text">
          Welcome back, <span className="username">{user?.username}</span>! 
          Ready to analyze some images?
        </p>
      </div>

      <div className="quick-actions">
        <Link to="/single" className="action-card neon-blue">
          <div className="action-icon">🔍</div>
          <h3>Single Image Analysis</h3>
          <p>Upload and analyze a single image for AI generation detection</p>
        </Link>

        <Link to="/batch" className="action-card neon-purple">
          <div className="action-icon">📊</div>
          <h3>Batch Analysis</h3>
          <p>Process multiple images simultaneously with advanced models</p>
        </Link>

        <Link to="/videos" className="action-card neon-purple">
          <div className="action-icon">📊</div>
          <h3>Video Analysis</h3>
          <p>Conduct forensic analysis on video full lengths or sampled frames</p>
        </Link>
      </div>

      <div className="models-section">
        <h2>Available Detection Models</h2>
        {loading ? (
          <div className="loading">Loading models...</div>
        ) : (
          <div className="models-grid">
            {models.map((model) => (
              <div key={model.id} className="model-card">
                <h4>{model.name}</h4>
                <p>{model.description}</p>
                <div className="model-id">{model.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-value">3</div>
          <div className="stat-label">Detection Models</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">99.2%</div>
          <div className="stat-label">Accuracy Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">≤ 2s</div>
          <div className="stat-label">Processing Time</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
