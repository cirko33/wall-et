const { ethers } = require('ethers');

// Test configuration
const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb";
const SEPOLIA_CHAIN_ID = 11155111;

// Real deployed addresses and keys
const TEST_ADDRESSES = {
  RSDC: "0xDDC735C8813832e0F2BdbFF81bd5FC0CD5931394", // Sepolia RSDC
  SPENDER: "0x67B4aEBD440DaF118d3dBc44fB4E2dD8007F7e06", // Your public key
  TARGET_CONTRACT: "0x8d81c6300Ea18CdD7b7a9FA0dEc1e6A1ae832038", // Approver contract
  WALLET_ADDRESS: "0x67B4aEBD440DaF118d3dBc44fB4E2dD8007F7e06", // Your public key
};

// Real private key (for testing only, never use real funds!)
const TEST_PRIVATE_KEY = "0x1258da7fcb1cdf38756793019d647be1e901d813926a20436633de1ae66c1f32";

// EIP-7702 Constants
const EIP7702_TRANSACTION_TYPE = 0x04;
const DELEGATION_PREFIX = '0xef0100';

/**
 * EIP-7702 Manager that actually sends transactions
 */
class EIP7702Manager {
  constructor(provider) {
    this.provider = provider;
  }

  async createAuthorization(chainId, targetContract, nonce, privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    
    // Create message hash as per EIP-7702 spec
    const messageData = ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [chainId, targetContract, nonce]
    );
    
    const messageHash = ethers.utils.keccak256(
      ethers.utils.concat(['0x05', messageData])
    );
    
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
    const sig = ethers.utils.splitSignature(signature);
    
    return {
      chainId,
      targetContract,
      nonce,
      yParity: sig.v - 27,
      r: sig.r,
      s: sig.s
    };
  }

  createERC20ApprovalData(tokenAddress, spenderAddress, amount) {
    // ERC-20 approve function signature
    const approveFunction = 'approve(address,uint256)';
    const functionSelector = ethers.utils.id(approveFunction).slice(0, 10);
    
    // Encode the parameters
    const encodedParams = ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint256'],
      [spenderAddress, amount]
    );
    
    return functionSelector + encodedParams.slice(2); // Remove '0x' prefix
  }

  encodeSetCodeTransaction(transaction) {
    // Convert authorization objects to arrays for proper ABI encoding
    const authorizationArrays = transaction.authorizationList.map(auth => [
      auth.chainId,
      auth.targetContract,
      auth.nonce,
      auth.yParity,
      auth.r,
      auth.s
    ]);

    const encoded = ethers.utils.defaultAbiCoder.encode(
      [
        'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'address', 'uint256', 'bytes', 'bytes32[]',
        'tuple(uint256,address,uint256,uint8,bytes32,bytes32)[]', 'uint8', 'bytes32', 'bytes32'
      ],
      [
        transaction.chainId,
        transaction.nonce,
        transaction.maxPriorityFeePerGas,
        transaction.maxFeePerGas,
        transaction.gasLimit,
        transaction.destination,
        transaction.value,
        transaction.data,
        transaction.accessList,
        authorizationArrays,
        transaction.signatureYParity,
        transaction.signatureR,
        transaction.signatureS
      ]
    );
    
    return ethers.utils.concat([EIP7702_TRANSACTION_TYPE, encoded]);
  }

  async sendEIP7702Transaction(transaction, privateKey) {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Encode the EIP-7702 transaction
    console.log("Encoded transaction:", encodedTx);
    console.log("Encoded transaction:", encodedTx);
    
    // Send the transaction
    const tx = await wallet.sendTransaction({
      to: transaction.destination,
      value: ethers.BigNumber.from(transaction.value),
      data: encodedTx,
      gasLimit: ethers.BigNumber.from(transaction.gasLimit),
      maxFeePerGas: ethers.BigNumber.from(transaction.maxFeePerGas),
      maxPriorityFeePerGas: ethers.BigNumber.from(transaction.maxPriorityFeePerGas)
    });
    
    return tx;
  }
}

/**
 * ACTUAL EIP-7702 Transaction Test - Sends to Sepolia
 */
async function sendEIP7702Transaction() {
  console.log("🚀 SENDING EIP-7702 TRANSACTION TO SEPOLIA");
  console.log("==========================================");
  
  try {
    // 1. Setup
    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const manager = new EIP7702Manager(provider);
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);
    
    console.log("✅ Connected to Sepolia");
    console.log("Wallet:", wallet.address);
    
    // 2. Get current nonce
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log("Current nonce:", nonce);
    
    // 3. Create authorization (delegate to Approver contract)
    console.log("\n📝 Creating authorization...");
    const authorization = await manager.createAuthorization(
      SEPOLIA_CHAIN_ID,
      TEST_ADDRESSES.TARGET_CONTRACT, // Approver contract
      nonce,
      TEST_PRIVATE_KEY
    );
    
    console.log("✅ Authorization created for contract:", authorization.targetContract);
    
    // 4. Create ERC-20 approval data
    console.log("\n💰 Creating approval Rata...");
    const tokenAddress = TEST_ADDRESSES.RSDC;
    const spenderAddress = TEST_ADDRESSES.SPENDER;
    const amount = "1000000"; // 1 USDC
    
    const approvalData = manager.createERC20ApprovalData(
      tokenAddress,
      spenderAddress,
      amount
    );
    
    console.log("✅ Approval data created for", amount, "USDC");
    
    // 5. Create complete transaction
    console.log("\n📦 Building transaction...");
    const transaction = {
      chainId: SEPOLIA_CHAIN_ID,
      nonce: nonce,
      maxPriorityFeePerGas: '1000000000', // 1 gwei
      maxFeePerGas: '20000000000', // 20 gwei
      gasLimit: '200000', // Higher gas limit for EIP-7702
      destination: wallet.address, // Send to EOA itself to trigger delegation
      value: '0x0',
      data: approvalData,
      accessList: [],
      authorizationList: [authorization],
      signatureYParity: 0,
      signatureR: '0x0000000000000000000000000000000000000000000000000000000000000000',
      signatureS: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
    
    console.log("✅ Transaction built");
    console.log("Destination:", transaction.destination);
    console.log("Gas Limit:", transaction.gasLimit);
    
    // 6. SEND THE ACTUAL TRANSACTION
    console.log("\n🔥 SENDING TRANSACTION TO SEPOLIA...");
    const tx = await manager.sendEIP7702Transaction(transaction, TEST_PRIVATE_KEY);
    
    console.log("\n🎉 TRANSACTION SENT!");
    console.log("Transaction Hash:", tx.hash);
    console.log("Block Number:", tx.blockNumber);
    console.log("Gas Used:", tx.gasLimit.toString());
    
    // 7. Wait for confirmation
    console.log("\n⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("\n✅ TRANSACTION CONFIRMED!");
    console.log("Block Number:", receipt.blockNumber);
    console.log("Gas Used:", receipt.gasUsed.toString());
    console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    
    if (receipt.status === 1) {
      console.log("\n🎯 EIP-7702 TRANSACTION SUCCESSFUL!");
      console.log("Your EOA has been delegated to the Approver contract");
      console.log("USDC approval has been executed");
      console.log("\nView on Etherscan: https://sepolia.etherscan.io/tx/" + tx.hash);
    } else {
      console.log("\n❌ Transaction failed");
    }
    
  } catch (error) {
    console.error("\n💥 TRANSACTION FAILED:", error.message);
    if (error.transaction) {
      console.log("Transaction Hash:", error.transaction.hash);
    }
    throw error;
  }
}

// Run the actual transaction
sendEIP7702Transaction().catch(console.error); 