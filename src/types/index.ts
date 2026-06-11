export type ReportFormat = 'json' | 'pdf';

export interface User {
  id: string;
  account_id?: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface ApiKeyCreateResponse {
  api_key: ApiKey;
  raw_key: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  // Password reset methods
  forgotPassword: (email: string) => Promise<void>;
  //resetPassword: (token: string, newPassword: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  verifyResetToken: (token: string) => Promise<boolean>;
  resetLoading: boolean;
  clearResetMessage: () => void;
  resetMessage: string | null;
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
  free_analyses_used_this_month?: number;
  free_analyses_remaining?: number;
  subscription_used?: boolean;
  account_id?: string | null;
  oversized_files?: boolean;
  
  // New fields from polar payment system
  current_plan?: string;
  plan_limits?: {
    image: number;
    video: number;
  };
  used_this_month?: {
    image: number;
    video: number;
    total: number;
  };
  remaining_this_month?: {
    image: number;
    video: number;
  };
  total_analyses?: number;
  today_analyses?: number;
  breakdown_by_type?: Record<string, any>;
  batch_jobs?: {
    total: number;
    completed: number;
    pending: number;
  };
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

// Extended interfaces to include pdfBlob
export interface BatchClassificationResponse {
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

export interface BatchAnalysisItem {
  filename: string;
  analysis_results: IndividualClassificationResult;
  from_cache: boolean;
  cache_used: boolean;
  timestamp: string;

  id?: string;
  // Add other analysis properties based on your data
  image_url?: string;
  prediction?: string;
  confidence?: number;
}
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}

export interface AnalysesResponse {
  analyses: ClassificationResult[];
  total: number;
  job_id: string;
}
export interface BatchUsage {
  free_analyses_used_this_month: number;
  free_analyses_remaining: number;
  subscription_used: boolean;
  account_id: string | null;
}

export interface BatchJobDebug {
  analyses_count: number;
  analysis_count_in_db: number;
  include_analyses_param: boolean;
  job_data_status: string;
  results_source: string | null;
}

export interface BatchJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  user: string;
  processed: number;
  total_images: number;
  analyses?: BatchAnalysisItem[];
  //results?: IndividualClassificationResult[];
  individual_analyses?: IndividualClassificationResult[];
  usage?: BatchUsage;
  error?: string;
  results_note?: string;
  results_source?: string;
  results: any[];
  // Add the _debug property
  _debug?: {
    analyses_count: number;
    analysis_count_in_db: number;
    include_analyses_param: boolean;
    job_data_status: string;
    results_source: string | null;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export type ProvenanceStatus =
  | 'verified'
  | 'unverified'
  | 'tampered'
  | 'revoked'
  | 'expired'
  | 'superseded'
  | 'not_registered'
  | 'upstream_error'
  | 'unsupported'
  | 'unknown';

export interface ProvenanceVerifyResponse {
  status?: ProvenanceStatus | string;
  verified?: boolean;
  valid?: boolean;
  tampered?: boolean;
  reason?: string;
  request_id?: string;
  secret?: string;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
  proof?: Record<string, any>;
  registry?: ProvenanceRegistryRecord | null;
  registry_match?: boolean;
  registry_status?: string;
  trust_decision?: 'accept' | 'review' | 'do_not_accept' | string;
  verification_url?: string;
  document_hash?: string;
  message?: string;
  raw?: Record<string, any>;
  [key: string]: any;
}

export interface ProvenanceIssueCertificateInput {
  secret: string;
  title?: string;
  document_type?: string;
  issuer_id?: string;
  cert_id?: string;
  recipient_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  expires_at?: string;
  supersedes_document_id?: string;
  metadata_visibility?: 'public_safe' | 'recipient_only' | 'issuer_only';
  model_name?: string;
  timestamp?: string;
  account_id?: string;
}

export interface ProvenanceIssueCertificateResponse {
  blob: Blob;
  filename: string;
  contentType: string;
  documentId?: string;
  verificationUrl?: string;
  status?: string;
  storageMode?: string;
  supersedesDocumentId?: string;
}

export interface ProvenanceRegistryRecord {
  document_id: string;
  issuer_name?: string;
  document_type?: string;
  title?: string;
  status?: string;
  issued_at?: string;
  expires_at?: string | null;
  verification_url?: string;
  storage_mode?: string;
  metadata_visibility?: string;
  document_hash?: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  supersedes_document_id?: string | null;
  supersedes_verification_url?: string | null;
  superseded_by_document_id?: string | null;
  superseded_by_verification_url?: string | null;
  [key: string]: any;
}

export interface ProvenanceRegistryListResponse {
  account_id: string;
  items: ProvenanceRegistryRecord[];
  limit: number;
  offset: number;
}

export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface OrganizationSummary {
  id: string;
  name?: string;
  slug?: string;
  email?: string;
  subscription_plan_type?: string;
  subscription_status?: string;
  role: OrganizationRole;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  role: OrganizationRole;
  username: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
}

export interface OrganizationInvitation {
  id: string;
  account_id: string;
  email: string;
  role: Exclude<OrganizationRole, 'owner'>;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  invited_by: string;
  expires_at: string;
  created_at: string;
}

export interface OrganizationInvitationCreated extends OrganizationInvitation {
  accept_url: string;
  delivery: 'sent' | 'failed' | 'not_configured';
}

export interface OrganizationDetail extends OrganizationSummary {
  seat_limit: number;
  member_count: number;
  pending_invitation_count: number;
  available_seats: number;
  members: OrganizationMember[];
  pending_invitations?: OrganizationInvitation[];
}

export interface OrganizationListResponse {
  organizations: OrganizationSummary[];
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
  features: any;
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
  features: any;
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  user: string; // Change from optional to required
  processed: number;
  total_images: number;
  results?: IndividualClassificationResult[];
  individual_analyses?: IndividualClassificationResult[];
  analyses?: BatchAnalysisItem[];
  usage?: BatchUsage;
  error?: string;
  results_note?: string;
  results_source?: string;
}

export interface BatchJobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  user: string;
  total_images: number;
  processed: number;
  analyses?: BatchAnalysisItem[];
  results?: IndividualClassificationResult[];
  individual_analyses?: IndividualClassificationResult[];
  usage?: BatchUsage;
  error?: string;
  results_note?: string;
  results_source?: string;
  data: any;
}

// In types/index.tsx
export interface BatchJobBase {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  user: string; // Required in base
  processed: number;
  total_images: number;
  results?: IndividualClassificationResult[];
  individual_analyses?: IndividualClassificationResult[];
  analyses?: BatchAnalysisItem[];
  usage?: BatchUsage;
  error?: string;
  results_note?: string;
  results_source?: string;
}

// Add these interfaces near the top of your file, after the existing interfaces

export interface AnalysisData {
  filename: string;
  predicted_class: string;
  is_ai: boolean;
  confidence: number | null;
  probability: number | null;
  model: string;
  features: any;
  analysis?: any;
  analysis_results?: any;
}

export interface BatchAnalysesResponse {
  analyses?: Array<{
    analysis: AnalysisData;
  }>;
  results?: Array<{
    analysis_results: AnalysisData;
  }>;
  length?: number;
  usage: UsageInfo;
}

export interface BatchAnalysisResult {
  filename: string;
  predicted_class: string;
  is_ai: boolean;
  confidence: number | 0;
  probability: number | 0;
  model: string;
  features: any;
  analysis_type?: string;
  total_images?: number;
  analyzed_images?: number;
  user?: string;
  [key: string]: any;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  email?: string;
}

// New interface for the updated usage response
export interface CurrentUsageResponse {
// Add other relevant fields as needed
  usage: {
    current_plan: string;
    plan_limits: {
      image: number;
      video: number;
    };
    used_this_month: {
      image: number;
      video: number;
      total: number;
    };
    remaining_this_month: {
      image: number;
      video: number;
    };
    total_analyses: number;
    today_analyses: number;
    breakdown_by_type: Record<string, any>;
    batch_jobs: {
      total: number;
      completed: number;
      pending: number;
    };
  };
  subscription: {
    active: boolean;
    plan_name: string;
    account_id: string;
    status: string;
  };
  timestamp: string;
}

export interface PlanLimitsResponse {
  images: number;
  videos: number;
  analysis_type: string;
}

export interface SubscriptionStatus {
  account_id: string;
  current_plan: string;
  status: string;
  polar_subscription_id: string | null;
  polar_product_id: string | null;
  limits: {
    image_analysis_limit: number;
    video_analysis_limit: number;
    analysis_types_allowed: string[];
    plan_type: string;
  };
  is_active: boolean;
  is_free_tier: boolean;
}

export interface CancelResponse {
  status: string;
  message: string;
  new_plan: string;
  limits: {
    images: number;
    videos: number;
  };
}

export interface UpgradeResponse {
  success: boolean;
  checkout_url: string;
  session_id: string;
  message: string;
  subscription_plan_type: string;
}

export interface PlanInfo {
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
}

export interface AvailablePlansResponse {
  available_plans: PlanInfo[];
  current_plan: string;
  can_upgrade: boolean;
}

// Update the IndividualClassificationResult interface if needed
// (This should probably match what's in your ../types file)

// Then extend for specific cases - they'll all have required user
export interface BatchJob extends BatchJobBase {
  // Add any BatchJob-specific properties here
}

export interface BatchJobStatus extends BatchJobBase {
  // Add any BatchJobStatus-specific properties here
}

export interface BatchJobResponse extends BatchJobBase {
  // BatchJobResponse specific properties
}
