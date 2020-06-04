const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicassets = blockchain.createAccount(`atomicassets`);

const eosio_token = blockchain.createAccount('eosio.token');
const karma_token = blockchain.createAccount('karmatoken');

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

    eosio_token.setContract(blockchain.contractTemplates['eosio.token']);
    karma_token.setContract(blockchain.contractTemplates['eosio.token']);
});

beforeEach(async () => {
    await atomicassets.resetTables();
    await eosio_token.resetTables();
    await karma_token.resetTables();

    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("schemas", {
        "testcol": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });
});

test("burn basic asset", async () => {
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

    await atomicassets.loadFixtures("assets", {
        "user1": [{
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

    await atomicassets.contract.burnasset({
        asset_owner: user1.accountName,
        asset_id: "1099511627776"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toBeUndefined();
});

test("burn asset with single backed token", async () => {
    expect.assertions(2);

    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "atomicassets": [{
            balance: "100.00000000 WAX"
        }]
    });

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

    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: ["100.00000000 WAX"],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.burnasset({
        asset_owner: user1.accountName,
        asset_id: "1099511627776"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toBeUndefined();

    const user1_token_balance = eosio_token.getTableRowsScoped("accounts")[user1.accountName];
    expect(user1_token_balance).toEqual([{
        balance: "100.00000000 WAX"
    }]);
});

test("burn asset with multiple backed tokens", async () => {
    expect.assertions(3);

    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "atomicassets": [{
            balance: "100.00000000 WAX"
        }]
    });

    await karma_token.loadFixtures("stat", {
        "KARMA": [{
            supply: "500.0000 KARMA",
            max_supply: "1000.0000 KARMA",
            issuer: "eosio"
        }]
    });
    await karma_token.loadFixtures("accounts", {
        "atomicassets": [{
            balance: "500.0000 KARMA"
        }]
    });

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
                    {"token_contract": "karmatoken", "token_symbol": "4,KARMA"}
                ]
            }
        ]
    });

    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: ["500.0000 KARMA", "100.00000000 WAX"],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.burnasset({
        asset_owner: user1.accountName,
        asset_id: "1099511627776"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toBeUndefined();

    const user1_token_balance = eosio_token.getTableRowsScoped("accounts")[user1.accountName];
    expect(user1_token_balance).toEqual([{
        balance: "100.00000000 WAX"
    }]);

    const user1_karmatoken_balance = karma_token.getTableRowsScoped("accounts")[user1.accountName];
    expect(user1_karmatoken_balance).toEqual([{
        balance: "500.0000 KARMA"
    }]);
});

test("issued supply in template stays the same after burning", async () => {
    expect.assertions(2);

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
                    {"token_contract": "karmatoken", "token_symbol": "4,KARMA"}
                ]
            }
        ]
    });

    await atomicassets.loadFixtures("templates", {
        "testcol": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 0,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: 1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.burnasset({
        asset_owner: user1.accountName,
        asset_id: "1099511627776"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toBeUndefined();

    const testcol_templates = atomicassets.getTableRowsScoped("templates")["testcol"];
    expect(testcol_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        issued_supply: 5,
        immutable_serialized_data: []
    }]);
});






test("throw when asset does not exist", async () => {
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
                    {"token_contract": "karmatoken", "token_symbol": "4,KARMA"}
                ]
            }
        ]
    });

    await expect(atomicassets.contract.burnasset({
        asset_owner: user1.accountName,
        asset_id: "1099511627776"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No asset with this id exists");
});

test("throw when asset is not burnable", async () => {
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
                    {"token_contract": "karmatoken", "token_symbol": "4,KARMA"}
                ]
            }
        ]
    });

    await atomicassets.loadFixtures("templates", {
        "testcol": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: false,
            max_supply: 0,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: 1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.burnasset({
        asset_owner: user1.accountName,
        asset_id: "1099511627776"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The asset is not burnable");
});

test("throw without authorization from asset owner", async () => {
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
                    {"token_contract": "karmatoken", "token_symbol": "4,KARMA"}
                ]
            }
        ]
    });

    await atomicassets.loadFixtures("assets", {
        "user1": [{
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

    await expect(atomicassets.contract.burnasset({
        asset_owner: user1.accountName,
        asset_id: "1099511627776"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});