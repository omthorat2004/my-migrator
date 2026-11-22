const fs = require("node:fs");
const { createJiti } = require("jiti");
const checkConfig = require("./load-config");

const jiti = createJiti(__filename);

const checkPathExist = (p) => fs.existsSync(p);

const ensureDir = (p) => {
    if (!checkPathExist(p)) {
        fs.mkdirSync(p, { recursive: true });
    }
};

const makeTimestamp = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, "0");
    return (
        date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
    );
};

async function getValidConfig() {
    const config = await checkConfig();

    if (!config) {
        console.error("Config file does not exist or does not export anything");
        return null;
    }
    if (!config.path) {
        console.error("path of migration folder is missing in config");
        return null;
    }
    if (!config.databaseUrl) {
        console.error("databaseUrl does not exist in configuration");
        return null;
    }
    return config;
}

function listMigrationFiles(migrationPath) {
    if (!checkPathExist(migrationPath)) return [];
    return fs
        .readdirSync(migrationPath)
        .filter((f) => /^\d+_.+\.(js|ts)$/.test(f))
        .sort();
}

async function loadMigration(filePath) {
    const mod = await jiti.import(filePath);
    return mod && typeof mod.up !== "function" && mod.default ? mod.default : mod;
}

async function runInTransaction(client, fn) {
    await client.query("BEGIN");
    try {
        await fn();
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
}

module.exports = {
    checkPathExist,
    ensureDir,
    makeTimestamp,
    getValidConfig,
    listMigrationFiles,
    loadMigration,
    runInTransaction,
};
