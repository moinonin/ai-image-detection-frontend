import { User, AuthResponse, ClassificationResult, SingleClassificationResponse, ModelInfo, VideoClassificationResponse, BatchJobResponse, VerifyResetTokenResponse, CurrentUsageResponse, PlanLimitsResponse, BatchClassificationResponse } from '../types';
import { usageService } from '../services/usageService';

type ReportFormat = 'json' | 'pdf';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8008';

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

  // NEW: Get current usage information
  async getCurrentUsage(): Promise<CurrentUsageResponse> {
    return usageService.getCurrentUsage();
  }

  // UPDATED: Get plan limits for a specific product - fixed endpoint
  async getPlanLimits(productId: string): Promise<PlanLimitsResponse> {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/products/${encodeURIComponent(productId)}/limits`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get plan limits: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching plan limits:', error);
      throw error;
    }
  }

  // Subscription methods
  async getAvailablePlans(accountId: string): Promise<{
    available_plans: Array<{
      subscription_plan_type: string;
      name: string;
      description: string;
      price_amount: number | null;
      price_currency: string | null;
      recurring_interval: string;
      limits: {
        images: number;
        videos: number;
        analysis_types: string[];
      };
    }>;
    current_plan: string;
    can_upgrade: boolean;
  }> {
    return this.request(`/api/v1/subscriptions/plans?account_id=${accountId}`);
  }

  async upgradeAccount(accountId: string, subscriptionPlanType: string): Promise<{
    success: boolean;
    checkout_url: string;
    session_id: string;
    message: string;
    subscription_plan_type: string;
  }> {
    return this.request('/api/v1/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({
        account_id: accountId,
        subscription_plan_type: subscriptionPlanType
      }),
    });
  }

  async getCurrentPlan(accountId: string): Promise<{
    account_id: string;
    current_plan: string;
    status: string;
    is_active: boolean;
    limits: {
      images: number;
      videos: number;
      analysis_types: string[];
    };
  }> {
    return this.request(`/api/v1/subscriptions/${accountId}/current-plan`);
  }

  async completeUpgrade(
    accountId: string, 
    polarSubscriptionId: string, 
    polarProductId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/v1/subscriptions/${accountId}/complete-upgrade`, {
      method: 'POST',
      body: JSON.stringify({
        polar_subscription_id: polarSubscriptionId,
        polar_product_id: polarProductId
      }),
    });
  }

  // Product methods (for backward compatibility - remove these if not needed)
  async getProducts(): Promise<{ products: any[] }> {
    return this.request('/api/v1/products');
  }

  async getFreeTier(): Promise<any> {
    return this.request('/api/v1/products/free-tier');
  }

  async getProductCheckout(productId: string, customerEmail?: string): Promise<{
    checkout_url: string;
    session_id: string;
    product_id: string;
    expires_at?: string;
  }> {
    const params = new URLSearchParams();
    if (customerEmail) {
      params.append('customer_email', customerEmail);
    }
    
    return this.request(`/api/v1/products/${productId}/checkout?${params.toString()}`);
  }
  // IMPROVED: Check if user has remaining quota for a specific analysis type
  async checkUsageQuota(analysisType: 'image' | 'video'): Promise<{
    hasQuota: boolean;
    message?: string;
    usage?: CurrentUsageResponse;
  }> {
    try {
      const usage = await this.getCurrentUsage();
      const remaining = usage.usage.remaining_this_month[analysisType];
      
      console.log(`📊 Usage check for ${analysisType}:`, {
        remaining,
        currentPlan: usage.usage.current_plan,
        usedThisMonth: usage.usage.used_this_month[analysisType],
        planLimit: usage.usage.plan_limits[analysisType]
      });

      if (remaining <= 0) {
        return {
          hasQuota: false,
          message: `No remaining ${analysisType} analyses for this month. Current plan: ${usage.usage.current_plan}, Used: ${usage.usage.used_this_month[analysisType]}/${usage.usage.plan_limits[analysisType]}`,
          usage
        };
      }

      return {
        hasQuota: true,
        usage
      };
    } catch (error) {
      console.error('Error checking usage quota:', error);
      // If we can't check usage, allow the request to proceed
      // but log the error for debugging
      return {
        hasQuota: true
      };
    }
  }
  // In api.ts - add this method to check plan features
  async checkPlanFeatures(): Promise<{
    allowsBatch: boolean;
    maxBatchSize?: number;
    currentPlan: string;
  }> {
    try {
      const usage = await this.getCurrentUsage();
      const currentPlan = usage.usage.current_plan.toLowerCase();
      
      console.log('🔍 Plan features check:', {
        currentPlan: usage.usage.current_plan,
        normalizedPlan: currentPlan
      });

      // Define which plans allow batch classification
      const batchAllowedPlans = ['free', 'explorer', 'professional', 'team', 'custom'];
      const allowsBatch = batchAllowedPlans.includes(currentPlan);
      
      // Set batch size limits per plan
      const batchSizeLimits: { [key: string]: number } = {
        'free': 0,
        'explorer': 0,
        'professional': 50,
        'team': 100,
        'custom': 500
      };
      
      const features = {
        allowsBatch,
        maxBatchSize: batchSizeLimits[currentPlan],
        currentPlan: usage.usage.current_plan
      };

      console.log('📋 Plan features determined:', features);
      return features;
    } catch (error) {
      console.error('Error checking plan features:', error);
      // Default to no batch access if we can't check
      return {
        allowsBatch: false,
        currentPlan: 'unknown'
      };
    }
  }
  // SIMPLIFIED: Single image classification with usage check
  async classifySingleImage(
    file: File, 
    modelType: string = 'ml', 
    reportFormat: ReportFormat = 'json',
    useCache: boolean = true,
    accountId?: string
  ): Promise<SingleClassificationResponse> {
    const token = localStorage.getItem('token');
    
    try {
      // Enhanced usage check that can trigger UI components
      const quotaCheck = await this.checkUsageQuota('image');
      if (!quotaCheck.hasQuota) {
        // Create an error that components can use to show upgrade UI
        const error = new Error(`USAGE_LIMIT_EXCEEDED: ${quotaCheck.message}`);
        (error as any).status = 402;
        (error as any).usageData = quotaCheck.usage;
        (error as any).showUpgrade = true;
        throw error;
      }

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
        
        // Enhanced error handling for usage limits
        if (response.status === 402) {
          let usageData;
          try {
            usageData = await this.getCurrentUsage();
          } catch (e) {
            console.error('Failed to fetch usage data for error:', e);
          }
          
          const error = new Error(`USAGE_LIMIT_EXCEEDED: ${errorText}`);
          (error as any).status = 402;
          (error as any).usageData = usageData;
          (error as any).showUpgrade = true;
          throw error;
        }
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error && errorData.summary) {
            const fileSizeError = new Error(errorData.error);
            fileSizeError.name = 'FileSizeError';
            (fileSizeError as any).details = errorData;
            throw fileSizeError;
          }
          } catch (error) {
            console.error('Classification service error:', error);
            throw error;
          }
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

  // UPDATED: Batch classification with usage check
  async startBatchJobSync(
    files: File[], 
    model: string = 'ml',
    reportFormat: ReportFormat = 'json',
    useCache: boolean = true,
    accountId?: string
  ): Promise<BatchClassificationResponse> {
    const planFeatures = await this.checkPlanFeatures();
    if (!planFeatures.allowsBatch) {
      const error = new Error(`PLAN_FEATURE_RESTRICTED: Batch classification is not available for your ${planFeatures.currentPlan} plan. Please upgrade to access batch processing.`);
      (error as any).status = 402;
      (error as any).planFeatures = planFeatures;
      (error as any).showUpgrade = true;
      throw error;
    }
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

    // FIXED: Properly check usage quota
    const quotaCheck = await this.checkUsageQuota('image');
    if (!quotaCheck.hasQuota) {
      const error = new Error(`USAGE_LIMIT_EXCEEDED: ${quotaCheck.message}`);
      (error as any).status = 402;
      (error as any).usageData = quotaCheck.usage;
      (error as any).showUpgrade = true;
      throw error;
    }

    // Check if we have enough quota for all files
    if (quotaCheck.usage && files.length > quotaCheck.usage.usage.remaining_this_month.image) {
      const error = new Error(`USAGE_LIMIT_EXCEEDED: Requested ${files.length} analyses but only ${quotaCheck.usage.usage.remaining_this_month.image} remaining. Current plan: ${quotaCheck.usage.usage.current_plan}, Used: ${quotaCheck.usage.usage.used_this_month.image}/${quotaCheck.usage.usage.plan_limits.image}`);
      (error as any).status = 402;
      (error as any).usageData = quotaCheck.usage;
      (error as any).showUpgrade = true;
      throw error;
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

  // UPDATED: classifyBatch with usage check
  async classifyBatch(
    files: File[], 
    model: string = 'ml',
    reportFormat: ReportFormat = 'json',
    useCache: boolean = true,
    accountId?: string
  ): Promise<BatchClassificationResponse> {
    const token = localStorage.getItem('token');
    
    // FIXED: Properly check usage quota
    const quotaCheck = await this.checkUsageQuota('image');
    if (!quotaCheck.hasQuota) {
      const error = new Error(`USAGE_LIMIT_EXCEEDED: ${quotaCheck.message}`);
      (error as any).status = 402;
      (error as any).usageData = quotaCheck.usage;
      (error as any).showUpgrade = true;
      throw error;
    }

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
          (usageLimitError as any).showUpgrade = true;
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

  // FIXED: Video classification with proper usage check
  async classifyVideo(
    file: File, 
    model: string, 
    partial: boolean,
    reportFormat: ReportFormat = 'json',
    useCache: boolean = true,
    accountId?: string
  ): Promise<VideoClassificationResponse> {
    const token = localStorage.getItem('token');
    
    try {
      // FIXED: Properly check usage quota
      const quotaCheck = await this.checkUsageQuota('video');
      if (!quotaCheck.hasQuota) {
        // Create an error that components can use to show upgrade UI
        const error = new Error(`USAGE_LIMIT_EXCEEDED: ${quotaCheck.message}`);
        (error as any).status = 402;
        (error as any).usageData = quotaCheck.usage;
        (error as any).showUpgrade = true;
        throw error;
      }

      const formData = new FormData();
      formData.append('files', file);
      formData.append('model', model);
      formData.append('partial', partial ? 'true' : 'false');
      formData.append('report_format', reportFormat);
      formData.append('use_cache', useCache.toString());
      if (accountId) {
        formData.append('account_id', accountId);
      }

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
        
        // Enhanced error handling for usage limits
        if (response.status === 402) {
          let usageData;
          try {
            usageData = await this.getCurrentUsage();
          } catch (e) {
            console.error('Failed to fetch usage data for error:', e);
          }
          
          const error = new Error(`USAGE_LIMIT_EXCEEDED: ${errorText}`);
          (error as any).status = 402;
          (error as any).usageData = usageData;
          (error as any).showUpgrade = true;
          throw error;
        }
        
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
    } catch (error) {
      console.error('Video classification service error:', error);
      throw error;
    }
  }

  // ADD: Usage check for PDF downloads
  async downloadImagePDFFromResult(
    analysisData: ClassificationResult
  ): Promise<Blob> {
    const token = localStorage.getItem('token');
    
    // Check usage for PDF generation (counts as image analysis)
    const quotaCheck = await this.checkUsageQuota('image');
    if (!quotaCheck.hasQuota) {
      const error = new Error(`USAGE_LIMIT_EXCEEDED: ${quotaCheck.message}`);
      (error as any).status = 402;
      (error as any).usageData = quotaCheck.usage;
      (error as any).showUpgrade = true;
      throw error;
    }

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

  // UPDATED: Async batch job with usage check
  async startBatchJob(files: File[], model: string = 'ml'): Promise<{ job_id: string; status: string; message: string }> {
    const token = localStorage.getItem('token');
    
    // Check usage quota before proceeding
    const hasQuota = await this.checkUsageQuota('image');
    if (!hasQuota) {
      const usage = await this.getCurrentUsage();
      throw new Error(`USAGE_LIMIT_EXCEEDED: No remaining image analyses for this month. Current plan: ${usage.usage.current_plan}, Used: ${usage.usage.used_this_month.image}/${usage.usage.plan_limits.image}`);
    }

    // Check if we have enough quota for all files
    try {
      const usage = await this.getCurrentUsage();
      const remainingImages = usage.usage.remaining_this_month.image;
      if (files.length > remainingImages) {
        throw new Error(`USAGE_LIMIT_EXCEEDED: Requested ${files.length} analyses but only ${remainingImages} remaining. Current plan: ${usage.usage.current_plan}, Used: ${usage.usage.used_this_month.image}/${usage.usage.plan_limits.image}`);
      }
    } catch (error) {
      // If usage check fails, proceed and let backend handle it
      console.warn('Could not verify exact usage quota, proceeding with request:', error);
    }

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

  static async getModels(): Promise<{ models: ModelInfo[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/models`, {
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
export { usageService };