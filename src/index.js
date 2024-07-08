const {scope} = require("hardhat/config");

// The list of blueprints. Each one has {defaultName, filePath, arguments}.
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

module.exports = {
    registerBlueprint
}