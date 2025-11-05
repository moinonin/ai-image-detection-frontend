export interface User {
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ClassificationResult {
  filename: string;
  model: string;
  probability?: number;
  predicted_class: string;
  ground_truth?: string;
  features?: any;
  confidence?: number;
  user: string;
  is_ai?: boolean;
  result?: any;
}

export interface BatchJob {
  job_id: string;
  status: string;
  user: string;
  total_images: number;
  processed: number;
  results: any;
  error: string | null;
  created_at: string;
  completed_at?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}