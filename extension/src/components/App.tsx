import React, { useState, useEffect } from "react";
import { useWallet } from "./WalletProvider";
import SetupScreen from "./SetupScreen";
import ImportScreen from "./ImportScreen";
import GeneratedWalletScreen from "./GeneratedWalletScreen";
import WalletScreen from "./WalletScreen";
import SendScreen from "./SendScreen";
import LoadingScreen from "./LoadingScreen";
import PasswordSetupScreen from "./PasswordSetupScreen";
import PasswordUnlockScreen from "./PasswordUnlockScreen";
import ViewPrivateKeyScreen from "./ViewPrivateKeyScreen";
import wallETIcon from "../../icons/wall-et.png";

const Navbar: React.FC<{
  onLock?: () => void;
  showLock?: boolean;
  dark?: boolean;
}> = ({ onLock, showLock = true, dark = false }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 60,
      padding: "0 16px",
      background: dark ? "#2a2f40" : "#fff",
      borderBottom: dark ? "1px solid #181a20" : "1px solid #eee",
    }}
  >
    <img src={wallETIcon} alt="Wall-Et" style={{ width: 50, height: 50 }} />
    {showLock && (
      <button
        onClick={onLock}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Lock Wallet"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="nonde"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="5"
            y="10"
            width="12"
            height="7"
            rx="2"
            stroke="white"
            strokeWidth="2"
          />
          <path
            d="M7 10V7a4 4 0 1 1 8 0v3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    )}
  </div>
);

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
  const [currentScreen, setCurrentScreen] = useState<
    | "setup"
    | "password-setup"
    | "import"
    | "generated"
    | "wallet"
    | "send"
    | "unlock"
    | "view-private-key"
  >("setup");
  const [generatedWalletData, setGeneratedWalletData] = useState<{
    privateKey: string;
    address: string;
  } | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string>("");

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
    switch (currentScreen) {
      case "wallet":
        return (
          <>
            <Navbar onLock={handleLock} dark showLock />
            <WalletScreen
              onSendEth={() => setCurrentScreen("send")}
              onCreateNewWallet={() => setCurrentScreen("password-setup")}
              onViewPrivateKey={() => setCurrentScreen("view-private-key")}
            />
          </>
        );
      case "send":
        return (
          <>
            <Navbar onLock={handleLock} dark showLock />
            <SendScreen onBack={() => setCurrentScreen("wallet")} />
          </>
        );
      case "view-private-key":
        return (
          <>
            <Navbar onLock={handleLock} dark showLock />
            <ViewPrivateKeyScreen onBack={() => setCurrentScreen("wallet")} />
          </>
        );
      default:
        return (
          <>
            <Navbar onLock={handleLock} dark showLock />
            <WalletScreen
              onSendEth={() => setCurrentScreen("send")}
              onCreateNewWallet={() => setCurrentScreen("password-setup")}
              onViewPrivateKey={() => setCurrentScreen("view-private-key")}
            />
          </>
        );
    }
  }

  // If password is set but no wallet is loaded, show unlock screen
  if (isPasswordSet && !wallet) {
    return (
      <>
        <Navbar dark showLock={false} />
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
