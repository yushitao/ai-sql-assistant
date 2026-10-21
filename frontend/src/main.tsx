import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp } from "antd";

import './index.css'
import App from './App.tsx'
import NetworkErrorNotifier from "./components/NetworkErrorNotifier";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
	  <AntdApp>
		  <NetworkErrorNotifier />

		  <App />
	  </AntdApp>
  </StrictMode>,
)

