const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicassets = blockchain.createAccount(`atomicassets`);

const eosio_token = blockchain.createAccount('eosio.token');
const karma_token = blockchain.createAccount('karmatoken');

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

    eosio_token.setContract(blockchain.contractTemplates['eosio.token']);
    karma_token.setContract(blockchain.contractTemplates['eosio.token']);
});

beforeEach(async () => {
    await atomicassets.resetTables();
    await eosio_token.resetTables();
    await karma_token.resetTables();
});

test("send first deposit of only announced token", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["0.00000000 WAX"]
        }]
    });

    await eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicassets.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["10.00000000 WAX"]
    }]);
});

test("send first deposit of one of many tokens", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "eosio.token", "sym": "4,EOS"},
                    {"contract": "karmatoken", "sym": "4,KARMA"},
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["0.0000 EOS", "0.00000000 WAX"]
        }]
    });

    await eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicassets.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["0.0000 EOS", "10.00000000 WAX"]
    }]);
});

test("send deposit when balance table already has a balance for that token", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "eosio.token", "sym": "4,EOS"},
                    {"contract": "karmatoken", "sym": "4,KARMA"},
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

    await eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicassets.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["20.00000000 WAX"]
    }]);
});

test("send deposit from non eosio.token token contract", async () => {
    await karma_token.loadFixtures("stat", {
        "KARMA": [{
            supply: "100.0000 KARMA",
            max_supply: "1000.0000 KARMA",
            issuer: "eosio"
        }]
    });
    await karma_token.loadFixtures("accounts", {
        "user1": [{
            balance: "100.0000 KARMA"
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "eosio.token", "sym": "4,EOS"},
                    {"contract": "karmatoken", "sym": "4,KARMA"},
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["0.0000 KARMA"]
        }]
    });

    await karma_token.contract.transfer({
        from: user1.accountName,
        to: atomicassets.accountName,
        quantity: "10.0000 KARMA",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["10.0000 KARMA"]
    }]);
});

test("throw when token is not supported (same symbol as supported token)", async () => {
    await karma_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await karma_token.loadFixtures("accounts", {
        "user1": [{
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["0.00000000 WAX"]
        }]
    });

    await expect(karma_token.contract.transfer({
        from: user1.accountName,
        to: atomicassets.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The transferred token is not supported");
});

test("throw when balance row of depositer has not been initialized", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });

    await expect(eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicassets.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You need to first initialize the balance table row using the announcedepo action");
});

test("throw when balance row of depositer does not have an entry for the deposited token", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
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
                    {"contract": "eosio.token", "sym": "8,WAX"},
                    {"contract": "karmatoken", "sym": "4,KARMA"},
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["0.0000 KARMA"]
        }]
    });

    await expect(eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicassets.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You first need to announce the asset type you're backing using the announcedepo action");
});

test("throw when memo is invalid", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["0.00000000 WAX"]
        }]
    });

    await expect(eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicassets.accountName,
        quantity: "10.00000000 WAX",
        memo: "this memo is probably invalid"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("invalid memo");
});