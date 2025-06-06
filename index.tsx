
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './shell/App'; // Updated import path
import { LanguageProvider } from './packages/core-contexts/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);