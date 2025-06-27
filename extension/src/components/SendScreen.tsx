import React, { useState } from 'react';

interface SendScreenProps {
  onBack: () => void;
}

const SendScreen: React.FC<SendScreenProps> = ({ onBack }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = () => {
    alert('Network connectivity is not available. This is a local wallet tool only.');
  };

  return (
    <div className="screen">
      <div className="send-content">
        <h2>Send ETH</h2>
        
        <div className="form-group">
          <label htmlFor="recipient-address">Recipient Address:</label>
          <input
            type="text"
            id="recipient-address"
            className="input"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (ETH):</label>
          <input
            type="number"
            id="amount"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.001"
            min="0"
            disabled
          />
        </div>

        <div className="button-group">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSend} disabled>
            Send Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendScreen; 