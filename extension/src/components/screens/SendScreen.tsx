import React, { useState, useEffect } from "react";
import { useWallet } from "../providers/WalletProvider";

interface SendScreenProps {
  onBack: () => void;
}

const SendScreen: React.FC<SendScreenProps> = ({ onBack }) => {
  const { wallet, sendTransaction } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("20");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [totalAmount, setTotalAmount] = useState("0");

  // Calculate estimated fee and total amount
  const calculateFees = () => {
    const amountNum = parseFloat(amount) || 0;
    const gasPriceNum = parseInt(gasPrice) || 20;
    const gasLimit = 21000; // Standard for ETH transfer

    // Calculate fee in ETH
    const feeWei = gasLimit * (gasPriceNum * 1e9); // Convert gwei to wei
    const feeEth = feeWei / 1e18; // Convert wei to ETH

    setEstimatedFee(feeEth.toFixed(6));
    setTotalAmount((amountNum + feeEth).toFixed(6));
  };

  // Update calculations when amount or gas price changes
  useEffect(() => {
    calculateFees();
  }, [amount, gasPrice]);

  const handleSend = async () => {
    if (!wallet) {
      setError("No wallet loaded");
      return;
    }

    if (!recipientAddress.trim()) {
      setError("Please enter recipient address");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!gasPrice || parseInt(gasPrice) <= 0) {
      setError("Please enter a valid gas price");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Send the transaction to the network
      const { txHash, receipt } = await sendTransaction(
        recipientAddress.trim(),
        amount,
        gasPrice
      );

      // Log the transaction data
      console.log("Transaction sent successfully:", {
        txHash: txHash,
        receipt: receipt,
        from: wallet.address,
        to: recipientAddress.trim(),
        amount: amount,
        gasPrice: gasPrice,
        gasLimit: 21000,
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });

      // Show success message
      alert(
        `Transaction sent successfully!\n\nTransaction Hash: ${txHash}\n\nBlock Number: ${
          receipt.blockNumber
        }\n\nGas Used: ${receipt.gasUsed.toString()}\n\nView on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`
      );

      // Clear form
      setRecipientAddress("");
      setAmount("");
      setGasPrice("20");
    } catch (error) {
      console.error("Error sending transaction:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send transaction"
      );
    } finally {
      setIsLoading(false);
    }
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
          />
        </div>

        <div className="form-group">
          <label htmlFor="gas-price">Gas Price (Gwei):</label>
          <input
            type="number"
            id="gas-price"
            className="input"
            value={gasPrice}
            onChange={(e) => setGasPrice(e.target.value)}
            placeholder="20"
            step="1"
            min="1"
          />
        </div>

        <div className="transaction-summary">
          <div className="summary-item">
            <span>Estimated Fee:</span>
            <span>{estimatedFee} ETH</span>
          </div>
          <div className="summary-item">
            <span>Total Amount:</span>
            <span>{totalAmount} ETH</span>
          </div>
        </div>

        {error && <div className="warning">{error}</div>}

        <div className="button-group">
          <button
            className="btn btn-secondary"
            onClick={onBack}
            disabled={isLoading}
          >
            Back to Wallet
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={
              isLoading ||
              !recipientAddress.trim() ||
              !amount ||
              parseFloat(amount) <= 0
            }
          >
            {isLoading ? "Sending Transaction..." : "Send Transaction"}
          </button>
        </div>

        <div className="warning">
          <strong>ℹ️ Transaction Info:</strong> This extension connects to
          Sepolia testnet via Infura and sends real transactions. Make sure you
          have sufficient Sepolia ETH balance before sending transactions.
        </div>
      </div>
    </div>
  );
};

export default SendScreen;
