import React from "react";
import { MdContentCopy } from "react-icons/md";

interface RecoveryContractActionSuccessScreenProps {
  actionType: "deploy" | "addRecoveryAddress" | "removeRecoveryAddress" | "setQuorum" | "recover" | "tokenApproval";
  txHash: string;
  contractAddress: string;
  actionDetails: {
    address?: string;
    quorum?: number;
    recoverTo?: string;
    tokens?: string[];
  };
  signerAddress: string;
  chainId: number;
  timestamp: number;
  onClose: () => void;
}

const RecoveryContractActionSuccessScreen: React.FC<RecoveryContractActionSuccessScreenProps> = ({
  actionType,
  txHash,
  contractAddress,
  actionDetails,
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

  const getActionTypeTitle = () => {
    switch (actionType) {
      case "deploy":
        return "Recovery Contract Deployed Successfully";
      case "addRecoveryAddress":
        return "Recovery Address Added Successfully";
      case "removeRecoveryAddress":
        return "Recovery Address Removed Successfully";
      case "setQuorum":
        return "Quorum Updated Successfully";
      case "recover":
        return "Recovery Vote Submitted Successfully";
      case "tokenApproval":
        return "Token Approvals Processed Successfully";
      default:
        return "Action Completed Successfully";
    }
  };

  const getActionTypeIcon = () => {
    switch (actionType) {
      case "deploy":
        return "🏗️";
      case "addRecoveryAddress":
        return "➕";
      case "removeRecoveryAddress":
        return "➖";
      case "setQuorum":
        return "⚙️";
      case "recover":
        return "🔄";
      case "tokenApproval":
        return "🔐";
      default:
        return "✅";
    }
  };

  return (
    <div className="screen">
      <div className="transaction-success-content">
        <div className="success-header">
          <h2>{getActionTypeIcon()} {getActionTypeTitle()}</h2>
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
            <h3>Action Details</h3>
            <div className="detail-row">
              <span>Action Type:</span>
              <span style={{ textTransform: 'capitalize' }}>
                {actionType.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
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
            {actionDetails.address && (
              <div className="detail-row">
                <span>Target Address:</span>
                <div className="address-container">
                  <span className="address-text">{actionDetails.address}</span>
                  <button
                    className="btn-icon"
                    onClick={() => copyToClipboard(actionDetails.address!)}
                    title="Copy address"
                  >
                    <MdContentCopy size={14} />
                  </button>
                </div>
              </div>
            )}
            {actionDetails.quorum && (
              <div className="detail-row">
                <span>New Quorum:</span>
                <span>{actionDetails.quorum}</span>
              </div>
            )}
            {actionDetails.recoverTo && (
              <div className="detail-row">
                <span>Recover To:</span>
                <div className="address-container">
                  <span className="address-text">{actionDetails.recoverTo}</span>
                  <button
                    className="btn-icon"
                    onClick={() => copyToClipboard(actionDetails.recoverTo!)}
                    title="Copy address"
                  >
                    <MdContentCopy size={14} />
                  </button>
                </div>
              </div>
            )}
            {actionDetails.tokens && actionDetails.tokens.length > 0 && (
              <div className="detail-row">
                <span>Tokens Processed:</span>
                <span>{actionDetails.tokens.length}</span>
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

export default RecoveryContractActionSuccessScreen; 