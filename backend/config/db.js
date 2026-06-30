// Database bootstrap — now Microsoft SQL Server (was MongoDB).
// Keeps the connectDB() export so server.js / app.js need no changes.
const { getPool } = require('./mssql');

const connectDB = async () => {
    console.log('Connecting to SQL Server...');
    if (!process.env.MSSQL_SERVER) {
        console.error('MSSQL_SERVER is NOT set. Add the MSSQL_* values in the environment settings.');
        return;
    }
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            await getPool();
            return;
        } catch (err) {
            console.error(`SQL Server connect attempt ${attempt} failed: ${err.message}`);
            if (attempt < 5) await new Promise((r) => setTimeout(r, 5000));
            else console.error('SQL Server connection failed after 5 attempts.');
        }
    }
};

module.exports = connectDB;
