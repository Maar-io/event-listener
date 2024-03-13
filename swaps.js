const ethers = require("ethers");
const POOL_ABI = require("./pool.json");
require("dotenv").config();
const baseToken = process.env.BASE_TOKEN;
const baseTokenName = process.env.BASE_TOKEN_NAME;
const quoteToken = process.env.QUOTE_TOKEN;
const quoteTokenName = process.env.QUOTE_TOKEN_NAME;
const swapRouter = process.env.SWAP_ROUTER;
const myAccount = process.env.MY_ACCOUNT;
const pool = process.env.POOL;
const rpcUrl = process.env.RPC_URL;

async function getNewSwaps() {
    verifyEnv();

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
        // if (recipient !== myAccount) return;
        console.log(`Swap event: amount0=${roundedAmount0} ${baseTokenName}, amount1=${roundedAmount1} ${quoteTokenName}, liquidity=${liquidity}, recipient= ${recipient},`);
    });
}

function verifyEnv() {
    if (!baseToken || !quoteToken) {
        throw new Error("Please set the base and quote token in the .env file")
    }

    if (!pool) {
        throw new Error("Please set the swap router address in the .env file")
    }

}

getNewSwaps() 