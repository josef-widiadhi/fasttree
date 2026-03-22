import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, sans-serif',
            background: '#faf3e0',
            color: '#1a1008',
            border: '1px solid #e8c99a',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(139,94,42,0.15)',
          },
          success: { iconTheme: { primary: '#267a26', secondary: '#faf3e0' } },
          error:   { iconTheme: { primary: '#b04020', secondary: '#faf3e0' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
