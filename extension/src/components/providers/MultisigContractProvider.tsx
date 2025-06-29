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
import { createDelegation, revokeDelegation } from "../../utils/multisig";

interface MultisigContractContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  proposeNative: (to: string, amount: ethers.BigNumberish) => Promise<any>;
  proposeToken: (
    to: string,
    amount: ethers.BigNumberish,
    token: string
  ) => Promise<any>;
  sign: (txHash: string) => Promise<boolean | undefined>;
  execute: (txHash: string) => Promise<boolean | undefined>;
  depositNative: (
    txHash: string,
    value: ethers.BigNumberish
  ) => Promise<boolean | undefined>;
  depositToken: (
    txHash: string,
    token: string,
    amount: ethers.BigNumberish
  ) => Promise<boolean | undefined>;
  getBalance: () => Promise<ethers.BigNumberish | null>;
  getTxBalance: (txHash: string) => Promise<ethers.BigNumberish | null>;
  getTokenBalance: (token: string) => Promise<ethers.BigNumberish | null>;
  getTransactionData: (txHash: string) => Promise<TransactionData | null>;
}

const MultisigContractContext = createContext<
  MultisigContractContextType | undefined
>(undefined);

interface MultisigContractProviderProps {
  contractAddress: string;
  children: ReactNode;
}

export interface TransactionData {
  to: string;
  native: boolean;
  token: string;
  amount: ethers.BigNumberish;
  proposer: string;
  timestamp: ethers.BigNumberish;
  signedCount: ethers.BigNumberish;
  executed: boolean;
  balance: ethers.BigNumberish;
}

export const MultisigContractProvider: React.FC<
  MultisigContractProviderProps
> = ({ contractAddress, children }) => {
  const { wallet } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet || !ethers.isAddress(contractAddress)) {
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
      // Send the transaction
      const tx = await contract["propose(address,uint256)"](to, amount);
      const receipt = await tx.wait();
      if (receipt.status !== 1) {
        throw new Error("Transaction failed with status: " + receipt.status);
      }

      console.log(receipt);
      return receipt.logs[0].data;
    } catch (err: any) {
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
      const tx = await contract["propose(address,uint256,address)"](
        to,
        amount,
        token
      );
      const receipt = await tx.wait();
      console.log("🚀 ~ receipt:", receipt);
      if (receipt.status !== 1) {
        throw new Error("Transaction failed with status: " + receipt.status);
      }
      console.log(receipt);
      return receipt.logs[0].data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const sign = async (txHash: string) => {
    if (!contract) return;
    try {
      const tx = await contract["sign(bytes32)"](txHash);
      const receipt = await tx.wait();
      return receipt.status === 1;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const execute = async (txHash: string) => {
    if (!contract) return;
    try {
      const tx = await contract["execute(bytes32)"](txHash);
      const receipt = await tx.wait();
      return receipt.status === 1;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const depositNative = async (txHash: string, value: ethers.BigNumberish) => {
    if (!contract) return;
    try {
      const tx = await contract["deposit(bytes32)"](txHash, {
        value: value,
      });
      const receipt = await tx.wait();
      return receipt.status === 1;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const depositToken = async (
    txHash: string,
    token: string,
    amount: ethers.BigNumberish
  ) => {
    if (!contract || !wallet) return;
    try {
      const multisigContractAddress = await contract.getAddress();
      const approverContractAddress = "0x2732d3c8f33bbb34411de6420fd085339f781cd4";
      
      console.log("amount", amount);
      
      const receipt = await createDelegation(
        wallet,
        approverContractAddress,
        token,
        multisigContractAddress,
        txHash,
        amount // Use original amount directly
      );

      console.log("🚀 ~ receipt:", receipt);


      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getBalance = async () => {
    if (!contract) return null;
    try {
      return await contract["getBalance(address)"](wallet?.address);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const getTxBalance = async (txHash: string) => {
    if (!contract) return null;
    try {
      return await contract["getBalance(bytes32)"](txHash);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const getTokenBalance = async (token: string) => {
    if (!contract) return null;
    try {
      return await contract["getBalance(address)"](token);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const getTransactionData = async (txHash: string) => {
    if (!contract) return null;
    try {
      const data = await contract["transactions(bytes32)"](txHash);
      return data as TransactionData;
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
