import wallETIcon from "../../../icons/wall-et-blue-nobg.png";
import React from "react";
import { Screen } from "../../types";
import { MdLock } from "react-icons/md";

const Navbar: React.FC<{
  onLock?: () => void;
  showLock?: boolean;
  dark?: boolean;
  setCurrentScreen?: (screen: Screen) => void;
}> = ({ onLock, showLock = true, dark = false, setCurrentScreen }) => (
  <div className={`navbar${dark ? " navbar-dark" : ""}`}>
    <img
      src={"../../../icons/wall-et-blue-nobg.png"}
      alt="Wall-ET"
      className="navbar-logo"
      onClick={() => {
        if (setCurrentScreen) setCurrentScreen("setup");
      }}
    />
    {showLock && (
      <button onClick={onLock} className="navbar-lock-btn" title="Lock Wallet">
        <MdLock size={22} color={dark ? "#fff" : "#1d427d"} />
      </button>
    )}
  </div>
);

export default Navbar;
