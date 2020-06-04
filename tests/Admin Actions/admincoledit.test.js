const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicassets = blockchain.createAccount(`atomicassets`);

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
});

beforeEach(async () => {
    await atomicassets.resetTables();
    await atomicassets.loadFixtures("config", {
        "atomicassets": [
            {
                "asset_counter": "1099511627776",
                "template_counter": 1,
                "offer_counter": "1",
                "collection_format": [],
                "supported_tokens": []
            }
        ]
    });
});

test("set single valid line", async () => {
    await atomicassets.contract.admincoledit({
        collection_format_extension: [
            {"name": "name", "type": "string"}
        ]
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    const config_row = atomicassets.getTableRowsScoped("config")["atomicassets"][0];
    expect(config_row["collection_format"]).toEqual(
        [
            {"name": "name", "type": "string"}
        ]
    );
});

test("set two valid lines at once", async () => {
    await atomicassets.contract.admincoledit({
        collection_format_extension: [
            {"name": "name", "type": "string"},
            {"name": "img", "type": "ipfs"}
        ]
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    const config_row = atomicassets.getTableRowsScoped("config")["atomicassets"][0];
    expect(config_row["collection_format"]).toEqual(
        [
            {"name": "name", "type": "string"},
            {"name": "img", "type": "ipfs"}
        ]
    );
});

test("set two valid lines in two actions", async () => {
    await atomicassets.contract.admincoledit({
        collection_format_extension: [
            {"name": "name", "type": "string"}
        ]
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    await atomicassets.contract.admincoledit({
        collection_format_extension: [
            {"name": "img", "type": "ipfs"}
        ]
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    const config_row = atomicassets.getTableRowsScoped("config")["atomicassets"][0];
    expect(config_row["collection_format"]).toEqual(
        [
            {"name": "name", "type": "string"},
            {"name": "img", "type": "ipfs"}
        ]
    );
});

test("throw if nothing is added", async () => {
    await expect(atomicassets.contract.admincoledit({
        collection_format_extension: []
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }])).rejects.toThrow("Need to add at least one new line");
});

test("throw if no name attribute is defined", async () => {
    await expect(atomicassets.contract.admincoledit({
        collection_format_extension: [
            {"name": "img", "type": "ipfs"}
        ]
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }])).rejects.toThrow(`A format line with {\"name\": \"name\" and \"type\": \"string\"} needs to be defined`);
});

test("throw if two attributes have same name", async () => {
    await expect(atomicassets.contract.admincoledit({
        collection_format_extension: [
            {"name": "name", "type": "string"},
            {"name": "name", "type": "string"}
        ]
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }])).rejects.toThrow("there already is an attribute with the same name");
});

test("throw if type is invalid", async () => {
    await expect(atomicassets.contract.admincoledit({
        collection_format_extension: [
            {"name": "name", "type": "banana"}
        ]
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }])).rejects.toThrow("'type' attribute has an invalid format");
});

test("throw without authorization", async () => {
    await expect(atomicassets.contract.admincoledit({
        collection_format_extension: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});