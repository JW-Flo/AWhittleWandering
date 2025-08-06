-- QA Data Storage Schema for Cloudflare D1
-- This will store all QA pipeline results, test data, and monitoring information

-- QA Pipeline Runs
CREATE TABLE qa_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT UNIQUE NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    pipeline_version TEXT,
    total_iterations INTEGER,
    status TEXT CHECK(status IN ('running', 'completed', 'failed', 'aborted')),
    total_phases INTEGER,
    passed_phases INTEGER,
    failed_phases INTEGER,
    duration_ms INTEGER,
    trigger_type TEXT CHECK(trigger_type IN ('manual', 'git-hook', 'scheduled', 'deployment', 'monitoring')),
    git_commit TEXT,
    branch TEXT,
    environment TEXT DEFAULT 'production',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Individual Test Phases
CREATE TABLE qa_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    iteration INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    phase_order INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'running', 'passed', 'failed', 'skipped', 'retrying')),
    start_time DATETIME,
    end_time DATETIME,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    details TEXT, -- JSON string with detailed results
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);

-- Test Results
CREATE TABLE qa_test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    phase_id INTEGER NOT NULL,
    test_name TEXT NOT NULL,
    test_type TEXT CHECK(test_type IN ('unit', 'integration', 'api', 'e2e', 'security', 'performance')),
    status TEXT CHECK(status IN ('passed', 'failed', 'skipped', 'timeout', 'error')),
    execution_time_ms INTEGER,
    assertion_count INTEGER,
    passed_assertions INTEGER,
    failed_assertions INTEGER,
    error_message TEXT,
    stack_trace TEXT,
    screenshot_url TEXT,
    test_data TEXT, -- JSON string with test input/output
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id),
    FOREIGN KEY (phase_id) REFERENCES qa_phases(id)
);

-- Performance Metrics
CREATE TABLE qa_performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit TEXT,
    endpoint_url TEXT,
    response_time_ms INTEGER,
    status_code INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);

-- Security Scan Results
CREATE TABLE qa_security_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    scan_type TEXT NOT NULL,
    vulnerability_level TEXT CHECK(vulnerability_level IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    affected_component TEXT,
    recommendation TEXT,
    status TEXT CHECK(status IN ('open', 'resolved', 'accepted_risk', 'false_positive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);

-- Deployment Validation
CREATE TABLE qa_deployment_validations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    deployment_id TEXT,
    environment TEXT,
    deployment_status TEXT,
    health_check_url TEXT,
    health_check_status INTEGER,
    response_time_ms INTEGER,
    validation_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    rollback_required BOOLEAN DEFAULT FALSE,
    rollback_reason TEXT,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);

-- Monitoring Alerts
CREATE TABLE qa_monitoring_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT UNIQUE NOT NULL,
    run_id TEXT,
    alert_type TEXT CHECK(alert_type IN ('performance', 'availability', 'error_rate', 'security', 'custom')),
    severity TEXT CHECK(severity IN ('info', 'warning', 'error', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    affected_service TEXT,
    metric_value REAL,
    threshold_value REAL,
    status TEXT CHECK(status IN ('active', 'resolved', 'acknowledged', 'suppressed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (run_id) REFERENCES qa_runs(run_id)
);

-- QA Configuration
CREATE TABLE qa_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type TEXT CHECK(config_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    environment TEXT DEFAULT 'global',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO qa_config (config_key, config_value, config_type, description) VALUES
('max_iterations', '5', 'number', 'Maximum number of recursive QA iterations'),
('retry_limit', '3', 'number', 'Maximum retries per phase'),
('timeout_ms', '300000', 'number', 'Default timeout for QA phases in milliseconds'),
('enable_e2e', 'true', 'boolean', 'Enable end-to-end testing'),
('enable_performance', 'true', 'boolean', 'Enable performance testing'),
('enable_security', 'true', 'boolean', 'Enable security scanning'),
('notification_webhook', '', 'string', 'Webhook URL for QA notifications'),
('dashboard_url', 'https://ab99ceea.awhittlewandering-frontend.pages.dev', 'string', 'Frontend dashboard URL'),
('api_url', 'https://awhittlewandering-api.kd8jc7v8cd.workers.dev', 'string', 'Backend API URL');

-- Create indexes for better performance
CREATE INDEX idx_qa_runs_timestamp ON qa_runs(timestamp);
CREATE INDEX idx_qa_runs_status ON qa_runs(status);
CREATE INDEX idx_qa_runs_environment ON qa_runs(environment);
CREATE INDEX idx_qa_phases_run_id ON qa_phases(run_id);
CREATE INDEX idx_qa_phases_status ON qa_phases(status);
CREATE INDEX idx_qa_test_results_run_id ON qa_test_results(run_id);
CREATE INDEX idx_qa_test_results_status ON qa_test_results(status);
CREATE INDEX idx_qa_performance_metrics_run_id ON qa_performance_metrics(run_id);
CREATE INDEX idx_qa_security_scans_run_id ON qa_security_scans(run_id);
CREATE INDEX idx_qa_deployment_validations_run_id ON qa_deployment_validations(run_id);
CREATE INDEX idx_qa_monitoring_alerts_status ON qa_monitoring_alerts(status);
CREATE INDEX idx_qa_monitoring_alerts_severity ON qa_monitoring_alerts(severity);
