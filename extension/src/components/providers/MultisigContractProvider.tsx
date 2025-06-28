import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import MultiSigJson from "../../../contracts/MultiSig.json";
import { useWallet } from "./WalletProvider";

interface MultisigContractContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  proposeNative: (
    to: string,
    amount: ethers.BigNumberish
  ) => Promise<string | null>;
  proposeToken: (
    to: string,
    amount: ethers.BigNumberish,
    token: string
  ) => Promise<string | null>;
  sign: (txHash: string) => Promise<void>;
  execute: (txHash: string) => Promise<void>;
  depositNative: (txHash: string, value: ethers.BigNumberish) => Promise<void>;
  depositToken: (
    txHash: string,
    token: string,
    amount: ethers.BigNumberish
  ) => Promise<void>;
  getBalance: () => Promise<ethers.BigNumber | null>;
  getTxBalance: (txHash: string) => Promise<ethers.BigNumber | null>;
  getTokenBalance: (token: string) => Promise<ethers.BigNumber | null>;
  getTransactionData: (txHash: string) => Promise<any | null>;
}

const MultisigContractContext = createContext<
  MultisigContractContextType | undefined
>(undefined);

interface MultisigContractProviderProps {
  contractAddress: string;
  children: ReactNode;
}

export const MultisigContractProvider: React.FC<
  MultisigContractProviderProps
> = ({ contractAddress, children }) => {
  const { wallet } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet || !ethers.utils.isAddress(contractAddress)) {
      setContract(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const c = new ethers.Contract(contractAddress, MultiSigJson.abi, wallet);
      setContract(c);
      setError(null);
    } catch (err: any) {
      setContract(null);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, contractAddress]);

  // Contract methods
  const proposeNative = async (to: string, amount: ethers.BigNumberish) => {
    if (!contract) return null;
    try {
      // Get the txHash that will be generated
      const txHash = await contract.propose(to, amount);
      // Send the transaction
      const tx = await contract.propose(to, amount);
      await tx.wait();
      return txHash;
    } catch (err: any) {
      console.log("🚀 ~ proposeNative ~ err:", err);
      setError(err.message);
      return null;
    }
  };

  const proposeToken = async (
    to: string,
    amount: ethers.BigNumberish,
    token: string
  ) => {
    if (!contract) return null;
    try {
      const txHash = await contract.callStatic.propose(to, amount, token);
      const tx = await contract.propose(to, amount, token);
      await tx.wait();
      return txHash;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const sign = async (txHash: string) => {
    if (!contract) return;
    try {
      const tx = await contract.sign(txHash);
      await tx.wait();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const execute = async (txHash: string) => {
    if (!contract) return;
    try {
      const tx = await contract.execute(txHash);
      await tx.wait();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const depositNative = async (txHash: string, value: ethers.BigNumberish) => {
    if (!contract) return;
    try {
      const tx = await contract.deposit(txHash, { value });
      await tx.wait();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const depositToken = async (
    txHash: string,
    token: string,
    amount: ethers.BigNumberish
  ) => {
    if (!contract) return;
    try {
      const tx = await contract.deposit(txHash, token, amount);
      await tx.wait();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getBalance = async () => {
    if (!contract) return null;
    try {
      return await contract.getBalance();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const getTxBalance = async (txHash: string) => {
    if (!contract) return null;
    try {
      return await contract.getBalance(txHash);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const getTokenBalance = async (token: string) => {
    if (!contract) return null;
    try {
      return await contract.getBalance(token);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const getTransactionData = async (txHash: string) => {
    if (!contract) return null;
    try {
      return await contract.transactions(txHash);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const value = useMemo(
    () => ({
      contract,
      isLoading,
      error,
      proposeNative,
      proposeToken,
      sign,
      execute,
      depositNative,
      depositToken,
      getBalance,
      getTxBalance,
      getTokenBalance,
      getTransactionData,
    }),
    [contract, isLoading, error]
  );

  return (
    <MultisigContractContext.Provider value={value}>
      {children}
    </MultisigContractContext.Provider>
  );
};

export const useMultisigContract = () => {
  const context = useContext(MultisigContractContext);
  if (context === undefined) {
    throw new Error(
      "useMultisigContract must be used within a MultisigContractProvider"
    );
  }
  return context;
};
