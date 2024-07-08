// The list of blueprints. Each one has {defaultName, filePath, arguments}.
const {preparePrompts} = require("./prompts");
const fs = require("fs");
const path = require("path");
let blueprints = {};

// The elements to render to pick a contract.
let blueprintsList = [];

/**
 * Registers a blueprint.
 * @param key The internal name of the contract entry. It must be unique.
 * @param title The title/description for the option.
 * @param defaultName The default name for the contract.
 * @param filePath The path to the template file.
 * @param arguments The list of arguments. Each one must be an entry like
 * this: {name, message, promptType} where name and message will directly
 * be forwarded to `enquirer` prompts, while the promptType will be either
 * a registered preset (e.g. string, number, contract, boolean, address or
 * smart address, or others that may come across later) or a one-off prompt
 * entry (which completely would match an entry in a call to enquirer's
 * prompt() method).
 */
function registerBlueprint(key, defaultName, title, filePath, arguments) {
    if (blueprints[key]) {
        throw new Error(`Blueprint key already registered: ${key}`);
    }
    blueprintsList.push({name: key, message: title});
    blueprints[key] = {defaultName, filePath, arguments};
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
    const data = template.replace(/#(\w+)#/g, (match, key) => {
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
 * @param scriptType The script type. Typically, something like
 * "contract" or "deployment module"
 * @param extension The extension of the new file.
 */
async function executeBlueprint(hre, key, nonInteractive, givenValues, scriptType, extension) {
    const blueprint = blueprints[key];
    if (!blueprint) throw new Error(`Unknown blueprint: ${key}`);
    const prompts = [
        {
            type: "plus:given-or-valid-input",
            validate: /^[A-Z][A-Za-z0-9_]*$/,
            makeInvalidInputMessage: (v) => `Invalid ${scriptType} name: ${v}`,
            onInvalidGiven: (v) => console.error(`Invalid given ${scriptType} name: ${v}`),
            initial: blueprint.defaultName,
            name: "SCRIPT_NAME"
        }, ...preparePrompts(blueprint.arguments, nonInteractive, givenValues)
    ];
    const answers = await new hre.enquirerPlus.Enquirer().prompt(prompts);
    const contractsPath = hre.config.paths.sources;
    const toFilePath = path.resolve(contractsPath, answers.SCRIPT_NAME + "." + extension);
    applyTemplate(blueprint.filePath, answers, toFilePath);
}

module.exports = {
    registerBlueprint
}