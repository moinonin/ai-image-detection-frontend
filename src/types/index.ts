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

export interface VideoSummary {
  filename: string;
  analysis_type: string;
  confidence_ai: number;
  confidence_human: number;
  total_frames_analyzed: number;
  ai_frames: number;
  human_frames: number;
  average_ai_confidence: number;
  average_human_confidence: number;
  dominant_class: string;
  model: string;
  "analysis detail": string;
}

export  interface PDFResultProps {
  filename: string;
  dominant_class: string;
  confidence_ai: number;
  confidence_human: number;
  model: string;
  analysis_type: string;
  'analysis detail': string;
  total_frames_analyzed: number;
  ai_frames: number;
  human_frames: number;
  average_ai_confidence: number;
  average_human_confidence: number;
}
export interface EmailResultProps {
  filename: string;
  dominant_class: string;
  confidence_ai: number;
  confidence_human: number;
  model: string;
  analysis_type: string;
  'analysis detail': string;
  total_frames_analyzed: number;
  ai_frames: number;
  human_frames: number;
  average_ai_confidence: number;
  average_human_confidence: number;
}

export interface EmailResultsParams {
  predicted_class: string;
  filename: string;
  confidence: number | undefined;
  model: string;
  probability?: number;
}

export interface EmailResultsParams {
  filename: string;
  predicted_class: string;
  confidence: number | undefined;
  model: string;
  probability?: number;
}

export interface BatchResult {
  filename?: string;
  predicted_class: string;
  confidence?: number;
  model?: string;
  probability?: number;
  [key: string]: any;
}