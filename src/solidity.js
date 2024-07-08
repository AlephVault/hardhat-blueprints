const GivenOrSelect = require("enquirer-plus/src/given-or-select");
const {getHRE} = require("hardhat-enquirer-plus/src/common/hre");

/**
 * Gets the {initial, choices} settings of solidity versions
 * for a hardhat project, so they can be used in a hardhat.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<{initial: string, choices: {name: *, message: *}[]}>}
 * The settings (async function).
 */
async function getSolidityVersionSettings(hre) {
    let compilerVersions = [];
    try {
        compilerVersions = hre.config.solidity.compilers.map((entry) => {
            return (entry.version || "").trim();
        }).filter((version) => {
            return /\d+\.\d+\.\d+/.test(version);
        });
    } catch(e) {
        throw new Error(
            "Your Hardhat config seems to not have the appropriate format " +
            "for the solidity compilers. Please ensure that section is properly " +
            "configured and try again."
        );
    }

    if (compilerVersions.length === 0) throw new Error(
        "The current Hardhat configuration has no valid compiler entries. " +
        "Define at least one Solidity compiler entry (with proper version format)."
    );

    const initial = compilerVersions.reduce((v1, v2) => {
        const v1parts = v1.split(".");
        const v2parts = v2.split(".");

        if (parseInt(v1parts[0]) > parseInt(v2parts[0])) return v1;
        if (parseInt(v1parts[1]) > parseInt(v2parts[1])) return v1;
        if (parseInt(v1parts[2]) > parseInt(v2parts[2])) return v1;
        return v2;
    });

    const choices = compilerVersions.map((version) => {
        return {name: version, message: version}
    });

    return {initial, choices};
}

/**
 * A Select for the solidity version prompt.
 */
class GivenOrSolidityVersionSelect extends GivenOrSelect {
    constructor({hre, ...options}) {
        hre = hre || getHRE();
        if (!hre) {
            throw new Error(
                "This prompt type can only be used when hardhat-enquirer-plus is installed " +
                "as a plug-in in a hardhat project"
            );
        }
        super({...options, ...getSolidityVersionSettings(hre)});
    }
}

module.exports = GivenOrSolidityVersionSelect;
