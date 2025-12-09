import { JobData } from './job-data';

/**
 * API request/response types for communication with local backend.
 */

export interface ScoreJobRequest {
  job_data: JobData;
}

export interface ScoreJobResponse {
  authenticity_score: number;
  level: 'likely real' | 'uncertain' | 'likely fake';
  confidence: 'Low' | 'Medium' | 'High';
  summary: string;
  red_flags: string[];
  positive_signals: string[];
  activated_rules: Array<{
    id: string;
    weight: number;
    confidence: string;
  }>;
  computed_at: string;
}

export interface HealthCheckResponse {
  status: 'ok';
  version: string;
  scorer_loaded: boolean;
}

export interface ApiError {
  error: string;
  detail?: string;
}

