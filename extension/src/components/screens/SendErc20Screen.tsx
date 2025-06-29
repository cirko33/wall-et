import React, { useState, useEffect } from "react";
import { useWallet } from "../providers/WalletProvider";

interface SendErc20ScreenProps {
  onBack: () => void;
}

const SendErc20Screen: React.FC<SendErc20ScreenProps> = ({ onBack }) => {
  const { wallet, sendErc20Transaction } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("20");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [totalAmount, setTotalAmount] = useState("0");

  // Calculate estimated fee and total amount
  const calculateFees = () => {
    const gasPriceNum = parseInt(gasPrice) || 20;
    const gasLimit = 60000; // Typical for ERC20 transfer
    const feeWei = gasLimit * (gasPriceNum * 1e9); // Convert gwei to wei
    const feeEth = feeWei / 1e18; // Convert wei to ETH
    setEstimatedFee(feeEth.toFixed(6));
    setTotalAmount(feeEth.toFixed(6)); // Only fee in ETH, token is separate
  };

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
    if (!tokenAddress.trim()) {
      setError("Please enter token contract address");
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
      const { txHash, receipt } = await sendErc20Transaction(
        tokenAddress.trim(),
        recipientAddress.trim(),
        amount,
        gasPrice
      );

      console.log("ERC20 Transaction sent successfully:", {
        txHash,
        receipt,
        from: wallet.address,
        to: recipientAddress.trim(),
        token: tokenAddress.trim(),
        amount,
        gasPrice,
        gasLimit: 60000,
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      alert(
        `ERC20 Transaction sent successfully!\n\nTransaction Hash: ${txHash}\n\nBlock Number: ${
          receipt.blockNumber
        }\n\nGas Used: ${receipt.gasUsed.toString()}\n\nView on Etherscan: https://sepolia.etherscan.io/tx/${txHash}`
      );
      setRecipientAddress("");
      setTokenAddress("");
      setAmount("");
      setGasPrice("20");
    } catch (error) {
      console.error("Error sending ERC20 transaction:", error);
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
        <h2>Send ERC20 Token</h2>
        <div className="form-group">
          <label htmlFor="token-address">Token Contract Address:</label>
          <input
            type="text"
            id="token-address"
            className="input"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
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
          <label htmlFor="amount">Amount (Token Units):</label>
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
            <span>Total ETH Needed:</span>
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
              !tokenAddress.trim() ||
              !amount ||
              parseFloat(amount) <= 0
            }
          >
            {isLoading ? "Sending Transaction..." : "Send Token"}
          </button>
        </div>
        <div className="warning">
          <strong>ℹ️ Transaction Info:</strong> This extension connects to
          Sepolia testnet via Infura and sends real transactions. Make sure you
          have sufficient Sepolia ETH for gas and token balance before sending
          transactions.
        </div>
      </div>
    </div>
  );
};

export default SendErc20Screen;
