const path = require("node:path");
const fs = require("node:fs");

const resolveMigrationDir = require("../resolveMigration");
const { ensureDir, makeTimestamp, getValidConfig } = require("../utils");


const JS_TEMPLATE = `exports.up = async (client) => {
    // await client.query("...");
};

exports.down = async (client) => {
    // await client.query("...");
};
`;

const ESM_TEMPLATE = `export async function up(client) {
    // await client.query("...");
}

export async function down(client) {
    // await client.query("...");
}
`;

function isEsmProject() {
    try {
        const pkg = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
        );
        return pkg.type === "module";
    } catch {
        return false;
    }
}

const TS_TEMPLATE =`import type { Client } from "pg";

export async function up(client: Client): Promise<void> {
    // await client.query("...");
}

export async function down(client: Client): Promise<void> {
    // await client.query("...");
}
`;

function resolveLanguage(flags, config) {
    if (flags.includes("--ts")) return "ts";
    if (flags.includes("--js")) return "js";
    if (config.language === "ts" || config.language === "js") return config.language;
    return fs.existsSync(path.join(process.cwd(), "tsconfig.json")) ? "ts" : "js";
}

async function create(inputs) {
    const flags = inputs.filter((i) => i.startsWith("--"));
    const name = inputs.find((i) => !i.startsWith("--"));

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

    const language = resolveLanguage(flags, config);
    const fileName = `${makeTimestamp()}_${safeName}.${language}`;
    const filePath = path.join(migrationPath, fileName);

    try {
        fs.writeFileSync(filePath, language === "ts" ? TS_TEMPLATE : isEsmProject() ? ESM_TEMPLATE : JS_TEMPLATE, { flag: "wx" });
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
