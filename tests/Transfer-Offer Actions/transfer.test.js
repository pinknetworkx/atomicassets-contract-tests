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

test("transfer basic asset", async () => {
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

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user1.accountName,
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
});

test("transfer multiple basic assets", async () => {
    expect.assertions(2);

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
            },
            {
                asset_id: "1099511627778",
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

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776", "1099511627777"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([{
        asset_id: "1099511627778",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: "eosio",
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);

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
});

test("transfer multiple assets of different collections", async () => {
    expect.assertions(2);

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

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776", "1099511627777"],
        memo: ""
    }, [{
        actor: user1.accountName,
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
});

test("transfer with a memo", async () => {
    expect.assertions(2);

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
            }
        ]
    });

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776"],
        memo: "This is an example memo!"
    }, [{
        actor: user1.accountName,
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
        }
    ]);
});

test("transfer assets with a template", async () => {
    expect.assertions(2);

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
                template_id: 1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user1.accountName,
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
            template_id: 1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);
});

test("transfer assets with data", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [4, 3, 84, 111, 109],
                mutable_serialized_data: [5, 100]
            }
        ]
    });

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user1.accountName,
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
            immutable_serialized_data: [4, 3, 84, 111, 109],
            mutable_serialized_data: [5, 100]
        }
    ]);
});

test("transfer assets with backed tokens", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: ["50.00000000 WAX"],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user1.accountName,
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
            backed_tokens: ["50.00000000 WAX"],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);
});

test("throw when transferring the same asset multiple times", async () => {
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
        },{
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776", "1099511627777", "1099511627777"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Can't transfer the same asset multiple times");
});

test("throw when the sender does not own at least one of the assets", async () => {
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776", "1099511627777"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Sender doesn't own at least one of the provided assets");
});

test("throw when at least one asset is not transferable", async () => {
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776", "1099511627777"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("At least one asset isn't transferable");
});

test("throw when to account does not exist", async () => {
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: "noaccount",
        asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("to account does not exist");
});

test("throw when to and from is the same", async () => {
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: user1.accountName,
        asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Can't transfer assets to yourself");
});

test("throw when asset_ids vector is empty", async () => {
    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: [],
        memo: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("asset_ids needs to contain at least one id");
});

test("throw when memo is over 256 chars", async () => {
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776"],
        memo: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor " +
            "invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et " +
            "accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata s"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("A transfer memo can only be 256 characters max");
});

test("throw without authorization from sender", async () => {
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: user2.accountName,
        asset_ids: ["1099511627776"],
        memo: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});