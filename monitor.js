// yarn; node monitor.js "0xYOUR_POOL_ADDRESS"

const ethers = require("ethers");
const POOL_ABI = require("./pool.json");
require("dotenv").config();
const baseToken = process.env.BASE_TOKEN;
const baseTokenName = process.env.BASE_TOKEN_NAME;
const quoteToken = process.env.QUOTE_TOKEN;
const quoteTokenName = process.env.QUOTE_TOKEN_NAME;
const swapRouter = process.env.SWAP_ROUTER;
const rpcUrl = process.env.RPC_URL;

async function getNewSwaps(pool) {
    // Create a provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(pool, POOL_ABI, provider);

    // Listen for Swap events
    contract.on("Swap", (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {
        const amount0InEther = Number(ethers.utils.formatEther(amount0));
        const amount1InEther = Number(ethers.utils.formatEther(amount1));
        const roundedAmount0 = amount0InEther.toFixed(4);
        const roundedAmount1 = amount1InEther.toFixed(4);

        // This will be called when a Swap event is emitted
        console.log(`Swap event: amount0=${roundedAmount0} ${baseTokenName}, amount1=${roundedAmount1} ${quoteTokenName}, liquidity=${liquidity}, recipient= ${recipient}`);
    });
}

async function main() {
    const pool = process.argv[2];

    if (!pool || pool.length !== 42) {
        throw new Error("Please provide a valid Ethereum address as a command-line argument");
    }

    try {
        await getNewSwaps(pool);
    } catch (error) {
        console.error(error);
    }
}

main();