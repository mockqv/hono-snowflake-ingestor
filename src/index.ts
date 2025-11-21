import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import snowflake from 'snowflake-sdk';

const app = new Hono();

app.use('*', logger());

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT || '',
  username: process.env.SNOWFLAKE_USER || '',
  password: process.env.SNOWFLAKE_PASSWORD || '',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
  database: process.env.SNOWFLAKE_DATABASE || 'LOGS_DB',
  schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC',
  role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN',
});

const executeQuery = (sql: string, binds: any[] = []) => {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      binds: binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Snowflake Error:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      },
    });
  });
};

connection.connect(async (err, conn) => {
  if (err) {
    console.error('Unable to connect to Snowflake: ' + err.message);
  } else {
    console.log('Successfully connected to Snowflake.');
    try {
      const warehouse = process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH';
      const database = process.env.SNOWFLAKE_DATABASE || 'LOGS_DB';

      await executeQuery(`USE WAREHOUSE ${warehouse}`);
      await executeQuery(`USE DATABASE ${database}`);
      console.log('Session initialized successfully.');
    } catch (sessionError) {
      console.error('Error initializing session:', sessionError);
    }
  }
});

const logSchema = z.object({
  service_name: z.string().min(1),
  log_level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG', 'FATAL']),
  message: z.string(),
  environment: z.string().optional().default('production'),
  timestamp: z.string().optional(),
}).passthrough();

app.get('/', (c) => {
  return c.json({ message: 'Hono Ingestor is running' });
});

app.post(
  '/ingest',
  zValidator('json', logSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');

      (async () => {
        try {
          const query = `INSERT INTO API_EVENTS (RAW_DATA) SELECT PARSE_JSON(?)`;
          const payload = {
            ...data,
            server_received_at: new Date().toISOString()
          };
          
          await executeQuery(query, [JSON.stringify(payload)]);
        } catch (bgError) {
          console.error('Background Insert Error:', bgError);
        }
      })();

      return c.json({ 
        success: true, 
        status: 'queued',
        message: 'Event accepted for processing' 
      }, 202);

    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
);

export default {
  port: 3000,
  fetch: app.fetch,
};