import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedRowId?: string;
  rowKey?: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  selectedRowId,
  rowKey,
  emptyMessage = 'No hay datos disponibles',
  className = '',
}: DataTableProps<T>) {
  const { theme } = useTheme();

  const getRowId = (item: T) => rowKey ? rowKey(item) : item.id;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className={`border-b ${theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/50'}`}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
                  theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={`px-4 py-8 text-center text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const id = getRowId(item);
              const isSelected = selectedRowId && id === selectedRowId;
              const isClickable = !!onRowClick;

              return (
                <tr
                  key={id || index}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    transition-colors
                    ${isClickable ? 'cursor-pointer' : ''}
                    ${
                      isSelected
                        ? theme === 'light'
                          ? 'bg-sky-50 border-l-2 border-sky-500'
                          : 'bg-sky-950/30 border-l-2 border-sky-500'
                        : theme === 'light'
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-slate-800/40'
                    }
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm ${
                        theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
