# hardhat-blueprints
A hardhat plugin offering the possibility to generate new contract files (.sol) out of an extensible list of contract blueprints.

# Installation
Run this command to install it from NPM:

```shell
npm install hardhat-blueprints@^1.0.0
```

# Usage
This is a hardhat plugin, so the first thing to do is to install it in your hardhat.config.ts file:

```javascript
require("hardhat-blueprints");
```

Once there, you can make use of it (this supports both viem-enabled and ethers-enabled projects):

## Listing the available blueprints

Write this command just to start:

```shell
npx hardhat blueprint list
```

At first (if you did not register any new blueprint nor installed other packages that do it) you
will see this content:

```
These are the available blueprints you can use in the `apply` command:
- contract: An empty contract
  - Arguments:
    - SOLIDITY_VERSION: The Solidity version for the new file (An X.Y.Z Solidity version in the project)
- interface: An empty interface
  - Arguments:
    - SOLIDITY_VERSION: The Solidity version for the new file (An X.Y.Z Solidity version in the project)
- library: An empty library
  - Arguments:
    - SOLIDITY_VERSION: The Solidity version for the new file (An X.Y.Z Solidity version in the project)
- existing-contract-deployment-module: An ignition module for an existing contract (by artifact ID and contract address)
  - Arguments:
    - CONTRACT_NAME: The type to use for the contract (The ID of an artifact)
    - CONTRACT_ADDRESS: The address where the contract is deployed (A checksum address)
- new-contract-deployment-module: An ignition module for a new contract (by artifact ID)
  - Arguments:
    - CONTRACT_NAME: The type to use for the contract (The ID of an artifact)
```

Which details many entries (there are 5 built-in entries by default), like "contract" or
"interface" and 3 more.

If you expect a blueprint to be available for use, either provided by your own code or a
different plug-in, ensure that it is listed here (otherwise, it won't be available).

## Applying a blueprint

There are certain types of blueprints here to account for:

1. Source code blueprints. They typically come from .sol files and will end in your sources
   directory (e.g. your project's `contracts/` directory).
2. Ignition modules. This will be useful if your project uses `hardhat-ignition`. They are
   .js files and will end in your `ignition/modules/` directory.

But, independently of the type, applying a blueprint has always this workflow:

1. You tell which blueprint to use.
2. You tell the name of the result file (be it a module or a contract / interface / library).
3. You tell whatever arguments are required (and validated).

This can be done in two ways (which can be partially applied):

1. You add a positional argument with a valid blueprint key to use (e.g. "contract") or it
   will be prompted for you to manually fill.
2. You tell all the required arguments, one by one. For example, SOLIDITY_VERSION=0.8.24
   (the format is: like environment variables). These are positional arguments. If you don't
   specify one or more of the required arguments (and with a valid value for it), it/they'll
   be prompted for you to manually fill them.
   1. This includes the `SCRIPT_NAME` argument (e.g. SCRIPT_NAME=MySampleContract for the
      "contract" example).
3. The file will be immediately generated.