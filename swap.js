// swap.js

require("dotenv").config();
const ethers = require("ethers");
const SWAP_ROUTER_ABI = require("./swapRouter.json");
const swapRouter = process.env.SWAP_ROUTER;
// const tokenOut = process.env.BASE_TOKEN;
// const tokenIn = process.env.QUOTE_TOKEN;

const rpcUrl = process.env.RPC_URL;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

async function swap(token0, token1, amountInWei, provider, signer) {
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
  // const fee = 3000;
  // const amountOutMinimum = ethers.utils.parseUnits( process.env.MIN_OUT, "ether");
  // const sqrtPriceLimitX96 = ethers.BigNumber.from("0");

  const tokenIn = "0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400"; //LSBY
const tokenOut = "0x1CD8854309097808Fea4668d9dcd7e3A43FB0565"; //BRR
const fee = 3000;
const recipient = "0x911d82b108804A18022d0A2621B2Fc608DEF6FCA";
const amountIn = ethers.BigNumber.from("0x1bc16d674ec80000"); // 2 LSBY
const amountOutMinimum = ethers.BigNumber.from("0x9CF90C1FDEDDB865C"); // BRR
const sqrtPriceLimitX96 = ethers.BigNumber.from("0x00");

  // Send the swap transaction
  try {
    console.log("tokenIn:", tokenIn);
    console.log("tokenOut:", tokenOut);
    console.log("fee:", fee);
    console.log("recipient:", signer.address);
    console.log("deadline:", deadline);
    console.log("amountInWei:", amountInWei);
    console.log("amountOutMinimum:", amountOutMinimum);
    console.log("sqrtPriceLimitX96:", sqrtPriceLimitX96);
    const tx = await router.exactInputSingle({
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      fee: fee,
      recipient: recipient,
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: amountOutMinimum,
      sqrtPriceLimitX96: sqrtPriceLimitX96,
    });
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);

    // Print all the event logs from the transaction receipt
    console.log("All events from transaction receipt:");
    receipt.events?.forEach((event, index) => {
      console.log(`Event ${index + 1}: ${event.event}`);
      console.log(`Event details: ${JSON.stringify(event.args, null, 2)}`);
    });

    // Find the Swap event
    const swapEvent = receipt.events?.find((e) => e.event === "Swap");

    // Check if the Swap event was emitted
    if (swapEvent) {
      console.log("Swap executed successfully");
      console.log(
        `Swap event details: ${JSON.stringify(swapEvent.args, null, 2)}`
      );
    } else {
      console.log("Swap event not found");
    }
  } catch (error) {
    console.error("An error occurred while executing the transaction:", error);
  }
  console.log("THE END");
}

async function approveToken(tokenIn, amount, signer) {
  try {
    const IERC20_ABI = [
      "function approve(address spender, uint256 amount) public returns (bool)",
      "function allowance(address owner, address spender) public view returns (uint256)",
    ];
    const tokenInContract = new ethers.Contract(
      tokenIn,
      IERC20_ABI,
      provider
    ).connect(signer);
    const approvalTx = await tokenInContract.approve(swapRouter, amount);
    await approvalTx.wait();
    console.log("Token approved successfully");
    console.log(
      "Alowance:",
      await tokenInContract.allowance(signer.address, swapRouter)
    );
  } catch (error) {
    console.error("An error occurred while approving the token:", error);
  }
}
module.exports = swap;

async function main() {
  const tokenIn = "0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400";
  const tokenOut = "0x1CD8854309097808Fea4668d9dcd7e3A43FB0565";

  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  // const amountIn = ethers.utils.parseUnits( process.env.AMOUNT, "ether");
  const amountIn = ethers.BigNumber.from("0x1bc16d674ec80000");

  await approveToken(tokenIn, amountIn, signer);
  swap(tokenIn, tokenOut, amountIn, provider, signer);
}
main().catch(console.error);

