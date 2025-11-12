import { User, AuthResponse, ClassificationResult, BatchJob, ModelInfo, VideoClassificationResponse } from '../types';

type ReportFormat = 'json' | 'pdf';

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

  // Update the method signature and implementation
// In your existing classifySingleImage function, replace the current error checking:
async classifySingleImage(
  file: File, 
  modelType: string = 'ml', 
  reportFormat: ReportFormat = 'json'
): Promise<ClassificationResult> {
  const token = localStorage.getItem('token');
  
  try {
    // First, get the classification result with JSON format
    const jsonFormData = new FormData();
    jsonFormData.append('file', file);
    jsonFormData.append('model_type', modelType);

    const jsonResponse = await fetch(`${API_BASE_URL}/api/v1/classify/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: jsonFormData,
    });
    
    if (!jsonResponse.ok) {
      const errorText = await jsonResponse.text();
      console.error('Backend error:', jsonResponse.status, errorText);
      throw new Error(`Classification failed (${jsonResponse.status})`);
    }

    const result = await jsonResponse.json();

    // === ADD THIS SECTION ===
    // Check if this is an error response from file size validation
    if (result.error) {
      // Check if it's a file size error and extract details
      if (result.summary && result.details) {
        const fileSizeError = new Error(result.error);
        fileSizeError.name = 'FileSizeError';
        // Attach the full error details to the error object
        (fileSizeError as any).details = result;
        throw fileSizeError;
      } else {
        throw new Error(result.error);
      }
    }
    // === END OF ADDED SECTION ===

    // Validate that we have the required fields for a successful classification
    if (!result.predicted_class || result.confidence === undefined) {
      console.warn('Incomplete response from backend:', result);
      throw new Error('Incomplete classification response');
    }

    // If PDF is requested, make a separate call
    if (reportFormat === 'pdf') {
      try {
        const pdfFormData = new FormData();
        pdfFormData.append('file', file);
        pdfFormData.append('model_type', modelType);
        pdfFormData.append('report_format', 'pdf');

        const pdfResponse = await fetch(`${API_BASE_URL}/api/v1/classify/single`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: pdfFormData,
        });

        if (pdfResponse.ok) {
          const pdfBlob = await pdfResponse.blob();
          result.pdfBlob = pdfBlob;
        }
      } catch (pdfError) {
        console.warn('PDF generation failed, but classification succeeded:', pdfError);
      }
    }

    return result;
  } catch (error) {
    console.error('Classification service error:', error);
    throw error;
  }
}

async startBatchJobSync(
  files: File[], 
  model: string = 'ml',
  reportFormat: ReportFormat = 'json'
): Promise<any> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('model', model);
  formData.append('report_format', reportFormat);

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', response.status, errorText);
    throw new Error(`Batch job start failed (${response.status})`);
  }

  // Handle PDF response
  if (reportFormat === 'pdf') {
    const pdfBlob = await response.blob();
    return {
      job_id: `batch_${Date.now()}`,
      status: 'completed',
      total_images: files.length,
      processed: files.length,
      results: [],
      pdfBlob: pdfBlob
    };
  }

  return response.json();
}

async downloadBatchPDF(
  files: File[], 
  model: string = 'ml'
): Promise<Blob> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('model', model);
  formData.append('report_format', 'pdf'); // Set report format to PDF

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', response.status, errorText);
    throw new Error(`Batch PDF download failed (${response.status})`);
  }

  return response.blob();
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

async classifyVideo(
  file: File, 
  model: string, 
  partial: boolean
): Promise<VideoClassificationResponse> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('model', model);
  formData.append('partial', partial ? 'true' : 'false');
  formData.append('report_format', 'json'); // Always JSON for analysis
  formData.append('use_cache', 'true'); // Enable cache

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/classify/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', response.status, errorText);
    throw new Error(`Video classification failed (${response.status})`);
  }

  return response.json();
}

async downloadVideoPDF(
  file: File, 
  model: string, 
  partial: boolean
): Promise<Blob> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('model', model);
  formData.append('partial', partial ? 'true' : 'false');
  formData.append('report_format', 'pdf');
  formData.append('use_cache', 'true');  // Add cache parameter

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/classify/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend error:', response.status, errorText);
    throw new Error(`PDF download failed (${response.status})`);
  }

  return response.blob();
}

}

export const generatePDFReport = async (results: any[], reportType: string = 'individual') => {
  
  console.log('📤 Calling PDF endpoint with:', { resultsCount: results.length, reportType });

  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/v1/generate-pdf`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ results, reportType }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PDF generation failed:', response.status, errorText);
    throw new Error(`Failed to generate PDF: ${response.status}`);
  }
  
  return response.blob();
};


export const authService = new ApiService();
export const classificationService = new ApiService();
