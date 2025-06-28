import wallETIcon from "../../icons/wall-et.png";
import React from "react";
import { Screen } from "../types";

const Navbar: React.FC<{
  onLock?: () => void;
  showLock?: boolean;
  dark?: boolean;
  setCurrentScreen?: (screen: Screen) => void;
}> = ({ onLock, showLock = true, dark = false, setCurrentScreen }) => (
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
    <img
      src={wallETIcon}
      alt="Wall-ET"
      style={{ width: 50, height: 50 }}
      onClick={() => {
        if (setCurrentScreen) setCurrentScreen("setup");
      }}
    />
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
          fill="none"
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

export default Navbar;
