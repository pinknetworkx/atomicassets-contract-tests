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
    await atomicassets.loadFixtures();
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [user1.accountName],
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

test("set data of asset that previously didnt have data", async () => {
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

    await atomicassets.contract.setassetdata({
        authorized_editor: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        new_mutable_data: [
            {"key": "name", "value": ["string", "ABC"]}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcol",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: [4, 3, 65, 66, 67]
    }]);
});

test("overwrite data of asset that already has data", async () => {
    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: [4, 3, 65, 66, 67]
        }]
    });

    await atomicassets.contract.setassetdata({
        authorized_editor: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        new_mutable_data: [
            {"key": "level", "value": ["uint32", 100]}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcol",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: [5, 100]
    }]);
});

test("erase data of asset that already has data", async () => {
    await atomicassets.loadFixtures("assets", {
        "user3": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: [4, 3, 65, 66, 67]
        }]
    });

    await atomicassets.contract.setassetdata({
        authorized_editor: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        new_mutable_data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcol",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("throw when asset does not exist", async () => {
    await expect(atomicassets.contract.setassetdata({
        authorized_editor: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        new_mutable_data: [
            {"key": "name", "value": ["string", "ABC"]}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No asset with this id exists");
});

test("set data as authorized account but not author", async () => {
    await atomicassets.resetTables();
    await atomicassets.loadFixtures();
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [user2.accountName],
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

    await atomicassets.contract.setassetdata({
        authorized_editor: user2.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        new_mutable_data: [
            {"key": "name", "value": ["string", "ABC"]}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcol",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user2.accountName,
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: [4, 3, 65, 66, 67]
    }]);
});

test("throw without authorization from authorized editor", async () => {
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

    await expect(atomicassets.contract.setassetdata({
        authorized_editor: user1.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        new_mutable_data: [
            {"key": "name", "value": ["string", "ABC"]}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});

test("throw when authorized_editor is not actually authorized", async () => {
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

    await expect(atomicassets.contract.setassetdata({
        authorized_editor: user2.accountName,
        asset_owner: user3.accountName,
        asset_id: "1099511627776",
        new_mutable_data: [
            {"key": "name", "value": ["string", "ABC"]}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The editor is not authorized within the collection");
});