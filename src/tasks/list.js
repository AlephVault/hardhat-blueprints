import { installBlueprints } from "../index.js";

export default async function (_taskArguments, hre) {
    installBlueprints(hre);

    console.log("These are the available blueprints you can use in the `apply` command:");
    hre.blueprints.list.forEach(({name, message}) => {
        console.log(`- ${name}: ${message}\n  - Arguments:`);
        hre.blueprints.map[name].arguments.forEach((argument) => {
            const typeDescription = hre.blueprints.argTypes[argument.argumentType]?.description || "unknown";
            console.log(`    - ${argument.name}: ${argument.description || "No description"} (${typeDescription})`);
        });
    });
}
