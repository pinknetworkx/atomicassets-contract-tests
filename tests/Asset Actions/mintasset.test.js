const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicassets = blockchain.createAccount(`atomicassets`);

const user1 = blockchain.createAccount(`user1`);
const user2 = blockchain.createAccount(`user2`);
const user3 = blockchain.createAccount(`user3`);

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
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [user1.accountName],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("schemas", {
        "testcollect1": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });
});

test("mint minimal asset", async () => {
    await atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("mint two minimal assets", async () => {
    await atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    await atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: user1.accountName,
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);
});

test("throw when new owner account does not exist", async () => {
    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: "noaccount",
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The new_asset_owner account does not exist");
});

test("mint asset with data", async () => {
    await atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [
            {"key": "name", "value": ["string", "Tom"]}
        ],
        mutable_data: [
            {"key": "level", "value": ["uint32", 100]}
        ],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: [],
        immutable_serialized_data: [4, 3, 84, 111, 109],
        mutable_serialized_data: [5, 100]
    }]);
});

test("mint asset with one backed token", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["150.00000000 WAX"]
        }]
    });

    await atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: ["100.00000000 WAX"]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: ["100.00000000 WAX"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["50.00000000 WAX"]
    }]);
});

test("mint asset with two backed tokens", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["150.00000000 WAX", "10.0000 EOS"]
        }]
    });

    await atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: ["100.00000000 WAX", "10.0000 EOS"]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user1.accountName,
        backed_tokens: ["100.00000000 WAX", "10.0000 EOS"],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);

    const balances = atomicassets.getTableRowsScoped("balances")["atomicassets"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["50.00000000 WAX"]
    }]);
});

test("throw when minter tries to back tokens but does not have any balance", async () => {
    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: ["100.00000000 WAX"]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance table row");
});

test("throw when minter tries to back tokens but does not have enough balance", async () => {
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: ["100.00000000 WAX"]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account's balance is lower than the specified quantity");
});

test("throw when minter tries to back tokens but only has balance for a different token", async () => {
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["10.0000 EOS"]
        }]
    });

    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: ["100.00000000 WAX"]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance for the symbol specified in the quantity");
});

test("mint asset referencing a template", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 0,
            issued_supply: 0,
            immutable_serialized_data: []
        }]
    });

    await atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: 1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: 1,
        ram_payer: user1.accountName,
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);

    const testcol_templates = atomicassets.getTableRowsScoped("templates")["testcollect1"];
    expect(testcol_templates).toEqual([{
        template_id: 1,
        schema_name: "testschema",
        transferable: true,
        burnable: true,
        max_supply: 0,
        issued_supply: 1,
        immutable_serialized_data: []
    }]);
});

test("throw when minting asset referencing a template that reached its max supply", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 5,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: 1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The template's maxsupply has already been reached");
});

test("throw when minting asset with backed token referencing a template that is not burnable", async () => {
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: false,
            max_supply: 0,
            issued_supply: 0,
            immutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: 1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: ["50.00000000 WAX"]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The asset is not burnable. Only burnable assets can be backed.");
});

test("throw when minting asset with multiple backed tokens with the same symbol", async () => {
    await atomicassets.loadFixtures("balances", {
        "atomicassets": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: ["50.00000000 WAX","20.00000000 WAX"]
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Symbols in the tokens_to_back must be unique");
});

test("throw when template id is a negative number other than -1", async () => {
    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -2,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The template id must either be an existing template or -1");
});

test("throw when template belongs to another schema", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "different",
            transferable: true,
            burnable: false,
            max_supply: 0,
            issued_supply: 0,
            immutable_serialized_data: []
        }]
    });

    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: 1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The template belongs to another schema");
});

test("throw when collection does not exist", async () => {
    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "nocol",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No collection with this name exists");
});

test("throw when schema does not exist", async () => {
    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "noschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No schema with this name exists");
});

test("throw when template does not exist", async () => {
    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: 1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No template with this id exists");
});

test("mint asset as authorized account but not author", async () => {
    await atomicassets.resetTables();
    await atomicassets.loadFixtures();
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [user2.accountName],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("schemas", {
        "testcollect1": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });

    await atomicassets.contract.mintasset({
        authorized_minter: user2.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const user3_assets = atomicassets.getTableRowsScoped("assets")[user3.accountName];
    expect(user3_assets).toEqual([{
        asset_id: "1099511627776",
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        ram_payer: user2.accountName,
        backed_tokens: [],
        immutable_serialized_data: [],
        mutable_serialized_data: []
    }]);
});

test("throw without authorization from authorized minter", async () => {
    await expect(atomicassets.contract.mintasset({
        authorized_minter: user1.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});

test("throw when authorized_creator is not actually authorized", async () => {
    await expect(atomicassets.contract.mintasset({
        authorized_minter: user2.accountName,
        collection_name: "testcollect1",
        schema_name: "testschema",
        template_id: -1,
        new_asset_owner: user3.accountName,
        immutable_data: [],
        mutable_data: [],
        tokens_to_back: []
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The minter is not authorized within the collection");
});