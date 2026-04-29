import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import posthog from 'posthog-js'

posthog.init('phc_ВАШ_КЛЮЧ', {
  api_host: 'https://eu.i.posthog.com',
  autocapture: true,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
