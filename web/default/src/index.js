import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { UserProvider } from './context/User';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { StatusProvider } from './context/Status';
import { SubscriptionProvider } from './context/Subscription';
import { UsageProvider } from './context/Usage';
import { BillingProvider } from './context/Billing';
import './i18n';
import { TooltipProvider } from './components/ui/tooltip';

/* Suppress harmless ResizeObserver loop errors */
window.addEventListener('error', (e) => {
  if (e.message?.includes?.('ResizeObserver')) e.stopImmediatePropagation();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StatusProvider>
      <UserProvider>
        <SubscriptionProvider>
          <UsageProvider>
            <BillingProvider>
              <HashRouter>
                <TooltipProvider>
                  <App />
                </TooltipProvider>
                <ToastContainer style={{ zIndex: 99999 }} />
              </HashRouter>
            </BillingProvider>
          </UsageProvider>
        </SubscriptionProvider>
      </UserProvider>
    </StatusProvider>
  </React.StrictMode>
);
