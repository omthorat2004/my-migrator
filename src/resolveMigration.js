const path = require('path')




function resolveMigrationDir(input) {
    const projectDir = process.cwd();

    const relativePath = input.replace(/^[/\\]+/, "");

    return path.resolve(projectDir, relativePath);
}

module.exports = resolveMigrationDir