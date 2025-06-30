// Background service worker for the WALL-ET extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("WALL-ET extension installed");

    // Set default settings
    chrome.storage.local.set({
      settings: {
        network: "sepolia",
        gasPrice: 20,
        autoRefresh: true,
      },
    });
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "getWalletInfo":
      handleGetWalletInfo(sendResponse);
      return true; // Keep message channel open for async response

    case "sendTransaction":
      handleSendTransaction(request.data, sendResponse);
      return true;

    case "getBalance":
      handleGetBalance(request.address, sendResponse);
      return true;

    case "clearWallet":
      handleClearWallet(sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: "Unknown action" });
  }
});

// Handle getting wallet information
async function handleGetWalletInfo(sendResponse: (response: any) => void) {
  try {
    const result = await chrome.storage.local.get(["wallet"]);
    if (result.wallet) {
      sendResponse({
        success: true,
        wallet: result.wallet,
      });
    } else {
      sendResponse({
        success: false,
        error: "No wallet found",
      });
    }
  } catch (error) {
    sendResponse({
      success: false,
      error: (error as Error).message,
    });
  }
}

// Handle sending transaction (background processing)
async function handleSendTransaction(
  transactionData: any,
  sendResponse: (response: any) => void
) {
  try {
    // This would typically involve more complex transaction handling
    // For now, we'll just acknowledge the request
    sendResponse({
      success: true,
      message: "Transaction request received",
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: (error as Error).message,
    });
  }
}

// Handle getting balance for an address
async function handleGetBalance(
  address: string,
  sendResponse: (response: any) => void
) {
  try {
    // In a real implementation, you'd make an API call to get the balance
    // For now, we'll return a placeholder
    sendResponse({
      success: true,
      balance: "0.0",
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: (error as Error).message,
    });
  }
}

// Handle clearing wallet data
async function handleClearWallet(sendResponse: (response: any) => void) {
  try {
    await chrome.storage.local.remove(["wallet"]);
    sendResponse({
      success: true,
      message: "Wallet cleared successfully",
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: (error as Error).message,
    });
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open the popup when the extension icon is clicked
  chrome.action.setPopup({ popup: "popup.html" });
});

// Handle tab updates to potentially inject content scripts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // You could inject content scripts here if needed
    // For now, we'll just log the tab update
    console.log("Tab updated:", tab.url);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("WALL-ET extension started");
});

// Handle extension shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log("WALL-ET extension suspended");
});
