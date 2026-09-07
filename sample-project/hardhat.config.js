import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import hardhatBlueprintsPlugin from "hardhat-blueprints";

export default defineConfig({
  plugins: [
    hardhatToolboxMochaEthersPlugin,
    hardhatBlueprintsPlugin,
  ],
  solidity: "0.8.24",
});
