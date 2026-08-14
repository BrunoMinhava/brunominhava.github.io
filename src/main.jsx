import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// O browser tenta restaurar a posição de scroll antes de as secções existirem,
// o que deixaria o utilizador a meio de um ato com as animações por calcular.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
