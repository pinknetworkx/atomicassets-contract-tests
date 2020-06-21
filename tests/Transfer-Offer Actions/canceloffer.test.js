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


test("cancel offer", async () => {
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776", "1099511627777"],
            recipient_asset_ids: ["1099511627778"],
            memo: "Example memo. Doesn't matter anyways.",
            ram_payer: user1.accountName
        }]
    })

    await atomicassets.contract.canceloffer({
        offer_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("throw without authorization from the offer sender", async () => {
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [{
            offer_id: "1",
            sender: user1.accountName,
            recipient: user2.accountName,
            sender_asset_ids: ["1099511627776", "1099511627777"],
            recipient_asset_ids: ["1099511627778"],
            memo: "Example memo. Doesn't matter anyways.",
            ram_payer: user1.accountName
        }]
    })

    await expect(atomicassets.contract.canceloffer({
        offer_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});