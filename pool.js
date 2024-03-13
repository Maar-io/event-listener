const ethers = require("ethers");
const POOL_ABI = require("./pool.json");
const FACTORY_ABI = require("./factory.json");
require("dotenv").config();
const assert = require('assert');

// Environment variables
const baseToken = process.env.BASE_TOKEN;
const baseTokenName = process.env.BASE_TOKEN_NAME;
const quoteToken = process.env.QUOTE_TOKEN;
const quoteTokenName = process.env.QUOTE_TOKEN_NAME;
const swapRouter = process.env.SWAP_ROUTER;
const myAccount = process.env.MY_ACCOUNT;
const rpcUrl = process.env.RPC_URL;
const factory = process.env.FACTORY;

// Create a provider
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
var newPool = null;

// Fetch the new pool address
async function getNewPool() {
    // Create a contract instance for the Factory contract
    const factoryContract = new ethers.Contract(factory, FACTORY_ABI, provider);

    // Create a promise that resolves with the pool address when the PoolCreated event is emitted
    console.log(`✅ Waiting for PoolCreated event... on factory: ${factory}`);

    return new Promise((resolve, reject) => {
        factoryContract.on("PoolCreated", (token0, token1, fee, tickSpacing, pool, event) => {
            console.log(`✅ PoolCreated event: token0=${token0}, token1=${token1}, fee=${fee}, pool=${pool}`);
            process.stdout.write('\x07');

            const t0 = token0.toUpperCase()
            const t1 = token1.toUpperCase()
            const b = baseToken.toUpperCase()
            const q = quoteToken.toUpperCase()

            if (t0 === b || t0 === q) {
                if (t1 === b || t1 === q) {
                    console.log(`✅ Use new pool: ${pool}`);
                    newPool = pool;
                    resolve(pool);
                }
            }
        });
    });
}

async function getNewSwaps(pool) {
    assert(pool, "Pool address is null")

    // Create a contract instance for the newly created pool
    const contract = new ethers.Contract(pool, POOL_ABI, provider);

    // Listen for Swap events
    console.log("✅ Listening for Swap events on pool: ", pool);
    contract.on("Swap", (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {
        const amount0InEther = Number(ethers.utils.formatEther(amount0));
        const amount1InEther = Number(ethers.utils.formatEther(amount1));
        const roundedAmount0 = amount0InEther.toFixed(4);
        const roundedAmount1 = amount1InEther.toFixed(4);

        // This will be called when a Swap event is emitted
        console.log(`✅ Swap event: amount0=${roundedAmount0} ${baseTokenName}, amount1=${roundedAmount1} ${quoteTokenName}, liquidity=${liquidity}, recipient= ${recipient},`);
    });
}

function verifyEnv() {
    if (!baseToken || !quoteToken) {
        throw new Error("Please set the base and quote token in the .env file")
    }

    if (!quoteTokenName || !baseTokenName) {
        throw new Error("Please set token names .env file")
    }
}

function foo() {
    const ok = false
    const token0 = '0x1607D9C58466D6EFE8B0d969f41F3931D69bBCe1'.toUpperCase()
    const token1 = '0xd2480162Aa7F02Ead7BF4C127465446150D58452'.toUpperCase()
    const b = baseToken.toUpperCase()
    const q = quoteToken.toUpperCase()


    if ((token0 === b || token0 === q)
        && (token1 === b || token1 === q)) {
        const ok = true
        console.log(`✅ Use new pool`);
    }
}

//   M A I N 
async function main() {
    verifyEnv();
    await getNewPool();
    await getNewSwaps(newPool);
}

main().catch(console.error);