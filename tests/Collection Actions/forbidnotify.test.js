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

test("forbid notify", async () => {
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

    await atomicassets.contract.forbidnotify({
        collection_name: "testcol"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const collections = atomicassets.getTableRowsScoped("collections")["atomicassets"];
    expect(collections).toEqual([{
        collection_name: "testcol",
        author: user1.accountName,
        allow_notify: false,
        authorized_accounts: [],
        notify_accounts: [],
        market_fee: 0.05,
        serialized_data: []
    }]);
});

test("throw when notify is already forbidden", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: false,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.forbidnotify({
        collection_name: "testcol"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("allow_notify is already false for this collection");
});

test("throw when one account is in the notfy list", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: false,
            authorized_accounts: [],
            notify_accounts: [user1.accountName],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.forbidnotify({
        collection_name: "testcol"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The collection's notify_accounts vector must be empty");
});

test("throw when multiple accounts are in the notfy list", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: false,
            authorized_accounts: [],
            notify_accounts: [user1.accountName, "abc", "def", "test123"],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.forbidnotify({
        collection_name: "testcol"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The collection's notify_accounts vector must be empty");
});

test("throw when collection does not exist", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: false,
            authorized_accounts: [],
            notify_accounts: [user1.accountName, "abc", "def", "test123"],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.forbidnotify({
        collection_name: "nocol"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No collection with this name exists");
});

test("throw without authorization from author", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: false,
            authorized_accounts: [],
            notify_accounts: [user1.accountName, "abc", "def", "test123"],
            market_fee: 0.05,
            serialized_data: []
        }]
    });

    await expect(atomicassets.contract.forbidnotify({
        collection_name: "testcol"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});