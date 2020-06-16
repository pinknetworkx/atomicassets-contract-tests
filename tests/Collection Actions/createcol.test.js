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

test("create basic collection", async () => {
    await atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: true,
        authorized_accounts: [user1.accountName],
        notify_accounts: [],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcollect1",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [user1.accountName],
        notify_accounts: [],
        market_fee: 0.05,
        serialized_data: []
    }]);
});

test("create collection with notify account and two auth accounts", async () => {
    await atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: true,
        authorized_accounts: [user1.accountName, user2.accountName],
        notify_accounts: [user1.accountName],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcollect1",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [user1.accountName, user2.accountName],
        notify_accounts: [user1.accountName],
        market_fee: 0.05,
        serialized_data: []
    }]);
});

test("throw when two auth accounts are duplicate", async () => {
    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: true,
        authorized_accounts: [user1.accountName, user1.accountName],
        notify_accounts: [],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You can't have duplicates in the authorized_accounts");
});

test("throw when two notify accounts are duplicate", async () => {
    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: true,
        authorized_accounts: [],
        notify_accounts: [user1.accountName, user1.accountName],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You can't have duplicates in the notify_accounts");
});

test("throw when auth account does not exist", async () => {
    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: true,
        authorized_accounts: ["noaccount"],
        notify_accounts: [],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("At least one account does not exist");
});

test("throw when notify account does not exist", async () => {
    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: true,
        authorized_accounts: [],
        notify_accounts: ["noaccount"],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("At least one account does not exist");
});

test("throw when notify is not allowed but notify account is added", async () => {
    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: false,
        authorized_accounts: [],
        notify_accounts: ["noaccount"],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Can't add notify_accounts if allow_notify is false");
});

test("throw when market_fee is too high", async () => {
    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: false,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: 0.5,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The market_fee must be between");
});

test("throw when market_fee is negative", async () => {
    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: false,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: -0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The market_fee must be between");
});

test("throw when name is an account name", async () => {

    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: user2.accountName,
        allow_notify: false,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("When the collection has the name of an existing account, its authorization is required");
});

test("collection name is account name but with auth", async () => {

    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: user2.accountName,
        allow_notify: false,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: 0.05,
        data: []
    }, [
        {
            actor: user1.accountName,
            permission: "active"
        },
        {
            actor: user2.accountName,
            permission: "active"
        }
    ])).resolves.toBeTruthy();
});

test("throw when collection name already exists", async () => {
    await atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: true,
        authorized_accounts: [user1.accountName],
        notify_accounts: [],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: true,
        authorized_accounts: [user1.accountName],
        notify_accounts: [],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("A collection with this name already exists");
});

test("throw without author auth from author", async () => {

    await expect(atomicassets.contract.createcol({
        author: user1.accountName,
        collection_name: "testcollect1",
        allow_notify: false,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: 0.05,
        data: []
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});