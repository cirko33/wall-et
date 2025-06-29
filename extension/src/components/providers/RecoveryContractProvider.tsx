import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import SocialRecoveryJson from "../../../contracts/SocialRecovery.json";
import { useWallet } from "./WalletProvider";

interface RecoveryContractContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  deploy: (addresses: string[], quorum: number) => Promise<string | null>;
  addRecoveryAddress: (address: string) => Promise<boolean>;
  removeRecoveryAddress: (address: string) => Promise<boolean>;
  addToken: (token: string) => Promise<boolean>;
  addTokens: (tokens: string[]) => Promise<boolean>;
  setQuorum: (quorum: ethers.BigNumberish) => Promise<boolean>;
  recover: (recoverTo: string) => Promise<boolean>;
  recoveryAddresses: (address: string) => Promise<boolean | null>;
  addressToRecoverVotes: (
    recoveryAddress: string,
    recoverTo: string
  ) => Promise<boolean | null>;
  addressToRecoverVotesCount: (
    recoveryAddress: string
  ) => Promise<ethers.BigNumberish | null>;
  recovered: () => Promise<boolean | null>;
  recoveryAddressCount: () => Promise<ethers.BigNumberish | null>;
  quorum: () => Promise<ethers.BigNumberish | null>;
  owner: () => Promise<string | null>;
  tokenMap: (token: string) => Promise<boolean | null>;
  tokens: (index: ethers.BigNumberish) => Promise<string | null>;
}

const RecoveryContractContext = createContext<
  RecoveryContractContextType | undefined
>(undefined);

interface RecoveryContractProviderProps {
  contractAddress: string;
  children: ReactNode;
}

export const RecoveryContractProvider: React.FC<
  RecoveryContractProviderProps
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
      const c = new ethers.Contract(
        contractAddress,
        SocialRecoveryJson.abi,
        wallet
      );
      setContract(c);
      setError(null);
    } catch (err: any) {
      setContract(null);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, contractAddress]);

  const deploy = async (
    addresses: string[],
    quorum: number
  ): Promise<string | null> => {
    if (!wallet) return null;
    try {
      // Use the user's wallet as signer
      const signer = wallet.connect(wallet.provider);
      const abi = SocialRecoveryJson.abi;
      // @ts-ignore
      const bytecode =
        SocialRecoveryJson.bytecode?.object || SocialRecoveryJson.bytecode;
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      if (!addresses.every((addr) => ethers.isAddress(addr))) {
        throw new Error("All signers must be valid Ethereum addresses");
      }

      if (quorum > addresses.length) {
        throw new Error(
          "Quorum cannot be greater than the number of addresses"
        );
      }

      const contract = await factory.deploy(addresses, quorum);
      return contract.getAddress();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Write methods
  const addRecoveryAddress = async (address: string) => {
    if (!contract) return false;
    try {
      const tx = await contract["addRecoveryAddress(address)"](address);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const removeRecoveryAddress = async (address: string) => {
    if (!contract) return false;
    try {
      const tx = await contract["removeRecoveryAddress(address)"](address);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const addToken = async (token: string) => {
    if (!contract) return false;
    try {
      const tx = await contract["addToken(address)"](token);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const addTokens = async (tokens: string[]) => {
    if (!contract) return false;
    try {
      const tx = await contract["addTokens(address[])"](tokens);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const setQuorum = async (quorum: ethers.BigNumberish) => {
    if (!contract) return false;
    try {
      const tx = await contract["setQuorum(uint256)"](quorum);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const recover = async (recoverTo: string) => {
    if (!contract) return false;
    try {
      const tx = await contract["recover(address)"](recoverTo);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Read methods
  const recoveryAddresses = async (address: string) => {
    if (!contract) return null;
    try {
      return await contract["recoveryAddresses(address)"](address);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const addressToRecoverVotes = async (
    recoveryAddress: string,
    recoverTo: string
  ) => {
    if (!contract) return null;
    try {
      return await contract["addressToRecoverVotes(address,address)"](
        recoveryAddress,
        recoverTo
      );
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const addressToRecoverVotesCount = async (recoveryAddress: string) => {
    if (!contract) return null;
    try {
      return await contract["addressToRecoverVotesCount(address)"](
        recoveryAddress
      );
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const recovered = async () => {
    if (!contract) return null;
    try {
      return await contract["recovered"]();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const recoveryAddressCount = async () => {
    if (!contract) return null;
    try {
      return await contract["recoveryAddressCount"]();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const quorum = async () => {
    if (!contract) return null;
    try {
      return await contract["quorum"]();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const owner = async () => {
    if (!contract) return null;
    try {
      return await contract["owner"]();
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const tokenMap = async (token: string) => {
    if (!contract) return null;
    try {
      return await contract["tokenMap(address)"](token);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const tokens = async (index: ethers.BigNumberish) => {
    if (!contract) return null;
    try {
      return await contract["tokens(uint256)"](index);
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
      deploy,
      addRecoveryAddress,
      removeRecoveryAddress,
      addToken,
      addTokens,
      setQuorum,
      recover,
      recoveryAddresses,
      addressToRecoverVotes,
      addressToRecoverVotesCount,
      recovered,
      recoveryAddressCount,
      quorum,
      owner,
      tokenMap,
      tokens,
    }),
    [contract, isLoading, error]
  );

  return (
    <RecoveryContractContext.Provider value={value}>
      {children}
    </RecoveryContractContext.Provider>
  );
};

export const useRecoveryContract = () => {
  const context = useContext(RecoveryContractContext);
  if (context === undefined) {
    throw new Error(
      "useRecoveryContract must be used within a RecoveryContractProvider"
    );
  }
  return context;
};
