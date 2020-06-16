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

test("add one account", async () => {
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

    await atomicassets.contract.addnotifyacc({
        collection_name: "testcollect1",
        account_to_add: user1.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcollect1",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [],
        notify_accounts: [user1.accountName],
        market_fee: 0.05,
        serialized_data: []
    }]);
});

test("add second account", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [user1.accountName],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await atomicassets.contract.addnotifyacc({
        collection_name: "testcollect1",
        account_to_add: user2.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcollect1",
        author: user1.accountName,
        allow_notify: true,
        authorized_accounts: [],
        notify_accounts: [user1.accountName, user2.accountName],
        market_fee: 0.05,
        serialized_data: []
    }]);
});

test("throw when allow notify is false", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: false,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.addnotifyacc({
        collection_name: "testcollect1",
        account_to_add: user1.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Adding notify accounts to this collection is not allowed");
});

test("throw when not an account", async () => {
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

    await expect(atomicassets.contract.addnotifyacc({
        collection_name: "testcollect1",
        account_to_add: "noaccount"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The account does not exist");
});

test("throw when duplicate", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [user1.accountName],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.addnotifyacc({
        collection_name: "testcollect1",
        account_to_add: user1.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The account is already a notify account");
});

test("throw when collection does not exist", async () => {
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

    await expect(atomicassets.contract.addnotifyacc({
        collection_name: "nocol",
        account_to_add: user1.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No collection with this name exists");
});

test("throw without authorization from author", async () => {
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

    await expect(atomicassets.contract.addnotifyacc({
        collection_name: "testcollect1",
        account_to_add: user1.accountName
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});