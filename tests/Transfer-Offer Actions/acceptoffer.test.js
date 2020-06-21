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
    await atomicassets.loadFixtures();

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


test("accept offer 1 for 0", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776"],
            recipient_asset_ids: [],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toBeUndefined();

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: "eosio",
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("accept offer 0 for 1", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user2": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: [],
            recipient_asset_ids: ["1099511627776"],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: "eosio",
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toBeUndefined();

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("accept offer 2 for 0", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776", "1099511627777"],
            recipient_asset_ids: [],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toBeUndefined();

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("accept offer 0 for 2", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: [],
            recipient_asset_ids: ["1099511627776", "1099511627777"],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toBeUndefined();

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("accept offer 2 for 2", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ],
        "user2": [
            {
                asset_id: "1099511627778",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627779",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776", "1099511627777"],
            recipient_asset_ids: ["1099511627778", "1099511627779"],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([
        {
            asset_id: "1099511627778",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627779",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("accept offer with assets from different collections", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol2",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("schemas", {
        "testcol2": [{
            schema_name: "testschema2",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });

    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcol2",
                schema_name: "testschema2",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776", "1099511627777"],
            recipient_asset_ids: [],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toBeUndefined();

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcol2",
            schema_name: "testschema2",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("accept offer with asset that has a template", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
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
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: 1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776", "1099511627777"],
            recipient_asset_ids: [],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toBeUndefined();

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: 1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("throw when sender does not own one of the assets", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776", "1099511627777"],
            recipient_asset_ids: [],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await expect(atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Offer sender doesn't own at least one of the provided assets");
});

test("throw when recipient does not own one of the assets", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: [],
            recipient_asset_ids: ["1099511627776", "1099511627777"],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await expect(atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Offer recipient doesn't own at least one of the provided assets");
});

test("throw without authorization from recipient", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776"],
            recipient_asset_ids: [],
            memo: "",
            ram_payer: user1.accountName
        }]
    })

    await expect(atomicassets.contract.acceptoffer({
        offer_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});
