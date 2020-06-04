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
                {name: "name", type: "string"}
            ]
        }]
    });
});

test("extend schema by one attribute", async () => {
    await atomicassets.contract.extendschema({
        authorized_editor: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format_extension: [
            {name: "img", type: "ipfs"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_schemas = atomicassets.getTableRowsScoped("schemas")["testcol"];
    expect(collection_schemas).toEqual([{
        schema_name: "testschema",
        format: [
            {name: "name", type: "string"},
            {name: "img", type: "ipfs"}
        ]
    }]);
});

test("extend schema by multiple attributes", async () => {
    await atomicassets.contract.extendschema({
        authorized_editor: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format_extension: [
            {name: "img", type: "ipfs"},
            {name: "level", type: "uint16"},
            {name: "gender", type: "string"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_schemas = atomicassets.getTableRowsScoped("schemas")["testcol"];
    expect(collection_schemas).toEqual([{
        schema_name: "testschema",
        format: [
            {name: "name", type: "string"},
            {name: "img", type: "ipfs"},
            {name: "level", type: "uint16"},
            {name: "gender", type: "string"}
        ]
    }]);
});

test("throw when format extension is empty", async () => {
    await expect(atomicassets.contract.extendschema({
        authorized_editor: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format_extension: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Need to add at least one new line");
});

test("throw when collection does not exist", async () => {
    await expect(atomicassets.contract.extendschema({
        authorized_editor: user1.accountName,
        collection_name: "nocol",
        schema_name: "testschema",
        schema_format_extension: [
            {name: "img", type: "ipfs"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No collection with this name exists");
});

test("throw when schema does not exist in collection", async () => {
    await expect(atomicassets.contract.extendschema({
        authorized_editor: user1.accountName,
        collection_name: "testcol",
        schema_name: "noschema",
        schema_format_extension: [
            {name: "img", type: "ipfs"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No schema with this name exists for this collection");
});

test("extend schema as authorized account but not author", async () => {
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
                {name: "name", type: "string"}
            ]
        }]
    });

    await atomicassets.contract.extendschema({
        authorized_editor: user2.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format_extension: [
            {name: "img", type: "ipfs"}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const collection_schemas = atomicassets.getTableRowsScoped("schemas")["testcol"];
    expect(collection_schemas).toEqual([{
        schema_name: "testschema",
        format: [
            {name: "name", type: "string"},
            {name: "img", type: "ipfs"}
        ]
    }]);
});

test("throw without authorization from authorized editor", async () => {
    await expect(atomicassets.contract.extendschema({
        authorized_editor: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format_extension: [
            {name: "img", type: "ipfs"}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});

test("throw when authorized_editor is not actually authorized", async () => {
    await expect(atomicassets.contract.extendschema({
        authorized_editor: user2.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format_extension: [
            {name: "img", type: "ipfs"}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The editor is not authorized within the collection");
});