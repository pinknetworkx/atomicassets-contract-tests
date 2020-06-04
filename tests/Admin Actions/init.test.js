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
});

test("initialize config table", async () => {
    await atomicassets.contract.init({}, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    const config_row = atomicassets.getTableRowsScoped("config")["atomicassets"][0];

    expect(config_row).toEqual({
        "asset_counter": "1099511627776",
        "template_counter": 1,
        "offer_counter": "1",
        "collection_format": [],
        "supported_tokens": []
    });
});

test("change nothing when config already exists", async () => {
    await atomicassets.loadFixtures("config", {
        "atomicassets": [
            {
                "asset_counter": "2000000000000",
                "template_counter": 10,
                "offer_counter": "10",
                "collection_format": [],
                "supported_tokens": []
            }
        ]
    });

    await atomicassets.contract.init({}, [{
        actor: atomicassets.accountName,
        permission: "active"
    }]);

    const config_row = atomicassets.getTableRowsScoped("config")["atomicassets"][0];

    expect(config_row).toEqual({
        "asset_counter": "2000000000000",
        "template_counter": 10,
        "offer_counter": "10",
        "collection_format": [],
        "supported_tokens": []
    });
});

test("throw without authorization", async () => {
    await expect(atomicassets.contract.init({}, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});