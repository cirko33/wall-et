import React, { useState, useEffect } from "react";
import { useWallet } from "./providers/WalletProvider";
import SetupScreen from "./screens/SetupScreen";
import ImportScreen from "./screens/ImportScreen";
import GeneratedWalletScreen from "./screens/GeneratedWalletScreen";
import WalletScreen from "./screens/WalletScreen";
import SendScreen from "./screens/SendScreen";
import LoadingScreen from "./screens/LoadingScreen";
import PasswordSetupScreen from "./screens/PasswordSetupScreen";
import PasswordUnlockScreen from "./screens/PasswordUnlockScreen";
import ViewPrivateKeyScreen from "./screens/ViewPrivateKeyScreen";
import SignOutScreen from "./screens/SignOutScreen";
import Navbar from "./navbar/Navbar";
import MultisigScreen from "./screens/MultisigScreen";
import { Screen } from "../types";
import MultisigInteractScreen from "./screens/MultisigInteractScreen";
import { MultisigContractProvider } from "./providers/MultisigContractProvider";
import SendErc20Screen from "./screens/SendErc20Screen";
import TokenScreen from "./screens/TokenScreen";
import { TokenProvider } from "./providers/TokenProvider";
import AddressBookScreen from "./screens/AddressBookScreen";

const App = () => {
  const {
    wallet,
    isLoading,
    isPasswordSet,
    generateWallet,
    importWallet,
    unlockWallet,
    lockWallet,
  } = useWallet();
  const [currentScreen, setCurrentScreen] = useState<Screen>("setup");
  const [generatedWalletData, setGeneratedWalletData] = useState<{
    privateKey: string;
    address: string;
  } | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string>("");
  const [currentContractAddress, setCurrentContractAddress] =
    useState<string>("");

  // Set initial screen based on wallet state
  useEffect(() => {
    if (!isLoading) {
      if (wallet) {
        setCurrentScreen("wallet");
      } else if (isPasswordSet) {
        setCurrentScreen("unlock");
      } else {
        setCurrentScreen("setup");
      }
    }
  }, [isLoading, wallet, isPasswordSet]);

  const handleGenerateWallet = async (password: string) => {
    try {
      // Generate a new wallet directly
      const { ethers } = await import("ethers");
      const newWallet = ethers.Wallet.createRandom();

      // Store the wallet data for display
      setGeneratedWalletData({
        privateKey: newWallet.privateKey,
        address: newWallet.address,
      });

      // Call the provider's generateWallet to store it encrypted
      await generateWallet(password);

      setCurrentScreen("generated");
    } catch (error) {
      console.error("Error generating wallet:", error);
      alert("Error generating wallet: " + (error as Error).message);
    }
  };

  const handleImportWallet = async (privateKey: string, password: string) => {
    try {
      await importWallet(privateKey, password);
      setCurrentScreen("wallet");
    } catch (error) {
      console.error("Error importing wallet:", error);
      alert("Error importing wallet: " + (error as Error).message);
    }
  };

  const handlePasswordSet = async (password: string) => {
    try {
      await handleGenerateWallet(password);
    } catch (error) {
      console.error("Error setting password:", error);
      setCurrentScreen("setup");
    }
  };

  const handleUnlock = async (password: string) => {
    const success = await unlockWallet(password);
    if (success) {
      setCurrentScreen("wallet");
    } else {
      alert("Invalid password. Please try again.");
    }
  };

  const handleLock = () => {
    lockWallet();
    setCurrentScreen("unlock");
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If wallet is loaded, show wallet screens
  if (wallet) {
    let component: JSX.Element;
    switch (currentScreen) {
      case "wallet":
        component = (
          <WalletScreen
            onSendEth={() => setCurrentScreen("send")}
            onSendErc20={() => setCurrentScreen("send-erc20")}
            onUploadMultisig={() => setCurrentScreen("multisig")}
            onViewTokens={() => setCurrentScreen("tokens")}
            onViewAddressBook={() => setCurrentScreen("address-book")}
          />
        );
        break;
      case "send":
        component = <SendScreen onBack={() => setCurrentScreen("wallet")} />;
        break;
      case "send-erc20":
        component = (
          <SendErc20Screen onBack={() => setCurrentScreen("wallet")} />
        );
        break;
      case "view-private-key":
        component = (
          <ViewPrivateKeyScreen onBack={() => setCurrentScreen("wallet")} />
        );
        break;
      case "sign-out":
        component = (
          <SignOutScreen onBack={() => setCurrentScreen("wallet")} />
        );
        break;
      case "multisig":
        component = (
          <MultisigScreen
            onBack={() => setCurrentScreen("wallet")}
            onOpenMultisigInteract={(addr: string) => {
              setCurrentContractAddress(addr);
              setCurrentScreen("multisig-interact");
            }}
          />
        );
        break;
      case "multisig-interact":
        component = (
          <MultisigContractProvider contractAddress={currentContractAddress}>
            <MultisigInteractScreen
              onBack={() => setCurrentScreen("wallet")}
              contractAddress={currentContractAddress}
            />
          </MultisigContractProvider>
        );
        break;
      case "tokens":
        component = <TokenScreen onBack={() => setCurrentScreen("wallet")} />;
        break;
      case "address-book":
        component = (
          <AddressBookScreen onBack={() => setCurrentScreen("wallet")} />
        );
        break;
      default:
        component = (
          <WalletScreen
            onSendEth={() => setCurrentScreen("send")}
            onSendErc20={() => setCurrentScreen("send-erc20")}
            onUploadMultisig={() => setCurrentScreen("multisig")}
            onViewTokens={() => setCurrentScreen("tokens")}
            onViewAddressBook={() => setCurrentScreen("address-book")}
          />
        );
        break;
    }

    return (
      <>
        <Navbar
          onLock={handleLock}
          onViewPrivateKey={() => setCurrentScreen("view-private-key")}
          onSignOut={() => setCurrentScreen("sign-out")}
          dark
          showMenu
          setCurrentScreen={setCurrentScreen}
        />
        {component}
      </>
    );
  }

  // If password is set but no wallet is loaded, show unlock screen
  if (isPasswordSet && !wallet) {
    return (
      <>
        <Navbar dark showMenu={false} setCurrentScreen={setCurrentScreen} />
        <PasswordUnlockScreen onUnlock={handleUnlock} />
      </>
    );
  }

  // If no password is set, show setup screen
  if (!isPasswordSet) {
    switch (currentScreen) {
      case "setup":
        return (
          <SetupScreen
            onGenerateWallet={() => setCurrentScreen("password-setup")}
            onImportWallet={() => setCurrentScreen("import")}
          />
        );
      case "password-setup":
        return (
          <PasswordSetupScreen
            onPasswordSet={handlePasswordSet}
            onBack={() => setCurrentScreen("setup")}
          />
        );
      case "import":
        return (
          <ImportScreen
            onBack={() => setCurrentScreen("setup")}
            onImport={(privateKey, password) =>
              handleImportWallet(privateKey, password)
            }
          />
        );
      case "generated":
        return (
          <GeneratedWalletScreen
            walletData={generatedWalletData}
            onContinue={() => setCurrentScreen("wallet")}
          />
        );
      default:
        return (
          <SetupScreen
            onGenerateWallet={() => setCurrentScreen("password-setup")}
            onImportWallet={() => setCurrentScreen("import")}
          />
        );
    }
  }

  // Default fallback
  return (
    <SetupScreen
      onGenerateWallet={() => setCurrentScreen("password-setup")}
      onImportWallet={() => setCurrentScreen("import")}
    />
  );
};

export default App;
