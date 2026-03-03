import { getChannelOption } from './helper';
import React from 'react';

export function renderText(text, limit) {
  if (text.length > limit) {
    return text.slice(0, limit - 3) + '...';
  }
  return text;
}

export function renderGroup(group) {
  if (group === '') {
    return <span className='inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold'>default</span>;
  }
  let groups = group.split(',');
  groups.sort();
  return (
    <div className='flex flex-wrap items-center gap-1'>
      {groups.map((group) => {
        let colorClass = 'bg-secondary text-secondary-foreground';
        if (group === 'vip' || group === 'pro') {
          colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
        } else if (group === 'svip' || group === 'premium') {
          colorClass = 'bg-red-100 text-red-800 border-red-300';
        }
        return (
          <span
            key={group}
            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
          >
            {group}
          </span>
        );
      })}
    </div>
  );
}

export function renderNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 10000) {
    return (num / 1000).toFixed(1) + 'k';
  } else {
    return num;
  }
}

export function renderQuota(quota, t, precision = 2) {
  const displayInCurrency =
    localStorage.getItem('display_in_currency') === 'true';
  const quotaPerUnit = parseFloat(
    localStorage.getItem('quota_per_unit') || '1'
  );

  if (displayInCurrency) {
    const amount = (quota / quotaPerUnit).toFixed(precision);
    if (typeof t === 'function') {
      return t('common.quota.display_short', { amount });
    }
    return `$${amount}`;
  }

  return renderNumber(quota);
}

export function renderQuotaWithPrompt(quota, t) {
  const displayInCurrency =
    localStorage.getItem('display_in_currency') === 'true';
  const quotaPerUnit = parseFloat(
    localStorage.getItem('quota_per_unit') || '1'
  );

  if (displayInCurrency) {
    const amount = (quota / quotaPerUnit).toFixed(2);
    if (typeof t === 'function') {
      return ` (${t('common.quota.display', { amount })})`;
    }
    return ` ($${amount})`;
  }

  return '';
}

const tailwindColors = [
  'bg-red-100 text-red-800 border-red-300',
  'bg-orange-100 text-orange-800 border-orange-300',
  'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bg-lime-100 text-lime-800 border-lime-300',
  'bg-green-100 text-green-800 border-green-300',
  'bg-teal-100 text-teal-800 border-teal-300',
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-violet-100 text-violet-800 border-violet-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-amber-100 text-amber-800 border-amber-300',
  'bg-gray-100 text-gray-800 border-gray-300',
  'bg-slate-100 text-slate-800 border-slate-300',
];

export function renderColorLabel(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  let index = Math.abs(hash % tailwindColors.length);
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${tailwindColors[index]}`}>
      {text}
    </span>
  );
}

export function renderChannelTip(channelId) {
  let channel = getChannelOption(channelId);
  if (channel === undefined || channel.tip === undefined) {
    return <></>;
  }
  return (
    <div className='rounded-lg border bg-muted/50 p-4'>
      <div dangerouslySetInnerHTML={{ __html: channel.tip }}></div>
    </div>
  );
}
