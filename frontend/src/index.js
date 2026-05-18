import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Benign browser warning — CRA dev overlay treats it as a crash otherwise
const resizeObserverErr = /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/;
window.addEventListener('error', (e) => {
  if (resizeObserverErr.test(e.message)) e.stopImmediatePropagation();
});
window.addEventListener('unhandledrejection', (e) => {
  if (resizeObserverErr.test(String(e.reason?.message ?? e.reason))) e.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

