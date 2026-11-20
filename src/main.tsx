import {InexBoot} from './components/InexBoot';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/ios-wallet.css';

if (new URLSearchParams(window.location.search).get('admin') === 'true' || window.location.hostname === 'admin.goalliancehub.com') {
  window.location.replace('/admin.html');
} else createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InexBoot><App /></InexBoot>
  </StrictMode>,
);

import "./styles/clean-panels.css";

import "./styles/workspaces.css";
import './styles/partner-minimal.css';

import './styles/dashboard-motion.css';
