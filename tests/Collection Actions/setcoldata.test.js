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
});

test("set basic data", async () => {
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

    await atomicassets.contract.setcoldata({
        collection_name: "testcol",
        data: [
            {"key": "name", "value": ["string", "ABC"]}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcol",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [user1.accountName],
        notify_accounts: [],
        market_fee: 0.05,
        serialized_data: [4,3,65,66,67]
    }]);
});

test("overwrite data", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [user1.accountName],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: [4,3,65,66,67]
        }]
    });

    await atomicassets.contract.setcoldata({
        collection_name: "testcol",
        data: [
            {"key": "name", "value": ["string", "123"]}
        ]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcol",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [user1.accountName],
        notify_accounts: [],
        market_fee: 0.05,
        serialized_data: [4,3,49,50,51]
    }]);
});

test("erase data", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [user1.accountName],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: [4,3,65,66,67]
        }]
    });

    await atomicassets.contract.setcoldata({
        collection_name: "testcol",
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcol",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [user1.accountName],
        notify_accounts: [],
        market_fee: 0.05,
        serialized_data: []
    }]);
});

test("throw without authorization", async () => {
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

    await expect(atomicassets.contract.setcoldata({
        collection_name: "testcol",
        data: []
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});