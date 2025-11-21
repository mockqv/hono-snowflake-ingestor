import snowflake from 'snowflake-sdk';

/**
 * Configures the Snowflake connection using environment variables.
 * These credentials and settings should be securely managed.
 */
const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT || '',
  username: process.env.SNOWFLAKE_USER || '',
  password: process.env.SNOWFLAKE_PASSWORD || '',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'Your warehouse here',
  database: process.env.SNOWFLAKE_DATABASE || 'Your database here',
  schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC', // Default to PUBLIC schema
  role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN', // Default role
});

/**
 * Executes a SQL query against the Snowflake database.
 * This function supports parameterized queries to prevent SQL injection.
 * @param sql The SQL query string to execute.
 * @param binds An array of values to bind to the query parameters.
 * @returns A Promise that resolves with the query results or rejects with an error.
 */
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

/**
 * Initializes the connection to Snowflake.
 * It attempts to connect and then sets the default warehouse and database
 * for the session to ensure queries are run in the correct context.
 */
export const initSnowflake = () => {
  connection.connect(async (err, conn) => {
    if (err) {
      console.error('Unable to connect to Snowflake: ' + err.message);
    } else {
      console.log('Successfully connected to Snowflake.');
      try {
        const warehouse = process.env.SNOWFLAKE_WAREHOUSE || 'Your warehouse here';
        const database = process.env.SNOWFLAKE_DATABASE || 'Your database here';

        await executeQuery(`USE WAREHOUSE ${warehouse}`);
        await executeQuery(`USE DATABASE ${database}`);
        console.log('Session initialized successfully (Warehouse & DB selected).');
      } catch (sessionError) {
        console.error('Error initializing session:', sessionError);
      }
    }
  });
};