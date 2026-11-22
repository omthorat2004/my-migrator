const path = require("node:path");
const fs = require("node:fs");

const resolveMigrationDir = require("../resolveMigration");
const { ensureDir, makeTimestamp, getValidConfig } = require("../utils");

const TEMPLATE = `exports.up = async (client) => {
    // await client.query("...");
};

exports.down = async (client) => {
    // await client.query("...");
};
`;

async function create(inputs) {
    const name = inputs[0];

    if (!name) {
        console.error("Usage: my-migrator create <migration_name>");
        process.exitCode = 1;
        return;
    }

    const config = await getValidConfig();
    if (!config) {
        process.exitCode = 1;
        return;
    }

    const migrationPath = resolveMigrationDir(config.path);

    try {
        ensureDir(migrationPath);
    } catch (err) {
        if (err.code === "EACCES" || err.code === "EPERM") {
            console.error(`Permission denied: cannot create folder ${migrationPath}`);
        } else {
            console.error(`Failed to create migration folder: ${err.message}`);
        }
        process.exitCode = 1;
        return;
    }

    const safeName = name.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!safeName) {
        console.error("Invalid migration name");
        process.exitCode = 1;
        return;
    }

    const fileName = `${makeTimestamp()}_${safeName}.js`;
    const filePath = path.join(migrationPath, fileName);

    try {
        fs.writeFileSync(filePath, TEMPLATE, { flag: "wx" });
    } catch (err) {
        if (err.code === "EACCES" || err.code === "EPERM") {
            console.error(`Permission denied: cannot write to ${migrationPath}`);
        } else if (err.code === "EEXIST") {
            console.error(`Migration file already exists: ${fileName}`);
        } else {
            console.error(`Failed to create migration: ${err.message}`);
        }
        process.exitCode = 1;
        return;
    }
    console.log(`Created migration: ${path.relative(process.cwd(), filePath)}`);
}

module.exports = create;
