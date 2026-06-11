// Create a new file: services/usageService.ts
import { CurrentUsageResponse, PlanLimitsResponse } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_PROVENANCE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8008';

class UsageService {
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

  async getCurrentUsage(): Promise<CurrentUsageResponse> {
    return this.request<CurrentUsageResponse>('/api/v1/usage/current');
  }

  async getPlanLimits(productId: string): Promise<PlanLimitsResponse> {
    return this.request<PlanLimitsResponse>(`/api/v1/products/${encodeURIComponent(productId)}/limits`);
  }

  // Helper method to check if user needs to upgrade
  async shouldShowUpgrade(analysisType: 'image' | 'video' = 'image'): Promise<{
    showUpgrade: boolean;
    message?: string;
    usage?: CurrentUsageResponse;
  }> {
    try {
      const usage = await this.getCurrentUsage();
      const remaining = usage.usage.remaining_this_month[analysisType];
      
      if (remaining <= 0) {
        return {
          showUpgrade: true,
          message: `No remaining ${analysisType} analyses for this month. Current plan: ${usage.usage.current_plan}, Used: ${usage.usage.used_this_month[analysisType]}/${usage.usage.plan_limits[analysisType]}`,
          usage
        };
      }

      return {
        showUpgrade: false,
        usage
      };
    } catch (error) {
      console.error('Error checking upgrade status:', error);
      return {
        showUpgrade: false
      };
    }
  }
}

export const usageService = new UsageService();
//export { usageService };
