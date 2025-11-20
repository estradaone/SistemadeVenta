const { Pool } = require('pg');
const config = require('../config/config');

const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;
