import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Processing...' }) => {
  return (
    <div className="container">
      <div className="header">
        <h1>Sepolia ETH Wallet</h1>
        <div className="network-badge">Sepolia Testnet</div>
      </div>

      <div className="screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 