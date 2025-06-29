import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  TransactionData,
  useMultisigContract,
} from "../providers/MultisigContractProvider";
import { getMultisigTxs, addMultisigTx } from "../../utils/multisigStorage";
import LoadingScreen from "./LoadingScreen";

interface MultisigInteractScreenProps {
  onBack: () => void;
  contractAddress: string;
}

interface TransactionDataLocal {
  hash: string;
  to: string;
  amount: string;
  proposer: string;
  timestamp: string;
  signedCount: string;
  executed: boolean;
  balance: string;
  native: boolean;
  token: string;
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
  const [txs, setTxs] = useState<TransactionDataLocal[]>([]); // Transactions with details
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

  const [loading, setLoading] = useState(false);

  const [txHashes, setTxHashes] = useState<string[]>([]);

  const [selectedTxHash, setSelectedTxHash] = useState<string | undefined>(
    undefined
  );
  const [selectedTx, setSelectedTx] = useState<TransactionDataLocal | null>(
    null
  );

  const bigNumberishToString = (
    value: ethers.BigNumberish,
    inEther: boolean = false
  ) => {
    if (typeof value === "string") {
      return value;
    }

    return inEther ? ethers.formatEther(value) : value.toString();
  };

  // Fetch transaction details for all hashes in local storage
  const fetchTransactions = async () => {
    const hashes = getMultisigTxs(contractAddress);
    const details = await Promise.all(
      hashes.map(async (hash) => {
        const data = await getTransactionData(hash);
        if (!data) return null;

        return {
          hash,
          to: data.to,
          amount: bigNumberishToString(data.amount, true),
          proposer: data.proposer,
          timestamp: bigNumberishToString(data.timestamp),
          signedCount: bigNumberishToString(data.signedCount),
          executed: data.executed,
          balance: bigNumberishToString(data.balance, true),
          native: data.native,
          token: data.token,
        };
      })
    );

    setTxs(details.filter(Boolean) as TransactionDataLocal[]);
  };

  useEffect(() => {
    fetchTransactions();
    setTxHashes(getMultisigTxs(contractAddress));
    // eslint-disable-next-line
  }, [contractAddress]);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  useEffect(() => {
    if (txHashes.length > 0) {
      if (!selectedTxHash || !txHashes.includes(selectedTxHash)) {
        setSelectedTxHash(txHashes[0]);
      }
    } else {
      setSelectedTxHash(undefined);
    }
  }, [txHashes]);

  useEffect(() => {
    if (selectedTxHash && txs.length > 0) {
      const found = txs.find((tx) => tx.hash === selectedTxHash);
      setSelectedTx(found || null);
    } else {
      setSelectedTx(null);
    }
  }, [selectedTxHash, txs]);

  // Handlers for each action
  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!to || !value) return setError("Recipient and value required");
    setLoading(true);
    try {
      let txHash: string | null = null;
      if (proposeType === "native") {
        txHash = await proposeNative(to, ethers.parseEther(value));
      } else {
        if (!tokenAddress) return setError("Token address required");
        txHash = await proposeToken(to, ethers.parseEther(value), tokenAddress);
      }
      if (!txHash) throw new Error("Failed to propose transaction");
      addMultisigTx(contractAddress, txHash);
      alert(`Proposed transaction with hash: ${txHash}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!depositTxId || !depositValue)
      return setError("Transaction ID and value required");
    setLoading(true);
    try {
      if (depositType === "native") {
        await depositNative(depositTxId, ethers.parseEther(depositValue));
        alert("Native deposit successful");
      } else {
        if (!depositTokenAddress) return setError("Token address required");
        await depositToken(
          depositTxId,
          depositTokenAddress,
          ethers.parseEther(depositValue)
        );
        alert("Token deposit successful");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!txId) return setError("Transaction ID required");
    setLoading(true);
    try {
      await sign(txId);
      alert("Transaction signed");
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!txId) return setError("Transaction ID required");
    setLoading(true);
    try {
      await execute(txId);
      alert("Transaction executed");
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Waiting for transaction...</p>
          </div>
        </div>
      )}
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
                  list="deposit-txid-list"
                />
                <datalist id="deposit-txid-list">
                  {txHashes.map((hash) => (
                    <option value={hash} key={hash} />
                  ))}
                </datalist>
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
                  list="sign-txid-list"
                />
                <datalist id="sign-txid-list">
                  {txHashes.map((hash) => (
                    <option value={hash} key={hash} />
                  ))}
                </datalist>
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
                  list="execute-txid-list"
                />
                <datalist id="execute-txid-list">
                  {txHashes.map((hash) => (
                    <option value={hash} key={hash} />
                  ))}
                </datalist>
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
                <>
                  <div className="form-group">
                    <label htmlFor="tx-hash-dropdown">
                      Select Transaction Hash:
                    </label>
                    <select
                      id="tx-hash-dropdown"
                      className="input"
                      style={{ width: "100%", marginBottom: 16 }}
                      value={
                        txHashes.length > 0
                          ? typeof selectedTxHash !== "undefined"
                            ? selectedTxHash
                            : txHashes[0]
                          : ""
                      }
                      onChange={(e) => setSelectedTxHash(e.target.value)}
                    >
                      {txHashes.map((hash) => (
                        <option value={hash} key={hash}>
                          {hash}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedTx && (
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 14,
                        background: "#1e293b",
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ wordBreak: "break-all" }}>
                        Hash: {selectedTx.hash}
                      </div>
                      <div>To: {selectedTx.to}</div>
                      <div>Amount: {selectedTx.amount}</div>
                      <div>Proposer: {selectedTx.proposer}</div>
                      <div>Signed: {selectedTx.signedCount}</div>
                      <div>Executed: {selectedTx.executed ? "Yes" : "No"}</div>
                      <div>Balance: {selectedTx.balance}</div>
                      <div>Timestamp: {selectedTx.timestamp}</div>
                      {selectedTx.native ? (
                        <div>Native: Yes</div>
                      ) : (
                        <div>Token: {selectedTx.token}</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: "#0f1419",
          borderRadius: 8,
          border: "1px solid #334155",
        }}
      >
        <h4 style={{ color: "#fff", marginBottom: 8 }}>
          All Transaction Hashes
        </h4>
        {txHashes.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>No transaction hashes found.</div>
        ) : (
          <ul
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              color: "#94a3b8",
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {txHashes.map((hash) => (
              <li
                key={hash}
                style={{ wordBreak: "break-all", marginBottom: 4 }}
              >
                {hash}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MultisigInteractScreen;
