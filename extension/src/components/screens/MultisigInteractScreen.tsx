import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  TransactionData,
  useMultisigContract,
} from "../providers/MultisigContractProvider";
import { getMultisigTxs, addMultisigTx } from "../../utils/multisigStorage";
import LoadingScreen from "./LoadingScreen";
import { getTokenAddressBook } from "../../utils/tokenAddressBookStorage";
import { getAddressBook } from "../../utils/addressBookStorage";
import { useWallet } from "../providers/WalletProvider";

interface MultisigInteractScreenProps {
  onBack: () => void;
  contractAddress: string;
  onMultisigTransactionSuccess: (transactionData: {
    transactionType: "propose" | "deposit" | "sign" | "execute";
    txHash: string;
    contractAddress: string;
    transactionId: string;
    recipientAddress?: string;
    amount?: string;
    tokenAddress?: string;
    signerAddress: string;
    chainId: number;
    timestamp: number;
  }) => void;
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
  onMultisigTransactionSuccess,
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
  const { wallet } = useWallet();
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
  const [loadingType, setLoadingType] = useState<"propose" | "deposit" | "sign" | "execute" | null>(null);

  const [txHashes, setTxHashes] = useState<string[]>([]);

  const [selectedTxHash, setSelectedTxHash] = useState<string | undefined>(
    undefined
  );
  const [selectedTx, setSelectedTx] = useState<TransactionDataLocal | null>(
    null
  );

  const [tokenAddressOptions, setTokenAddressOptions] = useState<
    {
      address: string;
      name: string;
      symbol: string;
    }[]
  >([]);

  const [recipientOptions, setRecipientOptions] = useState<
    {
      address: string;
      name: string;
    }[]
  >([]);

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

  useEffect(() => {
    // Load token address book for datalist
    const tokenBook = getTokenAddressBook();
    setTokenAddressOptions(
      Object.entries(tokenBook).map(([address, info]) => ({
        address,
        name: info.name,
        symbol: info.symbol,
      }))
    );
  }, [contractAddress]);

  useEffect(() => {
    // Load recipient address book for datalist
    const addressBook = getAddressBook();
    setRecipientOptions(
      Object.entries(addressBook).map(([address, name]) => ({
        address,
        name: String(name),
      }))
    );
  }, [contractAddress]);

