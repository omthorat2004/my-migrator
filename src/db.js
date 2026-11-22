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

module.exports = { connect, ensureMigrationsTable, getApplied };
