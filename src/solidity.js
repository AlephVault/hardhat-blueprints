import GivenOrSelect from "enquirer-plus/src/given-or-select.js";

/**
 * Gets the {initial, choices} settings of solidity versions
 * for a hardhat project, so they can be used in a hardhat.
 * @param hre The hardhat runtime environment.
 * @returns {Promise<{initial: string, choices: {name: *, message: *}[]}>}
 * The settings (async function).
 */
function getSolidityVersionSettings(hre) {
    let compilerVersions = getCompilerVersions(hre);
    if (compilerVersions.length === 0) {
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

function getCompilerVersions(hre) {
    const solidity = hre?.config?.solidity;

    if (Array.isArray(solidity?.compilers)) {
        return filterVersions(solidity.compilers.map((entry) => entry.version));
    }

    const profiles = Object.values(solidity?.profiles || {});
    return filterVersions(
        profiles.flatMap((profile) => (profile.compilers || []).map((entry) => entry.version))
    );
}

function filterVersions(versions) {
    return [...new Set(
        versions.map((version) => (version || "").trim()).filter((version) => /\d+\.\d+\.\d+/.test(version))
    )];
}

/**
 * A Select for the solidity version prompt.
 */
class GivenOrSolidityVersionSelect extends GivenOrSelect {
    constructor({hre, ...options}) {
        if (!hre) {
            throw new Error(
                "This prompt type can only be used when hardhat-enquirer-plus is installed " +
                "as a plug-in in a hardhat project"
            );
        }
        super({...options, ...getSolidityVersionSettings(hre)});
    }
}

export default GivenOrSolidityVersionSelect;
