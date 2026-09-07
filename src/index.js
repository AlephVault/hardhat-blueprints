import { emptyTask, task } from "hardhat/config";
import { definePlugin } from "hardhat/plugins";
import { ArgumentType } from "hardhat/types/arguments";
import path from "path";
import { fileURLToPath } from "url";

import hardhatCommonToolsPlugin from "hardhat-common-tools";
import hardhatEnquirerPlusPlugin from "hardhat-enquirer-plus";

import { registerBlueprintArgumentType, defaultArgumentTypes, prepareArgumentPrompts, tupleArgument, arrayArgument } from "./argumentTypes.js";
import { registerBlueprint, applyBlueprint } from "./blueprints.js";
import { registerHashedInput } from "./hashed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __templates = path.resolve(__dirname, "..", "data", "templates");

export function installBlueprints(hre) {
    if (hre.blueprints?.__hardhatBlueprintsInstalled) {
        return;
    }

    registerHashedInput(hre);

    hre.blueprints ||= {
        map: {},
        list: [],
        argTypes: {...defaultArgumentTypes},
        registerBlueprint: (key, defaultName, title, filePath, scriptType, blueprintArguments) => registerBlueprint(
            hre, key, defaultName, title, filePath, scriptType, blueprintArguments
        ),
        registerBlueprintArgumentType: (argumentType, promptSpec, description) => registerBlueprintArgumentType(
            hre, argumentType, promptSpec, description
        ),
        prepareArgumentPrompts: (blueprintArguments, nonInteractive, givenValues) => prepareArgumentPrompts(
            hre, blueprintArguments, nonInteractive, givenValues
        ),
        applyBlueprint: (key, nonInteractive, givenValues, outputFile) => applyBlueprint(
            hre, key, nonInteractive, givenValues, outputFile
        ),
        tupleArgument: ({message, description, name, elements}) => tupleArgument(
            hre, {message, description, name, elements}
        ),
        arrayArgument: ({message, description, name, length, elements}) => arrayArgument(
            hre, {message, description, name, length, elements}
        )
    };

    hre.blueprints.registerBlueprint(
        "contract", "MyContract", "An empty contract",
        path.resolve(__templates, "solidity", "Contract.sol.template"),
        "solidity", [
            {
                name: "SOLIDITY_VERSION",
                description: "The Solidity version for the new file",
                message: "Choose the solidity version for this file",
                argumentType: "solidity"
            }
        ]
    );
    hre.blueprints.registerBlueprint(
        "interface", "MyInterface", "An empty interface",
        path.resolve(__templates, "solidity", "Interface.sol.template"),
        "solidity", [
            {
                name: "SOLIDITY_VERSION",
                description: "The Solidity version for the new file",
                message: "Choose the solidity version for this file",
                argumentType: "solidity"
            }
        ]
    );
    hre.blueprints.registerBlueprint(
        "library", "MyLibrary", "An empty library",
        path.resolve(__templates, "solidity", "Library.sol.template"),
        "solidity", [
            {
                name: "SOLIDITY_VERSION",
                description: "The Solidity version for the new file",
                message: "Choose the solidity version for this file",
                argumentType: "solidity"
            }
        ]
    );
    hre.blueprints.registerBlueprint(
        "existing-contract-deployment-module", "MyModule",
        "An ignition module for an existing contract (by artifact ID and contract address)",
        path.resolve(__templates, "ignition-modules", "existing-contract.js.template"),
        "ignition-module", [
            {
                name: "CONTRACT_NAME",
                description: "The type to use for the contract",
                message: "Choose one of your contract artifacts",
                argumentType: "contract"
            },
            {
                name: "CONTRACT_ADDRESS",
                description: "The address where the contract is deployed",
                message: "Tell the address where the contract is located at",
                argumentType: "address"
            }
        ]
    );
    hre.blueprints.registerBlueprint(
        "new-contract-deployment-module", "MyModule",
        "An ignition module for a new contract (by artifact ID)",
        path.resolve(__templates, "ignition-modules", "new-contract.js.template"),
        "ignition-module", [
            {
                name: "CONTRACT_NAME",
                description: "The type to use for the contract",
                message: "Choose one of your contract artifacts",
                argumentType: "contract"
            }
        ]
    );
    hre.blueprints.__hardhatBlueprintsInstalled = true;
}

const hardhatBlueprintsPlugin = definePlugin({
    id: "hardhat-blueprints",
    npmPackage: "hardhat-blueprints",
    dependencies: () => [
        Promise.resolve({default: hardhatCommonToolsPlugin}),
        Promise.resolve({default: hardhatEnquirerPlusPlugin}),
    ],
    hookHandlers: {
        hre: async () => ({
            default: async () => ({
                created: async (_context, hre) => {
                    installBlueprints(hre);
                },
            }),
        }),
    },
    tasks: [
        emptyTask(["blueprint"], "Manages contract blueprints").build(),
        task(["blueprint", "apply"], "Picks and applies a template")
            .addPositionalArgument({
                name: "template",
                description: "The template key to apply",
                type: ArgumentType.STRING_WITHOUT_DEFAULT,
            })
            .addFlag({
                name: "nonInteractive",
                description: "Ensure this execution is not interactive (raising an error when it becomes interactive)",
            })
            .addOption({
                name: "outputFile",
                description: "Chooses an explicit output file name (without extension)",
                type: ArgumentType.STRING_WITHOUT_DEFAULT,
                defaultValue: undefined,
            })
            .addVariadicArgument({
                name: "params",
                description: "Many arguments like ARG=value that will be used in the template",
                defaultValue: [],
            })
            .setAction(() => import("./tasks/apply.js"))
            .build(),
        task(["blueprint", "list"], "Lists all the available blueprints")
            .setAction(() => import("./tasks/list.js"))
            .build(),
        task(["blueprint", "show"], "Shows only one of the available blueprints")
            .addPositionalArgument({
                name: "blueprintName",
                description: "A registered blueprint's name",
                type: ArgumentType.STRING_WITHOUT_DEFAULT,
            })
            .setAction(() => import("./tasks/show.js"))
            .build(),
    ],
});

export default hardhatBlueprintsPlugin;
