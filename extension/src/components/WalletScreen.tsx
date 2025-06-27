import React, { useState } from 'react';
import { useWallet } from './WalletProvider';

interface WalletScreenProps {
  onSendEth: () => void;
  onCreateNewWallet: () => void;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ onSendEth, onCreateNewWallet }) => {
  const { wallet, address, clearWallet } = useWallet();
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClearWallet = async () => {
    if (confirm('Are you sure you want to clear this wallet? This action cannot be undone.')) {
      await clearWallet();
    }
  };

  const handleCreateNewWallet = async () => {
    if (confirm('This will clear your current wallet and create a new one. Are you sure?')) {
      await clearWallet();
      onCreateNewWallet();
    }
  };

  const handleViewPrivateKey = () => {
    if (wallet) {
      const privateKey = wallet.privateKey;
      const message = `Your Private Key:\n\n${privateKey}\n\n⚠️ WARNING: Never share this private key with anyone!\n\nClick OK to copy it to clipboard.`;
      
      if (confirm(message)) {
        copyToClipboard(privateKey);
      }
    }
  };

  if (!wallet) {
    return <div>No wallet loaded</div>;
  }

  return (
    <div className="screen">
      <div className="wallet-content">
        <div className="wallet-header">
          <h2>Your Wallet</h2>
        </div>

        <div className="address-section">
          <label>Wallet Address:</label>
          <div className="input-group">
            <input
              type="text"
              id="wallet-address"
              className="input"
              value={address}
              readOnly
            />
            <button
              className="btn-icon"
              onClick={() => copyToClipboard(address)}
              title="Copy address"
            >
              📋
            </button>
          </div>
        </div>

        <div className="wallet-actions">
          <button className="btn btn-primary" onClick={onSendEth}>
            <span className="icon">💸</span>
            Send ETH
          </button>
          <button className="btn btn-secondary" onClick={handleViewPrivateKey}>
            <span className="icon">🔑</span>
            View Private Key
          </button>
          <button className="btn btn-secondary" onClick={handleCreateNewWallet}>
            <span className="icon">🆕</span>
            Create New Wallet
          </button>
          <button className="btn btn-secondary" onClick={handleClearWallet}>
            <span className="icon">🗑️</span>
            Clear Wallet
          </button>
        </div>

        <div className="warning">
          <strong>⚠️ Important:</strong> This is a local wallet tool. No network connectivity is available.
          You can generate and import wallets, but cannot check balances or send transactions.
        </div>
      </div>
    </div>
  );
};

export default WalletScreen; 