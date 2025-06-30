import React from "react";
import { MdContentCopy, MdOpenInNew } from "react-icons/md";

interface TransactionSuccessScreenProps {
  txHash: string;
  receipt: any;
  from: string;
  to: string;
  amount: string;
  gasPrice: string;
  gasLimit: number;
  chainId: number;
  timestamp: number;
  onClose: () => void;
}

const TransactionSuccessScreen: React.FC<TransactionSuccessScreenProps> = ({
  txHash,
  receipt,
  from,
  to,
  amount,
  gasPrice,
  gasLimit,
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

  const getEtherscanUrl = () => {
    if (chainId === 11155111) {
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    }
    return `https://etherscan.io/tx/${txHash}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="screen">
      <div className="transaction-success-content">
        <div className="success-header">
          <h2>✅ Transaction Successful</h2>
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
            <h3>Block Information</h3>
            <div className="detail-row">
              <span>Block Number:</span>
              <span>{receipt.blockNumber}</span>
            </div>
            <div className="detail-row">
              <span>Gas Used:</span>
              <span>{receipt.gasUsed.toString()}</span>
            </div>
            <div className="detail-row">
              <span>Gas Price:</span>
              <span>{gasPrice} gwei</span>
            </div>
            <div className="detail-row">
              <span>Gas Limit:</span>
              <span>{gasLimit.toLocaleString()}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Transaction Details</h3>
            <div className="detail-row">
              <span>From:</span>
              <div className="address-container">
                <span className="address-text">{from}</span>
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(from)}
                  title="Copy address"
                >
                  <MdContentCopy size={14} />
                </button>
              </div>
            </div>
            <div className="detail-row">
              <span>To:</span>
              <div className="address-container">
                <span className="address-text">{to}</span>
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(to)}
                  title="Copy address"
                >
                  <MdContentCopy size={14} />
                </button>
              </div>
            </div>
            <div className="detail-row">
              <span>Amount:</span>
              <span>{amount} ETH</span>
            </div>
            <div className="detail-row">
              <span>Timestamp:</span>
              <span>{formatTimestamp(timestamp)}</span>
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
          <a
            href={getEtherscanUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <MdOpenInNew size={16} />
            View on Etherscan
          </a>
          <button className="btn btn-secondary" onClick={onClose}>
            Back to Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionSuccessScreen; 