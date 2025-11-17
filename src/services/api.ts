import { User, AuthResponse, ClassificationResult, BatchJob, ModelInfo, VideoClassificationResponse, UsageInfo, CacheInfo } from '../types';

type ReportFormat = 'json' | 'pdf';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8008';
function base64ToBlob(base64: string, contentType: string = ''): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: contentType });
}

// Extended interfaces to include pdfBlob
interface SingleClassificationResponse {
  analysis: ClassificationResult;
  cache_info: CacheInfo;
  usage: UsageInfo;
  pdfBlob?: Blob;
}

interface BatchClassificationResponse {
  analyses: Array<{
    filename: string;
    analysis_results: any;
    from_cache: boolean;
    cache_used: boolean;
    timestamp: string;
  }>;
  usage: UsageInfo;
  pdfBlob?: Blob;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const config: RequestInit = {
      headers,
      credentials: 'include',
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

  async getCurrentUser(): Promise<User> {
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

// Fixed single image classification
async classifySingleImage(
  file: File, 
  modelType: string = 'ml', 
  reportFormat: ReportFormat = 'json',
  useCache: boolean = true,
  accountId?: string
): Promise<SingleClassificationResponse> {
  const token = localStorage.getItem('token');
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', modelType);
    formData.append('report_format', reportFormat);
    formData.append('use_cache', useCache.toString());
    if (accountId) {
      formData.append('account_id', accountId);
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/classify/single`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.summary) {
          const fileSizeError = new Error(errorData.error);
          fileSizeError.name = 'FileSizeError';
          (fileSizeError as any).details = errorData;
          throw fileSizeError;
        }
      } catch (parseError) {
        throw new Error(`Classification failed (${response.status}): ${errorText}`);
      }
      
      throw new Error(`Classification failed (${response.status})`);
    }

    // For PDF responses, handle blob directly
    if (reportFormat === 'pdf') {
      console.log('📄 Handling PDF response for single image');
      
      // Get the PDF blob directly
      const pdfBlob = await response.blob();
      
      // Try to extract analysis data from headers or return minimal response
      let analysisData: ClassificationResult | null = null;
      
      // Some backends include analysis data in headers or as separate fields
      // If your backend doesn't, we'll create a minimal response
      try {
        // Check if there's a JSON part or if we need to make another request
        // For now, create a minimal response
        analysisData = {
          filename: file.name,
          predicted_class: 'Analysis Complete',
          confidence: 0,
          model: modelType,
          is_ai: false,
          probability: 0
        } as ClassificationResult;
      } catch (e) {
        console.warn('Could not extract analysis data from PDF response');
      }
      
      return {
        analysis: analysisData || {
          filename: file.name,
          predicted_class: 'Analysis Complete', 
          confidence: 0,
          model: modelType,
          is_ai: false,
          probability: 0
        } as ClassificationResult,
        cache_info: {
          from_cache: false,
          cache_timestamp: null
        },
        usage: {
          free_analyses_used_this_month: 0,
          free_analyses_remaining: 0, 
          subscription_used: false,
          account_id: null
        },
        pdfBlob
      };
    }

    // For JSON responses
    const result = await response.json();
    console.log('Raw API response:', result);
    
    if (!result.analysis) {
      console.warn('API response missing analysis field:', result);
      throw new Error('Invalid response from server: missing analysis data');
    }
    
    return result;
    
  } catch (error) {
    console.error('Classification service error:', error);
    throw error;
  }
}

  // Batch classification
  async startBatchJobSync(
    files: File[], 
    model: string = 'ml',
    reportFormat: ReportFormat = 'json',
    useCache: boolean = true,
    accountId?: string
  ): Promise<BatchClassificationResponse> {
    const MAX_FILE_SIZE_MB = 0.5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      const oversizedError = {
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
          file_size_MB: file.size / (1024 * 1024),
          reason: file.size > MAX_FILE_SIZE_BYTES ? `Exceeded size limit (max ${MAX_FILE_SIZE_MB} MB per file)` : undefined
        })),
        accepted_files: files.filter(file => file.size <= MAX_FILE_SIZE_BYTES)
      };
      throw oversizedError;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('model', model);
    formData.append('report_format', reportFormat);
    formData.append('use_cache', useCache.toString());
    if (accountId) {
      formData.append('account_id', accountId);
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.summary) {
          throw errorData;
        }
      } catch (parseError) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);
        throw new Error(`Batch job start failed (${response.status})`);
      }
      throw new Error(`Batch job start failed (${response.status})`);
    }

    if (reportFormat === 'pdf') {
      const pdfBlob = await response.blob();
      return {
        analyses: [],
        usage: { free_analyses_used_this_month: 0, free_analyses_remaining: 0, subscription_used: false, account_id: null },
        pdfBlob
      } as BatchClassificationResponse;
    }

    return response.json();
  }

  // Video classification
  async classifyVideo(
    file: File, 
    model: string, 
    partial: boolean,
    reportFormat: ReportFormat = 'json',
    useCache: boolean = true,
    accountId?: string
  ): Promise<VideoClassificationResponse> {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('model', model);
    formData.append('partial', partial ? 'true' : 'false');
    formData.append('report_format', reportFormat);
    formData.append('use_cache', useCache.toString());
    if (accountId) {
      formData.append('account_id', accountId);
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/v1/classify/videos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      throw new Error(`Video classification failed (${response.status})`);
    }

    if (reportFormat === 'pdf') {
      const pdfBlob = await response.blob();
      return {
        analyses: [],
        usage: { free_analyses_used_this_month: 0, free_analyses_remaining: 0, subscription_used: false, account_id: null },
        pdfBlob
      } as VideoClassificationResponse;
    }

    return response.json();
  }
  // In your api.ts service, add this method:
  async downloadImagePDFFromResult(
    analysisData: ClassificationResult
  ): Promise<Blob> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        results: analysisData,
        reportType: 'individual'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PDF download failed: ${response.status} ${errorText}`);
    }

    return await response.blob();
  }

  // In your api.ts service, update the downloadVideoPDF method:
  async downloadVideoPDFFromResult(
    analysisResults: VideoClassificationResponse
  ): Promise<Blob> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        results: analysisResults,
        reportType: 'video'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PDF download failed: ${response.status} ${errorText}`);
    }

    return await response.blob();
  }

  // Async batch job methods
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
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to start batch job');
    }
    return response.json();
  }

  async getBatchJobStatus(jobId: string, includeAnalyses: boolean = false): Promise<BatchJob> {
    return this.request(`/api/v1/classify/batch/status/${jobId}?include_analyses=${includeAnalyses}`);
  }

  async getModels(): Promise<{ models: ModelInfo[] }> {
    return this.request('/api/v1/models');
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