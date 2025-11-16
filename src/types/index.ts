export type ReportFormat = 'json' | 'pdf';

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

/* Handle large files */
export interface LargeFileSummary {
  accepted: number;
  rejected: number;
  total_uploaded_MB: number;
  max_size: number;
  max_file_size_MB: number
}

export interface FileDetail {
  file_name: string;
  status: 'accepted' | 'rejected';
  file_size_MB?: number;
  message?: string;
}

export interface LargeFileResponse {
  summary: LargeFileSummary;
  details: FileDetail[];
}

export interface ClassificationResult {
  filename: string;
  model: string;
  report_format: string;
  probability?: number;
  predicted_class: string;
  ground_truth?: string;
  features?: any;
  confidence?: number;
  user: string;
  is_ai?: boolean;
  result?: any;
  pdfBlob?: Blob;
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
  reportFormat?: string;
  individual_analyses?: any[];  // New
  results_note?: string;        // New
  results_source?: string;      // New
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

// Video Analysis Response with Cache Support
export interface VideoAnalysisResponse {
  analysis_results: VideoSummary;
  from_cache: boolean;
  cache_used: boolean;
  timestamp: string;
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
  pdfBlob?: Blob;
  summary?: LargeFileSummary;
  details?: FileDetail[];
  // Optional cache fields that might be included
  from_cache?: boolean;
  cache_timestamp?: string;
}

export interface ClassificationService {
  classifyVideo(
    file: File, 
    model: string, 
    partial: boolean,
    reportFormat?: string,
  ): Promise<VideoClassificationResponse>;
  
  downloadVideoPDF(
    file: File, 
    model: string, 
    partial: boolean
  ): Promise<Blob>;
}

export type VideoClassificationResponse = VideoSummary | VideoAnalysisResponse;

// Type guard
export function isCachedResponse(response: any): response is VideoAnalysisResponse {
  return response && 'analysis_results' in response && 'from_cache' in response;
}

// Helper function to extract video summary from either response format
export function getVideoSummary(response: VideoClassificationResponse): VideoSummary {
  if (isCachedResponse(response)) {
    return response.analysis_results;
  }
  return response;
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
  pdfBlob?: Blob;
  reportFormat?: string;
}

// Individual result type
export interface IndividualClassificationResult {
  filename: string;
  model: string;
  probability: number;
  predicted_class: string;
  is_ai: boolean;
  ground_truth?: string;
  features: Record<string, any>;
  confidence: number;
  user: string;

  
}

export interface FileValidationError {
  error: string;
  summary: {
    accepted: number;
    rejected: number;
    total_uploaded_MB: number;
    max_size: number;
    max_file_size_MB: number;
  };
  details: Array<{
    filename: string;
    status: 'accepted' | 'rejected';
    file_size_MB: number;
    reason?: string;
  }>;
  accepted_files: any[];
}

export type BatchClassificationResults = IndividualClassificationResult[];
// Function overloads for better type safety
export interface PDFDownloadHandlers {
  // Overload for single result
  handleDownloadPDF(result: IndividualClassificationResult): Promise<void>;
  // Overload for batch results
  handleDownloadPDF(results: BatchClassificationResults): Promise<void>;
  // Implementation signature
  handleDownloadPDF(resultOrResults: IndividualClassificationResult | BatchClassificationResults): Promise<void>;
}