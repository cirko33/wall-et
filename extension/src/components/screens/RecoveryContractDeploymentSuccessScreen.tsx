import React from "react";
import { MdContentCopy } from "react-icons/md";

interface RecoveryContractDeploymentSuccessScreenProps {
  contractAddress: string;
  recoveryAddresses: string[];
  quorum: number;
  deployerAddress: string;
  chainId: number;
  timestamp: number;
  onClose: () => void;
}

const RecoveryContractDeploymentSuccessScreen: React.FC<RecoveryContractDeploymentSuccessScreenProps> = ({
  contractAddress,
  recoveryAddresses,
  quorum,
  deployerAddress,
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

  return (
    <div className="screen">
      <div className="transaction-success-content">
        <div className="success-header">
          <h2>✅ Recovery Contract Deployed Successfully</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="transaction-details">
          <div className="detail-section">
            <h3>Contract Address</h3>
            <div className="hash-container">
              <span className="hash-text">{contractAddress}</span>
              <button
                className="btn-icon"
                onClick={() => copyToClipboard(contractAddress)}
                title="Copy contract address"
              >
                <MdContentCopy size={16} />
              </button>
            </div>
          </div>

          <div className="detail-section">
            <h3>Contract Configuration</h3>
            <div className="detail-row">
              <span>Quorum Required:</span>
              <span>{quorum}</span>
            </div>
            <div className="detail-row">
              <span>Recovery Addresses:</span>
              <span>{recoveryAddresses.length}</span>
            </div>
            <div className="detail-row">
              <span>Deployer:</span>
              <div className="address-container">
                <span className="address-text">{deployerAddress}</span>
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(deployerAddress)}
                  title="Copy deployer address"
                >
                  <MdContentCopy size={14} />
                </button>
              </div>
            </div>
            <div className="detail-row">
              <span>Deployment Time:</span>
              <span>{formatTimestamp(timestamp)}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Recovery Addresses</h3>
            {recoveryAddresses.map((address, index) => (
              <div key={address} className="detail-row">
                <span>Address {index + 1}:</span>
                <div className="address-container">
                  <span className="address-text">{address}</span>
                  <button
                    className="btn-icon"
                    onClick={() => copyToClipboard(address)}
                    title="Copy address"
                  >
                    <MdContentCopy size={14} />
                  </button>
                </div>
              </div>
            ))}
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
            Back to Recovery Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryContractDeploymentSuccessScreen; 