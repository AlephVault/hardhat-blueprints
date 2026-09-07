import { installBlueprints } from "../index.js";

export default async function ({blueprintName}, hre) {
    installBlueprints(hre);

    if (!blueprintName || !hre.blueprints.map[blueprintName]) {
        console.error("The blueprint name must be specified among: " + hre.blueprints.list.map(({name}) => name).join(", "));
        process.exitCode = 1;
        return;
    }

    console.log("This blueprint is registered and has the following details:");
    console.log(`- ${blueprintName}: ${hre.blueprints.map[blueprintName].title}\n  - Arguments:`);
    hre.blueprints.map[blueprintName].arguments.forEach((argument) => {
        const typeDescription = hre.blueprints.argTypes[argument.argumentType]?.description || "unknown";
        console.log(`    - ${argument.name}: ${argument.description || "No description"} (${typeDescription})`);
    });
}
