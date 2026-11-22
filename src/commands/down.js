const path = require("node:path");

const resolveMigrationDir = require("../resolveMigration");
const { connect, ensureMigrationsTable, getApplied } = require("../db");
const {
    getValidConfig,
    checkPathExist,
    loadMigration,
    runInTransaction,
} = require("../utils");

async function down(inputs) {
    const count = inputs[0] === undefined ? 1 : Number(inputs[0]);
    if (!Number.isInteger(count) || count < 1) {
        console.error("Usage: my-migrator down [count]");
        process.exitCode = 1;
        return;
    }

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
        const applied = await getApplied(client);

        if (applied.length === 0) {
            console.log("No migrations to roll back");
            return;
        }

        const toRollBack = applied.slice(-count).reverse();

        for (const file of toRollBack) {
            const filePath = path.join(migrationPath, file);
            if (!checkPathExist(filePath)) {
                throw new Error(`Migration file not found: ${file}`);
            }
            const migration = await loadMigration(filePath);
            if (typeof migration.down !== "function") {
                throw new Error(`${file} does not export a down function`);
            }
            await runInTransaction(client, async () => {
                await migration.down(client);
                await client.query("DELETE FROM migrations WHERE name = $1", [file]);
            });
            console.log(`Rolled back: ${file}`);
        }
    } catch (err) {
        console.error(`Rollback failed: ${err.message}`);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

module.exports = down;
