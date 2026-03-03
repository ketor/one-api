import React, { lazy, Suspense, useContext, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loading from './components/Loading';
import { PrivateRoute, AdminRoute } from './components/PrivateRoute';
import { API, getLogo, getSystemName, showError, showNotice } from './helpers';
import { UserContext } from './context/User';
import { StatusContext } from './context/Status';

// Layout components
import MarketingLayout from './components/layout/MarketingLayout';
import ConsoleLayout from './components/layout/ConsoleLayout';
import DocsLayout from './components/layout/DocsLayout';
import AuthLayout from './components/layout/AuthLayout';

// Lazy-loaded pages - Marketing
const LandingPage = lazy(() => import('./pages/marketing/LandingPage'));
const PricingPage = lazy(() => import('./pages/marketing/PricingPage'));
const TermsPage = lazy(() => import('./pages/marketing/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/marketing/PrivacyPage'));
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

// Lazy-loaded pages - Docs
const DocsHome = lazy(() => import('./pages/docs/DocsHome'));
const DocsApi = lazy(() => import('./pages/docs/DocsApi'));
const DocsSdk = lazy(() => import('./pages/docs/DocsSdk'));
const DocsTools = lazy(() => import('./pages/docs/DocsTools'));
const DocsErrors = lazy(() => import('./pages/docs/DocsErrors'));
const DocsFaq = lazy(() => import('./pages/docs/DocsFaq'));

// Lazy-loaded pages - Auth
const LoginForm = lazy(() => import('./components/LoginForm'));
const RegisterForm = lazy(() => import('./components/RegisterForm'));
const PasswordResetForm = lazy(() => import('./components/PasswordResetForm'));
const PasswordResetConfirm = lazy(() => import('./components/PasswordResetConfirm'));
const GitHubOAuth = lazy(() => import('./components/GitHubOAuth'));
const LarkOAuth = lazy(() => import('./components/LarkOAuth'));

// Lazy-loaded pages - Console
const DashboardPage = lazy(() => import('./pages/console/DashboardPage'));
const KeysPage = lazy(() => import('./pages/console/KeysPage'));
const SubscriptionPage = lazy(() => import('./pages/console/SubscriptionPage'));
const UsagePage = lazy(() => import('./pages/console/UsagePage'));
const BillingPage = lazy(() => import('./pages/console/BillingPage'));
const BoosterPage = lazy(() => import('./pages/console/BoosterPage'));
const SettingsPage = lazy(() => import('./pages/console/SettingsPage'));
const Token = lazy(() => import('./pages/Token'));
const EditToken = lazy(() => import('./pages/Token/EditToken'));
const TopUp = lazy(() => import('./pages/TopUp'));
const Log = lazy(() => import('./pages/Log'));
const Chat = lazy(() => import('./pages/Chat'));
const Setting = lazy(() => import('./pages/Setting'));
const EditUser = lazy(() => import('./pages/User/EditUser'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Lazy-loaded pages - Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminKeysAudit = lazy(() => import('./pages/admin/AdminKeysAudit'));
const AdminUsageMonitor = lazy(() => import('./pages/admin/AdminUsageMonitor'));
const Channel = lazy(() => import('./pages/Channel'));
const EditChannel = lazy(() => import('./pages/Channel/EditChannel'));
const Redemption = lazy(() => import('./pages/Redemption'));
const EditRedemption = lazy(() => import('./pages/Redemption/EditRedemption'));
const User = lazy(() => import('./pages/User'));
const AddUser = lazy(() => import('./pages/User/AddUser'));

function App() {
  const [, userDispatch] = useContext(UserContext);
  const [, statusDispatch] = useContext(StatusContext);

  useEffect(() => {
    // Load user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const data = JSON.parse(userStr);
        userDispatch({ type: 'login', payload: data });
      } catch (e) {
        localStorage.removeItem('user');
      }
    }

    // Load system status
    const loadStatus = async () => {
      try {
        const res = await API.get('/api/status');
        const { success, message, data } = res.data || {};
        if (success && data) {
          localStorage.setItem('status', JSON.stringify(data));
          statusDispatch({ type: 'set', payload: data });
          localStorage.setItem('system_name', data.system_name);
          localStorage.setItem('logo', data.logo);
          localStorage.setItem('footer_html', data.footer_html);
          localStorage.setItem('quota_per_unit', data.quota_per_unit);
          localStorage.setItem('display_in_currency', data.display_in_currency);
          if (data.chat_link) {
            localStorage.setItem('chat_link', data.chat_link);
          } else {
            localStorage.removeItem('chat_link');
          }
          if (
            data.version !== process.env.REACT_APP_VERSION &&
            data.version !== 'v0.0.0' &&
            process.env.REACT_APP_VERSION !== ''
          ) {
            showNotice(
              `新版本可用：${data.version}，请使用快捷键 Shift + F5 刷新页面`
            );
          }
        } else {
          showError(message || '无法正常连接至服务器！');
        }
      } catch (error) {
        showError(error.message || '无法正常连接至服务器！');
      }
    };
    loadStatus();

    // Set page title and favicon
    const systemName = getSystemName();
    document.title = systemName || 'Alaya Code - Alaya NeW';
    const logo = getLogo();
    if (logo) {
      const linkElement = document.querySelector("link[rel~='icon']");
      if (linkElement) {
        linkElement.href = logo;
      }
    }
  }, [userDispatch, statusDispatch]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Marketing pages */}
        <Route element={<MarketingLayout />}>
          <Route path='/' element={<LandingPage />} />
          <Route path='/pricing' element={<PricingPage />} />
          <Route path='/terms' element={<TermsPage />} />
          <Route path='/privacy' element={<PrivacyPage />} />
          <Route path='/home' element={<Home />} />
          <Route path='/about' element={<About />} />
        </Route>

        {/* Documentation */}
        <Route element={<DocsLayout />}>
          <Route path='/docs' element={<DocsHome />} />
          <Route path='/docs/api' element={<DocsApi />} />
          <Route path='/docs/sdk' element={<DocsSdk />} />
          <Route path='/docs/tools' element={<DocsTools />} />
          <Route path='/docs/errors' element={<DocsErrors />} />
          <Route path='/docs/faq' element={<DocsFaq />} />
        </Route>

        {/* Authentication */}
        <Route element={<AuthLayout />}>
          <Route path='/login' element={<LoginForm />} />
          <Route path='/register' element={<RegisterForm />} />
          <Route path='/reset' element={<PasswordResetForm />} />
          <Route path='/user/reset' element={<PasswordResetConfirm />} />
        </Route>

        {/* User Console - requires authentication */}
        <Route
          element={
            <PrivateRoute>
              <ConsoleLayout />
            </PrivateRoute>
          }
        >
          {/* Console pages */}
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/keys' element={<KeysPage />} />
          <Route path='/token' element={<Token />} />
          <Route path='/token/edit/:id' element={<EditToken />} />
          <Route path='/token/add' element={<EditToken />} />
          <Route path='/subscription' element={<SubscriptionPage />} />
          <Route path='/usage' element={<UsagePage />} />
          <Route path='/billing' element={<BillingPage />} />
          <Route path='/booster' element={<BoosterPage />} />
          <Route path='/topup' element={<TopUp />} />
          <Route path='/log' element={<Log />} />
          <Route path='/chat' element={<Chat />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='/setting' element={<Setting />} />
          <Route path='/user/edit' element={<EditUser />} />
        </Route>

        {/* Admin pages - requires admin role */}
        <Route
          element={
            <AdminRoute>
              <ConsoleLayout />
            </AdminRoute>
          }
        >
          <Route path='/admin/dashboard' element={<AdminDashboard />} />
          <Route path='/admin/keys' element={<AdminKeysAudit />} />
          <Route path='/admin/usage' element={<AdminUsageMonitor />} />
          <Route path='/channel' element={<Channel />} />
          <Route path='/channel/edit/:id' element={<EditChannel />} />
          <Route path='/channel/add' element={<EditChannel />} />
          <Route path='/redemption' element={<Redemption />} />
          <Route path='/redemption/edit/:id' element={<EditRedemption />} />
          <Route path='/redemption/add' element={<EditRedemption />} />
          <Route path='/user' element={<User />} />
          <Route path='/user/edit/:id' element={<EditUser />} />
          <Route path='/user/add' element={<AddUser />} />
        </Route>

        {/* OAuth callbacks - no layout */}
        <Route path='/oauth/github' element={<GitHubOAuth />} />
        <Route path='/oauth/lark' element={<LarkOAuth />} />

        <Route path='*' element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
