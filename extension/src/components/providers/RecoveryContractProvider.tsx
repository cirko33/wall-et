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
import { config } from "../../config";
import ApproverJson from "../../../contracts/Approver.json";

interface RecoveryContractContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  deploy: (addresses: string[], quorum: number) => Promise<string | null>;
  addRecoveryAddress: (address: string) => Promise<any>;
  removeRecoveryAddress: (address: string) => Promise<any>;
  addToken: (token: string) => Promise<any>;
  addTokens: (tokens: string[]) => Promise<any>;
  setQuorum: (quorum: ethers.BigNumberish) => Promise<any>;
  recover: (recoverTo: string) => Promise<any>;
  recoveryAddresses: (address: string) => Promise<any>;
  addressToRecoverVotes: (
    recoveryAddress: string,
    recoverTo: string
  ) => Promise<any>;
  addressToRecoverVotesCount: (recoveryAddress: string) => Promise<any>;
  recovered: () => Promise<any>;
  recoveryAddressCount: () => Promise<any>;
  quorum: () => Promise<any>;
  owner: () => Promise<any>;
  tokenMap: (token: string) => Promise<any>;
  tokens: (index: ethers.BigNumberish) => Promise<any>;
  handleAllTokensApproval: (tokens: string[]) => Promise<any>;
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
      return await contract.getAddress();
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
      return await tx.wait();
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const removeRecoveryAddress = async (address: string) => {
    if (!contract) return false;
    try {
      const tx = await contract["removeRecoveryAddress(address)"](address);
      return await tx.wait();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addToken = async (token: string) => {
    if (!contract) return false;
    try {
      const tx = await contract["addToken(address)"](token);
      return await tx.wait();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addTokens = async (tokens: string[]) => {
    if (!contract) return false;
    try {
      const tx = await contract["addTokens(address[])"](tokens);
      return await tx.wait();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const setQuorum = async (quorum: ethers.BigNumberish) => {
    if (!contract) return false;
    try {
      const tx = await contract["setQuorum(uint256)"](quorum);
      return await tx.wait();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const recover = async (recoverTo: string) => {
    if (!contract) return false;
    try {
      const tx = await contract["recover(address)"](recoverTo);
      return await tx.wait();
    } catch (err: any) {
      setError(err.message);
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

  const handleAllTokensApproval = async (tokens: string[]) => {
    if (!contract || !wallet) return false;
    try {
      const auth = await wallet.authorize({
        address: config.APPROVER_CONTRACT,
        nonce: (await wallet.getNonce()) + 1,
      });
      console.log("🚀 ~ handleAllTokensApproval ~ auth:", auth);

      const delegatedContract = new ethers.Contract(
        wallet.address,
        ApproverJson.abi,
        wallet
      );
      console.log(
        "🚀 ~ handleAllTokensApproval ~ delegatedContract:",
        delegatedContract
      );

      const tx = await delegatedContract["approveRecovery(address[],address)"](
        tokens,
        contract.getAddress(),
        {
          type: 4,
          authorizationList: [auth],
        }
      );
      console.log("🚀 ~ handleAllTokensApproval ~ tx:", tx);

      return await tx.wait();
    } catch (err: any) {
      setError(err.message);
      return err.message;
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
      handleAllTokensApproval,
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
