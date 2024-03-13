//getNewPool
const ethers = require("ethers");
const FACTORY_ABI = require("./factory.json");
require("dotenv").config();
const { swap, tokenBalance, approveToken } = require('./swap.js');

// Environment variables
const tokenOut = process.env.TOKEN_OUT;
const tokenIn = process.env.TOKEN_IN;
const tokenOutName = process.env.TOKEN_OUT_NAME;
const tokenInName = process.env.TOKEN_IN_NAME;


// Read Events on Factory to find out when a new pool is created
async function getNewPool(amountIn, signer, provider) {
  const factory = process.env.FACTORY;
  // Create a contract instance for the Factory contract
  const factoryContract = new ethers.Contract(factory, FACTORY_ABI, provider);

  // Create a promise that resolves with the pool address when the PoolCreated event is emitted
  console.log(`ℹ️ Waiting for PoolCreated event for pair ${tokenInName}/${tokenOutName}...`);

    factoryContract.on("PoolCreated", async (token0, token1, fee, tickSpacing, pool, event) => {
      console.log(`✅ PoolCreated event: token0=${token0}, token1=${token1}, fee=${fee}, pool=${pool}`);
      process.stdout.write('\x07');
    
      const t0 = token0.toUpperCase()
      const t1 = token1.toUpperCase()
      const tOut = tokenOut.toUpperCase()
      const tIn = tokenIn.toUpperCase()
    
      if ((t0 === tIn || t0 === tOut) && (t1 === tIn || t1 === tOut)) {
        console.log(`ℹ️ Use new pool: ${pool}`);
        await approveToken(tokenIn, amountIn, signer, provider);
        await swap(amountIn, signer, provider);
        await tokenBalance(tokenOut, signer.address, provider);
      }
    });
}

//   M A I N
async function main() {
  const rpcUrl = process.env.RPC_URL;
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const amountIn = ethers.utils.parseUnits(process.env.AMOUNT_IN, "ether");

  await tokenBalance(tokenOut, signer.address, provider);
  await getNewPool(amountIn, signer, provider);
  // await approveToken(tokenIn, amountIn, signer, provider);
  // await swap(amountIn, signer, provider);
  // await tokenBalance(tokenOut, signer.address, provider);
}

main().catch(console.error);
