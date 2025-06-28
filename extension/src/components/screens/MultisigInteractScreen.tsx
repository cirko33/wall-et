import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMultisigContract } from "../providers/MultisigContractProvider";
import { getMultisigTxs, addMultisigTx } from "../../utils/multisigStorage";

interface MultisigInteractScreenProps {
  onBack: () => void;
  contractAddress: string;
}

const MultisigInteractScreen: React.FC<MultisigInteractScreenProps> = ({
  onBack,
  contractAddress,
}) => {
  const {
    proposeNative,
    proposeToken,
    depositNative,
    depositToken,
    sign,
    execute,
    getTransactionData,
    error: contractError,
  } = useMultisigContract();
  const [activeTab, setActiveTab] = useState<
    "propose" | "deposit" | "sign" | "execute" | "transactions"
  >("propose");
  const [proposeType, setProposeType] = useState<"native" | "token">("native");
  const [depositType, setDepositType] = useState<"native" | "token">("native");
  const [txs, setTxs] = useState<any[]>([]); // Transactions with details
  const [error, setError] = useState("");

  // Propose form state
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");

  // Deposit form state
  const [depositTxId, setDepositTxId] = useState("");
  const [depositValue, setDepositValue] = useState("");
  const [depositTokenAddress, setDepositTokenAddress] = useState("");

  // Sign/Execute form state
  const [txId, setTxId] = useState("");

  // Fetch transaction details for all hashes in local storage
  const fetchTransactions = async () => {
    const hashes = getMultisigTxs(contractAddress);
    const details = await Promise.all(
      hashes.map(async (hash) => {
        const data = await getTransactionData(hash);
        return data ? { hash, ...data } : null;
      })
    );
    setTxs(details.filter(Boolean));
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [contractAddress]);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Handlers for each action
  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!to || !value) return setError("Recipient and value required");
    try {
      let txHash: string | null = null;
      if (proposeType === "native") {
        txHash = await proposeNative(to, ethers.utils.parseEther(value));
      } else {
        if (!tokenAddress) return setError("Token address required");
        txHash = await proposeToken(
          to,
          ethers.utils.parseEther(value),
          tokenAddress
        );
      }
      if (!txHash) throw new Error("Failed to propose transaction");
      addMultisigTx(contractAddress, txHash);
      alert(`Proposed transaction with hash: ${txHash}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!depositTxId || !depositValue)
      return setError("Transaction ID and value required");
    try {
      if (depositType === "native") {
        await depositNative(depositTxId, ethers.utils.parseEther(depositValue));
        alert("Native deposit successful");
      } else {
        if (!depositTokenAddress) return setError("Token address required");
        await depositToken(
          depositTxId,
          depositTokenAddress,
          ethers.utils.parseEther(depositValue)
        );
        alert("Token deposit successful");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!txId) return setError("Transaction ID required");
    try {
      await sign(txId);
      alert("Transaction signed");
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!txId) return setError("Transaction ID required");
    try {
      await execute(txId);
      alert("Transaction executed");
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="screen">
        <div className="multisig-content">
          <h2>Interact with MultiSig Contract</h2>
          <div className="form-group">
            <label>
              Contract Address:{" "}
              {contractAddress || (
                <span style={{ color: "red" }}>No contract address</span>
              )}
            </label>
          </div>
          <div className="button-group" style={{ margin: "16px 0" }}>
            <button
              className={`btn${activeTab === "propose" ? " btn-primary" : ""}`}
              onClick={() => setActiveTab("propose")}
            >
              Propose
            </button>
            <button
              className={`btn${activeTab === "deposit" ? " btn-primary" : ""}`}
              onClick={() => setActiveTab("deposit")}
            >
              Deposit
            </button>
            <button
              className={`btn${activeTab === "sign" ? " btn-primary" : ""}`}
              onClick={() => setActiveTab("sign")}
            >
              Sign
            </button>
            <button
              className={`btn${activeTab === "execute" ? " btn-primary" : ""}`}
              onClick={() => setActiveTab("execute")}
            >
              Execute
            </button>
            <button
              className={`btn${
                activeTab === "transactions" ? " btn-primary" : ""
              }`}
              onClick={() => setActiveTab("transactions")}
            >
              Transactions
            </button>
            <button
              className="btn btn-secondary"
              style={{ float: "right" }}
              onClick={onBack}
            >
              Back
            </button>
          </div>
          {(error || contractError) && (
            <div className="warning">{error || contractError}</div>
          )}
          {activeTab === "propose" && (
            <form onSubmit={handlePropose} style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <label>
                  <input
                    type="radio"
                    checked={proposeType === "native"}
                    onChange={() => setProposeType("native")}
                  />
                  &nbsp;Native
                </label>
                &nbsp;&nbsp;
                <label>
                  <input
                    type="radio"
                    checked={proposeType === "token"}
                    onChange={() => setProposeType("token")}
                  />
                  &nbsp;Token
                </label>
              </div>
              <div className="form-group">
                <label>To (recipient):</label>
                <input
                  type="text"
                  className="input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              <div className="form-group">
                <label>
                  Value ({proposeType === "native" ? "ETH" : "Token Amount"}):
                </label>
                <input
                  type="number"
                  className="input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              {proposeType === "token" && (
                <div className="form-group">
                  <label>Token Address:</label>
                  <input
                    type="text"
                    className="input"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
              )}
              <button className="btn btn-primary" type="submit">
                Propose
              </button>
            </form>
          )}
          {activeTab === "deposit" && (
            <form onSubmit={handleDeposit} style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <label>
                  <input
                    type="radio"
                    checked={depositType === "native"}
                    onChange={() => setDepositType("native")}
                  />
                  &nbsp;Native
                </label>
                &nbsp;&nbsp;
                <label>
                  <input
                    type="radio"
                    checked={depositType === "token"}
                    onChange={() => setDepositType("token")}
                  />
                  &nbsp;Token
                </label>
              </div>
              <div className="form-group">
                <label>Transaction ID:</label>
                <input
                  type="text"
                  className="input"
                  value={depositTxId}
                  onChange={(e) => setDepositTxId(e.target.value)}
                  placeholder="Transaction ID"
                />
              </div>
              <div className="form-group">
                <label>
                  Value ({depositType === "native" ? "ETH" : "Token Amount"}):
                </label>
                <input
                  type="number"
                  className="input"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              {depositType === "token" && (
                <div className="form-group">
                  <label>Token Address:</label>
                  <input
                    type="text"
                    className="input"
                    value={depositTokenAddress}
                    onChange={(e) => setDepositTokenAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
              )}
              <button className="btn btn-primary" type="submit">
                Deposit
              </button>
            </form>
          )}
          {activeTab === "sign" && (
            <form onSubmit={handleSign} style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Transaction ID:</label>
                <input
                  type="text"
                  className="input"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="Transaction ID"
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Sign
              </button>
            </form>
          )}
          {activeTab === "execute" && (
            <form onSubmit={handleExecute} style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Transaction ID:</label>
                <input
                  type="text"
                  className="input"
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="Transaction ID"
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Execute
              </button>
            </form>
          )}
          {activeTab === "transactions" && (
            <div style={{ marginTop: 16 }}>
              <h3>Transactions</h3>
              {txs.length === 0 ? (
                <div>No transactions found.</div>
              ) : (
                <ul>
                  {txs.map((tx, idx) => (
                    <li
                      key={tx.hash}
                      style={{ fontFamily: "monospace", fontSize: 14 }}
                    >
                      <div>Hash: {tx.hash}</div>
                      <div>To: {tx.to}</div>
                      <div>Amount: {tx.amount?.toString?.()}</div>
                      <div>Proposer: {tx.proposer}</div>
                      <div>Signed: {tx.signedCount}</div>
                      <div>Executed: {tx.executed ? "Yes" : "No"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultisigInteractScreen;
