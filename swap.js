// swap.js

require('dotenv').config();
const ethers = require('ethers');
const SWAP_ROUTER_ABI = require('./swapRouter.json');
const swapRouter = process.env.SWAP_ROUTER;
const tokenOut = process.env.BASE_TOKEN;
const tokenIn = process.env.QUOTE_TOKEN;
// const amountIn = process.env.AMOUNT;

const rpcUrl = process.env.RPC_URL;
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

async function swap(tokenIn, tokenOut, amountIn, provider, signer) {
    // Create contract instance for the SwapRouter contract
    const router = new ethers.Contract(swapRouter, SWAP_ROUTER_ABI, provider).connect(signer);

    // Define the path for the swap
    const path = [tokenIn, tokenOut];

    // Define the transaction parameters
    const deadline = ethers.BigNumber.from(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes from the current Unix time
    console.log('deadline:', deadline);

    if (!amountIn) {
        console.error('amountIn is undefined');
    }
    const amountInWei = ethers.utils.parseUnits(amountIn.toString(), 'ether');
    console.log(amountInWei);


    const fee = 3000;
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
    console.log('Swap 3');


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
module.exports = swap;

async function main() {

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const amountIn = ethers.utils.parseUnits('1', 'ether');

    await approveToken(tokenIn, amountIn, signer);
    swap(tokenIn, tokenOut, amountIn, provider, signer);
}
main().catch(console.error);
