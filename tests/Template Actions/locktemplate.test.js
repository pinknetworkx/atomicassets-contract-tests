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
            authorized_accounts: [user1.accountName],
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

test("lock template that had no max supply previously", async () => {
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

    await atomicassets.contract.locktemplate({
        authorized_editor: user1.accountName,
        collection_name: "testcollect1",
        template_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcollect1"];
    expect(collection_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 5,
        issued_supply: 5,
        immutable_serialized_data: []
    }]);
});

test("lock template that had a max supply previously", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 10,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });

    await atomicassets.contract.locktemplate({
        authorized_editor: user1.accountName,
        collection_name: "testcollect1",
        template_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcollect1"];
    expect(collection_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 5,
        issued_supply: 5,
        immutable_serialized_data: []
    }]);
});

test("lock template where max supply is equal to issued supply", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 5,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });

    await atomicassets.contract.locktemplate({
        authorized_editor: user1.accountName,
        collection_name: "testcollect1",
        template_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcollect1"];
    expect(collection_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 5,
        issued_supply: 5,
        immutable_serialized_data: []
    }]);
});

test("throw when issued supply is 0", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 10,
            issued_supply: 0,
            immutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.locktemplate({
        authorized_editor: user1.accountName,
        collection_name: "testcollect1",
        template_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Can't lock a template that does not have at least one issued asset");
});

test("throw when template with this id does not exist in collection", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 10,
            issued_supply: 0,
            immutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.locktemplate({
        authorized_editor: user1.accountName,
        collection_name: "testcollect1",
        template_id: 2
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No template with the specified id exists for the specified collection");
});

test("throw when collection does not exist", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 10,
            issued_supply: 0,
            immutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.locktemplate({
        authorized_editor: user1.accountName,
        collection_name: "nocol",
        template_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No collection with this name exists");
});

test("lock template as authorized account but not author", async () => {
    await atomicassets.resetTables();
    await atomicassets.loadFixtures();
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [user2.accountName],
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
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 10,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });

    await atomicassets.contract.locktemplate({
        authorized_editor: user2.accountName,
        collection_name: "testcollect1",
        template_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const collection_templates = atomicassets.getTableRowsScoped("templates")["testcollect1"];
    expect(collection_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 5,
        issued_supply: 5,
        immutable_serialized_data: []
    }]);
});

test("throw without authorization from authorized creator", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 10,
            issued_supply: 0,
            immutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.locktemplate({
        authorized_editor: user1.accountName,
        collection_name: "testcollect1",
        template_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});

test("throw when template id is negative", async () => {
    await expect(atomicassets.contract.locktemplate({
        authorized_editor: user1.accountName,
        collection_name: "testcollect1",
        template_id: -1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The template id must be positive");
});

test("throw when authorized_creator is not actually authorized", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 10,
            issued_supply: 0,
            immutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.locktemplate({
        authorized_editor: user2.accountName,
        collection_name: "testcollect1",
        template_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The editor is not authorized within the collection");
});