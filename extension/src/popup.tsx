import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletProvider } from './components/WalletProvider';
import App from './components/App';
import './styles/App.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
); 