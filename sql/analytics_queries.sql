-- ==================================================================
-- ❄️ EDGE-LOG ANALYTICS - SHOWCASE QUERIES
-- Description: Analytical queries to extract intelligence from JSON logs
-- Author: Mockqv
-- ==================================================================

-- 1. Overview: Total logs and latest ingestion timestamp
SELECT 
    COUNT(*) as total_logs,
    MAX(INGESTED_AT) as last_ingestion_time,
    MIN(INGESTED_AT) as first_ingestion_time
FROM API_EVENTS;


-- 2. JSON Parsing: Extracting virtual columns from VARIANT field
-- Snowflake allows traversing JSON using the dot/colon notation (:)
SELECT 
    ID,
    RAW_DATA:service_name::STRING as service,
    RAW_DATA:log_level::STRING as level,
    RAW_DATA:message::STRING as message,
    RAW_DATA:server_received_at::TIMESTAMP as processed_at
FROM API_EVENTS
ORDER BY INGESTED_AT DESC
LIMIT 20;


-- 3. Aggregation: Top services generating logs
SELECT 
    RAW_DATA:service_name::STRING as service,
    COUNT(*) as event_count
FROM API_EVENTS
GROUP BY 1
ORDER BY 2 DESC;


-- 4. Error Analysis: Filtering critical logs
SELECT 
    RAW_DATA:service_name::STRING as service,
    RAW_DATA:message::STRING as error_message,
    INGESTED_AT
FROM API_EVENTS
WHERE RAW_DATA:log_level::STRING IN ('ERROR', 'FATAL')
ORDER BY INGESTED_AT DESC;


-- 5. Time-Series: Logs per minute (For monitoring dashboards)
SELECT 
    DATE_TRUNC('MINUTE', INGESTED_AT) as minute_window,
    COUNT(*) as throughput
FROM API_EVENTS
GROUP BY 1
ORDER BY 1 DESC;