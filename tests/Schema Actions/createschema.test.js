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
});

test("create minimal schema", async () => {
    await atomicassets.contract.createschema({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: [
            {name: "name", type: "string"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_schemas = atomicassets.getTableRowsScoped("schemas")["testcol"];
    expect(collection_schemas).toEqual([{
        schema_name: "testschema",
        format: [
            {name: "name", type: "string"}
        ]
    }]);
});

test("create bigger schema", async () => {
    await atomicassets.contract.createschema({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: [
            {name: "name", type: "string"},
            {name: "level", type: "uint32"},
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
            {name: "level", type: "uint32"},
            {name: "img", type: "ipfs"}
        ]
    }]);
});

test("throw when format is empty", async () => {
    await expect(atomicassets.contract.createschema({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow(`A format line with {\"name\": \"name\" and \"type\": \"string\"} needs to be defined`);
});

test("throw when name attribute is not defined", async () => {
    await expect(atomicassets.contract.createschema({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: [
            {name: "img", type: "ipfs"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow(`A format line with {\"name\": \"name\" and \"type\": \"string\"} needs to be defined`);
});

test("create schema with a name that already exists in another collection", async () => {
    await atomicassets.loadFixtures("schemas", {
        "testcol2": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"}
            ]
        }]
    });

    await atomicassets.contract.createschema({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: [
            {name: "name", type: "string"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_schemas = atomicassets.getTableRowsScoped("schemas")["testcol"];
    expect(collection_schemas).toEqual([{
        schema_name: "testschema",
        format: [
            {name: "name", type: "string"}
        ]
    }]);
});

test("throw when schema with this name already exists in collection", async () => {
    await atomicassets.loadFixtures("schemas", {
        "testcol": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"}
            ]
        }]
    });

    await expect(atomicassets.contract.createschema({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: [
            {name: "name", type: "string"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("A schema with this name already exists for this collection");
});

test("throw when collection does not exist", async () => {
    await expect(atomicassets.contract.createschema({
        authorized_creator: user1.accountName,
        collection_name: "nocol",
        schema_name: "testschema",
        schema_format: [
            {name: "name", type: "string"}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No collection with this name exists");
});

test("create schema as authorized account but not author", async () => {
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

    await atomicassets.contract.createschema({
        authorized_creator: user2.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: [
            {name: "name", type: "string"}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const collection_schemas = atomicassets.getTableRowsScoped("schemas")["testcol"];
    expect(collection_schemas).toEqual([{
        schema_name: "testschema",
        format: [
            {name: "name", type: "string"}
        ]
    }]);
});

test("throw without authorization from authorized creator", async () => {
    await expect(atomicassets.contract.createschema({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: [
            {name: "name", type: "string"}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});

test("throw when authorized_creator is not actually authorized", async () => {
    await expect(atomicassets.contract.createschema({
        authorized_creator: user2.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        schema_format: [
            {name: "name", type: "string"}
        ]
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The creator is not authorized within the collection");
});