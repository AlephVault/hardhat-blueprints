// The list of blueprints. Each one has {defaultName, filePath, arguments}.
const {prepareArgumentPrompts} = require("./argumentTypes");
const fs = require("fs");
const path = require("path");

// The supported template types.
const templateTypes = {
    "solidity": {
        description: "solidity script",
        extension: "sol",
        target: "sources"
    },
    "ignition-module": {
        description: "ignition module",
        extension: "js",
        target: ["ignition", "modules"]
    }
}

/**
 * Registers a blueprint.
 * @param hre The hardhat runtime environment.
 * @param key The internal name of the contract entry. It must be unique.
 * @param title The title/description for the option.
 * @param defaultName The default name for the contract.
 * @param filePath The path to the template file.
 * @param scriptType The script type. Only "contract" or "ignition-module"
 * are supported.
 * @param arguments The list of arguments. Each one must be an entry like
 * this: {name, message, promptType} where name and message will directly
 * be forwarded to `enquirer` prompts, while the promptType will be either
 * a registered preset (e.g. string, number, contract, boolean, address or
 * smart address, or others that may come across later) or a one-off prompt
 * entry (which completely would match an entry in a call to enquirer's
 * prompt() method).
 */
function registerBlueprint(hre, key, defaultName, title, filePath, scriptType, arguments) {
    if (hre.blueprints.map[key]) {
        throw new Error(`Blueprint key already registered: ${key}`);
    }
    if (!templateTypes[scriptType]) {
        throw new Error(`Unknown script type: ${scriptType}`);
    }
    hre.blueprints.list.push({name: key, message: title});
    hre.blueprints.map[key] = {title, defaultName, filePath, arguments, scriptType};
}

/**
 * Applies a template from a template file (relative path) by using some data,
 * and dumps the results into the target file path (absolute path).
 * @param filePath The source template path.
 * @param replacements The object with the replacements.
 * @param toFilePath The target dump path.
 */
function applyTemplate(filePath, replacements, toFilePath) {
    const template = fs.readFileSync(filePath, {encoding: 'utf8'});
    const data = template.replace(/#([A-Za-z0-9_]+)#/g, (match, key) => {
        return replacements[key] !== undefined ? replacements[key] : match;
    });
    fs.writeFileSync(toFilePath, data, {encoding: 'utf8'});
}

/**
 * Fetches and executes a blueprint, prompting the script name and the
 * arguments. The underlying template must have the keys inside the
 * arguments, and also a SCRIPT_NAME key that will always be asked by
 * the very beginning of the blueprint execution.
 * @param hre The hardhat runtime environment.
 * @param key The blueprint key.
 * @param nonInteractive Flag to tell whether the interaction must
 * not become interactive (by raising an error) or can be.
 * @param givenValues A mapping of given values to use.
 * @returns {Promise<string>} The result filepath.
 */
async function applyBlueprint(hre, key, nonInteractive, givenValues) {
    const blueprint = hre.blueprints.map[key];
    if (!blueprint) throw new Error(`Unknown blueprint: ${key}`);
    const templateType = templateTypes[blueprint.scriptType];
    const {extension, target, description: scriptType} = templateType;
    const targetDirectory = typeof target === "string" ?
        hre.config.paths[target] : path.resolve(hre.config.paths.root, ...target);
    const prompts = [
        {
            type: "plus:given-or-valid-input",
            validate: /^[A-Z][A-Za-z0-9_]*$/,
            makeInvalidInputMessage: (v) => `Invalid ${scriptType} name: ${v}`,
            onInvalidGiven: (v) => console.error(`Invalid given ${scriptType} name: ${v}`),
            initial: blueprint.defaultName,
            given: (givenValues || {}).SCRIPT_NAME,
            message: "Give it a name",
            name: "SCRIPT_NAME"
        }, ...prepareArgumentPrompts(hre, blueprint.arguments, nonInteractive, givenValues)
    ];
    const answers = await new hre.enquirerPlus.Enquirer().prompt(prompts);
    const toFilePath = path.resolve(targetDirectory, answers.SCRIPT_NAME + "." + extension);
    applyTemplate(blueprint.filePath, answers, toFilePath);
    return toFilePath;
}

module.exports = {
    registerBlueprint, applyBlueprint
}