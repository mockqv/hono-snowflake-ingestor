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
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  fetch: app.fetch,
};