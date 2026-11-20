import React from 'react';
import {Modal} from '../Modal';
import { X, Search, ChevronRight } from 'lucide-react';

// iOS Switch / Toggle Control
export const IOSToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
}> = ({ checked, onChange, disabled, label, description, id }) => {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <span className="text-xs font-semibold text-slate-900 block">{label}</span>}
          {description && <span className="text-[11px] text-slate-400 block leading-tight">{description}</span>}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-label={label || description || 'Alterar preferência'}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        } ${checked ? 'bg-[#35343c]' : 'bg-[#E5E5EA]'}`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          } mt-0.5`}
        />
      </button>
    </div>
  );
};

// iOS Segmented Control
export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export const IOSSegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  className = '',
  id
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  id?: string;
}) => {
  return (
    <div
      id={id}
      className={`adm-tabs inline-flex items-center p-1 bg-[#767680]/12 rounded-xl overflow-x-auto max-w-full ${className}`}
    >
      {options.map((opt) => {
        const isSelected = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            aria-pressed={isSelected}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isSelected
                ? 'bg-white text-slate-900 shadow-[0_2px_6px_rgba(0,0,0,0.12)] font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#596777]' : 'text-slate-400'}`} />}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-slate-100 text-slate-700' : 'bg-black/[0.06] text-slate-500'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// iOS Grouped Inset Card
export const IOSCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}> = ({ children, className = '', onClick, id }) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`inex-admin-card bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all ${
        onClick ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

// iOS Badge Pill
export const IOSBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'gray' | 'indigo';
  className?: string;
}> = ({ children, variant = 'gray', className = '' }) => {
  const styles = {
    green: 'bg-[#657466]/12 text-[#59685d] border-[#657466]/20',
    blue: 'bg-[#596777]/12 text-[#596777] border-[#596777]/20',
    orange: 'bg-[#7c7469]/12 text-[#756b5b] border-[#7c7469]/20',
    red: 'bg-[#986a70]/12 text-[#986a70] border-[#986a70]/20',
    purple: 'bg-[#737080]/12 text-[#737080] border-[#737080]/20',
    indigo: 'bg-[#697587]/12 text-[#697587] border-[#697587]/20',
    gray: 'bg-black/[0.06] text-slate-600 border-black/[0.06]'
  };

  return (
    <span
      data-tone={variant}
      className={`adm-badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border whitespace-nowrap ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// iOS Metric / Stat Card
export const IOSStatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconColor?: string;
  sparkline?: React.ReactNode;
  onClick?: () => void;
  id?: string;
}> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon: Icon,
  iconBgColor = 'bg-[#596777]',
  iconColor = 'text-white',
  sparkline,
  onClick,
  id
}) => {
  return (
    <IOSCard id={id} onClick={onClick} className="inex-admin-stat p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">{title}</span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        </div>
        <div className={`inex-admin-stat-icon w-10 h-10 rounded-2xl ${iconBgColor} ${iconColor} flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        {subtitle && <span className="text-slate-500 font-medium truncate">{subtitle}</span>}
        {change && (
          <span
            className={`font-semibold shrink-0 px-2 py-0.5 rounded-full text-[10px] ${
              isPositive ? 'bg-[#657466]/12 text-[#59685d]' : 'bg-[#986a70]/12 text-[#986a70]'
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {sparkline && <div className="mt-2 pt-1">{sparkline}</div>}
    </IOSCard>
  );
};

// iOS Styled Button
export const IOSButton: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'destructive' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  id?: string;
  title?: string;
}> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  id,
  title
}) => {
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-9 px-4 text-xs font-semibold rounded-xl',
    lg: 'h-11 px-5 text-sm font-semibold rounded-xl'
  };

  const variantStyles = {
    primary: 'bg-[#596777] hover:bg-[#596777] text-white shadow-sm active:scale-[0.98]',
    secondary: 'bg-[#E5E5EA] hover:bg-[#D1D1D6] text-slate-800 active:scale-[0.98]',
    destructive: 'bg-[#986a70] hover:bg-[#986a70] text-white shadow-sm active:scale-[0.98]',
    success: 'bg-[#657466] hover:bg-[#28A745] text-white shadow-sm active:scale-[0.98]',
    ghost: 'bg-transparent hover:bg-black/[0.05] text-slate-700 active:scale-[0.98]'
  };

  return (
    <button
      id={id}
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      data-variant={variant}
      className={`adm-button inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// iOS Search Bar
export const IOSSearchBar: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}> = ({ value, onChange, placeholder = 'Buscar...', className = '', id }) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 bg-[#767680]/12 hover:bg-[#767680]/16 focus:bg-white text-slate-900 placeholder-[#8E8E93] text-xs font-medium rounded-xl border border-transparent focus:border-[#596777] focus:outline-none transition-all"
      />
      {value && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => onChange('')}
          className="absolute right-2.5 w-4 h-4 rounded-full bg-slate-300 hover:bg-slate-400 text-white flex items-center justify-center text-[10px] cursor-pointer"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

// iOS Sheet / Modal Component
export const IOSModalSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  id?: string;
}> = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg', id }) => {
  const widths:Record<string,number>={'max-w-sm':400,'max-w-md':448,'max-w-lg':512,'max-w-xl':576,'max-w-2xl':672,'max-w-3xl':768,'max-w-4xl':896,'max-w-5xl':1024,'max-w-6xl':1152};
  return <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} id={id} className="adm-modal" maxWidth={widths[maxWidth]||576}>{children}</Modal>;
};
