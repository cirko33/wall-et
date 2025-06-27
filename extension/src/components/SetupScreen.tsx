import React from 'react';

interface SetupScreenProps {
  onGenerateWallet: () => void;
  onImportWallet: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onGenerateWallet, onImportWallet }) => {
  return (
    <div className="container">
      <div className="header">
        <h1>Sepolia ETH Wallet</h1>
        <div className="network-badge">Sepolia Testnet</div>
      </div>

      <div className="screen">
        <div className="setup-content">
          <h2>Welcome to Sepolia ETH Wallet</h2>
          <p>Choose how you'd like to set up your wallet:</p>
          
          <div className="setup-options">
            <button onClick={onGenerateWallet} className="btn btn-primary">
              <span className="icon">🔑</span>
              Generate New Wallet
            </button>
            
            <button onClick={onImportWallet} className="btn btn-secondary">
              <span className="icon">📥</span>
              Import Existing Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen; 