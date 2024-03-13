// swap.js

require("dotenv").config();
const ethers = require("ethers");
const SWAP_ROUTER_ABI = require("./swapRouter.json");
const swapRouter = process.env.SWAP_ROUTER;
const tokenOut = process.env.TOKEN_OUT;
const tokenOutName = process.env.TOKEN_OUT_NAME;
const tokenIn = process.env.TOKEN_IN;

const rpcUrl = process.env.RPC_URL;

async function swap(amountInWei, signer, provider) {
  // Create contract instance for the SwapRouter contract
  const router = new ethers.Contract(
    swapRouter,
    SWAP_ROUTER_ABI,
    provider
  ).connect(signer);


  // Define the transaction parameters
  const deadline = ethers.BigNumber.from(
    Math.floor(Date.now() / 1000) + 60 * 20
  ); // 20 minutes from the current Unix time

  const fee = 10000;
  const amountOutMinimum = ethers.BigNumber.from(process.env.AMOUNT_OUT_MINIMUM);
  const sqrtPriceLimitX96 = ethers.BigNumber.from('0');

  // Send the swap transaction
  try {
    // console.log("tokenIn:", tokenIn);
    // console.log("tokenOut:", tokenOut);
    // console.log("fee:", fee);
    // console.log("recipient:", signer.address);
    // console.log("deadline:", deadline);
    // console.log("amountInWei:", amountInWei);
    // console.log("amountOutMinimum:", amountOutMinimum);
    // console.log("sqrtPriceLimitX96:", sqrtPriceLimitX96);
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
    console.log(`✅ Swap Success, Transaction hash: ${tx.hash}`);

  } catch (error) {
    console.error("An error occurred while executing the transaction:", error);
  }
}

async function approveToken(tokenIn, amount, signer, provider) {
  try {
    const IERC20_ABI = [
      "function approve(address spender, uint256 amount) public returns (bool)",
      "function allowance(address owner, address spender) public view returns (uint256)"
    ];
    const tokenInContract = new ethers.Contract(tokenIn, IERC20_ABI, provider).connect(signer);
    const approvalTx = await tokenInContract.approve(swapRouter, amount);
    await approvalTx.wait();
    const allowance = await tokenInContract.allowance(signer.address, swapRouter);
    const allowanceInDecimal = ethers.utils.formatUnits(allowance, 18);
    console.log(`✅ Allowance for swapRouter set to: ${allowanceInDecimal}`);
  } catch (error) {
    console.error("An error occurred while approving the token:", error);
  }
}

async function tokenBalance(token, userAddress, provider) {
  const tokenContract = new ethers.Contract(token, ["function balanceOf(address) view returns (uint)"], provider);
  const balance = await tokenContract.balanceOf(userAddress);
  const balanceInDecimal = ethers.utils.formatUnits(balance, 18);
  const wholeNumberBalance = Math.floor(balanceInDecimal); // Round down to nearest whole number
  const formattedBalance = wholeNumberBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Format with dot every 3 digits
  console.log(`ℹ️ Your ${tokenOutName} balance is ${formattedBalance}`);
}

module.exports = { swap, tokenBalance, approveToken };

// You can call this swap function from CLI by running: node swap.js
// async function main() {
//   const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
//   const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
//   const amountIn = ethers.utils.parseUnits(process.env.AMOUNT_IN, "ether");

//   await tokenBalance(tokenOut, signer.address, provider);
//   await approveToken(tokenIn, amountIn, signer, provider);
//   await swap(amountIn, signer, provider);
//   await tokenBalance(tokenOut, signer.address, provider);
// }
// main().catch(console.error);

