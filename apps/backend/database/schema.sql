-- FuckWork Phase 2A Minimal Schema
-- Focused on job collection with 4-field metadata only

CREATE TABLE IF NOT EXISTS jobs (
    -- Primary key
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Basic info (required)
    title VARCHAR(500) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    url TEXT UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    jd_text TEXT NOT NULL,
    posted_date TIMESTAMP,
    
    -- Phase 1 scoring results
    authenticity_score FLOAT,
    authenticity_level VARCHAR(20),  -- likely_real, uncertain, likely_fake
    confidence VARCHAR(20),  -- Low, Medium, High
    red_flags JSONB,
    positive_signals JSONB,
    
    -- Phase 2A: Minimal collection metadata (ONLY 4 fields)
    -- {
    --   "platform": "LinkedIn",
    --   "collection_method": "jobspy_batch",
    --   "poster_expected": true,
    --   "poster_present": false
    -- }
    collection_metadata JSONB,
    
    -- Poster/company/platform data (JSONB for flexibility)
    poster_info JSONB,
    company_info JSONB,
    platform_metadata JSONB,
    derived_signals JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date);
CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(authenticity_score);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_url ON jobs(url);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Comments for documentation
COMMENT ON TABLE jobs IS 'Job postings collected from multiple platforms';
COMMENT ON COLUMN jobs.collection_metadata IS 'Minimal 4-field metadata: platform, collection_method, poster_expected, poster_present';
COMMENT ON COLUMN jobs.poster_info IS 'Recruiter/poster information (if available)';
COMMENT ON COLUMN jobs.company_info IS 'Company information (website, size, ratings, etc.)';
COMMENT ON COLUMN jobs.platform_metadata IS 'Platform-specific metadata (job_type, salary, etc.)';
COMMENT ON COLUMN jobs.derived_signals IS 'Computed signals for authenticity scoring';

