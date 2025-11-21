import snowflake from 'snowflake-sdk';

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT || '',
  username: process.env.SNOWFLAKE_USER || '',
  password: process.env.SNOWFLAKE_PASSWORD || '',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'Your warehouse here',
  database: process.env.SNOWFLAKE_DATABASE || 'Your database here',
  schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC', // Default to PUBLIC schema
  role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN', // Default role
});

export const executeQuery = (sql: string, binds: any[] = []) => {
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

export const initSnowflake = () => {
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
        console.log('Session initialized successfully (Warehouse & DB selected).');
      } catch (sessionError) {
        console.error('Error initializing session:', sessionError);
      }
    }
  });
};