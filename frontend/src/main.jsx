import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import SessionGuard from './components/SessionGuard.jsx';
import './index.css';

// Apply saved theme colors + background before render (avoids a flash).
try {
    const t = JSON.parse(localStorage.getItem('themeColors') || '{}');
    if (t.primary) document.documentElement.style.setProperty('--primary-color', t.primary);
    if (t.secondary) document.documentElement.style.setProperty('--secondary-color', t.secondary);
    const bg = localStorage.getItem('appBg');
    if (bg) document.documentElement.style.setProperty('--app-bg', bg);
    const ff = localStorage.getItem('fieldFontColor');
    if (ff) document.documentElement.style.setProperty('--field-font', ff);
} catch (e) { /* ignore */ }

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <SessionGuard>
                <App />
            </SessionGuard>
        </BrowserRouter>
    </React.StrictMode>
);
