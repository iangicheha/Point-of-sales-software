import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Global error handling
window.addEventListener('error', (event) => {
  console.log('Global error caught:', event.error);
  // Prevent the error from crashing the app
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.log('Unhandled promise rejection:', event.reason);
  // Prevent the rejection from crashing the app
  event.preventDefault();
});

const root = ReactDOM.createRoot(
  document.getElementById('root')!
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 