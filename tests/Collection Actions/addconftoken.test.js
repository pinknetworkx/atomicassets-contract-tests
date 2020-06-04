const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicassets = blockchain.createAccount(`atomicassets`);

const user1 = blockchain.createAccount(`user1`);

beforeAll(async () => {
    atomicassets.setContract(blockchain.contractTemplates[`atomicassets`]);
    atomicassets.updateAuth(`active`, `owner`, {
        accounts: [
            {
                permission: {
                    actor: atomicassets.accountName,
                    permission: `eosio.code`
                },
                weight: 1
            }
        ]
    });
});

beforeEach(async () => {
    atomicassets.resetTables();
    await atomicassets.loadFixtures("config", {
        "atomicassets": [
            {
                "asset_counter": "1099511627776",
                "template_counter": 1,
                "offer_counter": "1",
                "collection_format": [],
                "supported_tokens": []
            }
        ]
    });
});

test("add one token", async () => {
    await atomicassets.contract.addconftoken({
        token_contract: "eosio.token",
        token_symbol: "8,WAX"
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    const config_row = atomicassets.getTableRowsScoped("config")["atomicassets"][0];

    expect(config_row.supported_tokens).toEqual([{
        token_contract: "eosio.token",
        token_symbol: "8,WAX"
    }]);
});

test("add two tokens of same contract", async () => {
    await atomicassets.contract.addconftoken({
        token_contract: "eosio.token",
        token_symbol: "8,WAX"
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    await atomicassets.contract.addconftoken({
        token_contract: "eosio.token",
        token_symbol: "0,SYS"
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    const config_row = atomicassets.getTableRowsScoped("config")["atomicassets"][0];

    expect(config_row.supported_tokens).toEqual([
        {
            token_contract: "eosio.token",
            token_symbol: "8,WAX"
        },
        {
            token_contract: "eosio.token",
            token_symbol: "0,SYS"
        }
    ]);
});

test("throw when adding two tokens with same symbol", async () => {
    await atomicassets.contract.addconftoken({
        token_contract: "eosio.token",
        token_symbol: "8,WAX"
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    await expect(atomicassets.contract.addconftoken({
        token_contract: "fakewaxtoken",
        token_symbol: "8,WAX"
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }])).rejects.toThrow("A token with this symbol is already supported");
});

test("throw without authorization from author", async () => {
    await expect(atomicassets.contract.addconftoken({
        token_contract: "eosio.token",
        token_symbol: "8,WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});