  // Handlers for each action
  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!to || !value) return setError("Recipient and value required");
    setLoading(true);
    setLoadingType("propose");
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
      setTxHashes(getMultisigTxs(contractAddress));
      onMultisigTransactionSuccess({
        transactionType: "propose",
        txHash,
        contractAddress,
        transactionId: txHash,
        recipientAddress: to,
        amount: value,
        tokenAddress: proposeType === "token" ? tokenAddress : undefined,
        signerAddress: wallet?.address || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!depositTxId || !depositValue)
      return setError("Transaction ID and value required");
    setLoading(true);
    setLoadingType("deposit");
    try {
      // Save depositTxId if not already saved and valid
      const existingTxs = getMultisigTxs(contractAddress);
      if (!existingTxs.includes(depositTxId)) {
        const txData = await getTransactionData(depositTxId);
        if (txData) {
          addMultisigTx(contractAddress, depositTxId);
        } else {
          throw new Error("Invalid transaction ID");
        }
      }
      if (depositType === "native") {
        await depositNative(depositTxId, ethers.parseEther(depositValue));
        onMultisigTransactionSuccess({
          transactionType: "deposit",
          txHash: depositTxId,
          contractAddress,
          transactionId: depositTxId,
          recipientAddress: undefined,
          amount: depositValue,
          tokenAddress: undefined,
          signerAddress: wallet?.address || "",
          chainId: 11155111, // Sepolia
          timestamp: Date.now(),
        });
      } else {
        if (!depositTokenAddress) return setError("Token address required");
        await depositToken(
          depositTxId,
          depositTokenAddress,
          ethers.parseEther(depositValue)
        );
        onMultisigTransactionSuccess({
          transactionType: "deposit",
          txHash: depositTxId,
          contractAddress,
          transactionId: depositTxId,
          recipientAddress: undefined,
          amount: depositValue,
          tokenAddress: depositTokenAddress,
          signerAddress: wallet?.address || "",
          chainId: 11155111, // Sepolia
          timestamp: Date.now(),
        });
      }
      setTxHashes(getMultisigTxs(contractAddress));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!txId) return setError("Transaction ID required");
    setLoading(true);
    setLoadingType("sign");
    try {
      // Save txId if not already saved and valid
      const existingTxs = getMultisigTxs(contractAddress);
      if (!existingTxs.includes(txId)) {
        const txData = await getTransactionData(txId);
        if (txData) {
          addMultisigTx(contractAddress, txId);
        } else {
          throw new Error("Invalid transaction ID");
        }
      }
      await sign(txId);
      onMultisigTransactionSuccess({
        transactionType: "sign",
        txHash: txId,
        contractAddress,
        transactionId: txId,
        recipientAddress: undefined,
        amount: undefined,
        tokenAddress: undefined,
        signerAddress: wallet?.address || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setTxHashes(getMultisigTxs(contractAddress));
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!txId) return setError("Transaction ID required");
    setLoading(true);
    setLoadingType("execute");
    try {
      // Save txId if not already saved and valid
      const existingTxs = getMultisigTxs(contractAddress);
      if (!existingTxs.includes(txId)) {
        const txData = await getTransactionData(txId);
        if (txData) {
          addMultisigTx(contractAddress, txId);
        } else {
          throw new Error("Invalid transaction ID");
        }
      }
      await execute(txId);
      onMultisigTransactionSuccess({
        transactionType: "execute",
        txHash: txId,
        contractAddress,
        transactionId: txId,
        recipientAddress: undefined,
        amount: undefined,
        tokenAddress: undefined,
        signerAddress: wallet?.address || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setTxHashes(getMultisigTxs(contractAddress));
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="container position-relative">
      {loading && (
        <div className="fixed-fullscreen-overlay">
          <div className="loading-content" style={{
            background: '#1a1f2e',
            padding: '32px',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
            textAlign: 'center',
            minWidth: '280px',
            maxWidth: '320px'
          }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '3px solid #334155',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <h3 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '16px' }}>
              {loadingType === "propose" && "📝 Proposing Transaction..."}
              {loadingType === "deposit" && "💰 Processing Deposit..."}
              {loadingType === "sign" && "✍️ Signing Transaction..."}
              {loadingType === "execute" && "✅ Executing Transaction..."}
              {!loadingType && "⏳ Processing Transaction..."}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
              Please wait while your transaction is being processed on the blockchain.
            </p>
            <div style={{ 
              background: '#0f1419', 
              padding: '10px', 
              borderRadius: '6px', 
              border: '1px solid #334155',
              fontSize: '11px',
              color: '#64748b'
            }}>
              This may take a few moments depending on network conditions.
            </div>
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
          <div className="button-group margin-16-0">
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
            <button className="btn btn-secondary float-right" onClick={onBack}>
              Back
            </button>
          </div>
          {(error || contractError) && (
            <div className="warning">{error || contractError}</div>
          )}
          {activeTab === "propose" && (
            <form onSubmit={handlePropose} className="margin-top-16">
              <div className="margin-bottom-12">
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
                  list="recipient-address-list"
                />
                <datalist id="recipient-address-list">
                  {recipientOptions.map((opt) => (
                    <option value={opt.address} key={opt.address}>
                      {opt.name} {opt.address ? `(${opt.address})` : ""}
                    </option>
                  ))}
                </datalist>
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
                    list="token-address-list"
                  />
                  <datalist id="token-address-list">
                    {tokenAddressOptions.map((opt) => (
                      <option value={opt.address} key={opt.address}>
                        {opt.address} {opt.symbol ? `(${opt.symbol})` : ""}
                      </option>
                    ))}
                  </datalist>
                </div>
              )}
              <button className="btn btn-primary" type="submit">
                Propose
              </button>
            </form>
          )}
          {activeTab === "deposit" && (
            <form onSubmit={handleDeposit} className="margin-top-16">
              <div className="margin-bottom-12">
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
                    list="token-address-list"
                  />
                  <datalist id="token-address-list">
                    {tokenAddressOptions.map((opt) => (
                      <option value={opt.address} key={opt.address}>
                        {opt.name} {opt.symbol ? `(${opt.symbol})` : ""}
                      </option>
                    ))}
                  </datalist>
                </div>
              )}
              <button className="btn btn-primary" type="submit">
                Deposit
              </button>
            </form>
          )}
          {activeTab === "sign" && (
            <form onSubmit={handleSign} className="margin-top-16">
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
            <form onSubmit={handleExecute} className="margin-top-16">
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
            <div className="margin-top-16">
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
                    <div className="word-break-all margin-bottom-4">
                      <div>Hash: {selectedTx.hash}</div>
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
    </div>
  );
};

export default MultisigInteractScreen;
