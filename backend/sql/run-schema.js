// Creates all ess_portal tables by running sql/schema.sql against SQL Server.
// Usage:  node sql/run-schema.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sql, getPool } = require('../config/mssql');

(async () => {
    const file = path.join(__dirname, 'schema.sql');
    const text = fs.readFileSync(file, 'utf8');

    // Split into batches on lines containing only GO (the SQL Server batch separator).
    const batches = text
        .split(/^\s*GO\s*$/im)
        .map((b) => b.trim())
        .filter(Boolean);

    let pool;
    try {
        pool = await getPool();
    } catch (e) {
        console.error('Could not connect to SQL Server:', e.message);
        process.exit(1);
    }

    let ok = 0;
    for (let i = 0; i < batches.length; i++) {
        try {
            await pool.request().batch(batches[i]);
            ok++;
        } catch (e) {
            console.error(`Batch ${i + 1} failed: ${e.message}`);
            console.error(batches[i].split('\n')[0]);
        }
    }
    console.log(`Done. ${ok}/${batches.length} batches executed.`);

    // List the resulting tables.
    const r = await pool.request().query(
        "SELECT name FROM sys.tables WHERE type = 'U' ORDER BY name"
    );
    console.log('Tables now in ess_portal:');
    r.recordset.forEach((row) => console.log('  -', row.name));

    await sql.close();
})();
