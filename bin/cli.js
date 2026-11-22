#!/usr/bin/env node

const create = require("../src/commands/create");
const up = require("../src/commands/up");
const down = require("../src/commands/down");

async function main() {
    const [command, ...inputs] = process.argv.slice(2);

    switch (command) {
        case "create":
            await create(inputs);
            break;
        case "up":
            await up();
            break;
        case "down":
            await down(inputs);
            break;
        default:
            console.log("Usage: my-migrator <create|up|down>");
    }
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
