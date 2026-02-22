/**
 * Page Wrapper - Consistent layout for all pages
 */
import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
        {children}
      </div>
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  icon?: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon = '',
  description = '',
  actions = null,
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <span className="text-4xl sm:text-5xl">{icon}</span>
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-base sm:text-lg text-gray-600">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

interface PageSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  icon?: string;
}

export const PageSection: React.FC<PageSectionProps> = ({
  title = '',
  subtitle = '',
  children,
  className = '',
  icon = '',
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8 ${className}`}>
      {title && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            {icon && <span className="text-2xl sm:text-3xl">{icon}</span>}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

interface FilterBarProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  columns = 4,
  className = '',
}) => {
  const colMap: { [key: number]: string } = {
    1: 'grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 md:grid-cols-3',
    4: 'sm:grid-cols-2 md:grid-cols-4',
  };
  const colClass = (colMap[columns as 1 | 2 | 3 | 4] || 'sm:grid-cols-2 md:grid-cols-4');

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  );
};

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label = '',
  error = '',
  hint = '',
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs sm:text-sm text-red-600 font-medium">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs sm:text-sm text-gray-600">{hint}</p>}
    </div>
  );
};

interface DataTableProps {
  headers: Array<{ key: string; label: string; width?: string }>;
  rows: Array<Record<string, any>>;
  renderCell?: (key: string, value: any, row: Record<string, any>) => React.ReactNode;
  onRowClick?: (row: Record<string, any>) => void;
  className?: string;
  emptyMessage?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  headers,
  rows,
  renderCell = (key, value) => value,
  onRowClick = () => {},
  className = '',
  emptyMessage = 'No data found',
}) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            {headers.map((header) => (
              <th
                key={header.key}
                className={`px-4 py-3 text-left text-xs sm:text-sm font-bold text-gray-900 ${
                  header.width || ''
                }`}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick(row)}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
            >
              {headers.map((header) => (
                <td key={header.key} className="px-4 py-3 text-sm text-gray-700">
                  {renderCell(header.key, row[header.key], row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon = '',
  loading = false,
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClass =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2';

  const variantClass = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
  }[variant];

  const sizeClass = {
    sm: 'px-3 py-1.5 text-sm gap-2',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
  }[size];

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {loading ? 'Loading...' : children}
    </button>
  );
};

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title = '',
  message,
  onClose = () => {},
}) => {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl font-bold">{icons[type]}</span>
        <div className="flex-1">
          {title && <h3 className="font-semibold text-sm sm:text-base">{title}</h3>}
          <p className="text-xs sm:text-sm mt-1">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-lg font-bold hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'orange';
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subtitle = '',
  trend = 'neutral',
  color = 'blue',
}) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  };

  return (
    <div className={`rounded-xl border-2 p-4 sm:p-6 ${colors[color]} hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm font-semibold opacity-75">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs sm:text-sm mt-2 opacity-70">{subtitle}</p>}
        </div>
        <span className="text-3xl sm:text-4xl">{icon}</span>
      </div>
    </div>
  );
};
