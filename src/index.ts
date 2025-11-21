import { Hono } from 'hono';
import { logger } from 'hono/logger';
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

app.get('/', (c) => {
  return c.json({ message: 'Hono Ingestor is running' });
});

app.post('/ingest', async (c) => {
  try {
    const body = await c.req.json();

    if (!body) {
      return c.json({ error: 'Empty body' }, 400);
    }

    const query = `INSERT INTO API_EVENTS (RAW_DATA) SELECT PARSE_JSON(?)`;
    const jsonString = JSON.stringify(body);

    await executeQuery(query, [jsonString]);

    return c.json({ success: true, message: 'Event ingested successfully' }, 201);

  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default {
  port: 3000,
  fetch: app.fetch,
};