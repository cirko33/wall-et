import { ethers } from "ethers";
import ApproverJson from "../../contracts/Approver.json";

async function checkDelegationStatus(provider: ethers.JsonRpcProvider, address: string) {
  console.log("\n=== CHECKING DELEGATION STATUS ===");

  try {
    // Get the code at the EOA address
    const code = await provider.getCode(address);

    if (code === "0x") {
      console.log(`❌ No delegation found for ${address}`);
      return null;
    }

    // Check if it's an EIP-7702 delegation (starts with 0xef0100)
    if (code.startsWith("0xef0100")) {
      // Extract the delegated address (remove 0xef0100 prefix)
      const delegatedAddress = "0x" + code.slice(8); // Remove 0xef0100 (8 chars)

      console.log(`✅ Delegation found for ${address}`);
      console.log(`📍 Delegated to: ${delegatedAddress}`);
      console.log(`📝 Full delegation code: ${code}`);

      return delegatedAddress;
    } else {
      console.log(`❓ Address has code but not EIP-7702 delegation: ${code}`);
      return null;
    }
  } catch (error) {
    console.error("Error checking delegation status:", error);
    return null;
  }
}

export async function revokeDelegation(signer: ethers.Wallet) {
  console.log("\n=== REVOKING DELEGATION ===");

  const currentNonce = await signer.getNonce();
  console.log("Current nonce for revocation:", currentNonce);

  // Create authorization to revoke (set address to zero address)
  const revokeAuth = await signer.authorize({
    address: ethers.ZeroAddress, // Zero address to revoke
    nonce: currentNonce + 1,
  });

  console.log("Revocation authorization created");

  // Send transaction with revocation authorization
  const tx = await signer.sendTransaction({
    type: 4,
    to: signer.address,
    authorizationList: [revokeAuth],
  });

  console.log("Revocation transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Delegation revoked successfully!");

  return receipt;
}

export async function createAuthorization(signer: ethers.Wallet, targetAddress: string, nonce: number) {
  const auth = await signer.authorize({
    address: targetAddress,
    nonce: nonce,
  });

  console.log("Authorization created with nonce:", auth.nonce);
  return auth;
}

export async function createDelegation(
  signer: ethers.Wallet, 
  targetAddress: string, 
  tokenAddress: string, 
  multiSigContract: string, 
  approvalTxHash: string,
  amount: ethers.BigNumberish
) {
  console.log("\n=== CREATING DELEGATION ===");
  const currentNonce = await signer.getNonce();
  console.log("Current nonce for signer:", currentNonce);

  // Create authorization with incremented nonce for same-wallet transactions
  const auth = await createAuthorization(signer, targetAddress, currentNonce + 1);

  // Create contract instance and execute
  const delegatedContract = new ethers.Contract(
    signer.address,
    ApproverJson.abi,
    signer
  );

  const tx = await delegatedContract["approveAndDeposit(address,address,bytes32,uint256)"](
    tokenAddress,
    multiSigContract,
    approvalTxHash,
    amount,
    {
      type: 4,
      authorizationList: [auth],
    }
  );

  console.log("Transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Receipt transaction:", receipt);

  return receipt;
}

async function run() {
  try {
    // Define all constants here
    const RPC_URL = "https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb";
    const PRIVATE_KEY = "0x1258da7fcb1cdf38756793019d647be1e901d813926a20436633de1ae66c1f32";
    const APPROVER_ADDRESS = "0xD5663f2593D06eA7bADd38880E27a9b5C038aAFf";
    const RSDC_ADDRESS = "0xDDC735C8813832e0F2BdbFF81bd5FC0CD5931394";
    const MULTI_SIG_CONTRACT = "0xF33Aa7FF517012CA0A66eeE79897a653FB2E3c44";
    const APPROVAL_TX_HASH = "0xf3ae18bd9d513f69b5d29f0159c8c43dd9045927916d61328c5f4f75cfa9eedd";


    console.log("\n=== INITIALIZING SIGNERS ===");
    
    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Signer Address:", signer.address);

    // Check balances
    const balance = await provider.getBalance(signer.address);
    console.log("Signer Balance:", ethers.formatEther(balance), "ETH");
    console.log("RSDC address:", RSDC_ADDRESS);
    console.log("MultiSig contract:", MULTI_SIG_CONTRACT);

    await checkDelegationStatus(provider, signer.address);
    await createDelegation(signer, APPROVER_ADDRESS, RSDC_ADDRESS, MULTI_SIG_CONTRACT, APPROVAL_TX_HASH, 1);
    await revokeDelegation(signer);
    await checkDelegationStatus(provider, signer.address);
  } catch (error) {
    console.error("Error in EIP-7702 transactions:", error);
    throw error;
  }
}

// run()
//   .then(() => {
//     console.log("Process completed successfully.");
//   })
//   .catch((error) => {
//     console.error("Failed to send EIP-7702 transactions:", error);
//   });
