/**
 * Platform type definitions for supported job boards.
 */

export type Platform = 
  | 'LinkedIn' 
  | 'Indeed' 
  | 'Glassdoor' 
  | 'YC Jobs' 
  | 'GitHub' 
  | 'Wellfound'
  | 'Hired'
  | 'Company Site'
  | 'Other';

/**
 * Platform configuration for URL matching and detection.
 */
export interface PlatformConfig {
  name: Platform;
  hostnames: string[];
  pathPatterns: string[];
  jobPageSelector: string;
}

export const SUPPORTED_PLATFORMS: PlatformConfig[] = [
  {
    name: 'LinkedIn',
    hostnames: ['linkedin.com', 'www.linkedin.com'],
    pathPatterns: ['/jobs/view/', '/jobs/collections/'],
    jobPageSelector: '.jobs-details',
  },
  {
    name: 'Indeed',
    hostnames: ['indeed.com', 'www.indeed.com'],
    pathPatterns: ['/viewjob'],
    jobPageSelector: '.jobsearch-JobComponent',
  },
  {
    name: 'Glassdoor',
    hostnames: ['glassdoor.com', 'www.glassdoor.com'],
    pathPatterns: ['/job-listing/', '/job/'],
    jobPageSelector: '.JobDetails',
  },
  {
    name: 'YC Jobs',
    hostnames: ['ycombinator.com', 'www.ycombinator.com'],
    pathPatterns: ['/jobs/'],
    jobPageSelector: '.company-card',
  },
  {
    name: 'GitHub',
    hostnames: ['github.com', 'www.github.com'],
    pathPatterns: ['/College-Jobs', '/AI-College-Jobs'],
    jobPageSelector: '.markdown-body table',
  },
];

