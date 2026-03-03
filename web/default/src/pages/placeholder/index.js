import React from 'react';

function createPlaceholder(name) {
  const Component = () => (
    <div className='flex flex-col items-center justify-center py-20'>
      <h1 className='text-2xl font-bold text-foreground'>{name}</h1>
      <p className='mt-2 text-muted-foreground'>此页面正在建设中</p>
    </div>
  );
  Component.displayName = name;
  return Component;
}

// Marketing pages
export const LandingPage = createPlaceholder('Landing Page');
export const PricingPage = createPlaceholder('Pricing Page');

// Docs pages
export const DocsHome = createPlaceholder('Documentation Home');
export const DocsPage = createPlaceholder('Documentation Page');

// Console pages
export const DashboardPage = createPlaceholder('Dashboard');
export const KeysPage = createPlaceholder('API Keys');
export const SubscriptionPage = createPlaceholder('Subscription Management');
export const UsagePage = createPlaceholder('Usage Statistics');
export const BillingPage = createPlaceholder('Billing Records');
export const BoosterPage = createPlaceholder('Booster Packs');
export const SettingsPage = createPlaceholder('Settings');

// Admin pages
export const AdminDashboard = createPlaceholder('Admin Dashboard');
export const AdminKeysAudit = createPlaceholder('Admin Keys Audit');
export const AdminUsageMonitor = createPlaceholder('Admin Usage Monitor');
export const AdminUsers = createPlaceholder('Admin User Management');
export const AdminChannels = createPlaceholder('Admin Channel Management');
export const AdminRedemptions = createPlaceholder('Admin Redemption Management');
export const AdminSettings = createPlaceholder('Admin System Settings');
