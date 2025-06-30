import React from "react";
import { ethers } from "ethers";

export interface TransactionDetails {
  type: "eth-transfer" | "erc20-transfer" | "multisig-propose" | "multisig-sign" | "multisig-execute" | "multisig-deposit" | "contract-deploy";
  to: string;
  from: string;
  value?: string;
  amount?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  gasPrice?: string;
  gasLimit?: number;
  estimatedFee?: string;
  contractAddress?: string;
  txHash?: string;
  functionName?: string;
  functionArgs?: any[];
  chainId?: number;
  data?: string;
}

interface TransactionConfirmationPopupProps {
  isOpen: boolean;
  transaction: TransactionDetails | null;
  onConfirm: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

const TransactionConfirmationPopup: React.FC<TransactionConfirmationPopupProps> = ({
  isOpen,
  transaction,
  onConfirm,
  onReject,
  isLoading = false,
}) => {
  if (!isOpen || !transaction) {
    return null;
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      return ethers.formatUnits(amount, decimals);
    } catch {
      return amount;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "eth-transfer":
        return "ETH Transfer";
      case "erc20-transfer":
        return "Token Transfer";
      case "multisig-propose":
        return "Multisig Proposal";
      case "multisig-sign":
        return "Multisig Sign";
      case "multisig-execute":
        return "Multisig Execute";
      case "multisig-deposit":
        return "Multisig Deposit";
      case "contract-deploy":
        return "Contract Deployment";
      default:
        return "Transaction";
    }
  };

  const getEstimatedFee = () => {
    if (transaction.estimatedFee) {
      return transaction.estimatedFee;
    }
    if (transaction.gasLimit && transaction.gasPrice) {
      const gasPriceWei = ethers.parseUnits(transaction.gasPrice, "gwei");
      const feeWei = BigInt(transaction.gasLimit) * gasPriceWei;
      return ethers.formatEther(feeWei);
    }
    return "Unknown";
  };

  return (
    <div className="transaction-confirmation-overlay">
      <div className="transaction-confirmation-popup">
        <div className="popup-header">
          <h2>Confirm Transaction</h2>
          <div className="transaction-type-badge">
            {getTransactionTypeLabel(transaction.type)}
          </div>
        </div>

        <div className="transaction-details">
          <div className="detail-row">
            <span className="detail-label">From:</span>
            <span className="detail-value">{formatAddress(transaction.from)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">To:</span>
            <span className="detail-value">{formatAddress(transaction.to)}</span>
          </div>

          {transaction.value && (
            <div className="detail-row">
              <span className="detail-label">Value:</span>
              <span className="detail-value">
                {formatAmount(transaction.value)} ETH
              </span>
            </div>
          )}

          {transaction.amount && transaction.tokenSymbol && (
            <div className="detail-row">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">
                {formatAmount(transaction.amount, 18)} {transaction.tokenSymbol}
              </span>
            </div>
          )}

          {transaction.tokenAddress && (
            <div className="detail-row">
              <span className="detail-label">Token Contract:</span>
              <span className="detail-value">{formatAddress(transaction.tokenAddress)}</span>
            </div>
          )}

          {transaction.contractAddress && (
            <div className="detail-row">
              <span className="detail-label">Contract:</span>
              <span className="detail-value">{formatAddress(transaction.contractAddress)}</span>
            </div>
          )}

          {transaction.txHash && (
            <div className="detail-row">
              <span className="detail-label">Transaction ID:</span>
              <span className="detail-value">{formatAddress(transaction.txHash)}</span>
            </div>
          )}

          {transaction.functionName && (
            <div className="detail-row">
              <span className="detail-label">Function:</span>
              <span className="detail-value">{transaction.functionName}</span>
            </div>
          )}

          {transaction.gasPrice && (
            <div className="detail-row">
              <span className="detail-label">Gas Price:</span>
              <span className="detail-value">{transaction.gasPrice} Gwei</span>
            </div>
          )}

          {transaction.gasLimit && (
            <div className="detail-row">
              <span className="detail-label">Gas Limit:</span>
              <span className="detail-value">{transaction.gasLimit.toLocaleString()}</span>
            </div>
          )}

          <div className="detail-row fee-row">
            <span className="detail-label">Estimated Fee:</span>
            <span className="detail-value fee-value">{getEstimatedFee()} ETH</span>
          </div>

          {transaction.chainId && (
            <div className="detail-row">
              <span className="detail-label">Network:</span>
              <span className="detail-value">
                {transaction.chainId === 11155111 ? "Sepolia Testnet" : `Chain ID: ${transaction.chainId}`}
              </span>
            </div>
          )}
        </div>

        <div className="warning-message">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            Please review the transaction details carefully. Once confirmed, this transaction cannot be undone.
          </div>
        </div>

        <div className="popup-actions">
          <button
            className="btn btn-secondary"
            onClick={onReject}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Signing..." : "Sign Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionConfirmationPopup; 