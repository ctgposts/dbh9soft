import React from "react";

interface ResponsiveTableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  className?: string;
  onRowClick?: (rowIndex: number) => void;
}

export function ResponsiveTable({
  headers,
  rows,
  className = "",
  onRowClick,
}: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-xs sm:text-sm border-collapse ${className}`}>
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-2 sm:px-3 py-2 sm:py-3 text-left font-semibold text-slate-700 text-xs sm:text-sm"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(rowIdx)}
              className={`border-b border-slate-200 hover:bg-slate-50 transition ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-2 sm:px-3 py-2 sm:py-3 text-slate-900 truncate"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mobile Card List (Stacked view for mobile)
interface ResponsiveCardListProps {
  items: {
    title: string;
    subtitle?: string;
    value: string | number;
    icon?: string;
    color?: string;
  }[];
}

export function ResponsiveCardList({ items }: ResponsiveCardListProps) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {item.icon && (
              <span className="text-lg sm:text-2xl flex-shrink-0">{item.icon}</span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-xs text-slate-600 truncate">{item.subtitle}</p>
              )}
            </div>
          </div>
          <div className={`text-right flex-shrink-0 font-bold ${item.color || "text-slate-900"}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// Mobile Metrics Grid
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export function ResponsiveMetrics({ metrics }: { metrics: MetricCardProps[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-lg border ${metric.color} p-3 sm:p-4`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase truncate">
                {metric.label}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-1">
                {metric.value}
              </p>
            </div>
            <span className="text-xl sm:text-2xl ml-2">{metric.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Mobile Action Bar
interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}

export function ResponsiveActionBar({ actions }: { actions: ActionButtonProps[] }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 gap-2 sm:gap-3 flex z-40">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition ${
            action.variant === "primary"
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : action.variant === "danger"
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-slate-100 text-slate-900 hover:bg-slate-200"
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
