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
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
});

test("set market fee", async () => {
    await atomicassets.contract.setmarketfee({
        collection_name: "testcol",
        market_fee: 0.1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcol",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: 0.1,
        serialized_data: []
    }]);
});

test("set market fee to 0", async () => {
    await atomicassets.contract.setmarketfee({
        collection_name: "testcol",
        market_fee: 0
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcol",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: 0,
        serialized_data: []
    }]);
});

test("set market fee to max allowed", async () => {
    await atomicassets.contract.setmarketfee({
        collection_name: "testcol",
        market_fee: 0.15
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcol",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: 0.15,
        serialized_data: []
    }]);
});

test("throw when market fee is negative", async () => {
    await expect(atomicassets.contract.setmarketfee({
        collection_name: "testcol",
        market_fee: -0.01
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The market_fee must be between");
});

test("throw when market fee is above max", async () => {
    await expect(atomicassets.contract.setmarketfee({
        collection_name: "testcol",
        market_fee: 0.151
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The market_fee must be between");
});

test("throw when market fee is NaN", async () => {
    await expect(atomicassets.contract.setmarketfee({
        collection_name: "testcol",
        market_fee: "NaN"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The market_fee must be between");
});

test("throw when collection does not exist", async () => {
    await expect(atomicassets.contract.setmarketfee({
        collection_name: "nonexistant",
        market_fee: 0
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No collection with this name exists");
});

test("throw without authorization from author", async () => {
    await expect(atomicassets.contract.setmarketfee({
        collection_name: "testcol",
        market_fee: 0
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});