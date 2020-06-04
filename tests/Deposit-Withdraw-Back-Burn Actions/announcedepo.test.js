const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicassets = blockchain.createAccount(`atomicassets`);

const user1 = blockchain.createAccount(`user1`);
const user2 = blockchain.createAccount(`user2`);

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
    await atomicassets.resetTables();
});

test("announce first deposit of only supported token", async () => {
    await atomicassets.loadFixtures("config", {
        "atomicassets": [
            {
                asset_counter: "1099511627776",
                template_counter: 1,
                offer_counter: "1",
                collection_format: [
                    {"name": "name", "type": "string"},
                    {"name": "img", "type": "ipfs"},
                    {"name": "description", "type": "string"}
                ],
                supported_tokens: [
                    {"token_contract": "eosio.token", "token_symbol": "8,WAX"}
                ]
            }
        ]
    });

    await atomicassets.contract.announcedepo({
        owner: user1.accountName,
        symbol_to_announce: "8,WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["0.00000000 WAX"]
    }]);
});

test("announce first deposit of one of many supported tokens", async () => {
    await atomicassets.loadFixtures("config", {
        "atomicassets": [
            {
                asset_counter: "1099511627776",
                template_counter: 1,
                offer_counter: "1",
                collection_format: [
                    {"name": "name", "type": "string"},
                    {"name": "img", "type": "ipfs"},
                    {"name": "description", "type": "string"}
                ],
                supported_tokens: [
                    {"token_contract": "eosio.token", "token_symbol": "8,WAX"},
                    {"token_contract": "eosio.token", "token_symbol": "4,EOS"},
                    {"token_contract": "karmatoken", "token_symbol": "4,KARMA"}
                ]
            }
        ]
    });

    await atomicassets.contract.announcedepo({
        owner: user1.accountName,
        symbol_to_announce: "4,EOS"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["0.0000 EOS"]
    }]);
});

test("announce deposit when balance table already has an entry", async () => {
    await atomicassets.loadFixtures("config", {
        "atomicassets": [
            {
                asset_counter: "1099511627776",
                template_counter: 1,
                offer_counter: "1",
                collection_format: [
                    {"name": "name", "type": "string"},
                    {"name": "img", "type": "ipfs"},
                    {"name": "description", "type": "string"}
                ],
                supported_tokens: [
                    {"token_contract": "eosio.token", "token_symbol": "8,WAX"},
                    {"token_contract": "eosio.token", "token_symbol": "4,EOS"},
                    {"token_contract": "karmatoken", "token_symbol": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["10.00000000 WAX"]
        }]
    });

    await atomicassets.contract.announcedepo({
        owner: user1.accountName,
        symbol_to_announce: "4,EOS"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["10.00000000 WAX", "0.0000 EOS"]
    }]);
});

test("throw when token is not supported", async () => {
    await atomicassets.loadFixtures("config", {
        "atomicassets": [
            {
                asset_counter: "1099511627776",
                template_counter: 1,
                offer_counter: "1",
                collection_format: [
                    {"name": "name", "type": "string"},
                    {"name": "img", "type": "ipfs"},
                    {"name": "description", "type": "string"}
                ],
                supported_tokens: [
                    {"token_contract": "eosio.token", "token_symbol": "8,WAX"}
                ]
            }
        ]
    });

    await expect(atomicassets.contract.announcedepo({
        owner: user1.accountName,
        symbol_to_announce: "4,EOS"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified symbol is not supported");
});

test("throw when token has already been announced", async () => {
    await atomicassets.loadFixtures("config", {
        "atomicassets": [
            {
                asset_counter: "1099511627776",
                template_counter: 1,
                offer_counter: "1",
                collection_format: [
                    {"name": "name", "type": "string"},
                    {"name": "img", "type": "ipfs"},
                    {"name": "description", "type": "string"}
                ],
                supported_tokens: [
                    {"token_contract": "eosio.token", "token_symbol": "8,WAX"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["10.00000000 WAX"]
        }]
    });

    await expect(atomicassets.contract.announcedepo({
        owner: user1.accountName,
        symbol_to_announce: "8,WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified symbol has already been announced");
});

test("throw without authorization from owner", async () => {
    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.announcedepo({
        owner: user1.accountName,
        symbol_to_announce: "8,WAX"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});