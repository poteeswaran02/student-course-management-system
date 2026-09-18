import React from 'react';
import ReactDOM from 'react-dom/client';
// Import Bootstrap 5 CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import custom styles
import './index.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
