const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicassets = blockchain.createAccount(`atomicassets`);

const user1 = blockchain.createAccount(`user1`);
const user2 = blockchain.createAccount(`user2`);
const user3 = blockchain.createAccount('user3');

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
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("schemas", {
        "testcollect1": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });
});

test("back first token", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "50.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toBeUndefined();

    const user3_assets = atomicassets.getTableRowsScoped("assets")["user3"];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: ["50.00000000 WAX"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("back same token again", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: ["50.00000000 WAX"],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "50.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toBeUndefined();

    const user3_assets = atomicassets.getTableRowsScoped("assets")["user3"];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: ["100.00000000 WAX"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("back part of only token in the payers balance", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "30.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["20.00000000 WAX"]
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")["user3"];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: ["30.00000000 WAX"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("back second token", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["500.0000 KARMA"]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: ["10.00000000 WAX"],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "500.0000 KARMA"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toBeUndefined();

    const user3_assets = atomicassets.getTableRowsScoped("assets")["user3"];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: ["10.00000000 WAX", "500.0000 KARMA"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("back all of one of multiple tokens in the payers balance", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX", "500.0000 KARMA"]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "500.0000 KARMA"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["100.00000000 WAX"]
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")["user3"];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: ["500.0000 KARMA"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("back part of one of multiple tokens in the payers balance", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX", "500.0000 KARMA"]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "200.0000 KARMA"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["100.00000000 WAX", "300.0000 KARMA"]
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")["user3"];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: ["200.0000 KARMA"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("ram payer changes when payer is different than existing ram payer", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.backasset({
        payer: user2.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "100.00000000 WAX"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toBeUndefined();

    const user3_assets = atomicassets.getTableRowsScoped("assets")["user3"];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user2.accountName,
        backed_tokens: ["100.00000000 WAX"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("throw when payer does not have a balance row", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "10.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance table row");
});

test("throw when payer does not have a balance for the token to back", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["500.0000 KARMA"]
        }]
    });

    await expect(atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "10.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance for the symbol specified in the quantity");
});

test("throw when payer has tokens, but less than required", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account's balance is lower than the specified quantity");
});

test("throw when token to back is negative", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.backasset({
        payer: user2.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "-10.00000000 WAX"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("token_to_back must be positive");
});

test("throw when the specified owner does not own the asset", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "10.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified owner does not own the asset with the specified ID");
});

test("throw when the asset is not burnable", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
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
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: 1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "10.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The asset is not burnable. Only burnable assets can be backed.");
});

test("throw withour authorization from payer", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.backasset({
        payer: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        token_to_back: "10.00000000 WAX"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});