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

test("remove single account", async () => {
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

    await atomicassets.contract.remnotifyacc({
        collection_name: "testcollect1",
        account_to_remove: user1.accountName
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
        notify_accounts: [],
        market_fee: 0.05,
        serialized_data: []
    }]);
});

test("remove one of many", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: ["test1", "test2", user1.accountName, "test3"],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await atomicassets.contract.remnotifyacc({
        collection_name: "testcollect1",
        account_to_remove: user1.accountName
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
        notify_accounts: ["test1", "test2", "test3"],
        market_fee: 0.05,
        serialized_data: []
    }]);
});

test("throw when there are no notify accounts", async () => {
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

    await expect(atomicassets.contract.remnotifyacc({
        collection_name: "testcollect1",
        account_to_remove: user1.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The account is not a notify account");
});

test("throw when account is not a notify account", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: ["test1", "test2", "test3"],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.remnotifyacc({
        collection_name: "testcollect1",
        account_to_remove: user1.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The account is not a notify account");
});

test("throw when collection does not exist", async () => {
    await expect(atomicassets.contract.remnotifyacc({
        collection_name: "nocol",
        account_to_remove: user1.accountName
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
            notify_accounts: [user1.accountName],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.remnotifyacc({
        collection_name: "testcollect1",
        account_to_remove: user1.accountName
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});