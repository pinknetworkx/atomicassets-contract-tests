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
    atomicassets.resetTables();
    await atomicassets.loadFixtures();
});

test("set tokenconfigs table", async () => {
    await atomicassets.contract.setversion({
        new_version: "1.0.0"
    }, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    const tokenconfigs_row = atomicassets.getTableRowsScoped("tokenconfigs")["atomicassets"][0];

    expect(tokenconfigs_row).toEqual({
        "standard": "atomicassets",
        "version": "1.0.0"
    });
});

test("throw without authorization", async () => {
    await expect(atomicassets.contract.setversion({
        new_version: "1.0.0"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});