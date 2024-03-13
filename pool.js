//getNewPool
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
const rpcUrl = process.env.RPC_URL;
const factory = process.env.FACTORY;
const tokenOut = process.env.BASE_TOKEN;
const tokenIn = process.env.QUOTE_TOKEN;

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

async function swap(pool, amountInWei, provider, signer) {
  // Create contract instance for the SwapRouter contract
  const router = new ethers.Contract(pool, SWAP_ROUTER_ABI, provider).connect(signer);
  // Define the transaction parameters
  const fee = 3000;
  const deadline = ethers.BigNumber.from(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes from the current Unix time
  const amountOutMinimum = ethers.BigNumber.from('150000000000000000');
  const sqrtPriceLimitX96 = ethers.BigNumber.from('0');

  // Send the swap transaction
  try {
    console.log('tokenIn:', tokenIn);
    console.log('tokenOut:', tokenOut);
    console.log('fee:', fee);
    console.log('recipient:', signer.address);
    console.log('deadline:', deadline);
    console.log('amountInWei:', amountInWei);
    console.log('amountOutMinimum:', amountOutMinimum);
    console.log('sqrtPriceLimitX96:', sqrtPriceLimitX96);
    const tx = await router.exactInputSingle({
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      fee: fee,
      recipient: signer.address,
      deadline: deadline,
      amountIn: amountInWei,
      amountOutMinimum: amountOutMinimum,
      sqrtPriceLimitX96: sqrtPriceLimitX96,
    });
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    // Get the event logs from the transaction receipt
    const event = receipt.events?.find(e => e.event === 'Swap');

    // Check if the Swap event was emitted
    if (event) {
      console.log('Swap executed successfully');
      console.log(`Event details: ${JSON.stringify(event.args, null, 2)}`);

    } else {
      console.log('Swap failed');
    }
  } catch (error) {
    console.error('An error occurred while executing the transaction:', error);
  }
  console.log('THE END');


}

async function approveToken(tokenIn, amount, signer) {
  try {
    const IERC20_ABI = [
      "function approve(address spender, uint256 amount) public returns (bool)",
      "function allowance(address owner, address spender) public view returns (uint256)"
    ];
    const tokenInContract = new ethers.Contract(tokenIn, IERC20_ABI, provider).connect(signer);
    const approvalTx = await tokenInContract.approve(swapRouter, amount);
    await approvalTx.wait();
    console.log('Token approved successfully');
    console.log("HHHHH", await tokenInContract.allowance(signer.address, swapRouter));
  } catch (error) {
    console.error("An error occurred while approving the token:", error);
  }
}

//   M A I N
async function main() {
  verifyEnv();
  await getNewPool();
  await getNewSwaps(newPool);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const amountIn = ethers.utils.parseUnits('1', 'ether');
  await approveToken(tokenIn, amountIn, signer);
  swap(newPool, amountIn, provider, signer);
}

main().catch(console.error);
