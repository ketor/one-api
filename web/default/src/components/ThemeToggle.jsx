import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/Theme';
import { useTranslation } from 'react-i18next';

const modes = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'auto', icon: Monitor },
];

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className='flex items-center gap-0.5 border border-border rounded p-0.5'>
      {modes.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-1.5 rounded transition-colors ${
            theme === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={t(`theme.${value}`)}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
