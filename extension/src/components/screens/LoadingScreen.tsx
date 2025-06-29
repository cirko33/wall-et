import React from "react";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Processing...",
}) => {
  return (
    <div className="container">
      <div className="screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
