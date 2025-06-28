import { ethers } from 'ethers';

// EIP-7702 Constants
export const EIP7702_TRANSACTION_TYPE = 0x04;
export const DELEGATION_PREFIX = '0xef0100';

// Basic types we'll need
export interface Authorization {
  chainId: number;
  targetContract: string;
  nonce: number;
  yParity: number;
  r: string;
  s: string;
}

export interface SetCodeTransaction {
  chainId: number;
  nonce: number;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  gasLimit: string;
  destination: string;
  value: string;
  data: string;
  accessList: string[];
  authorizationList: Authorization[];
  signatureYParity: number;
  signatureR: string;
  signatureS: string;
}

/**
 * EIP-7702 Manager for Wallet Extension
 * Handles code delegation and smart contract interactions
 */
export class EIP7702Manager {
  private provider: ethers.providers.JsonRpcProvider;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
  }

  /**
   * Create authorization for code delegation
   */
  async createAuthorization(
    chainId: number,
    targetContract: string,
    nonce: number,
    privateKey: string
  ): Promise<Authorization> {
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

  /**
   * Create ERC-20 approval data
   */
  createERC20ApprovalData(
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): string {
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

  /**
   * Create function call data for arbitrary smart contract functions
   */
  createFunctionCallData(
    functionSignature: string,
    parameters: any[]
  ): string {
    const functionSelector = ethers.utils.id(functionSignature).slice(0, 10);
    
    // Encode the parameters
    const encodedParams = ethers.utils.defaultAbiCoder.encode(
      this.getParameterTypes(functionSignature),
      parameters
    );
    
    return functionSelector + encodedParams.slice(2); // Remove '0x' prefix
  }

  /**
   * Create deposit function data
   */
  createDepositFunctionData(amount: string, tokenAddress?: string): string {
    if (tokenAddress) {
      return this.createFunctionCallData('deposit(uint256,address)', [amount, tokenAddress]);
    } else {
      return this.createFunctionCallData('deposit(uint256)', [amount]);
    }
  }

  /**
   * Create ERC-20 transfer data
   */
  createERC20TransferData(
    tokenAddress: string,
    toAddress: string,
    amount: string
  ): string {
    return this.createFunctionCallData('transfer(address,uint256)', [toAddress, amount]);
  }

  /**
   * Extract parameter types from function signature
   */
  private getParameterTypes(functionSignature: string): string[] {
    const match = functionSignature.match(/\(([^)]*)\)/);
    if (!match) return [];
    
    const params = match[1].split(',').map(p => p.trim());
    return params.filter(p => p.length > 0);
  }

  /**
   * Create a set code transaction with ERC-20 approval
   */
  async createApprovalTransaction(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    authorizations: Authorization[],
    options: {
      gasLimit?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
    } = {}
  ): Promise<SetCodeTransaction> {
    const chainId = await this.provider.getNetwork().then(net => net.chainId);
    
    // Create ERC-20 approval data
    const approvalData = this.createERC20ApprovalData(tokenAddress, spenderAddress, amount);
    
    return {
      chainId,
      nonce: 0, // This should be fetched from the account
      maxPriorityFeePerGas: options.maxPriorityFeePerGas || '1000000000', // 1 gwei
      maxFeePerGas: options.maxFeePerGas || '20000000000', // 20 gwei
      gasLimit: options.gasLimit || '100000',
      destination: tokenAddress, // Target the token contract
      value: '0x0',
      data: approvalData, // ERC-20 approval data
      accessList: [],
      authorizationList: authorizations,
      signatureYParity: 0,
      signatureR: '0x0000000000000000000000000000000000000000000000000000000000000000',
      signatureS: '0x0000000000000000000000000000000000000000000000000000000000000000'
    };
  }

  /**
   * RLP encode the set code transaction
   */
  private encodeSetCodeTransaction(transaction: SetCodeTransaction): string {
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
    
    return ethers.utils.hexlify(ethers.utils.concat([ethers.utils.hexlify(EIP7702_TRANSACTION_TYPE), encoded]));
  }

  /**
   * Send EIP-7702 transaction with ERC-20 approval
   */
  async sendApprovalTransaction(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    privateKey: string,
    targetContract: string
  ): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const chainId = await this.provider.getNetwork().then(net => net.chainId);
    const nonce = await this.provider.getTransactionCount(wallet.address);
    
    // Create authorization for the target contract
    const authorization = await this.createAuthorization(
      chainId,
      targetContract,
      nonce,
      privateKey
    );
    
    // Create the approval transaction
    const transaction = await this.createApprovalTransaction(
      tokenAddress,
      spenderAddress,
      amount,
      [authorization]
    );
    
    // Encode the EIP-7702 transaction
    const encodedTx = this.encodeSetCodeTransaction(transaction);
    
    // Send the transaction
    const tx = await wallet.sendTransaction({
      to: transaction.destination,
      value: ethers.BigNumber.from(transaction.value),
      data: encodedTx,
      gasLimit: ethers.BigNumber.from(transaction.gasLimit),
      maxFeePerGas: ethers.BigNumber.from(transaction.maxFeePerGas),
      maxPriorityFeePerGas: ethers.BigNumber.from(transaction.maxPriorityFeePerGas)
    });
    
    return tx.hash;
  }
}
