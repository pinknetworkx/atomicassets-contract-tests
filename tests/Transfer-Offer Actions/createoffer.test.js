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

test("create offer 1 for 0", async () => {
    expect.assertions(2);

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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
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

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toEqual([{
        offer_id: "1",
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "",
        ram_payer: user1.accountName
    }]);
});

test("create offer 0 for 1", async () => {
    expect.assertions(2);

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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: [],
        recipient_asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

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
    expect(offers).toEqual([{
        offer_id: "1",
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: [],
        recipient_asset_ids: ["1099511627776"],
        memo: "",
        ram_payer: user1.accountName
    }]);
});

test("create two equal offers 1 for 0", async () => {
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);
    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toEqual([
        {
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776"],
            recipient_asset_ids: [],
            memo: "",
            ram_payer: user1.accountName
        },
        {
            offer_id: "2",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776"],
            recipient_asset_ids: [],
            memo: "",
            ram_payer: user1.accountName
        }
    ]);
});

test("create offer 2 for 0", async () => {
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toEqual([{
        offer_id: "1",
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: [],
        memo: "",
        ram_payer: user1.accountName
    }]);
});

test("create offer 0 for 2", async () => {
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: [],
        recipient_asset_ids: ["1099511627776", "1099511627777"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toEqual([{
        offer_id: "1",
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: [],
        recipient_asset_ids: ["1099511627776", "1099511627777"],
        memo: "",
        ram_payer: user1.accountName
    }]);
});

test("create offer 2 for 2", async () => {
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: ["1099511627778", "1099511627779"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toEqual([{
        offer_id: "1",
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: ["1099511627778", "1099511627779"],
        memo: "",
        ram_payer: user1.accountName
    }]);
});

test("create offer with assets of different collections", async () => {
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toEqual([{
        offer_id: "1",
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: [],
        memo: "",
        ram_payer: user1.accountName
    }]);
});

test("create offer with memo", async () => {
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "This is an example memo"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toEqual([{
        offer_id: "1",
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", ],
        recipient_asset_ids: [],
        memo: "This is an example memo",
        ram_payer: user1.accountName
    }]);
});

test("create offer with asset that has a template", async () => {
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
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: 1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toEqual([{
        offer_id: "1",
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", ],
        recipient_asset_ids: [],
        memo: "",
        ram_payer: user1.accountName
    }]);
});

test("throw when sender does not own one of the assets", async () => {
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Offer sender doesn't own at least one of the provided assets");
});

test("throw when recipient does not own one of the assets", async () => {
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: [],
        recipient_asset_ids: ["1099511627776", "1099511627777"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Offer recipient doesn't own at least one of the provided assets");
});

test("throw when one of sender's assets is not transferable", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: false,
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("At least one asset isn't transferable");
});

test("throw when one of recipient's assets is not transferable", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: false,
            burnable: true,
            max_supply: 0,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });

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
                template_id: 1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: [],
        recipient_asset_ids: ["1099511627776", "1099511627777"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("At least one asset isn't transferable");
});

test("throw when recipient account does not exist", async () => {
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: "noaccount",
        sender_asset_ids: [],
        recipient_asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The recipient account deos not exist");
});

test("throw when sender and recipient is the same account", async () => {
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user1.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Can't send an offer to yourself");
});

test("throw when the offer is empty on both sides", async () => {
    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: [],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Can't create an empty offer");
});

test("throw when memo is over 256 chars", async () => {
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor " +
            "invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et " +
            "accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata s"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("An offer memo can only be 256 characters max");
});

test("throw without authorization from sender", async () => {
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: user2.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});