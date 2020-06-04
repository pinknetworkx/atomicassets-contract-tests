# AtomicAssets Tests

Tests for the [AtomicAssets](https://github.com/pinknetworkx/atomicassets-contracts) smart contract written using the [Hydra Testing Framework](https://docs.klevoya.com/hydra/about/getting-started)

-------

The abi / wasm files in the contract source are the compiled atomicassets contract with the added _hydraload_ action that is needed for the Hydra testing framework. Read more here: https://docs.klevoya.com/hydra/guides/initial-contract-tables

If you want to compile the contract source manually, the [hydra-include-helper.txt](https://github.com/pinknetworkx/atomicassets-contact-tests/blob/master/tests/hydra-include-helper.txt) lists all the changes that need to be applied to the atomicassets header file, as well as adding the [hydra.hpp](https://github.com/pinknetworkx/atomicassets-contact-tests/blob/master/tests/hydra.hpp) to the include folder.
