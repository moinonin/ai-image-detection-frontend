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

// Updated Classification Result and Response Types
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
  from_cache?: boolean;
  cache_timestamp?: string;
}

export interface UsageInfo {
  free_analyses_used_this_month: number;
  free_analyses_remaining: number;
  subscription_used: boolean;
  account_id: string | null;
}

export interface CacheInfo {
  from_cache: boolean;
  cache_timestamp: string | null;
}

export interface SingleClassificationResponse {
  analysis: ClassificationResult;
  cache_info: CacheInfo;
  usage: UsageInfo;
  pdfBlob?: Blob;
}

export interface BatchAnalysisItem {
  filename: string;
  analysis_results: any;
  from_cache: boolean;
  cache_used: boolean;
  timestamp: string;
}

export interface BatchClassificationResponse {
  analyses: BatchAnalysisItem[];
  usage: UsageInfo;
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

// Updated Video Classification Response to match new structure
export interface VideoClassificationResponse {
  analyses: Array<{
    filename: string;
    analysis_results: VideoSummary;
    from_cache: boolean;
    cache_used: boolean;
    timestamp: string;
  }>;
  usage: UsageInfo;
  pdfBlob?: Blob;
}

// Type guard for old cached response format
export function isCachedResponse(response: any): response is VideoAnalysisResponse {
  return response && 'analysis_results' in response && 'from_cache' in response;
}

// Type guard for new response format
export function isNewVideoResponse(response: any): response is VideoClassificationResponse {
  return response && 'analyses' in response && 'usage' in response;
}

// Type guard for direct VideoSummary (old format)
export function isDirectVideoSummary(response: any): response is VideoSummary {
  return response && 
         'filename' in response && 
         'analysis_type' in response && 
         'confidence_ai' in response &&
         'confidence_human' in response &&
         'total_frames_analyzed' in response;
}

// Helper function to extract video summary from any response format
export function getVideoSummary(response: any): VideoSummary {
  if (isNewVideoResponse(response)) {
    // New response structure - take the first analysis result
    if (response.analyses.length > 0) {
      return response.analyses[0].analysis_results;
    }
    throw new Error('No analyses found in video response');
  } else if (isCachedResponse(response)) {
    // Old cached response format
    return response.analysis_results;
  } else if (isDirectVideoSummary(response)) {
    // Direct VideoSummary (old non-cached format)
    return response;
  }
  
  throw new Error('Unknown video response format');
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

// Helper type for extracting analysis data from different response formats
export type AnalysisResponse = 
  | SingleClassificationResponse 
  | BatchClassificationResponse 
  | VideoClassificationResponse;

// Helper function types for working with the new response structures
export function extractEnrichedResults(response: AnalysisResponse): any[] {
  if ('analysis' in response) {
    // Single classification response
    return [response.analysis];
  } else if ('analyses' in response) {
    // Batch or video response
    return response.analyses.flatMap(analysis => 
      analysis.analysis_results?.enriched_results || []
    );
  }
  return [];
}

export function getUsageInfo(response: AnalysisResponse): UsageInfo {
  return response.usage;
}

export function getCacheInfo(response: SingleClassificationResponse): CacheInfo {
  return response.cache_info;
}