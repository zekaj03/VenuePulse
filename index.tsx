
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { hydrateLocalStateFromServer } from './utils/remoteState';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

void hydrateLocalStateFromServer().finally(() => {
  renderApp();
});
