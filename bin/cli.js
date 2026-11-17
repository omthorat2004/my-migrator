#!/usr/bin/env node

const path = require("path")
const fs = require("node:fs/promises")




const args = process.argv.slice(2);
const [command,...inputs] = args


switch(command){
    case 'create':
        console.log("Creating Migration!");

        const projectDir = process.cwd()

        const configPathJs = path.join(
            projectDir,
            "my-migrator.config.js"
        )


        const configPathTs = path.join(
            projectDir,
            "my-migrator.config.ts"
        )

        

        break;
    case 'up':
        console.log("Up command run")
        break;
    case 'down':
        console.log("Down command run")
        break;
    default:
        console.log("Default Command Run")
}