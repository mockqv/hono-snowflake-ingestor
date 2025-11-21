import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { initSnowflake, executeQuery } from './snowflake.ts';
import { logSchema } from './schemas.ts';

const app = new Hono();

app.use('*', logger());

initSnowflake();

app.get('/', (c) => {
  return c.json({ 
    status: 'active', 
    service: 'Hono Snowflake Ingestor' 
  });
});

/**
 * Endpoint for ingesting log data.
 * It validates the request body against a schema and then
 * asynchronously queues the data for insertion into Snowflake.
 */
app.post(
  '/ingest',
  zValidator('json', logSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');

      // Fire-and-forget background task for database insertion.
      // This makes the endpoint respond quickly without waiting for the DB operation.
      (async () => {
        try {
          const query = `INSERT INTO API_EVENTS (RAW_DATA) SELECT PARSE_JSON(?)`;
          const payload = {
            ...data,
            // Enrich the payload with the server's received timestamp
            server_received_at: new Date().toISOString()
          };
          
          await executeQuery(query, [JSON.stringify(payload)]);
        } catch (bgError) {
          // Log any errors that occur during the background insertion
          console.error('Background Insert Error:', bgError);
        }
      })();

      // Immediately respond to the client with a 202 Accepted status
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
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  fetch: app.fetch,
};