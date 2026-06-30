// Microsoft SQL Server connection pool (ess_portal).
// Reads credentials from .env (MSSQL_*). Use getPool() anywhere you need to run
// a query; the pool is created once and reused.
const sql = require('mssql');

const config = {
    server: process.env.MSSQL_SERVER,
    port: Number(process.env.MSSQL_PORT) || 1433,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    database: process.env.MSSQL_DATABASE,
    options: {
        encrypt: true,                 // SQL Server 2022 negotiates TLS
        trustServerCertificate: true,  // self-signed cert on the server
        enableArithAbort: true
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: 20000,
    requestTimeout: 30000
};

let poolPromise = null;

function getPool() {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config).connect()
            .then((pool) => {
                console.log('SQL Server Connected (ess_portal)');
                return pool;
            })
            .catch((err) => {
                poolPromise = null; // allow a later retry
                throw err;
            });
    }
    return poolPromise;
}

module.exports = { sql, getPool, config };
