import React, { lazy, Suspense, useContext, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loading from './components/Loading';
import User from './pages/User';
import { PrivateRoute } from './components/PrivateRoute';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import NotFound from './pages/NotFound';
import Setting from './pages/Setting';
import EditUser from './pages/User/EditUser';
import AddUser from './pages/User/AddUser';
import { API, getLogo, getSystemName, showError, showNotice } from './helpers';
import PasswordResetForm from './components/PasswordResetForm';
import GitHubOAuth from './components/GitHubOAuth';
import PasswordResetConfirm from './components/PasswordResetConfirm';
import { UserContext } from './context/User';
import { StatusContext } from './context/Status';
import Channel from './pages/Channel';
import Token from './pages/Token';
import EditToken from './pages/Token/EditToken';
import EditChannel from './pages/Channel/EditChannel';
import Redemption from './pages/Redemption';
import EditRedemption from './pages/Redemption/EditRedemption';
import TopUp from './pages/TopUp';
import Log from './pages/Log';
import Chat from './pages/Chat';
import LarkOAuth from './components/LarkOAuth';
import Dashboard from './pages/Dashboard'; // eslint-disable-line no-unused-vars

// Layout components
import MarketingLayout from './components/layout/MarketingLayout';
import ConsoleLayout from './components/layout/ConsoleLayout';
// AdminLayout removed - all admin routes now use ConsoleLayout
import DocsLayout from './components/layout/DocsLayout';
import AuthLayout from './components/layout/AuthLayout';

// Real console pages
import DashboardPage from './pages/console/DashboardPage';
import KeysPage from './pages/console/KeysPage';
import SubscriptionPage from './pages/console/SubscriptionPage';
import UsagePage from './pages/console/UsagePage';
import BillingPage from './pages/console/BillingPage';
import BoosterPage from './pages/console/BoosterPage';
import SettingsPage from './pages/console/SettingsPage';

// Real admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKeysAudit from './pages/admin/AdminKeysAudit';
import AdminUsageMonitor from './pages/admin/AdminUsageMonitor';

// Marketing pages
import LandingPage from './pages/marketing/LandingPage';
import PricingPage from './pages/marketing/PricingPage';

// Docs pages
import DocsHome from './pages/docs/DocsHome';
import DocsApi from './pages/docs/DocsApi';
import DocsSdk from './pages/docs/DocsSdk';
import DocsTools from './pages/docs/DocsTools';
import DocsErrors from './pages/docs/DocsErrors';
import DocsFaq from './pages/docs/DocsFaq';

// Admin pages reusing existing components (replacing placeholders)

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function App() {
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState, statusDispatch] = useContext(StatusContext);

  const loadUser = () => {
    let user = localStorage.getItem('user');
    if (user) {
      let data = JSON.parse(user);
      userDispatch({ type: 'login', payload: data });
    }
  };
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

  useEffect(() => {
    loadUser();
    loadStatus().then();
    let systemName = getSystemName();
    if (systemName) {
      document.title = systemName;
    }
    let logo = getLogo();
    if (logo) {
      let linkElement = document.querySelector("link[rel~='icon']");
      if (linkElement) {
        linkElement.href = logo;
      }
    }
  }, []);

  return (
    <Routes>
      {/* Marketing pages */}
      <Route element={<MarketingLayout />}>
        <Route path='/' element={<LandingPage />} />
        <Route path='/pricing' element={<PricingPage />} />
        <Route
          path='/home'
          element={
            <Suspense fallback={<Loading />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path='/about'
          element={
            <Suspense fallback={<Loading />}>
              <About />
            </Suspense>
          }
        />
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
        <Route
          path='/login'
          element={
            <Suspense fallback={<Loading />}>
              <LoginForm />
            </Suspense>
          }
        />
        <Route
          path='/register'
          element={
            <Suspense fallback={<Loading />}>
              <RegisterForm />
            </Suspense>
          }
        />
        <Route
          path='/reset'
          element={
            <Suspense fallback={<Loading />}>
              <PasswordResetForm />
            </Suspense>
          }
        />
        <Route
          path='/user/reset'
          element={
            <Suspense fallback={<Loading />}>
              <PasswordResetConfirm />
            </Suspense>
          }
        />
      </Route>

      {/* User Console + Admin - unified under ConsoleLayout */}
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
        <Route
          path='/token/edit/:id'
          element={
            <Suspense fallback={<Loading />}>
              <EditToken />
            </Suspense>
          }
        />
        <Route
          path='/token/add'
          element={
            <Suspense fallback={<Loading />}>
              <EditToken />
            </Suspense>
          }
        />
        <Route path='/subscription' element={<SubscriptionPage />} />
        <Route path='/usage' element={<UsagePage />} />
        <Route path='/billing' element={<BillingPage />} />
        <Route path='/booster' element={<BoosterPage />} />
        <Route path='/topup' element={<TopUp />} />
        <Route path='/log' element={<Log />} />
        <Route
          path='/chat'
          element={
            <Suspense fallback={<Loading />}>
              <Chat />
            </Suspense>
          }
        />
        <Route path='/settings' element={<SettingsPage />} />
        <Route
          path='/setting'
          element={
            <Suspense fallback={<Loading />}>
              <Setting />
            </Suspense>
          }
        />
        <Route
          path='/user/edit'
          element={
            <Suspense fallback={<Loading />}>
              <EditUser />
            </Suspense>
          }
        />
        {/* Admin pages - now unified under ConsoleLayout */}
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
        <Route path='/admin/keys' element={<AdminKeysAudit />} />
        <Route path='/admin/usage' element={<AdminUsageMonitor />} />
        <Route path='/channel' element={<Channel />} />
        <Route
          path='/channel/edit/:id'
          element={
            <Suspense fallback={<Loading />}>
              <EditChannel />
            </Suspense>
          }
        />
        <Route
          path='/channel/add'
          element={
            <Suspense fallback={<Loading />}>
              <EditChannel />
            </Suspense>
          }
        />
        <Route path='/redemption' element={<Redemption />} />
        <Route
          path='/redemption/edit/:id'
          element={
            <Suspense fallback={<Loading />}>
              <EditRedemption />
            </Suspense>
          }
        />
        <Route
          path='/redemption/add'
          element={
            <Suspense fallback={<Loading />}>
              <EditRedemption />
            </Suspense>
          }
        />
        <Route path='/user' element={<User />} />
        <Route
          path='/user/edit/:id'
          element={
            <Suspense fallback={<Loading />}>
              <EditUser />
            </Suspense>
          }
        />
        <Route
          path='/user/add'
          element={
            <Suspense fallback={<Loading />}>
              <AddUser />
            </Suspense>
          }
        />
      </Route>

      {/* OAuth callbacks - no layout */}
      <Route
        path='/oauth/github'
        element={
          <Suspense fallback={<Loading />}>
            <GitHubOAuth />
          </Suspense>
        }
      />
      <Route
        path='/oauth/lark'
        element={
          <Suspense fallback={<Loading />}>
            <LarkOAuth />
          </Suspense>
        }
      />

      <Route path='*' element={<NotFound />} />
    </Routes>
  );
}

export default App;
