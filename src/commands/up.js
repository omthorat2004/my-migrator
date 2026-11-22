const path = require("node:path");

const resolveMigrationDir = require("../resolveMigration");
const { connect, ensureMigrationsTable, getApplied } = require("../db");
const {
    getValidConfig,
    checkPathExist,
    listMigrationFiles,
    loadMigration,
    runInTransaction,
} = require("../utils");

async function up() {
    const config = await getValidConfig();
    if (!config) {
        process.exitCode = 1;
        return;
    }

    const migrationPath = resolveMigrationDir(config.path);

    if (!checkPathExist(migrationPath)) {
        console.error(`Migration folder not found: ${migrationPath}`);
        process.exitCode = 1;
        return;
    }

    let client;
    try {
        client = await connect(config.databaseUrl);
    } catch (err) {
        console.error(`Database connection failed: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    try {
        await ensureMigrationsTable(client);
        const applied = new Set(await getApplied(client));
        const pending = listMigrationFiles(migrationPath).filter((f) => !applied.has(f));

        if (pending.length === 0) {
            console.log("No pending migrations");
            return;
        }

        for (const file of pending) {
            const migration = await loadMigration(path.join(migrationPath, file));
            if (typeof migration.up !== "function") {
                throw new Error(`${file} does not export an up function`);
            }
            await runInTransaction(client, async () => {
                await migration.up(client);
                await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
            });
            console.log(`Applied: ${file}`);
        }
    } catch (err) {
        console.error(`Migration failed: ${err.message}`);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

module.exports = up;
