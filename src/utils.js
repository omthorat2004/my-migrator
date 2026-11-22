const fs = require("node:fs");

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

module.exports = { checkPathExist, ensureDir, makeTimestamp };
