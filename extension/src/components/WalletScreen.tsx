import React, { useState } from 'react';
import { useWallet } from './WalletProvider';

interface WalletScreenProps {
  onSendEth: () => void;
  onCreateNewWallet: () => void;
  onViewPrivateKey: () => void;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ onSendEth, onCreateNewWallet, onViewPrivateKey }) => {
  const { wallet, address, clearWallet } = useWallet();

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
              Copy
            </button>
          </div>
        </div>

        <div className="wallet-actions">
          <button className="btn btn-primary" onClick={onSendEth}>
            Send ETH
          </button>
          <button className="btn btn-secondary" onClick={onViewPrivateKey}>
            View Private Key
          </button>
          <button className="btn btn-secondary" onClick={handleClearWallet}>
            Clear Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletScreen; 