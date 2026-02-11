import React, { useState, useRef, useEffect } from 'react';
import { classificationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import EmailHealthBadge from './EmailHealthBadge';
import { useToast } from '../contexts/ToastContext';

import { 
  BatchJob, 
  IndividualClassificationResult,
  BatchJobResponse,
  BatchAnalysisResult,
  BatchClassificationResponse,
  CurrentUsageResponse
} from '../types';

//type ClassificationResponse = SingleClassificationResponse | BatchClassificationResponse;

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift()!;
  return null;
}

interface FileValidationError {
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

// Extended BatchJob type with debug info
interface BatchJobWithDebug extends BatchJob {
  _debug?: {
    analyses_count: number;
    analysis_count_in_db: number;
    include_analyses_param: boolean;
    job_data_status: string;
    results_source: string | null;
  };
}

const BatchClassification: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const MODEL_TYPES = ['ml', 'net', 'scalpel'];
  const [model, setModel] = useState('scalpel');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<BatchJobWithDebug | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportFormat: 'pdf' | 'json' = 'pdf';
  const [validationError, setValidationError] = useState<FileValidationError | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailFailed, setEmailFailed] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  useEffect(() => {
    if (user?.email && emailRecipient.trim() === '') {
      setEmailRecipient(user.email);
    }
  }, [user, emailRecipient]);

  //const [analysisResults, setAnalysisResults] = useState<ClassificationResponse | null>(null);
  const [analysisResults, setAnalysisResults] = useState<BatchClassificationResponse | null>(null);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [usageLimitMessage, setUsageLimitMessage] = useState('');
  const [apiError, setApiError] = useState('');

  //const [usageData, setUsageData] = useState<CurrentUsageResponse | null>(null);
  const [currentUsageData, setCurrentUsageData] = useState<CurrentUsageResponse | null>(null);
  const [showUpgradeBadge, setShowUpgradeBadge] = useState(false);
  // Add this state to track plan features
  const [planFeatures, setPlanFeatures] = useState<{
    allowsBatch: boolean;
    maxBatchSize?: number;
    currentPlan: string;
  } | null>(null);
  // Check usage on component mount
   useEffect(() => {
    const checkPlanAfterAuth = async () => {
      if (user) {
        try {
          const features = await classificationService.checkPlanFeatures();
          setPlanFeatures(features);
          console.log('🔄 Plan features re-checked after auth:', features);
        } catch (error) {
          console.error('Failed to check plan features after auth:', error);
        }
      }
    };

    checkPlanAfterAuth();
  }, [user]); // This will run whenever the user object changes
  // Client-side file size validation constants
  const MAX_FILE_SIZE_MB = 0.5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  // Results state
  const [analyses, setAnalyses] = useState<BatchAnalysisResult[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Debug state
  useEffect(() => {
    console.log('Current state:', {
      analysesCount: analyses.length,
      analysisResults: analysisResults,
      jobStatus: jobStatus,
      loading: loading,
      displayResults: getDisplayResults().length
    });
    checkPlanFeatures();
  }, [analyses, analysisResults, jobStatus, loading,]);

  const checkPlanFeatures = async () => {
    try {
      const features = await classificationService.checkPlanFeatures();
      setPlanFeatures(features);
      
      // If batch is not allowed, show appropriate UI
      if (!features.allowsBatch) {
        setShowUpgradeBadge(true);
      }
    } catch (error) {
      console.error('Failed to check plan features:', error);
    }
  };
  const handleBatchClassification = async (files: File[], model: string, accountId?: string) => {
    setApiError('');
    setAnalysisResults(null);
    setShowUsageLimitModal(false);
    setUsageLimitMessage('');
    setAnalyses([]);
    setJobStatus(null);
    setResultsError(null);
    setShowUpgradeBadge(false);

    try {
      // Check if user's plan allows batch classification
      let planFeatures;
      try {
        planFeatures = await classificationService.checkPlanFeatures();
        setPlanFeatures(planFeatures);
        console.log('📊 Plan features loaded:', planFeatures);
      } catch (error) {
        console.error('Failed to check plan features:', error);
        // Default to no batch access if we can't check
        planFeatures = {
          allowsBatch: false,
          currentPlan: 'Unknown'
        };
      }

      // If batch is not allowed, use single classification for each file
      if (!planFeatures.allowsBatch) {
        console.log(`🔄 Using single classification for ${planFeatures.currentPlan} plan`);
        
        const singleResults: BatchAnalysisResult[] = [];
        
        // Process files sequentially to avoid overwhelming the API
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            console.log(`📤 Processing file ${i + 1}/${files.length}: ${file.name}`);
            
            const singleResult = await classificationService.classifySingleImage(
              file, 
              model, 
              'json', 
              true, 
              accountId
            );
            
            const processedAnalysis: BatchAnalysisResult = {
              id: `single-${Date.now()}-${i}`,
              filename: file.name,
              predicted_class: singleResult.analysis.predicted_class || 'Unknown',
              is_ai: singleResult.analysis.is_ai !== undefined ? singleResult.analysis.is_ai : false,
              confidence: singleResult.analysis.confidence ?? 0,
              probability: singleResult.analysis.probability ?? 0,
              model: singleResult.analysis.model || model,
              features: singleResult.analysis.features || {},
              analysis_type: 'single',
              total_images: 1,
              analyzed_images: 1,
              user: 'user',
              from_cache: singleResult.cache_info?.from_cache || false,
              cache_timestamp: singleResult.cache_info?.cache_timestamp || null,
              processing_time: new Date().toISOString()
            };
            
            singleResults.push(processedAnalysis);
            
            // Update progress incrementally
            setAnalyses([...singleResults]);
            
          } catch (error) {
            console.error(`❌ Failed to process ${file.name}:`, error);
            
            // Create an error result for this file
            const errorAnalysis: BatchAnalysisResult = {
              id: `error-${Date.now()}-${i}`,
              filename: file.name,
              predicted_class: 'Processing Failed',
              is_ai: false,
              confidence: 0,
              probability: 0,
              model: model,
              features: {},
              analysis_type: 'single',
              total_images: 1,
              analyzed_images: 0,
              user: 'user',
              from_cache: false,
              cache_timestamp: null,
              processing_time: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            };
            
            singleResults.push(errorAnalysis);
            setAnalyses([...singleResults]);
          }
        }
        
        console.log('✅ Single classification results:', singleResults);
        
        // Set final results
        setAnalyses(singleResults);
        
        // Create a proper BatchClassificationResponse
        const batchResponse: BatchClassificationResponse = {
          analyses: singleResults.map(result => ({
            filename: result.filename,
            analysis_results: {
              filename: result.filename,
              predicted_class: result.predicted_class,
              is_ai: result.is_ai,
              confidence: result.confidence,
              probability: result.probability,
              model: result.model,
              features: result.features,
              analysis_type: result.analysis_type,
              total_images: result.total_images,
              analyzed_images: result.analyzed_images,
              user: result.user,
              from_cache: result.from_cache,
              cache_timestamp: result.cache_timestamp,
              processing_time: result.processing_time
            },
            from_cache: result.from_cache,
            cache_used: result.from_cache,
            timestamp: result.processing_time
          })),
          usage: { 
            free_analyses_used_this_month: 0, 
            free_analyses_remaining: 0, 
            subscription_used: false, 
            account_id: null 
          }
        };
        
        setAnalysisResults(batchResponse);
        
        // Show upgrade suggestion for free/explorer plan users
        if (['free', 'explorer'].includes(planFeatures.currentPlan.toLowerCase())) {
          setShowUpgradeBadge(true);
          setUsageLimitMessage(`Your ${planFeatures.currentPlan} plan processes files individually. Upgrade to enable faster batch processing.`);
        }
        
      } else {
        // Use regular batch processing for plans that allow it
        console.log(`⚡ Using batch processing for ${planFeatures.currentPlan} plan`);
        
        const result = await classificationService.startBatchJobSync(
          files, 
          model, 
          'json', 
          true, 
          accountId
        );
        
        console.log('Batch classification result:', result);
        
        // Process analyses from response
        if (result.analyses && result.analyses.length > 0) {
          const processedAnalyses: BatchAnalysisResult[] = result.analyses.map((item: any, index: number) => {
            const analysis = item.analysis_results || item;
            
            return {
              id: `batch-${Date.now()}-${index}`,
              filename: analysis.filename || item.filename || `file_${index}`,
              predicted_class: analysis.predicted_class || 'Unknown',
              is_ai: analysis.is_ai !== undefined ? analysis.is_ai : false,
              confidence: analysis.confidence ?? 0,
              probability: analysis.probability ?? 0,
              model: analysis.model || model,
              features: analysis.features || {},
              analysis_type: 'batch',
              total_images: 1,
              analyzed_images: 1,
              user: 'batch_user',
              from_cache: analysis.from_cache || false,
              cache_timestamp: analysis.cache_timestamp || null,
              processing_time: analysis.processing_time || new Date().toISOString()
            };
          });
          
          setAnalyses(processedAnalyses);
          console.log('Processed analyses:', processedAnalyses);
        } else {
          console.warn('No analyses found in response');
        }
        
        setAnalysisResults(result);
      }
      
    } catch (error: unknown) {
      console.error('❌ Classification error:', error);
      
      // Type guard to check if it's an Error object
      if (error instanceof Error) {
        // Enhanced usage limit error handling
        if (error.message.includes('USAGE_LIMIT_EXCEEDED')) {
          const rawMessage = error.message.replace('USAGE_LIMIT_EXCEEDED: ', '');
          
          // Try to parse the JSON message for better formatting
          try {
            const parsedMessage = JSON.parse(rawMessage);
            if (parsedMessage.detail) {
              setUsageLimitMessage(parsedMessage.detail);
            } else {
              setUsageLimitMessage(rawMessage);
            }
          } catch (parseError) {
            // If it's not JSON, use the raw message
            setUsageLimitMessage(rawMessage);
          }
          
          // Store usage data for the upgrade badge/modal
          if ((error as any).usageData) {
            setCurrentUsageData((error as any).usageData);
          }
          
          // Show both the modal and the upgrade badge
          setShowUsageLimitModal(true);
          setShowUpgradeBadge(true);
          
        } else if (error.message.includes('PLAN_FEATURE_RESTRICTED')) {
          // Handle plan feature restrictions
          setUsageLimitMessage(error.message.replace('PLAN_FEATURE_RESTRICTED: ', ''));
          setShowUsageLimitModal(true);
          setShowUpgradeBadge(true);
          
          // Store plan features for upgrade modal
          if ((error as any).planFeatures) {
            setPlanFeatures((error as any).planFeatures);
          }
        } else {
          setApiError(error.message || 'An error occurred during classification');
        }
      } else if (typeof error === 'object' && error !== null && 'error' in error && 'summary' in error) {
        // This is a file validation error from the backend
        setValidationError(error as FileValidationError);
      } else {
        setApiError('An unknown error occurred during classification');
      }
      throw error;
    }
  };

  {/*const handleBatchClassification = async (files: File[], model: string, accountId?: string) => {
    setApiError('');
    setAnalysisResults(null);
    setShowUsageLimitModal(false);
    setUsageLimitMessage('');
    setAnalyses([]);
    setJobStatus(null);
    setResultsError(null);
    setShowUpgradeBadge(false); // Reset upgrade badge

    try {
      const result = await classificationService.startBatchJobSync(
        files, 
        model, 
        'json', 
        true, 
        accountId
      );
      
      console.log('Batch classification result:', result);
      
      // Process analyses from response
      if (result.analyses && result.analyses.length > 0) {
        const processedAnalyses: BatchAnalysisResult[] = result.analyses.map((item: any, index: number) => {
          const analysis = item.analysis_results || item;
          
          return {
            id: `batch-${Date.now()}-${index}`,
            filename: analysis.filename || item.filename || `file_${index}`,
            predicted_class: analysis.predicted_class || 'Unknown',
            is_ai: analysis.is_ai !== undefined ? analysis.is_ai : false,
            confidence: analysis.confidence !== undefined ? analysis.confidence : null,
            probability: analysis.probability !== undefined ? analysis.probability : null,
            model: analysis.model || model,
            features: analysis.features || {},
            analysis_type: 'batch',
            total_images: 1,
            analyzed_images: 1,
            user: 'batch_user',
            from_cache: analysis.from_cache || false,
            cache_timestamp: analysis.cache_timestamp || null,
            processing_time: analysis.processing_time || new Date().toISOString()
          };
        });
        
        setAnalyses(processedAnalyses);
        console.log('Processed analyses:', processedAnalyses);
      } else {
        console.warn('No analyses found in response');
      }
      
      setAnalysisResults(result);
      
    } catch (error: any) {
      console.error('Classification error:', error);
      
      // Enhanced usage limit error handling
      if (error.message?.includes('USAGE_LIMIT_EXCEEDED')) {
        const rawMessage = error.message.replace('USAGE_LIMIT_EXCEEDED: ', '');
        
        // Try to parse the JSON message for better formatting
        try {
          const parsedMessage = JSON.parse(rawMessage);
          if (parsedMessage.detail) {
            setUsageLimitMessage(parsedMessage.detail);
          } else {
            setUsageLimitMessage(rawMessage);
          }
        } catch (parseError) {
          // If it's not JSON, use the raw message
          setUsageLimitMessage(rawMessage);
        }
        
        // Store usage data for the upgrade badge/modal
        if (error.usageData) {
          setCurrentUsageData(error.usageData);
          console.log('Usage data from error:', error.usageData);
        }
        
        // Show both the modal and the upgrade badge
        setShowUsageLimitModal(true);
        setShowUpgradeBadge(true);
        
      } else if (error.error && error.summary) {
        // This is a file validation error from the backend
        setValidationError(error as FileValidationError);
      } else {
        setApiError(error.message || 'An error occurred during classification');
      }
      throw error; // Re-throw to handle in submit
    }
  }; */}

  // You can also add a function to check usage before submitting (proactive check)
  const checkBatchUsageBeforeSubmit = async (fileCount: number): Promise<boolean> => {
    try {
      const usage = await classificationService.getCurrentUsage();
      const remainingImages = usage.usage.remaining_this_month.image;
      const currentPlan = usage.usage.current_plan;
      const usedThisMonth = usage.usage.used_this_month.image;
      const planLimit = usage.usage.plan_limits.image;
      
      if (fileCount > remainingImages) {
        setCurrentUsageData(usage);
        setUsageLimitMessage(
          `You only have ${remainingImages} image analysis${remainingImages === 1 ? '' : 's'} remaining this month, but tried to analyze ${fileCount} file${fileCount === 1 ? '' : 's'}. Current plan: ${currentPlan}, Used: ${usedThisMonth}/${planLimit}. Please upgrade your plan or reduce the number of files.`
        );
        setShowUsageLimitModal(true);
        setShowUpgradeBadge(true);
        return false;
      }
      
      if (remainingImages <= 0) {
        setCurrentUsageData(usage);
        setUsageLimitMessage(
          `You have no image analyses remaining this month. Current plan: ${currentPlan}, Used: ${usedThisMonth}/${planLimit}. Please upgrade your plan to continue.`
        );
        setShowUsageLimitModal(true);
        setShowUpgradeBadge(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking usage:', error);
      return true;
    }
  };

  // Adapter function
  const adaptToIndividualClassificationResult = (
    batchResult: BatchAnalysisResult
  ): IndividualClassificationResult => {
    return {
      filename: batchResult.filename,
      predicted_class: batchResult.predicted_class,
      is_ai: batchResult.is_ai,
      confidence: batchResult.confidence,
      probability: batchResult.probability,
      model: batchResult.model,
      features: batchResult.features,
      analysis_type: batchResult.analysis_type || 'batch',
      total_images: batchResult.total_images || 1,
      analyzed_images: batchResult.analyzed_images || 1,
      user: batchResult.user || 'batch_user',
      ai_detected: batchResult.is_ai,
      from_cache: batchResult.from_cache !== undefined ? batchResult.from_cache : false,
      cache_timestamp: batchResult.cache_timestamp || null,
      processing_time: batchResult.processing_time || new Date().toISOString()
    };
  };
  
  // Debug info
  const getDebugInfo = (): { 
    analysesInDb: number; 
    analysesCount: number; 
    includeAnalyses: boolean; 
    resultsSource: string | null; 
    jobStatus: string 
  } | null => {
    if (!jobStatus?._debug) return null;
    
    return {
      analysesInDb: jobStatus._debug.analysis_count_in_db ?? 0,
      analysesCount: jobStatus._debug.analyses_count ?? 0,
      includeAnalyses: jobStatus._debug.include_analyses_param ?? false,
      resultsSource: jobStatus._debug.results_source,
      jobStatus: jobStatus._debug.job_data_status
    };
  };

  // Fetch analyses when job completes but results are empty
  useEffect(() => {
    const fetchAnalysesForJob = async () => {
      const debugInfo = getDebugInfo();
      
      if (
        jobStatus?.status === 'completed' && 
        debugInfo && 
        debugInfo.analysesInDb > 0 && 
        (!jobStatus.results || jobStatus.results.length === 0) &&
        analyses.length === 0 &&
        !isLoadingAnalyses
      ) {
        setIsLoadingAnalyses(true);
        setResultsError(null);
        
        try {
          console.log(`Fetching ${debugInfo.analysesInDb} analyses for job ${jobStatus.job_id}`);
          
          const endpoints = [
            `/api/v1/classify/batch/status/${jobStatus.job_id}?include_analyses=true`,
            `/api/v1/classify/new-batch/status/${jobStatus.job_id}?include_analyses=true`
          ];

          let analysesData: BatchAnalysisResult[] | null = null;
          
          for (const endpoint of endpoints) {
            try {
              console.log(`Testing endpoint: ${endpoint}`);
              const response = await classificationService.get<any>(endpoint);
              console.log(`✅ ${endpoint} returned:`, response);
              
              let extractedData: BatchAnalysisResult[] = [];
              
              if (response.analyses && Array.isArray(response.analyses)) {
                extractedData = response.analyses
                  .map((item: any) => item.analysis || item)
                  .filter(Boolean);
              } else if (response.results && Array.isArray(response.results)) {
                extractedData = response.results
                  .map((item: any) => item.analysis_results || item)
                  .filter(Boolean);
              }
              
              if (extractedData.length > 0) {
                analysesData = extractedData;
                console.log(`✅ Found ${analysesData.length} analyses from ${endpoint}`);
                break;
              }
            } catch (err) {
              console.log(`❌ ${endpoint} failed:`, err);
            }
          }

          if (analysesData && analysesData.length > 0) {
            const cleanedAnalyses: BatchAnalysisResult[] = analysesData
              .map((item: any) => {
                const analysis = item.analysis || item.analysis_results || item;
                
                return {
                  filename: analysis.filename || item.filename || 'Unknown',
                  predicted_class: analysis.predicted_class || item.predicted_class || 'Unknown',
                  is_ai: analysis.is_ai !== undefined ? analysis.is_ai : 
                        (item.is_ai !== undefined ? item.is_ai : 
                        (analysis.predicted_class?.toLowerCase().includes('ai') || false)),
                  confidence: analysis.confidence !== undefined ? analysis.confidence : 
                            (item.confidence !== undefined ? item.confidence : null),
                  probability: analysis.probability !== undefined ? analysis.probability : 
                              (item.probability !== undefined ? item.probability : null),
                  model: analysis.model || item.model || model,
                  features: analysis.features || item.features || {},
                  analysis_type: 'batch',
                  total_images: 1,
                  analyzed_images: 1,
                  user: jobStatus?.user || 'batch_user'
                };
              })
              .filter((item: BatchAnalysisResult) => item.filename !== 'Unknown');

            setAnalyses(cleanedAnalyses);
            console.log(`✅ Set ${cleanedAnalyses.length} cleaned analyses in state`);
          } else {
            throw new Error('No analyses found in any endpoint');
          }
        } catch (err: any) {
          console.error('Failed to fetch analyses:', err);
          setResultsError(err.message || 'Failed to fetch analyses');
        } finally {
          setIsLoadingAnalyses(false);
        }
      }
    };

    fetchAnalysesForJob();
  }, [jobStatus, analyses.length, isLoadingAnalyses, model]);

  // Get display results - FIXED
  const getDisplayResults = (): BatchAnalysisResult[] => {
    if (analyses.length > 0) {
      console.log('Displaying analyses from state:', analyses.length);
      return analyses;
    }
    
    if (jobStatus?.results && Array.isArray(jobStatus.results)) {
      console.log('Displaying analyses from jobStatus:', jobStatus.results.length);
      return jobStatus.results
        .map((result: any) => {
          const analysis = result.analysis_results || result.analysis || result;
          return {
            filename: analysis.filename || result.filename || 'Unknown',
            predicted_class: analysis.predicted_class || result.predicted_class || 'Unknown',
            is_ai: analysis.is_ai !== undefined ? analysis.is_ai : 
                  (result.is_ai !== undefined ? result.is_ai : false),
            confidence: analysis.confidence !== undefined ? analysis.confidence : 
                      (result.confidence !== undefined ? result.confidence : null),
            probability: analysis.probability !== undefined ? analysis.probability : 
                        (result.probability !== undefined ? result.probability : null),
            model: analysis.model || result.model || model,
            features: analysis.features || result.features || {},
            analysis_type: 'batch',
            total_images: 1,
            analyzed_images: 1,
            user: jobStatus?.user || 'batch_user'
          };
        })
        .filter((item: BatchAnalysisResult) => item.filename !== 'Unknown');
    }
    
    console.log('No analyses to display');
    return [];
  };

  const validateFiles = (files: File[]): FileValidationError | null => {
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE_BYTES);
    
    if (oversizedFiles.length === 0) {
      return null;
    }

    return {
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
        file_size_MB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        reason: file.size > MAX_FILE_SIZE_BYTES ? `Exceeded size limit (max ${MAX_FILE_SIZE_MB} MB per file)` : undefined
      })),
      accepted_files: files.filter(file => file.size <= MAX_FILE_SIZE_BYTES)
    };
  };
  const renderDownloadButton = () => {
    if (reportFormat === 'pdf') {
      return (
        <button 
          className="pdf-btn futuristic-btn"
          onClick={() => handleDownloadBatchPDF(jobStatus)}
          disabled={!jobStatus || getDisplayResults().length === 0}
        >
          <span className="btn-icon">📄</span>
          Download Batch PDF
        </button>
      );
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      let files = Array.from(event.target.files);
      
      // If batch is not allowed, only take the first file
      if (planFeatures && !planFeatures.allowsBatch && files.length > 1) {
        files = [files[0]];
        // Show a message that only single files are allowed
        setApiError(`Your ${planFeatures.currentPlan} plan supports single file analysis only. The first file has been selected.`);
      }
      
      const validationResult = validateFiles(files);
      if (validationResult) {
        setValidationError(validationResult);
        setSelectedFiles(files);
      } else {
        setSelectedFiles(files);
        setValidationError(null);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      let files = Array.from(e.dataTransfer.files);
      
      // If batch is not allowed, only take the first file
      if (planFeatures && !planFeatures.allowsBatch && files.length > 1) {
        files = [files[0]];
        setApiError(`Your ${planFeatures.currentPlan} plan supports single file analysis only. The first file has been selected.`);
      }
      
      const validationResult = validateFiles(files);
      if (validationResult) {
        setValidationError(validationResult);
        setSelectedFiles(files);
      } else {
        setSelectedFiles(files);
        setValidationError(null);
      }
    }
  };

  // Update handleSubmit to use pre-validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    const clientValidationError = validateFiles(selectedFiles);
    if (clientValidationError) {
      setValidationError(clientValidationError);
      return;
    }

    // Check usage before proceeding
    const canProceed = await checkBatchUsageBeforeSubmit(selectedFiles.length);
    if (!canProceed) {
      return;
    }

    setLoading(true);
    setValidationError(null);
    setJobStatus(null);
    setJobId(null);
    setAnalyses([]);
    setResultsError(null);
    setApiError('');
    setAnalysisResults(null);
    setShowUsageLimitModal(false);
    setUsageLimitMessage('');

    try {
      await handleBatchClassification(selectedFiles, model);
    } catch (error: any) {
      console.error('Failed to start batch job:', error);
      
      if (!error.message?.includes('USAGE_LIMIT_EXCEEDED')) {
        if (error.error && error.summary && error.details) {
          setValidationError(error as FileValidationError);
        } else {
          setApiError(error.message || 'Failed to start batch processing');
        }
      }
    } finally {
      setLoading(false);
    }
  };
  // Update handleProceedWithAcceptedFiles as well:
  const handleProceedWithAcceptedFiles = () => {
    if (!validationError) return;

    const acceptedFilenames = validationError.details
      .filter(file => file.status === 'accepted')
      .map(file => file.filename);

    const acceptedFiles = selectedFiles.filter(file => 
      acceptedFilenames.includes(file.name)
    );

    if (acceptedFiles.length === 0) {
      alert('No accepted files to proceed with.');
      return;
    }

    setSelectedFiles(acceptedFiles);
    setValidationError(null);
    setLoading(true);
    setAnalyses([]);
    setResultsError(null);
    setApiError('');
    setShowUsageLimitModal(false); // Reset usage limit modal
    setUsageLimitMessage(''); // Reset usage limit message

    handleBatchClassification(acceptedFiles, model)
      .catch(error => {
        console.error('Failed to start batch job with accepted files:', error);
        
        // Don't set API error for usage limit exceeded - it's handled by the modal
        if (!error.message?.includes('USAGE_LIMIT_EXCEEDED')) {
          if (error.error && error.summary && error.details) {
            setValidationError(error as FileValidationError);
          } else {
            setApiError(error.message || 'Failed to start batch processing');
          }
        }
        setLoading(false);
      });
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    const validationResult = validateFiles(newFiles);
    setValidationError(validationResult);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'var(--warning-color)';
      case 'completed': return 'var(--success-color)';
      case 'failed': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleDownloadBatchPDF = async (jobStatus: BatchJobWithDebug | null): Promise<void> => {
    if (!jobStatus) return;

    try {
      console.log('Downloading batch PDF report...');
      const pdfBlob = await classificationService.downloadBatchPDF(
        selectedFiles,
        model,
        jobStatus as unknown as BatchJobResponse
      );
      
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `batch_analysis_report_${jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('Batch PDF downloaded successfully');
    } catch (error: any) {
      console.error('Batch PDF download failed:', error);
      alert('Batch PDF download failed. Please try again.');
    }
  };

  const handleDownloadPDF = async (result: BatchAnalysisResult): Promise<void> => {
    try {
      console.log('📤 Generating PDF for individual result:', {
        filename: result.filename,
      });

      const individualResult = adaptToIndividualClassificationResult(result);
      const pdfBlob = await generatePDFReport([individualResult], 'individual');
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analysis_${result.filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      console.log('Individual PDF downloaded successfully');
    } catch (error: any) {
      console.error('Individual PDF download failed:', error);
      alert(error.message || 'PDF download failed. Please try again.');
    }
  };

  const handleEmailBatchReport = async (): Promise<void> => {
    if (!emailRecipient) {
      setEmailError('Email is required.');
      return;
    }
    const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailPattern.test(emailRecipient)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    const results = getDisplayResults().map(adaptToIndividualClassificationResult);
    if (results.length === 0) {
      setEmailStatus('No results available to email.');
      return;
    }

    setEmailError(null);
    setShowEmailConfirm(true);
  };

  const confirmEmailBatchReport = async (): Promise<void> => {
    const results = getDisplayResults().map(adaptToIndividualClassificationResult);
    if (results.length === 0 || !emailRecipient) return;

    setEmailStatus(null);
    try {
      const result = await classificationService.emailReport(emailRecipient, results, 'batch');
      setEmailStatus('Report sent.');
      setEmailFailed(false);
      if (result.rate_limit) {
        toast.push(
          `Emails remaining: ${result.rate_limit.remaining} (resets in ${result.rate_limit.reset_after_seconds}s)`,
          'info'
        );
      }
      toast.push('Batch report emailed successfully.', 'success');
    } catch (error: any) {
      setEmailStatus(error.message || 'Failed to send report.');
      setEmailFailed(true);
      toast.push(error.message || 'Failed to send report.', 'error');
    } finally {
      setShowEmailConfirm(false);
    }
  };

  const generatePDFReport = async (results: IndividualClassificationResult[], reportType: string = 'individual') => {
    const token = localStorage.getItem('auth_token') || 
                  sessionStorage.getItem('auth_token') ||
                  getCookie('auth_token');
    
    console.log('📤 Calling PDF endpoint with authentication');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8008';
    const response = await fetch(`${apiBaseUrl}/api/v1/generate-pdf`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ results, reportType }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PDF generation failed:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      throw new Error(`Failed to generate PDF: ${response.status}`);
    }
    
    return response.blob();
  };

  const displayResults = getDisplayResults();
  const debugInfo = getDebugInfo();

  return (
      <div className="batch-classification">
        <div className="page-header">
          <h1>Batch Image Analysis</h1>
          <p>Process multiple images simultaneously with advanced AI models</p>
          <p className="file-size-info">Maximum file size: {MAX_FILE_SIZE_MB} MB per file</p>
        </div>

        {/* API Error Display */}
        {apiError && (
          <div className="error-message" style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #f5c6cb'
          }}>
            {apiError}
          </div>
        )}

        <div className="batch-container">
          {planFeatures && !planFeatures.allowsBatch && (
            <div className="plan-restriction-notice" style={{
              padding: '1rem',
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              marginBottom: '1rem',
              color: '#856404'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>⚡ Explorer Plan</h4>
              <p style={{ margin: 0 }}>
                Your current plan supports single file analysis. {selectedFiles.length > 1 && 'Only the first file will be processed.'}
              </p>
            </div>
          )}
          <div className="upload-section">
            <form onSubmit={handleSubmit} className="upload-form">
              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  style={{ display: 'none' }}
                />
                {/*<div className="upload-content">
                  <div className="upload-icon">📂</div>
                  <p>
                    {selectedFiles.length > 0 
                      ? `${selectedFiles.length} files selected`
                      : 'Drag & drop images or use the button below to browse'
                    }
                  </p>
                  <p className="file-size-note">Max file size: {MAX_FILE_SIZE_MB} MB</p>
                  <label className="browse-btn" onClick={() => fileInputRef.current?.click()}>
                    Browse Files
                  </label>
                </div> */}
                <div className="upload-content">
                  <div className="upload-icon">📂</div>
                  <p>
                    {selectedFiles.length > 0 
                      ? `${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'} selected`
                      : planFeatures && !planFeatures.allowsBatch 
                        ? 'Drag & drop an image or use the button below to browse'
                        : 'Drag & drop images or use the button below to browse'
                    }
                  </p>
                  <p className="file-size-note">
                    Max file size: {MAX_FILE_SIZE_MB} MB
                    {planFeatures && !planFeatures.allowsBatch ? ' (Single file only)' : ''}
                  </p>
                  <label className="browse-btn" onClick={() => fileInputRef.current?.click()}>
                    Browse File{planFeatures && !planFeatures.allowsBatch ? '' : 's'}
                  </label>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Selected Files:</h4>
                  <div className="files-list">
                    {selectedFiles.map((file, index) => {
                      const fileSizeMB = file.size / (1024 * 1024);
                      const isOversized = fileSizeMB > MAX_FILE_SIZE_MB;
                      
                      return (
                        <div key={index} className={`file-item ${isOversized ? 'oversized' : ''}`}>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">({fileSizeMB.toFixed(2)} MB)</span>
                          <button 
                            type="button" 
                            className="remove-file"
                            onClick={() => removeFile(index)}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {validationError && (
                <div className="validation-error">
                  <div className="error-header">
                    <h3>📁 File Validation Results</h3>
                    <span className="error-badge">{validationError.error}</span>
                  </div>
                  
                  <div className="validation-summary">
                    <div className="summary-item accepted">
                      <span className="summary-label">Accepted:</span>
                      <span className="summary-value">{validationError.summary.accepted}</span>
                    </div>
                    <div className="summary-item rejected">
                      <span className="summary-label">Rejected:</span>
                      <span className="summary-value">{validationError.summary.rejected}</span>
                    </div>
                    <div className="summary-item size">
                      <span className="summary-label">Max File Size:</span>
                      <span className="summary-value">{validationError.summary.max_file_size_MB} MB</span>
                    </div>
                  </div>

                  <div className="file-details">
                    <h4>File Details:</h4>
                    {validationError.details.map((file, index) => (
                      <div key={index} className={`file-detail ${file.status}`}>
                        <span className="file-name">{file.filename}</span>
                        <span className="file-size">{file.file_size_MB.toFixed(2)} MB</span>
                        <span className={`file-status ${file.status}`}>
                          {file.status === 'accepted' ? '✓' : '✗'} {file.status}
                        </span>
                        {file.reason && <span className="file-reason">{file.reason}</span>}
                      </div>
                    ))}
                  </div>

                  <div className="validation-actions">
                    {validationError.summary.accepted > 0 && (
                      <button 
                        type="button"
                        className="proceed-btn futuristic-btn"
                        onClick={handleProceedWithAcceptedFiles}
                      >
                        <span className="btn-icon">🚀</span>
                        Proceed with {validationError.summary.accepted} Accepted Files
                      </button>
                    )}
                    <button 
                      type="button"
                      className="dismiss-btn"
                      onClick={() => setValidationError(null)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <div className="model-selection">
                <label htmlFor="batch-model">Detection Model:</label>
                <select 
                  id="batch-model"
                  value={model} 
                  onChange={(e) => setModel(e.target.value)}
                  className="model-select"
                >
                  {MODEL_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={selectedFiles.length === 0 || loading || !!(validationError && validationError.summary.accepted === 0)}
                className="analyze-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Processing {selectedFiles.length} Images...
                  </>
                ) : (
                  `Process ${selectedFiles.length} Images`
                )}
              </button>
            </form>
          </div>

          {/* Usage Information Display */}
          {showUpgradeBadge && currentUsageData && (
            <div className="usage-info" style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#495057' }}>Usage Information</h3>
              <div className="detail-item" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem' 
              }}>
                <span className="detail-label" style={{ fontWeight: '500' }}>
                  Current Plan:
                </span>
                <span className="detail-value" style={{ fontWeight: '600' }}>
                  {currentUsageData?.usage?.current_plan || 'Unknown'}
                </span>
              </div>
              <div className="detail-item" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem' 
              }}>
                <span className="detail-label" style={{ fontWeight: '500' }}>
                  Images Remaining:
                </span>
                <span className="detail-value" style={{ fontWeight: '600' }}>
                  {currentUsageData?.usage?.remaining_this_month?.image ?? 0} / {currentUsageData?.usage?.plan_limits?.image ?? 0}
                </span>
              </div>
              <div className="detail-item" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem' 
              }}>
                <span className="detail-label" style={{ fontWeight: '500' }}>
                  Videos Remaining:
                </span>
                <span className="detail-value" style={{ fontWeight: '600' }}>
                  {currentUsageData?.usage?.remaining_this_month?.video ?? 0} / {currentUsageData?.usage?.plan_limits?.video ?? 0}
                </span>
              </div>
              <div className="detail-item" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.5rem' 
              }}>
                <span className="detail-label" style={{ fontWeight: '500' }}>
                  Subscription:
                </span>
                <span className="detail-value" style={{ 
                  fontWeight: '600', 
                  color: currentUsageData?.subscription?.active ? '#28a745' : '#dc3545'
                }}>
                  {currentUsageData?.subscription?.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
            {/* Enhanced Usage Limit Modal */}
            {showUsageLimitModal && (
              <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div className="modal-content" style={{
                  background: 'linear-gradient(135deg, var(--secondary-bg) 0%, var(--tertiary-bg) 100%)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '15px',
                  padding: '2.5rem',
                  maxWidth: '500px',
                  width: '90%',
                  color: 'var(--text-primary)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
                    <h2 style={{ 
                      color: 'var(--error-color)',
                      marginBottom: '1rem',
                      background: 'linear-gradient(45deg, var(--error-color), #ff6b6b)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      Usage Limit Exceeded
                    </h2>
                    <p style={{ 
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6',
                      marginBottom: '0.5rem'
                    }}>
                      {usageLimitMessage}
                    </p>
                    <p style={{ 
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}>
                      Each image in a batch counts as one analysis toward your monthly limit.
                    </p>
                  </div>

                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <h4 style={{ 
                      color: 'var(--primary-color)',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      Available Plans
                    </h4>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <div style={{ 
                        textAlign: 'center',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        minWidth: '120px'
                      }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>Explorer Plan</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>$19</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>100 analyses/month</div>
                      </div>
                      <div style={{ 
                        textAlign: 'center',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        minWidth: '120px',
                        background: 'rgba(0, 255, 136, 0.1)'
                      }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>Pro</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>$79</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>500 analyses/month</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setShowUsageLimitModal(false)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      Maybe Later
                    </button>
                    <button 
                      onClick={() => {
                        setShowUsageLimitModal(false);
                        // Navigate to pricing page or open subscription modal
                        window.open('/pricing', '_blank');
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(45deg, var(--primary-color), var(--secondary-color))',
                        color: 'var(--primary-bg)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 255, 255, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Upgrade Plan
                    </button>
                  </div>

                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <p style={{ 
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem'
                    }}>
                      Need a custom plan?{' '}
                      <a 
                        href="/about#contact-info" 
                        style={{ 
                          color: 'var(--primary-color)',
                          textDecoration: 'none'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        Contact us
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Results Display - MOVED OUTSIDE jobStatus */}
          {displayResults.length > 0 && (
            <div className="results-preview" style={{ marginTop: '2rem' }}>
              <h2>Analysis Results ({displayResults.length} images processed)</h2>
              <div className="results-grid">
                {displayResults
                  .slice(0, isExpanded ? displayResults.length : 5)
                  .map((result: BatchAnalysisResult, index: number) => {
                    const filename = result.filename || `Image ${index + 1}`;
                    
                    // Get data from the right place
                    const analysisData = result.analysis_results || result;
                    const predictedClass = analysisData.predicted_class || 'Unknown';
                    const confidence = analysisData.confidence !== undefined ? analysisData.confidence : null;
                    const probability = analysisData.probability !== undefined ? analysisData.probability : null;
                    const modelUsed = analysisData.model || model;
                    const analysisType = analysisData.analysis_type || 'batch';
                    const totalImages = analysisData.total_images || 1;
                    const analyzedImages = analysisData.analyzed_images || 1;
                    const features = analysisData.features || {};
                    const fromCache = analysisData.from_cache || false;
                    const cacheTimestamp = analysisData.cache_timestamp || null;
                    const processingTime = analysisData.processing_time || new Date().toISOString();

                    // Determine isAI directly from predicted_class text (this works!)
                    const isAI = predictedClass.toLowerCase().includes('ai') || 
                                predictedClass.toLowerCase().includes('generated');

                    return (
                      <div key={index} className="result-container">
                        {/* Result Item - Fixed structure */}
                        <div 
                          className={`result-item ${expandedIndex === index ? 'expanded' : ''}`}
                          onClick={() => toggleExpand(index)}
                        >
                          <span className="filename">{filename}</span>
                          <span className={`prediction ${isAI ? 'batch-ai' : 'batch-human'}`}>
                            {predictedClass}
                          </span>
                          {/*confidence !== null && (
                            <span className={`confidence-badge ${isAI ? 'ai' : 'human'}`}>
                              {(confidence * 100).toFixed(1)}%
                            </span>
                          )*/}
                        </div>
                        
                        {/* Expanded Details - Fixed structure */}
                        {expandedIndex === index && (
                          <div className="result-details-expanded">
                            <div className={`result-card ${isAI ? 'batch-ai-detected' : 'batch-human-detected'}`}>
                              <div className="result-header">
                                <h3>{filename}</h3>
                                <span className={`result-badge ${isAI ? 'batch-ai-badge' : 'batch-human-badge'}`}>
                                  {predictedClass}
                                </span>
                              </div>
                              
                              {/* Confidence Meter */}
                              <div className="confidence-meter">
                                <div className="confidence-label">
                                  Confidence: {confidence !== null ? `${(confidence * 100).toFixed(2)}%` : 'N/A'}
                                </div>
                                {confidence !== null && (
                                  <div className="confidence-bar">
                                    <div 
                                      className={`confidence-fill ${isAI ? 'ai' : 'human'}`}
                                      style={{ 
                                        width: `${(confidence || 0) * 100}%`
                                      }}
                                    ></div>
                                  </div>
                                )}
                              </div>

                              <div className="result-details">
                                <div className="detail-item">
                                  <span className="detail-label">Model Used:</span>
                                  <span className="detail-value">{modelUsed.toUpperCase()}</span>
                                </div>
                                
                                {probability !== null && (
                                  <div className="detail-item">
                                    <span className="detail-label">Probability Score:</span>
                                    <span className="detail-value">{probability.toFixed(4)}</span>
                                  </div>
                                )}
                                
                                <div className="detail-item">
                                  <span className="detail-label">Analysis Type:</span>
                                  <span className="detail-value">{analysisType}</span>
                                </div>
                                
                                <div className="detail-item">
                                  <span className="detail-label">AI Detected:</span>
                                  <span className="detail-value">{isAI ? 'Yes' : 'No'}</span>
                                </div>
                                
                                <div className="detail-item">
                                  <span className="detail-label">Images Analyzed:</span>
                                  <span className="detail-value">{analyzedImages} / {totalImages}</span>
                                </div>
                                
                                <div className="detail-item">
                                  <span className="detail-label">From Cache:</span>
                                  <span className="detail-value">{fromCache ? 'Yes' : 'No'}</span>
                                </div>
                                
                                {cacheTimestamp && (
                                  <div className="detail-item">
                                    <span className="detail-label">Cache Timestamp:</span>
                                    <span className="detail-value">
                                      {new Date(cacheTimestamp).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="detail-item">
                                  <span className="detail-label">Processing Time:</span>
                                  <span className="detail-value">
                                    {new Date(processingTime).toLocaleString()}
                                  </span>
                                </div>
                                
                                {Object.keys(features).length > 0 && (
                                  <div className="detail-item features">
                                    <span className="detail-label">Features:</span>
                                    <div className="features-grid">
                                      {Object.entries(features).map(([key, value]) => (
                                        <div key={key} className="feature-item">
                                          <span className="feature-key">{key}:</span>
                                          <span className="feature-value">
                                            {typeof value === 'number' ? value.toFixed(4) : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="result-actions">
                                <button 
                                  className="download-pdf-btn futuristic-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadPDF(result);
                                  }}
                                >
                                  <span className="btn-icon">📄</span>
                                  Download PDF
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              
              {/* Show More/Less Button - Fixed structure */}
              {displayResults.length > 5 && (
                <div className="results-expand">
                  <button 
                    className="expand-button"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <>
                        <span>Show less</span>
                        <span className="expand-icon">▲</span>
                      </>
                    ) : (
                      <>
                        <span>Show all {displayResults.length} results</span>
                        <span className="expand-icon">▼</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {jobStatus && (
            <div className="job-status">
              <h2>Batch Processing Status</h2>
              <div className="status-card">
                <div className="status-header">
                  <h3>Job: {jobId}</h3>
                  <span 
                    className="status-badge"
                    style={{ color: getStatusColor(jobStatus.status) }}
                  >
                    {jobStatus.status.toUpperCase()}
                  </span>
                </div>

                {debugInfo && (
                  <div className="debug-info">
                    <p><strong>Debug Info:</strong></p>
                    <p>Analyses in DB: {debugInfo.analysesInDb}</p>
                    <p>Analyses count: {debugInfo.analysesCount}</p>
                    <p>Results source: {debugInfo.resultsSource || 'null'}</p>
                  </div>
                )}

                {jobStatus.results_note && (
                  <div className="results-note">
                    <strong>Note:</strong> {jobStatus.results_note}
                  </div>
                )}

                <div className="progress-section">
                  <div className="progress-info">
                    <span>Processed: {jobStatus.processed} / {jobStatus.total_images}</span>
                    <span>{Math.round((jobStatus.processed / jobStatus.total_images) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(jobStatus.processed / jobStatus.total_images) * 100}%`,
                        backgroundColor: getStatusColor(jobStatus.status)
                      }}
                    ></div>
                  </div>
                </div>

                {isLoadingAnalyses && (
                  <div className="analyses-loading">
                    <div className="spinner"></div>
                    Loading analysis results...
                  </div>
                )}

                {resultsError && (
                  <div className="error-message">
                    <strong>Error loading results:</strong> {resultsError}
                  </div>
                )}

                <div className="action-buttons">
                  <EmailHealthBadge />
                  {renderDownloadButton()}
                  <div className="email-report">
                    <div className="email-display">
                      <span className="email-label">Email report to:</span>
                      <span className="email-value">{emailRecipient || 'No email on account'}</span>
                    </div>
                    <div className="email-note">
                      Reports can only be emailed to your account address.
                    </div>
                    {emailError && (
                      <div className="email-error">
                        {emailError}
                      </div>
                    )}
                    <button
                      className="email-btn futuristic-btn"
                      onClick={handleEmailBatchReport}
                      disabled={loading || !emailRecipient}
                    >
                      <span className="btn-icon">✉️</span>
                      Send Report
                    </button>
                    {emailFailed && (
                      <button
                        className="retry-btn futuristic-btn"
                        onClick={handleEmailBatchReport}
                        disabled={loading || !emailRecipient}
                      >
                        Resend
                      </button>
                    )}
                  </div>
                  {showEmailConfirm && (
                    <div className="modal-backdrop">
                      <div className="modal-card">
                        <h3>Send Report?</h3>
                        <p>We will email the report to <strong>{emailRecipient}</strong>.</p>
                        <div className="modal-actions">
                          <button className="futuristic-btn" onClick={confirmEmailBatchReport} disabled={loading}>
                            Confirm
                          </button>
                          <button className="retry-btn futuristic-btn" onClick={() => setShowEmailConfirm(false)} disabled={loading}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {emailStatus && (
                    <div className="email-status">
                      {emailStatus}
                    </div>
                  )}
                </div>

                {jobStatus.error && (
                  <div className="error-message">
                    <strong>Error:</strong> {jobStatus.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No results message */}
          {analysisResults && displayResults.length === 0 && !loading && (
            <div className="no-results" style={{ 
              marginTop: '2rem', 
              padding: '2rem', 
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h3>Processing Complete</h3>
              <p>No analysis results were returned. This might be due to:</p>
              <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                <li>All images failed processing</li>
                <li>Server response format changed</li>
                <li>Network issues</li>
              </ul>
              <p>Check the browser console for detailed information.</p>
            </div>
          )}
        </div>
      </div>
  );
};

export default BatchClassification;
