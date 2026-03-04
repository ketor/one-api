/**
 * Semantic UI React Compatibility Shim
 *
 * This module provides lightweight replacements for semantic-ui-react components
 * using Tailwind CSS classes. It allows existing pages to continue working
 * while the project transitions to Shadcn/ui components.
 *
 * Usage: Replace `from '../helpers/semantic-shim'` with `from '../helpers/semantic-shim'`
 */
import React from 'react';
import { cn } from '../lib/utils';

// ---- Button ----
export const Button = React.forwardRef(({
  children, onClick, className, style, size, primary, positive, negative, color,
  fluid, basic, circular, icon, disabled, loading, as: Component = 'button', to, ...rest
}, ref) => {
  let sizeClass = 'px-4 py-2 text-sm';
  if (size === 'tiny' || size === 'mini') sizeClass = 'px-2 py-1 text-xs';
  if (size === 'small') sizeClass = 'px-3 py-1.5 text-sm';
  if (size === 'large') sizeClass = 'px-6 py-3 text-base';

  let colorClass = 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-xyz-white-2';
  if (primary || color === 'blue') colorClass = 'bg-primary text-primary-foreground hover:bg-primary/90';
  if (positive || color === 'green') colorClass = 'bg-green-600 text-white hover:bg-green-700';
  if (negative || color === 'red') colorClass = 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
  if (color === 'black') colorClass = 'bg-gray-900 text-white hover:bg-gray-800';
  if (color === 'olive') colorClass = 'bg-lime-600 text-white hover:bg-lime-700';
  if (color === 'yellow') colorClass = 'bg-yellow-500 text-white hover:bg-yellow-600';

  if (basic) colorClass = 'border bg-transparent hover:bg-accent';

  const props = {
    ref,
    onClick,
    disabled: disabled || loading,
    className: cn(
      'inline-flex items-center justify-center gap-1 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      sizeClass,
      colorClass,
      fluid && 'w-full',
      circular && 'rounded-full',
      className
    ),
    style,
    ...rest,
  };

  if (to) props.to = to;

  return <Component {...props}>{loading ? <span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1' /> : null}{children}</Component>;
});
Button.displayName = 'Button';
Button.Group = ({ children, className, ...rest }) => (
  <div className={cn('inline-flex', className)} {...rest}>{children}</div>
);

// ---- Form ----
export const Form = ({ children, onSubmit, className, size, loading, ...rest }) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(e); }} className={cn('space-y-3 relative', className)} {...rest}>
    {loading && <div className='absolute inset-0 bg-background/60 z-10 flex items-center justify-center rounded-md'><div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' /></div>}
    {children}
  </form>
);
Form.Input = ({ fluid, icon, iconPosition, placeholder, name, value, onChange, type, readOnly, loading, action, label, style, className, ...rest }) => (
  <div className={cn('space-y-2', fluid && 'w-full')} style={style}>
    {label && <label className='text-sm font-medium leading-none'>{label}</label>}
    <div className={cn('flex gap-2')}>
      <input
        className={cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e, { name, value: e.target.value })}
        type={type}
        readOnly={readOnly}
        {...rest}
      />
      {action}
    </div>
  </div>
);
Form.Field = ({ children, className, ...rest }) => (
  <div className={cn('space-y-2', className)} {...rest}>{children}</div>
);
Form.Group = ({ children, className, widths, inline, ...rest }) => (
  <div className={cn('flex gap-3 flex-wrap', inline && 'items-center', (widths === 'equal' || typeof widths === 'number') && '[&>*]:flex-1', className)} {...rest}>{children}</div>
);
Form.Checkbox = ({ label, name, checked, onChange, ...rest }) => (
  <label className='flex items-center gap-2 text-sm cursor-pointer'>
    <input type='checkbox' name={name} checked={checked} onChange={(e) => onChange?.(e, { name, checked: e.target.checked })} className='h-4 w-4 rounded border-input' {...rest} />
    {label}
  </label>
);
Form.TextArea = ({ placeholder, name, value, onChange, label, style, ...rest }) => (
  <div className='space-y-2'>
    {label && <label className='text-sm font-medium leading-none'>{label}</label>}
    <textarea className='flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring' placeholder={placeholder} name={name} value={value} onChange={(e) => onChange?.(e, { name, value: e.target.value })} style={style} {...rest} />
  </div>
);
const colorDotMap = {
  green: 'bg-green-500', red: 'bg-red-500', blue: 'bg-blue-500', orange: 'bg-orange-500',
  yellow: 'bg-yellow-500', purple: 'bg-purple-500', violet: 'bg-violet-500', black: 'bg-gray-900',
  olive: 'bg-lime-500', teal: 'bg-teal-500', pink: 'bg-pink-500', brown: 'bg-amber-700', grey: 'bg-gray-500',
};

