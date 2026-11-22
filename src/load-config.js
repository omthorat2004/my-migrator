
const fs = require("node:fs");
const path = require("node:path");
const { createJiti } = require("jiti");

const jiti = createJiti(__filename);

async function checkConfig() {
    const projectDir = process.cwd();

    const configPathJs = path.join(
        projectDir,
        "my-migrator.config.js"
    );

    const configPathTs = path.join(
        projectDir,
        "my-migrator.config.ts"
    );

    let configPath;

    if (fs.existsSync(configPathJs)) {
        configPath = configPathJs;
    } else if (fs.existsSync(configPathTs)) {
        configPath = configPathTs;
    } else {

        return null;
    }

    const config = await jiti.import(configPath);

    return config.default ?? config;
}


module.exports = checkConfig
