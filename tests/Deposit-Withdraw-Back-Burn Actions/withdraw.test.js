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
});

test("withdraw all of the only deposited token", async () => {
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
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toBeUndefined();

    const user1_tokens = eosio_token.getTableRowsScoped("accounts")["user1"];
    expect(user1_tokens).toEqual([
        {
            balance: "100.00000000 WAX"
        }
    ]);
});

test("withdraw a part of the only deposited token", async () => {
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
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "30.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["70.00000000 WAX"]
    }]);

    const user1_tokens = eosio_token.getTableRowsScoped("accounts")["user1"];
    expect(user1_tokens).toEqual([
        {
            balance: "30.00000000 WAX"
        }
    ]);
});

test("withdraw all of one of multiple deposited token", async () => {
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
                    {"token_contract": "eosio.token", "token_symbol": "8,WAX"},
                    {"token_contract": "karmatoken", "token_symbol": "4,KARMA"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX", "50.0000 KARMA"]
        }]
    });

    await atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["50.0000 KARMA"]
    }]);

    const user1_tokens = eosio_token.getTableRowsScoped("accounts")["user1"];
    expect(user1_tokens).toEqual([
        {
            balance: "100.00000000 WAX"
        }
    ]);
});

test("withdraw all of a non eosio.token token", async () => {
    expect.assertions(2);

    await karma_token.loadFixtures("stat", {
        "KARMA": [{
            supply: "50.0000 KARMA",
            max_supply: "1000.0000 KARMA",
            issuer: "eosio"
        }]
    });
    await karma_token.loadFixtures("accounts", {
        "atomicassets": [{
            balance: "50.0000 KARMA"
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
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.0000 KARMA"]
        }]
    });

    await atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "50.0000 KARMA"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toBeUndefined();

    const user1_tokens = karma_token.getTableRowsScoped("accounts")["user1"];
    expect(user1_tokens).toEqual([
        {
            balance: "50.0000 KARMA"
        }
    ]);
});

test("throw when withdrawer does not have a balance row", async () => {
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

    await expect(atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance table row");
});

test("throw when withdrawer does not have a balance for the token to withdraw", async () => {
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
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.0000 KARMA"]
        }]
    });

    await expect(atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance for the symbol specified in the quantity");
});

test("throw when withdrawer has tokens, but less than the withdrawal", async () => {
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
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account's balance is lower than the specified quantity");
});

test("throw when the withdrawal amount is negative", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "50.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "atomicassets": [{
            balance: "50.00000000 WAX"
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
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "-100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("token_to_withdraw must be positive");
});

test("throw without authorization from owner", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "50.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "atomicassets": [{
            balance: "50.00000000 WAX"
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
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicassets.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "50.00000000 WAX"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});