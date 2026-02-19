// Mobile Responsive Container Wrapper
// এটি সব পেজ কম্পোনেন্টের জন্য মোবাইল অপটিমাইজেশন প্রদান করে

import React from "react";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  noPadding?: boolean;
}

export function ResponsiveContainer({
  children,
  title,
  subtitle,
  className = "",
  noPadding = false,
}: ResponsiveContainerProps) {
  return (
    <div className={`w-full min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div>
              {title && (
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={noPadding ? "" : "px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"}>
        {children}
      </div>
    </div>
  );
}

// Form Container (মোবাইল-অপটিমাইজড ফর্ম)
interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  title?: string;
  className?: string;
}

export function ResponsiveForm({
  children,
  onSubmit,
  title,
  className = "",
}: ResponsiveFormProps) {
  return (
    <div className={`bg-white rounded-lg sm:rounded-xl border border-slate-200 p-4 sm:p-6 md:p-8 max-w-2xl mx-auto ${className}`}>
      {title && (
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
          {title}
        </h2>
      )}
      <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
        {children}
      </form>
    </div>
  );
}

// Form Group (ইনপুট গ্রুপ)
interface ResponsiveFormGroupProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export function ResponsiveFormGroup({
  label,
  children,
  error,
  required,
  helpText,
}: ResponsiveFormGroupProps) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs sm:text-sm text-red-600 font-medium">{error}</p>}
      {helpText && <p className="text-xs text-slate-600">{helpText}</p>}
    </div>
  );
}

// Responsive Input (মোবাইল-অপটিমাইজড ইনপুট)
interface ResponsiveInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const ResponsiveInput = React.forwardRef<
  HTMLInputElement,
  ResponsiveInputProps
>(({ label, error, icon, className = "", ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
      <input
        ref={ref}
        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-10 sm:min-h-11 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
          icon ? "pl-9 sm:pl-11" : ""
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
  </div>
));

ResponsiveInput.displayName = "ResponsiveInput";

// Responsive Select
interface ResponsiveSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const ResponsiveSelect = React.forwardRef<
  HTMLSelectElement,
  ResponsiveSelectProps
>(({ label, error, options, className = "", ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
        {label}
      </label>
    )}
    <select
      ref={ref}
      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-10 sm:min-h-11 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
        error ? "border-red-500" : ""
      } ${className}`}
      {...props}
    >
      <option value="">নির্বাচন করুন</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
  </div>
));

ResponsiveSelect.displayName = "ResponsiveSelect";

// Responsive Button
interface ResponsiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function ResponsiveButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  icon,
  className = "",
  ...props
}: ResponsiveButtonProps) {
  const baseClasses =
    "font-semibold transition-all duration-200 flex items-center justify-center gap-2 rounded-lg";

  const sizeClasses = {
    sm: "px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs min-h-9 sm:min-h-10",
    md: "px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm min-h-10 sm:min-h-11",
    lg: "px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base min-h-11 sm:min-h-12",
  };

  const variantClasses = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800",
    secondary:
      "bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        fullWidth ? "w-full" : ""
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="animate-spin">⏳</span>}
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// Responsive Modal/Dialog
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
}: ResponsiveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full sm:max-h-96 sm:h-auto max-h-screen flex flex-col ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 text-xl sm:text-2xl"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Responsive Alert/Toast
interface ResponsiveAlertProps {
  message: string;
  type?: "info" | "success" | "error" | "warning";
  onClose?: () => void;
  autoClose?: number;
}

export function ResponsiveAlert({
  message,
  type = "info",
  onClose,
  autoClose,
}: ResponsiveAlertProps) {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const typeClasses = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return (
    <div
      className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border ${typeClasses[type]} text-xs sm:text-sm font-medium flex items-center justify-between gap-3`}
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-lg leading-none">
          ✕
        </button>
      )}
    </div>
  );
}
