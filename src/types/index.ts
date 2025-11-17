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
  analysis_results: IndividualClassificationResult;
  from_cache: boolean;
  cache_used: boolean;
  timestamp: string;
  
}

export interface BatchUsage {
  free_analyses_used_this_month: number;
  free_analyses_remaining: number;
  subscription_used: boolean;
  account_id: string | null;
}

export interface BatchClassificationResponse {
  analyses: BatchAnalysisItem[];
  usage: UsageInfo;
  pdfBlob?: Blob;
}

export interface BatchJob {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  processed: number;
  total_images: number;
  // Multiple possible result formats for backward compatibility
  results?: IndividualClassificationResult[];
  individual_analyses?: IndividualClassificationResult[];
  analyses?: BatchAnalysisItem[]; // Add this for new backend format
  usage?: BatchUsage; // Add this for usage information
  error?: string;
  results_note?: string;
  results_source?: string;
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
  // Add features as an optional property
  features?: {
    eigen_entropy: number;
    eigen_decay_rate: number;
    eigen_condition_number: number;
    radial_smoothness: number;
    high_freq_energy: number;
    channel_correlation: number;
    color_consistency: number;
    local_inconsistency: number;
    noise_std: number;
    noise_skew: number;
    noise_regularity: number;
  };
  // new with batch analysis
    video_id: string;
    total_frames: number;
    analyzed_frames: number;
    overall_verdict: string;
    confidence: number;
    
    // Add the missing enriched_results property
    enriched_results?: EnrichedResult | null;
    
    // Other existing VideoSummary properties...
    processing_time?: string;
    model_used?: string;
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
    modelType: string, 
    partialAnalysis: boolean
  ): Promise<Blob>;
}
//downloadVideoPDF(file: File, modelType: string, partialAnalysis: boolean): Promise<Blob>;
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
  analysis_type: string;
  total_images: number;
  analyzed_images: number;
  user: string;
  ai_detected: boolean;
  confidence: number;
  predicted_class: string;
  probability: number;
  from_cache: boolean;
  cache_timestamp: string | null;
  processing_time: string;
  enriched_results?: EnrichedResult | null;
  // Legacy fields for backward compatibility
  is_ai?: boolean;
  isAI?: boolean;
  predictedClass?: string;
  model_slug?: string;
  ground_truth?: string;
  groundTruth?: string;
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
  accepted_files: File[];
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

// Add this interface for enriched results if needed
export interface EnrichedResult {
  // Define the structure based on your backend response
  // These are example fields - adjust based on your actual data
  additional_analysis?: any;
  metadata?: any;
  enhanced_confidence?: number;
  // Add other fields that appear in enriched_results
}

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

// Add these types to match backend response
export interface BatchAnalysisResponse {
  analyses: BatchAnalysisItem[];
  usage: BatchUsage;
}

export interface BatchJobStatus {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  processed: number;
  total_images: number;
  results?: IndividualClassificationResult[];
  individual_analyses?: IndividualClassificationResult[];
  analyses?: BatchAnalysisResponse['analyses']; // Add this to match backend
  error?: string;
  results_note?: string;
  results_source?: string;
}