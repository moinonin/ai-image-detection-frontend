import { User, AuthResponse, ClassificationResult, BatchJob, ModelInfo } from '../types';

// Vite uses import.meta.env, not process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8008';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  async register(userData: any): Promise<User> {
    return this.request<User>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<User> { // Removed token parameter since we get it from localStorage
    return this.request<User>('/api/v1/auth/me');
  }

  async logout(): Promise<void> {
    return this.request('/api/v1/auth/logout', { method: 'POST' });
  }

  async forgotPassword(email: string): Promise<void> {
    return this.request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  }

  // Classification endpoints
  async classifySingleImage(file: File, modelType: string = 'ml'): Promise<ClassificationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', modelType);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/classify/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      throw new Error(`Classification failed (${response.status})`);
}
    if (!response.ok) {
      throw new Error('Classification failed');
    }

    return response.json();
  }

  async classifyBatchImages(files: File[], model: string = 'ml'): Promise<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('model', model);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Batch classification failed');
    }

    return response.json();
  }

  async startBatchJob(files: File[], model: string = 'ml'): Promise<{ job_id: string; status: string; message: string }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('model', model);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch/async`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to start batch job');
    }

    return response.json();
  }

  async getBatchJobStatus(jobId: string): Promise<BatchJob> {
    return this.request(`/api/v1/classify/batch/status/${jobId}`);
  }

  async getModels(): Promise<{ models: ModelInfo[] }> {
    return this.request('/api/v1/models');
  }
}

export const authService = new ApiService();
export const classificationService = new ApiService();