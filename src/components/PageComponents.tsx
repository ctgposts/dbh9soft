/**
 * COMPREHENSIVE PAGE DESIGN UPDATES
 * Apply consistent modern design to all pages
 */

import React from 'react';
import { pageStyles, headerStyles, sectionStyles } from '../utils/styleHelpers';

/**
 * Page Header Component - Use this in all pages
 */
export const createPageHeader = (
  icon: string,
  title: string,
  description: string,
  actionButton?: React.ReactNode
): React.ReactNode => {
  return (
    <div className={headerStyles.pageHeader}>
      <div className={headerStyles.titleContainer}>
        <div className="flex-1">
          <h1 className={headerStyles.title}>
            <span className={headerStyles.icon}>{icon}</span>
            {title}
          </h1>
          {description && (
            <p className={headerStyles.subtitle}>{description}</p>
          )}
        </div>
        {actionButton && (
          <div className="flex-shrink-0 flex items-center">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Standard Filter Bar - Use for search and filtering
 */
export const createFilterBar = (filters: Array<{
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
}>): React.ReactNode => {
  return (
    <div className={sectionStyles.card}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filters.map((filter, idx) => (
          <div key={idx}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {filter.label}
            </label>
            {filter.type === 'text' && (
              <input
                type="text"
                placeholder={filter.placeholder}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              />
            )}
            {filter.type === 'select' && (
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              >
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {filter.type === 'date' && (
              <input
                type="date"
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Stats Grid - Display key metrics
 */
export const createStatsGrid = (stats: Array<{
  icon: string;
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
}>): React.ReactNode => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`rounded-xl border-2 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 ${
            colorClasses[stat.color || 'blue']
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold opacity-75">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</p>
            </div>
            <span className="text-3xl sm:text-4xl">{stat.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Empty State Component
 */
export const createEmptyState = (
  icon: string,
  title: string,
  description: string,
  actionButton?: React.ReactNode
): React.ReactNode => {
  return (
    <div className="text-center py-12 sm:py-16 md:py-20">
      <span className="text-6xl sm:text-8xl">{icon}</span>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-4">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 mt-2">{description}</p>
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
};

/**
 * Modal Form Container
 */
export const createModalForm = (
  title: string,
  onClose: () => void,
  onSubmit: (e: React.FormEvent) => void,
  children: React.ReactNode,
  submitButtonText: string = 'Save',
  isSubmitting: boolean = false
): React.ReactNode => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto shadow-2xl">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {children}

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isSubmitting ? 'Saving...' : submitButtonText}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Action Button Group
 */
export const createActionButtons = (actions: Array<{
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}>): React.ReactNode => {
  const variants = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            variants[action.variant || 'primary']
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

/**
 * List Item Card - For displaying individual items
 */
export const createListItem = (
  primaryText: string,
  secondaryText: string,
  icon?: string,
  actions?: React.ReactNode,
  badge?: string
): React.ReactNode => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {icon && <span className="text-2xl mt-1">{icon}</span>}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
              {primaryText}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{secondaryText}</p>
          </div>
        </div>
        {badge && (
          <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
      {actions && <div className="mt-3 flex justify-end gap-2">{actions}</div>}
    </div>
  );
};
