-- Enhanced QA Data Storage Schema with Consolidated Logging
-- Updates to support component logging and major deployment tracking

-- Add new columns to existing tables for enhanced logging
ALTER TABLE qa_runs ADD COLUMN deployment_type TEXT CHECK(deployment_type IN ('minor', 'major', 'hotfix', 'rollback')) DEFAULT 'minor';
ALTER TABLE qa_runs ADD COLUMN component_logs_count INTEGER DEFAULT 0;
ALTER TABLE qa_runs ADD COLUMN log_severity_breakdown TEXT; -- JSON with counts per severity

-- Component Logs Table for Consolidated Logging
CREATE TABLE IF NOT EXISTS component_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT, -- Optional: can be null for standalone component logs
    component_name TEXT NOT NULL,
    service_type TEXT CHECK(service_type IN ('frontend', 'backend', 'qa', 'deployment', 'monitoring', 'database', 'api', 'worker')),
    log_level TEXT CHECK(log_level IN ('debug', 'info', 'warn', 'error', 'critical')) NOT NULL,
    message TEXT NOT NULL,
    details TEXT, -- JSON string with additional context
    error_stack TEXT,
    request_id TEXT,
    user_id TEXT,
    session_id TEXT,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    response_time_ms INTEGER,
    memory_usage_mb REAL,
    cpu_usage_percent REAL,
    database_query_count INTEGER,
    external_api_calls INTEGER,
    cache_hits INTEGER,
    cache_misses INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_file TEXT,
    source_line INTEGER,
    source_function TEXT,
    environment TEXT DEFAULT 'production',
    version TEXT,
    git_commit TEXT,
    deployment_id TEXT,
    correlation_id TEXT, -- For tracing related logs across components
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);

-- Deployment Events Table for Major Deployment Tracking
CREATE TABLE IF NOT EXISTS deployment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deployment_id TEXT UNIQUE NOT NULL,
    deployment_type TEXT CHECK(deployment_type IN ('minor', 'major', 'hotfix', 'rollback')) NOT NULL,
    component TEXT NOT NULL, -- frontend, backend, qa, etc.
    version TEXT NOT NULL,
    git_commit TEXT NOT NULL,
    git_branch TEXT DEFAULT 'main',
    triggered_by TEXT, -- user or automated system
    trigger_reason TEXT,
    deployment_status TEXT CHECK(deployment_status IN ('initiated', 'building', 'testing', 'deploying', 'completed', 'failed', 'rolled_back')) DEFAULT 'initiated',
    qa_run_id TEXT, -- Link to QA run triggered by this deployment
    pre_deployment_checks TEXT, -- JSON with check results
    post_deployment_validation TEXT, -- JSON with validation results
    rollback_plan TEXT,
    environment TEXT DEFAULT 'production',
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    duration_ms INTEGER,
    artifacts_urls TEXT, -- JSON array of build artifact URLs
    deployment_notes TEXT,
    health_check_url TEXT,
    health_check_status INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qa_run_id) REFERENCES qa_runs(run_id)
);

-- API Health Monitoring Table
CREATE TABLE IF NOT EXISTS api_health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT,
    endpoint_name TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    status_code INTEGER,
    response_time_ms INTEGER,
    payload_size_bytes INTEGER,
    error_message TEXT,
    tessie_api_working BOOLEAN,
    tesla_data_available BOOLEAN,
    database_responsive BOOLEAN,
    cache_working BOOLEAN,
    external_dependencies_up BOOLEAN,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    environment TEXT DEFAULT 'production',
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);

-- Log Analysis Table for Pattern Detection
CREATE TABLE IF NOT EXISTS log_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_run_id TEXT NOT NULL,
    time_range_start DATETIME,
    time_range_end DATETIME,
    total_logs_analyzed INTEGER,
    error_patterns TEXT, -- JSON with detected error patterns
    performance_trends TEXT, -- JSON with performance analysis
    anomalies_detected TEXT, -- JSON with detected anomalies
    recommendations TEXT, -- JSON with improvement suggestions
    tessie_api_reliability REAL, -- Percentage of successful Tessie calls
    api_success_rates TEXT, -- JSON with success rates per endpoint
    average_response_times TEXT, -- JSON with response time analysis
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update QA Configuration for new features
INSERT OR REPLACE INTO qa_config (config_key, config_value, config_type, description) VALUES
('major_deployment_qa_enabled', 'true', 'boolean', 'Enable automatic QA runs for major deployments'),
('tessie_api_timeout_ms', '10000', 'number', 'Timeout for Tessie API calls in milliseconds'),
('tessie_api_retry_count', '3', 'number', 'Number of retries for failed Tessie API calls'),
('log_retention_days', '90', 'number', 'Number of days to retain component logs'),
('error_alert_threshold', '10', 'number', 'Number of errors to trigger alert'),
('component_log_level', 'info', 'string', 'Minimum log level to store (debug, info, warn, error, critical)'),
('deployment_notification_webhook', '', 'string', 'Webhook URL for deployment notifications'),
('tessie_api_base_url', 'https://api.tessie.com', 'string', 'Base URL for Tessie API'),
('tesla_vin', '', 'string', 'Tesla Vehicle VIN for API calls'),
('enable_performance_monitoring', 'true', 'boolean', 'Enable detailed performance monitoring'),
('enable_tessie_health_checks', 'true', 'boolean', 'Enable continuous Tessie API health monitoring');

-- Create indexes for better performance on new tables
CREATE INDEX IF NOT EXISTS idx_component_logs_timestamp ON component_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_component_logs_component ON component_logs(component_name);
CREATE INDEX IF NOT EXISTS idx_component_logs_level ON component_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_component_logs_run_id ON component_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_component_logs_correlation ON component_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_deployment_events_type ON deployment_events(deployment_type);
CREATE INDEX IF NOT EXISTS idx_deployment_events_status ON deployment_events(deployment_status);
CREATE INDEX IF NOT EXISTS idx_deployment_events_timestamp ON deployment_events(start_time);
CREATE INDEX IF NOT EXISTS idx_api_health_timestamp ON api_health_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_health_endpoint ON api_health_logs(endpoint_name);
CREATE INDEX IF NOT EXISTS idx_api_health_run_id ON api_health_logs(run_id);
