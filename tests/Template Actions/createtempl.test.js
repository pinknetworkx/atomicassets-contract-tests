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
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });
});

test("create minimal template", async () => {
    await atomicassets.contract.createtempl({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcol"];
    expect(collection_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        issued_supply: 0,
        immutable_serialized_data: []
    }]);
});

test("create two minimal templates", async () => {
    await atomicassets.contract.createtempl({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);
    await atomicassets.contract.createtempl({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcol"];
    expect(collection_templates).toEqual([
        {
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 0,
            issued_supply: 0,
            immutable_serialized_data: []
        },
        {
            template_id: 2,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 0,
            issued_supply: 0,
            immutable_serialized_data: []
        }
    ]);
});

test("create template with data", async () => {
    await atomicassets.contract.createtempl({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: [
            {"key": "name", "value": ["string", "Tom"]}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcol"];
    expect(collection_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        issued_supply: 0,
        immutable_serialized_data: [4, 3, 84, 111, 109]
    }]);
});

test("create template with max supply / non transferable / non burnable", async () => {
    await atomicassets.contract.createtempl({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        transferable: false,
        burnable: false,
        max_supply: 10,
        immutable_data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcol"];
    expect(collection_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: false,
        burnable: false,
        max_supply: 10,
        issued_supply: 0,
        immutable_serialized_data: []
    }]);
});

test("throw when collection does not exist", async () => {
    await expect(atomicassets.contract.createtempl({
        authorized_creator: user1.accountName,
        collection_name: "nocol",
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No collection with this name exists");
});

test("throw when schema does not exist in collection", async () => {
    await expect(atomicassets.contract.createtempl({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "noschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No schema with this name exists");
});

test("create template as authorized account but not author", async () => {
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

    await atomicassets.contract.createtempl({
        authorized_creator: user2.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: []
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcol"];
    expect(collection_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        issued_supply: 0,
        immutable_serialized_data: []
    }]);
});

test("throw without authorization from authorized creator", async () => {
    await expect(atomicassets.contract.createtempl({
        authorized_creator: user1.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: []
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});

test("throw when authorized_creator is not actually authorized", async () => {
    await expect(atomicassets.contract.createtempl({
        authorized_creator: user2.accountName,
        collection_name: "testcol",
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        immutable_data: []
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The creator is not authorized within the collection");
});