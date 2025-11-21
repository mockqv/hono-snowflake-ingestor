# ❄️ **Hono Snowflake Ingestor**

**High-performance data ingestion pipeline** capable of streaming JSON events to **Snowflake** Data Cloud with sub-millisecond processing overhead. Built with **Hono**, **Bun**, and **Docker**.

## 🚀 Project Overview

This project demonstrates a modern **ELT (Extract, Load, Transform)** architecture designed for high-throughput event ingestion. It exposes a REST API that validates, buffers, and asynchronously streams data into **Snowflake**'s VARIANT columns, enabling **Schema-on-Read** capabilities for unstructured logs.

## Key Features

*   ⚡ **Ultra-fast Runtime**: Powered by **Bun** + **Hono**, optimized for edge-like performance.
*   🛡️ **Data Validation**: Implements **Zod** schemas to strictly validate incoming payloads before processing (Type Safety).
*   🚀 **Fire-and-Forget Strategy**: Utilizes asynchronous processing to return 202 Accepted immediately while persisting data in the background, minimizing latency for the client.
*   🐳 **Fully Containerized**: Production-ready **Dockerfile** using multi-stage builds.
*   💾 **Schema-on-Read**: Leverages **Snowflake**'s semi-structured data handling (VARIANT type) to avoid rigid schema migrations.

## 🏗️ Architecture

The system follows a decoupled ingestion pattern:

```mermaid
graph LR
    Client[Client / Load Balancer] -->|POST /ingest (JSON)| API[Hono API Gateway]
    
    subgraph Docker Container
        API -->|1. Validate (Zod)| API
        API -->|2. Async Dispatch| SnowflakeDriver
    end
    
    SnowflakeDriver -->|3. Secure Tunnel (TLS)| Warehouse[(Snowflake Cloud)]
    
    subgraph Snowflake Data Cloud
        Warehouse -->|INSERT| Table[API_EVENTS Table]
        Table -->|PARSE_JSON| Analytics[SQL Analytics]
    end
```

## 🛠️ Getting Started

### Prerequisites

*   **Docker** & **Docker Compose**
*   A **Snowflake** Account (Trial or Enterprise)

### 1. Clone & Configure

Clone the repository and configure your environment variables. You can create a `.env` file using the provided `.env.test` as a base template.

```bash
git clone https://github.com/YOUR_USERNAME/hono-snowflake-ingestor.git
cd hono-snowflake-ingestor

# Create .env from the template
cp .env.test .env
```

Note: Edit the `.env` file and populate it with your actual **Snowflake** credentials.

### 2. Run with Docker

Start the ingestion service:

```bash
docker-compose up --build
```

The API will be available at `http://localhost:3000`.

## 🧪 Testing & Performance

### Run Load Test

This project includes a load testing script to demonstrate concurrency handling and connection stability.

Execute the script inside a temporary Docker container. We use `--network host` to allow the test script to reach the API directly on `localhost`.

```bash
# Runs 100 concurrent requests against the API
docker run --rm --network host --env-file .env -v "$PWD/scripts:/scripts" node:18-alpine node /scripts/load_test.js
```

Expected Output:

```
Starting load test target: http://localhost:3000/ingest
..................................................
--- RESULTS ---
Target: http://localhost:3000/ingest
RPS: 200+ req/s
Success: 100/100
```

## 📊 Analytics (SQL)

### Example: Aggregating errors by service

Once data is ingested, you can perform advanced analytics directly in **Snowflake** using JSON parsing capabilities.

```sql
SELECT 
    RAW_DATA:service_name::STRING as service,
    COUNT(*) as error_count
FROM API_EVENTS
WHERE RAW_DATA:log_level::STRING = 'ERROR'
GROUP BY 1
ORDER BY 2 DESC;
```

See `sql/analytics_queries.sql` for more advanced queries.