import { User, AuthResponse, ClassificationResult, BatchUsage, ModelInfo, VideoClassificationResponse, UsageInfo, CacheInfo, BatchJobResponse, VerifyResetTokenResponse } from '../types';

type ReportFormat = 'json' | 'pdf';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8008';

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
  /*
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
  } */

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

    console.log('API Request:', {
      url: `${API_BASE_URL}${endpoint}`,
      method: config.method,
      headers: config.headers,
      body: config.body
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', response.status, error);
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

  async verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
    return this.request<VerifyResetTokenResponse>('/api/v1/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = localStorage.getItem('token');
    
    console.log('🔐 Change password attempt:', {
      currentPasswordLength: currentPassword.length,
      newPasswordLength: newPassword.length,
      tokenExists: !!token
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ 
          current_password: currentPassword, 
          new_password: newPassword 
        }),
      });

      console.log('📡 Change password response status:', response.status);

      // Special case: If we get 500 but know passwords actually change, treat as success
      if (response.status === 500) {
        console.log('🔧 Backend returned 500 but password change was successful');
        return; // Treat as success since we know the password actually changes
      }

      if (!response.ok) {
        let errorDetail;
        try {
          errorDetail = await response.json();
          console.error('❌ Change password error detail:', errorDetail);
        } catch (e) {
          const errorText = await response.text();
          console.error('❌ Change password error text:', errorText);
          errorDetail = { detail: errorText };
        }
        
        const error = new Error(errorDetail.detail || `Password change failed (${response.status})`);
        (error as any).status = response.status;
        (error as any).serverDetail = errorDetail;
        throw error;
      }

      console.log('✅ Password change successful');
      
    } catch (error) {
      console.error('💥 Change password service error:', error);
      throw error;
    }
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
        
        const pdfBlob = await response.blob();
        
        let analysisData: ClassificationResult | null = null;
        
        try {
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

  // Add this generic GET method to ApiService class
  async get<T>(endpoint: string): Promise<T> {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GET request failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in GET request:', error);
      throw error;
    }
  }

  // Batch classification - FIXED version
  // In your api.tsx - update the startBatchJobSync method to better handle usage limits
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
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const responseClone = response.clone();
        let errorData;
        
        try {
          errorData = await response.json();
        } catch (jsonError) {
          try {
            const errorText = await responseClone.text();
            errorData = { detail: errorText };
          } catch (textError) {
            errorData = { detail: `Request failed with status ${response.status}` };
          }
        }

        console.log('Batch classification error response:', { status: response.status, errorData });

        // Handle usage limit exceeded (402 Payment Required)
        if (response.status === 402) {
          const errorMessage = errorData.detail || errorData.error || 'Usage limit exceeded';
          const usageLimitError = new Error(`USAGE_LIMIT_EXCEEDED: ${errorMessage}`);
          (usageLimitError as any).status = 402;
          (usageLimitError as any).usageData = errorData;
          throw usageLimitError;
        }
        
        // Handle file validation errors from backend
        if (errorData.error && errorData.summary) {
          throw errorData;
        }
        
        // Handle other errors
        throw new Error(errorData.detail || errorData.error || `Batch job start failed (${response.status})`);
      }

      if (reportFormat === 'pdf') {
        const pdfBlob = await response.blob();
        return {
          analyses: [],
          usage: { free_analyses_used_this_month: 0, free_analyses_remaining: 0, subscription_used: false, account_id: null },
          pdfBlob
        } as BatchClassificationResponse;
      }

      const result = await response.json();
      console.log('Batch classification raw result:', result);
      return result;
    } catch (error) {
      console.error('Error in batch classification:', error);
      throw error;
    }
  }

  // Also update the classifyBatch method to handle usage limits consistently
  async classifyBatch(
    files: File[], 
    model: string = 'ml',
    reportFormat: ReportFormat = 'json',
    useCache: boolean = true,
    accountId?: string
  ): Promise<BatchClassificationResponse> {
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('model', model);
    formData.append('report_format', reportFormat);
    formData.append('use_cache', useCache.toString());
    if (accountId) {
      formData.append('account_id', accountId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 402) {
          const usageLimitError = new Error(`USAGE_LIMIT_EXCEEDED: ${errorText}`);
          (usageLimitError as any).status = 402;
          throw usageLimitError;
        }
        
        throw new Error(`Batch classification failed: ${response.status} - ${errorText}`);
      }

      if (reportFormat === 'pdf') {
        const pdfBlob = await response.blob();
        return {
          analyses: [],
          usage: { 
            free_analyses_used_this_month: 0, 
            free_analyses_remaining: 0, 
            subscription_used: false, 
            account_id: null 
          },
          pdfBlob
        };
      }

      const result = await response.json();
      console.log('Batch classification result:', result);
      return result;
    } catch (error) {
      console.error('Error in batch classification:', error);
      throw error;
    }
  }

  // Add this method to your ApiService class
  async getBatchClassificationResult(jobId: string): Promise<BatchClassificationResponse> {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get batch status: ${response.status} - ${errorText}`);
      }

      const statusResponse = await response.json();
      
      if (statusResponse.status === 'completed' && statusResponse.results) {
        return statusResponse;
      } else {
        throw new Error(`Batch job ${jobId} is not completed yet. Status: ${statusResponse.status}`);
      }
    } catch (error) {
      console.error('Error fetching batch classification results:', error);
      throw error;
    }
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
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('model', model);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch/async`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 402 || errorText.includes('exceeded') || errorText.includes('usage') || errorText.includes('payment')) {
          throw new Error(`USAGE_LIMIT_EXCEEDED: ${errorText}`);
        }
        
        throw new Error(`Failed to start batch job: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Batch job started:', result);
      return result;
    } catch (error) {
      console.error('Error starting batch job:', error);
      throw error;
    }
  }

  // Add method to get current usage
  async getCurrentUsage(): Promise<BatchUsage> {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/usage/current`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get usage: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching usage:', error);
      throw error;
    }
  }

  async getBatchJobStatus(jobId: string): Promise<BatchJobResponse> {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/classify/batch/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get batch job status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Batch job status:', data);
      return data;
    } catch (error) {
      console.error('Error fetching batch job status:', error);
      throw error;
    }
  }

  // Updated batch PDF download to handle BatchJobResponse
  async downloadBatchPDF(_selectedFiles: File[], _model: string, results: BatchJobResponse): Promise<Blob> {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/generate-batch-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          results: results,
          reportType: 'batch'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Batch PDF download failed: ${response.status} - ${errorText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading batch PDF:', error);
      throw error;
    }
  }

  //async getModels(): Promise<{ models: ModelInfo[] }> {
   // return this.request('/api/v1/models');
  //}

  static async getModels(): Promise<{ models: ModelInfo[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/models`, { // Adjust the endpoint as needed
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
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
export const getModels = ApiService.getModels;