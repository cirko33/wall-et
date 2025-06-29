import React from "react";
import { MdContentCopy } from "react-icons/md";

interface MultisigTransactionSuccessScreenProps {
  transactionType: "propose" | "deposit" | "sign" | "execute";
  txHash: string;
  contractAddress: string;
  transactionId: string;
  recipientAddress?: string;
  amount?: string;
  tokenAddress?: string;
  signerAddress: string;
  chainId: number;
  timestamp: number;
  onClose: () => void;
}

const MultisigTransactionSuccessScreen: React.FC<MultisigTransactionSuccessScreenProps> = ({
  transactionType,
  txHash,
  contractAddress,
  transactionId,
  recipientAddress,
  amount,
  tokenAddress,
  signerAddress,
  chainId,
  timestamp,
  onClose,
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTransactionTypeTitle = () => {
    switch (transactionType) {
      case "propose":
        return "Transaction Proposed Successfully";
      case "deposit":
        return "Deposit Successful";
      case "sign":
        return "Transaction Signed Successfully";
      case "execute":
        return "Transaction Executed Successfully";
      default:
        return "Transaction Successful";
    }
  };

  const getTransactionTypeIcon = () => {
    switch (transactionType) {
      case "propose":
        return "📝";
      case "deposit":
        return "💰";
      case "sign":
        return "✍️";
      case "execute":
        return "✅";
      default:
        return "✅";
    }
  };

  return (
    <div className="screen">
      <div className="transaction-success-content">
        <div className="success-header">
          <h2>{getTransactionTypeIcon()} {getTransactionTypeTitle()}</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="transaction-details">
          <div className="detail-section">
            <h3>Transaction Hash</h3>
            <div className="hash-container">
              <span className="hash-text">{txHash}</span>
              <button
                className="btn-icon"
                onClick={() => copyToClipboard(txHash)}
                title="Copy transaction hash"
              >
                <MdContentCopy size={16} />
              </button>
            </div>
          </div>

          <div className="detail-section">
            <h3>Transaction Details</h3>
            <div className="detail-row">
              <span>Transaction Type:</span>
              <span style={{ textTransform: 'capitalize' }}>{transactionType}</span>
            </div>
            <div className="detail-row">
              <span>Transaction ID:</span>
              <div className="hash-container">
                <span className="hash-text">{transactionId}</span>
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(transactionId)}
                  title="Copy transaction ID"
                >
                  <MdContentCopy size={14} />
                </button>
              </div>
            </div>
            {recipientAddress && (
              <div className="detail-row">
                <span>Recipient:</span>
                <div className="address-container">
                  <span className="address-text">{recipientAddress}</span>
                  <button
                    className="btn-icon"
                    onClick={() => copyToClipboard(recipientAddress)}
                    title="Copy recipient address"
                  >
                    <MdContentCopy size={14} />
                  </button>
                </div>
              </div>
            )}
            {amount && (
              <div className="detail-row">
                <span>Amount:</span>
                <span>{amount} {tokenAddress ? "tokens" : "ETH"}</span>
              </div>
            )}
            {tokenAddress && (
              <div className="detail-row">
                <span>Token Address:</span>
                <div className="address-container">
                  <span className="address-text">{tokenAddress}</span>
                  <button
                    className="btn-icon"
                    onClick={() => copyToClipboard(tokenAddress)}
                    title="Copy token address"
                  >
                    <MdContentCopy size={14} />
                  </button>
                </div>
              </div>
            )}
            <div className="detail-row">
              <span>Signer:</span>
              <div className="address-container">
                <span className="address-text">{signerAddress}</span>
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(signerAddress)}
                  title="Copy signer address"
                >
                  <MdContentCopy size={14} />
                </button>
              </div>
            </div>
            <div className="detail-row">
              <span>Timestamp:</span>
              <span>{formatTimestamp(timestamp)}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Contract Information</h3>
            <div className="detail-row">
              <span>Contract Address:</span>
              <div className="address-container">
                <span className="address-text">{contractAddress}</span>
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(contractAddress)}
                  title="Copy contract address"
                >
                  <MdContentCopy size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Network</h3>
            <div className="detail-row">
              <span>Chain ID:</span>
              <span>{chainId} {chainId === 11155111 ? "(Sepolia)" : "(Mainnet)"}</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={onClose}>
            Back to Multisig Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultisigTransactionSuccessScreen; 