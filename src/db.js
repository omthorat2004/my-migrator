const { Client } = require("pg");

async function connect(databaseUrl) {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    return client;
}

async function ensureMigrationsTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
}

async function getApplied(client) {
    const { rows } = await client.query(
        "SELECT name FROM migrations ORDER BY name ASC"
    );
    return rows.map((r) => r.name);
}

const LOCK_KEY = 727274001; // fixed id for my-migrator

async function acquireLock(client) {
    const { rows } = await client.query("SELECT pg_try_advisory_lock($1) AS locked", [LOCK_KEY]);
    return rows[0].locked;
}

async function releaseLock(client) {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_KEY]);
}

module.exports = { connect, ensureMigrationsTable, getApplied, acquireLock, releaseLock };
