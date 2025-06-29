import wallETIcon from "../../../icons/wall-et-blue-nobg.png";
import React, { useState } from "react";
import { Screen } from "../../types";
import { MdMenu, MdLock, MdVisibility, MdLogout } from "react-icons/md";

const Navbar: React.FC<{
  onLock?: () => void;
  onViewPrivateKey?: () => void;
  onSignOut?: () => void;
  onRecoveryContract?: () => void;
  showMenu?: boolean;
  dark?: boolean;
  setCurrentScreen?: (screen: Screen) => void;
}> = ({
  onLock,
  onViewPrivateKey,
  onSignOut,
  onRecoveryContract,
  showMenu = true,
  dark = false,
  setCurrentScreen,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (action: (() => void) | undefined) => {
    if (action) {
      action();
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className={`navbar${dark ? " navbar-dark" : ""}`}>
        <img
          src={"../../../icons/wall-et-blue-nobg.png"}
          alt="Wall-ET"
          className="navbar-logo"
          onClick={() => {
            if (setCurrentScreen) setCurrentScreen("setup");
          }}
        />
        {showMenu && (
          <button onClick={toggleMenu} className="navbar-menu-btn" title="Menu">
            <MdMenu size={24} color={dark ? "#fff" : "#1d427d"} />
          </button>
        )}
      </div>

      {/* Burger Menu Overlay */}
      {isMenuOpen && (
        <div
          className="burger-menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="burger-menu" onClick={(e) => e.stopPropagation()}>
            <div className="burger-menu-items">
              <button
                className="burger-menu-item"
                onClick={() => handleMenuAction(onLock)}
              >
                <MdLock size={20} />
                <span>Lock Wallet</span>
              </button>
              <button
                className="burger-menu-item"
                onClick={() => handleMenuAction(onViewPrivateKey)}
              >
                <MdVisibility size={20} />
                <span>View Private Key</span>
              </button>
              <button
                className="burger-menu-item"
                onClick={() => handleMenuAction(onRecoveryContract)}
              >
                <MdLogout size={20} />
                <span>Recovery Contract</span>
              </button>
              <button
                className="burger-menu-item burger-menu-item-danger"
                onClick={() => handleMenuAction(onSignOut)}
              >
                <MdLogout size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