const FormSelect = ({ label, name, options, value, onChange, search, required, placeholder, className, style, ...rest }) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = (options || []).filter((opt) => {
    if (search && query) return opt.text.toLowerCase().includes(query.toLowerCase());
    return true;
  });

  const selectedOpt = (options || []).find((o) => o.value === value);

  const handleSelect = (optValue) => {
    onChange?.(null, { name, value: optValue });
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={cn('space-y-2', className)} style={style} ref={containerRef}>
      {label && <label className='text-sm font-medium leading-none'>{label}{required && ' *'}</label>}
      <div className='relative'>
        <div
          className={cn(
            'flex items-center min-h-[36px] w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm cursor-pointer',
            'focus-within:outline-none focus-within:ring-1 focus-within:ring-ring'
          )}
          onClick={() => setOpen(!open)}
        >
          {search ? (
            <input
              className='flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground'
              placeholder={selectedOpt ? selectedOpt.text : (placeholder || '请选择...')}
              value={open ? query : (selectedOpt ? selectedOpt.text : '')}
              onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              onFocus={() => setQuery('')}
            />
          ) : (
            <span className={selectedOpt ? '' : 'text-muted-foreground'}>
              {selectedOpt ? selectedOpt.text : (placeholder || '请选择...')}
            </span>
          )}
          <span className='ml-auto text-muted-foreground text-xs'>&#9662;</span>
        </div>
        {open && (
          <div className='absolute z-50 mt-1 w-full max-h-[200px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md'>
            {filtered.length === 0 ? (
              <div className='px-2 py-1.5 text-sm text-muted-foreground'>无匹配结果</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.key ?? opt.value}
                  type='button'
                  className={cn(
                    'flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent',
                    opt.value === value && 'bg-accent font-medium'
                  )}
                  onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                >
                  {opt.color && <span className={cn('inline-block w-2 h-2 rounded-full mr-2', colorDotMap[opt.color] || 'bg-gray-500')} />}
                  {opt.text}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
Form.Select = FormSelect;

// Form.Dropdown – supports multiple/search/selection/allowAdditions for use in EditToken, EditChannel, EditUser, SystemSetting etc.
const FormDropdown = ({
  label, placeholder, name, fluid, multiple, search, selection,
  onChange, value, options, onLabelClick, allowAdditions, additionLabel, onAddItem,
  className, style, ...rest
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const safeValue = multiple ? (Array.isArray(value) ? value : []) : value;
  const filteredOptions = (options || []).filter((opt) => {
    if (search && query) {
      return opt.text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  });

  // Check if query matches an existing option exactly
  const queryMatchesExisting = query && (options || []).some(
    (opt) => opt.text.toLowerCase() === query.toLowerCase() || opt.value.toLowerCase() === query.toLowerCase()
  );

  const isSelected = (optValue) =>
    multiple ? safeValue.includes(optValue) : safeValue === optValue;

  const handleSelect = (optValue) => {
    let newValue;
    if (multiple) {
      if (safeValue.includes(optValue)) {
        newValue = safeValue.filter((v) => v !== optValue);
      } else {
        newValue = [...safeValue, optValue];
      }
    } else {
      newValue = optValue;
      setOpen(false);
    }
    setQuery('');
    onChange?.(null, { name, value: newValue });
  };

  const handleAddition = () => {
    if (!query.trim()) return;
    const trimmed = query.trim();
    onAddItem?.(null, { value: trimmed });
    if (multiple) {
      if (!safeValue.includes(trimmed)) {
        onChange?.(null, { name, value: [...safeValue, trimmed] });
      }
    } else {
      onChange?.(null, { name, value: trimmed });
      setOpen(false);
    }
    setQuery('');
  };

  const handleRemoveTag = (e, tagValue) => {
    e.stopPropagation();
    if (onLabelClick) {
      onLabelClick(e, { value: tagValue });
      return;
    }
    const newValue = safeValue.filter((v) => v !== tagValue);
    onChange?.(null, { name, value: newValue });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && allowAdditions && query.trim() && !queryMatchesExisting) {
      e.preventDefault();
      handleAddition();
    }
  };

  return (
    <div className={cn('space-y-2', fluid && 'w-full', className)} style={style} ref={containerRef}>
      {label && <label className='text-sm font-medium leading-none'>{label}</label>}
      <div className='relative'>
        <div
          className={cn(
            'flex flex-wrap items-center gap-1 min-h-[36px] w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm cursor-pointer',
            'focus-within:outline-none focus-within:ring-1 focus-within:ring-ring'
          )}
          onClick={() => setOpen(!open)}
        >
          {multiple && safeValue.length > 0 && safeValue.map((v) => {
            const opt = (options || []).find((o) => o.value === v);
            return (
              <span
                key={v}
                className='inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground'
                onClick={(e) => handleRemoveTag(e, v)}
              >
                {opt ? opt.text : v}
                <span className='cursor-pointer text-muted-foreground hover:text-foreground'>&times;</span>
              </span>
            );
          })}
          {search ? (
            <input
              className='flex-1 min-w-[60px] bg-transparent outline-none text-sm placeholder:text-muted-foreground'
              placeholder={multiple && safeValue.length > 0 ? '' : placeholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              onKeyDown={handleKeyDown}
            />
          ) : (
            !multiple || safeValue.length === 0 ? (
              <span className='text-muted-foreground'>{
                !multiple && safeValue
                  ? ((options || []).find((o) => o.value === safeValue)?.text || placeholder)
                  : placeholder
              }</span>
            ) : null
          )}
          <span className='ml-auto text-muted-foreground text-xs'>&#9662;</span>
        </div>
        {open && (
          <div className='absolute z-50 mt-1 w-full max-h-[200px] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md'>
            {allowAdditions && query.trim() && !queryMatchesExisting && (
              <button
                type='button'
                className='flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent text-primary font-medium'
                onClick={(e) => { e.stopPropagation(); handleAddition(); }}
              >
                {additionLabel || '添加 '}{query.trim()}
              </button>
            )}
            {filteredOptions.length === 0 && !(allowAdditions && query.trim()) ? (
              <div className='px-2 py-1.5 text-sm text-muted-foreground'>无匹配结果</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.key || opt.value}
                  type='button'
                  className={cn(
                    'flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent',
                    isSelected(opt.value) && 'bg-accent font-medium'
                  )}
                  onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                >
                  {multiple && (
                    <span className={cn(
                      'mr-2 inline-flex h-4 w-4 items-center justify-center rounded border text-xs',
                      isSelected(opt.value) ? 'bg-primary text-primary-foreground border-primary' : 'border-input'
                    )}>
                      {isSelected(opt.value) ? '\u2713' : ''}
                    </span>
                  )}
                  {opt.text}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
Form.Dropdown = FormDropdown;
Form.Button = ({ children, onClick, className, ...rest }) => (
  <Button onClick={onClick} className={cn('mt-1', className)} {...rest}>{children}</Button>
);

// ---- Table ----
export const Table = ({ children, className, basic, compact, size, ...rest }) => (
  <div className='relative w-full overflow-auto'>
    <table className={cn('w-full caption-bottom text-sm', className)} {...rest}>
      {children}
    </table>
  </div>
);
Table.Header = ({ children, ...rest }) => <thead className='[&_tr]:border-b' {...rest}>{children}</thead>;
Table.Body = ({ children, ...rest }) => <tbody className='[&_tr:last-child]:border-0' {...rest}>{children}</tbody>;
Table.Footer = ({ children, ...rest }) => <tfoot className='border-t bg-muted/50 font-medium' {...rest}>{children}</tfoot>;
Table.Row = ({ children, className, ...rest }) => <tr className={cn('border-b transition-colors hover:bg-muted/50', className)} {...rest}>{children}</tr>;
Table.HeaderCell = ({ children, onClick, style, colSpan, className, ...rest }) => (
  <th className={cn('h-10 px-2 text-left align-middle font-medium text-muted-foreground', onClick && 'cursor-pointer hover:text-foreground', className)} onClick={onClick} style={style} colSpan={colSpan} {...rest}>{children}</th>
);
Table.Cell = ({ children, className, colSpan, ...rest }) => <td className={cn('p-2 align-middle', className)} colSpan={colSpan} {...rest}>{children}</td>;

// ---- Label ----
export const Label = ({ children, color, basic, className, ...rest }) => {
  const colorMap = {
    green: 'bg-green-900/40 text-green-400 border-green-700',
    red: 'bg-red-900/40 text-red-400 border-red-700',
    yellow: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
    grey: 'bg-gray-800/40 text-gray-400 border-gray-600',
    black: 'bg-gray-900 text-white border-gray-900',
    blue: 'bg-blue-900/40 text-blue-400 border-blue-700',
    orange: 'bg-orange-900/40 text-orange-400 border-orange-700',
    olive: 'bg-lime-900/40 text-lime-400 border-lime-700',
    teal: 'bg-teal-900/40 text-teal-400 border-teal-700',
    violet: 'bg-violet-900/40 text-violet-400 border-violet-700',
    purple: 'bg-purple-900/40 text-purple-400 border-purple-700',
    pink: 'bg-pink-900/40 text-pink-400 border-pink-700',
    brown: 'bg-amber-900/40 text-amber-400 border-amber-700',
  };
  const colorClass = colorMap[color] || 'bg-secondary text-secondary-foreground';
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', basic && 'bg-transparent', colorClass, className)} {...rest}>
      {children}
    </span>
  );
};

// ---- Message ----
export const Message = ({ children, negative, positive, info, warning, onDismiss, style, className, ...rest }) => {
  let variant = 'border bg-muted/50';
  if (negative) variant = 'border-destructive/50 bg-destructive/10 text-destructive';
  if (positive) variant = 'border-green-500/50 bg-green-900/30 text-green-400';
  if (info) variant = 'border-blue-500/50 bg-blue-900/30 text-blue-400';
  if (warning) variant = 'border-yellow-500/50 bg-yellow-900/30 text-yellow-400';
  return (
    <div className={cn('relative rounded-lg p-4', variant, className)} style={style} {...rest}>
      {onDismiss && (
        <button
          type='button'
          className='absolute top-2 right-2 p-1 rounded hover:bg-black/10 text-current opacity-70 hover:opacity-100 transition-opacity'
          onClick={onDismiss}
          aria-label='Close'
        >
          &#10005;
        </button>
      )}
      {children}
    </div>
  );
};
Message.Header = ({ children, ...rest }) => <h4 className='font-semibold mb-1' {...rest}>{children}</h4>;

// ---- Grid ----
export const Grid = ({ children, columns, stackable, textAlign, style, className, ...rest }) => (
  <div className={cn('grid gap-4', columns === 2 && 'md:grid-cols-2', columns === 3 && 'md:grid-cols-3', columns === 4 && 'md:grid-cols-4', textAlign === 'center' && 'text-center', className)} style={style} {...rest}>
    {children}
  </div>
);
const colSpanMap = {
  1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
  5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 8: 'md:col-span-8',
  9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12',
};
Grid.Column = ({ children, style, width, className, ...rest }) => (
  <div className={cn(width && colSpanMap[width], className)} style={style} {...rest}>{children}</div>
);
Grid.Row = ({ children, className, ...rest }) => (
  <div className={cn('grid gap-4 md:grid-cols-2', className)} {...rest}>{children}</div>
);

// ---- Card ----
export const Card = ({ children, fluid, className, style, ...rest }) => (
  <div className={cn('rounded-xl border bg-card text-card-foreground shadow', fluid && 'w-full', className)} style={style} {...rest}>
    {children}
  </div>
);
Card.Content = ({ children, className, extra, ...rest }) => (
  <div className={cn('p-6', extra && 'border-t', className)} {...rest}>{children}</div>
);
Card.Header = ({ children, className, ...rest }) => (
  <div className={cn('font-semibold leading-none tracking-tight', className)} {...rest}>{children}</div>
);
Card.Description = ({ children, style, className, ...rest }) => (
  <div className={cn('text-sm text-muted-foreground mt-2', className)} style={style} {...rest}>{children}</div>
);
Card.Meta = ({ children, className, ...rest }) => (
  <div className={cn('text-sm text-muted-foreground', className)} {...rest}>{children}</div>
);

// ---- Segment ----
export const Segment = ({ children, vertical, style, className, ...rest }) => (
  <div className={cn('rounded-lg border bg-card p-4', vertical && 'border-0 border-y rounded-none', className)} style={style} {...rest}>
    {children}
  </div>
);

// ---- Container ----
export const Container = ({ children, textAlign, style, className, ...rest }) => (
  <div className={cn('container mx-auto px-4', textAlign === 'center' && 'text-center', className)} style={style} {...rest}>
    {children}
  </div>
);

// ---- Header ----
export const Header = ({ children, as: Component = 'h2', textAlign, content, subheader, className, style, ...rest }) => (
  <Component className={cn('font-semibold tracking-tight', textAlign === 'center' && 'text-center', className)} style={style} {...rest}>
    {content || children}
    {subheader && <p className='text-sm text-muted-foreground font-normal mt-1'>{subheader}</p>}
  </Component>
);
Header.Content = ({ children, ...rest }) => <span {...rest}>{children}</span>;
Header.Subheader = ({ children, ...rest }) => <p className='text-sm text-muted-foreground font-normal mt-1' {...rest}>{children}</p>;

// ---- Icon ----
export const Icon = ({ name, className, style, ...rest }) => (
  <i className={cn(`${name} icon`, className)} style={style} {...rest} />
);

// ---- Dimmer/Loader ----
export const Dimmer = ({ children, active, inverted, ...rest }) => (
  active ? <div className='absolute inset-0 flex items-center justify-center bg-background/80 z-10'>{children}</div> : null
);
export const Loader = ({ children, size, indeterminate, ...rest }) => (
  <div className='flex flex-col items-center gap-2'>
    <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
    {children && <span className='text-sm text-muted-foreground'>{children}</span>}
  </div>
);

// ---- Divider ----
export const Divider = ({ horizontal, children, style, className, ...rest }) => {
  if (horizontal && children) {
    return (
      <div className={cn('relative my-4', className)} style={style}>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-border' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-card px-2 text-muted-foreground'>{children}</span>
        </div>
      </div>
    );
  }
  return <div className={cn('my-4 h-px w-full bg-border', className)} style={style} />;
};

// ---- Image ----
export const Image = React.forwardRef(({ src, alt, avatar, size, fluid, style, className, ...rest }, ref) => (
  <img ref={ref} src={src} alt={alt || ''} className={cn(avatar && 'rounded-full', fluid && 'w-full', className)} style={style} {...rest} />
));
Image.displayName = 'Image';

// ---- Dropdown ----
export const Dropdown = ({ options, value, defaultValue, onChange, placeholder, selection, text, pointing, floating, trigger, item, children, style, className, ...rest }) => {
  if (trigger !== undefined || text) {
    // Dropdown with custom trigger (used in button groups and header)
    return (
      <div className={cn('relative inline-block', className)} style={style}>
        <details className='group'>
          <summary className='cursor-pointer list-none'>
            {trigger || <span className='text-sm'>{text}</span>}
          </summary>
          <div className='absolute right-0 z-50 mt-1 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md'>
            {options?.map((opt) => (
              <button
                key={opt.key || opt.value}
                className='flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent'
                onClick={() => {
                  opt.onClick?.();
                  onChange?.(null, { value: opt.value });
                }}
              >
                {opt.text}
              </button>
            ))}
            {children}
          </div>
        </details>
      </div>
    );
  }

  // Selection dropdown (acts like <select>)
  const selectProps = {};
  if (value !== undefined) selectProps.value = value;
  if (defaultValue !== undefined && value === undefined) selectProps.defaultValue = defaultValue;

  return (
    <select
      {...selectProps}
      onChange={(e) => onChange?.(e, { value: e.target.value })}
      className={cn('flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', className)}
      style={style}
    >
      {placeholder && <option value='' disabled>{placeholder}</option>}
      {options?.map((opt) => (
        <option key={opt.key || opt.value} value={opt.value}>{opt.text}</option>
      ))}
    </select>
  );
};
Dropdown.Menu = ({ children, ...rest }) => <>{children}</>;
Dropdown.Item = ({ children, onClick, style, ...rest }) => (
  <button className='flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent' onClick={onClick} style={style}>{children}</button>
);

// ---- Pagination ----
export const Pagination = ({ activePage, onPageChange, totalPages, size, siblingRange = 1, floated, ...rest }) => {
  const total = Math.max(1, totalPages);
  // Build page list with ellipsis for large page counts
  const getPageNumbers = () => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = new Set([1, total]);
    for (let i = Math.max(2, activePage - siblingRange); i <= Math.min(total - 1, activePage + siblingRange); i++) {
      pages.add(i);
    }
    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    for (const p of sorted) {
      if (p - prev > 1) result.push('...');
      result.push(p);
      prev = p;
    }
    return result;
  };
  const pages = getPageNumbers();
  return (
    <nav className={cn('inline-flex items-center gap-1', floated === 'right' && 'float-right')} aria-label='分页导航'>
      <button
        className='inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm disabled:opacity-50'
        disabled={activePage <= 1}
        onClick={(e) => onPageChange(e, { activePage: activePage - 1 })}
        aria-label='上一页'
      >
        &lt;
      </button>
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className='inline-flex h-8 w-8 items-center justify-center text-sm text-muted-foreground'>...</span>
        ) : (
          <button
            key={p}
            className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md text-sm', p === activePage ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent')}
            onClick={(e) => onPageChange(e, { activePage: p })}
            aria-label={`第 ${p} 页`}
            aria-current={p === activePage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        className='inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm disabled:opacity-50'
        disabled={activePage >= totalPages}
        onClick={(e) => onPageChange(e, { activePage: activePage + 1 })}
        aria-label='下一页'
      >
        &gt;
      </button>
    </nav>
  );
};

// ---- Popup ----
export const Popup = ({ children, trigger, on, flowing, hoverable, content, basic, position, ...rest }) => {
  const [visible, setVisible] = React.useState(false);
  const containerRef = React.useRef(null);
  const hideTimer = React.useRef(null);
  const isClick = on === 'click';

  React.useEffect(() => {
    if (!isClick) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isClick]);

  const showPopup = () => { clearTimeout(hideTimer.current); setVisible(true); };
  const hidePopup = () => { hideTimer.current = setTimeout(() => setVisible(false), 150); };

  const triggerProps = {};
  if (isClick) {
    triggerProps.onClick = (e) => { e.stopPropagation(); setVisible((v) => !v); };
  } else {
    triggerProps.onMouseEnter = showPopup;
    triggerProps.onMouseLeave = hidePopup;
  }

  const popupContent = content || children;

  return (
    <div className='relative inline-block' ref={containerRef}>
      <span {...triggerProps}>{trigger}</span>
      {visible && (
        <div
          className={cn('absolute z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-md text-sm', flowing ? 'whitespace-nowrap' : 'w-max max-w-xs', 'bottom-full left-1/2 -translate-x-1/2 mb-2')}
          onMouseEnter={hoverable ? showPopup : undefined}
          onMouseLeave={hoverable ? hidePopup : undefined}
        >
          {popupContent}
        </div>
      )}
    </div>
  );
};

// ---- Menu ----
export const Menu = ({ children, borderless, size, style, className, secondary, vertical, ...rest }) => (
  <nav className={cn('flex items-center', vertical && 'flex-col items-stretch', borderless && 'border-0', className)} style={style}>
    {children}
  </nav>
);
Menu.Item = React.forwardRef(({ children, as: Component = 'div', to, name, onClick, style, className, ...rest }, ref) => {
  const props = { ref, onClick, style, className: cn('px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-md', className), ...rest };
  if (to) props.to = to;
  return <Component {...props}>{name || children}</Component>;
});
Menu.Item.displayName = 'MenuItem';
Menu.Menu = ({ children, position, ...rest }) => (
  <div className={cn('flex items-center gap-1', position === 'right' && 'ml-auto')} {...rest}>{children}</div>
);

// ---- Modal ----
export const Modal = ({ children, open, onClose, onOpen, size, ...rest }) => {
  if (!open) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center' role='dialog' aria-modal='true'>
      <div className='fixed inset-0 bg-black/80' onClick={onClose} aria-label='关闭对话框' />
      <div className={cn('relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg', size === 'mini' && 'max-w-sm')}>
        {children}
      </div>
    </div>
  );
};
Modal.Content = ({ children, ...rest }) => <div {...rest}>{children}</div>;
Modal.Description = ({ children, ...rest }) => <div {...rest}>{children}</div>;
Modal.Header = ({ children, ...rest }) => <h3 className='text-lg font-semibold mb-4' {...rest}>{children}</h3>;
Modal.Actions = ({ children, ...rest }) => <div className='flex justify-end gap-2 mt-4' {...rest}>{children}</div>;

// ---- Tab / Tab.Pane ----
export const Tab = ({ panes, className, ...rest }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  return (
    <div className={className}>
      <div className='flex border-b mb-4'>
        {panes?.map((pane, idx) => (
          <button
            key={idx}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', idx === activeIndex ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
            onClick={() => setActiveIndex(idx)}
          >
            {pane.menuItem}
          </button>
        ))}
      </div>
      <div>{panes?.[activeIndex]?.render?.()}</div>
    </div>
  );
};
Tab.Pane = ({ children, attached, ...rest }) => <div {...rest}>{children}</div>;

// ---- Statistic ----
export const Statistic = ({ children, className, ...rest }) => (
  <div className={cn('flex flex-col items-center', className)} {...rest}>{children}</div>
);
Statistic.Value = ({ children, ...rest }) => <div className='text-3xl font-bold' {...rest}>{children}</div>;
Statistic.Label = ({ children, ...rest }) => <div className='text-sm text-muted-foreground' {...rest}>{children}</div>;
Statistic.Group = ({ children, widths, className, ...rest }) => (
  <div className={cn('flex gap-6 justify-around', className)} {...rest}>{children}</div>
);

// ---- Checkbox ----
export const Checkbox = ({ label, checked, onChange, toggle, name, ...rest }) => (
  <label className='flex items-center gap-2 text-sm cursor-pointer'>
    <input
      type='checkbox'
      checked={checked}
      onChange={(e) => onChange?.(e, { checked: e.target.checked, name })}
      className='h-4 w-4 rounded border-input'
      {...rest}
    />
    {label}
  </label>
);

// ---- Radio ----
export const Radio = ({ label, checked, onChange, name, value, ...rest }) => (
  <label className='flex items-center gap-2 text-sm cursor-pointer'>
    <input
      type='radio'
      name={name}
      value={value}
      checked={checked}
      onChange={(e) => onChange?.(e, { value, name })}
      className='h-4 w-4 border-input'
      {...rest}
    />
    {label}
  </label>
);

// ---- Select ----
export const Select = ({ options, value, onChange, placeholder, style, className, ...rest }) => (
  <select
    value={value}
    onChange={(e) => onChange?.(e, { value: e.target.value })}
    className={cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', className)}
    style={style}
    {...rest}
  >
    {placeholder && <option value=''>{placeholder}</option>}
    {options?.map((opt) => (
      <option key={opt.key || opt.value} value={opt.value}>{opt.text}</option>
    ))}
  </select>
);

// ---- Input ----
export const Input = ({ value, onChange, placeholder, type, fluid, icon, iconPosition, action, children, className, style, ...rest }) => (
  <div className={cn('flex gap-2', fluid && 'w-full', className)} style={style}>
    {children ? (
      React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (child.type === 'input') {
          return React.cloneElement(child, {
            value: child.props.value ?? value,
            onChange: child.props.onChange ?? ((e) => onChange?.(e, { value: e.target.value })),
            placeholder: child.props.placeholder ?? placeholder,
            type: child.props.type ?? type,
            className: cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', child.props.className),
            ...rest,
          });
        }
        return child;
      })
    ) : (
      <input
        className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        value={value}
        onChange={(e) => onChange?.(e, { value: e.target.value })}
        placeholder={placeholder}
        type={type}
        {...rest}
      />
    )}
    {action}
  </div>
);
