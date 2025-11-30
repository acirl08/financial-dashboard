import { format } from 'date-fns';
import { Mail, Edit2, Trash2 } from 'lucide-react';
import { Expense } from '../lib/api';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  showActions?: boolean;
}

export function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  showActions = false,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No expenses found
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-4 px-4 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: expense.categories?.color
                  ? `${expense.categories.color}20`
                  : '#e2e8f0',
              }}
            >
              {expense.source === 'gmail' ? (
                <Mail className="w-5 h-5 text-slate-600" />
              ) : (
                <span
                  className="text-lg font-bold"
                  style={{ color: expense.categories?.color || '#64748b' }}
                >
                  $
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900">
                {expense.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                {expense.merchant && <span>{expense.merchant}</span>}
                {expense.merchant && <span>•</span>}
                <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                {expense.categories && (
                  <>
                    <span>•</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${expense.categories.color}20`,
                        color: expense.categories.color,
                      }}
                    >
                      {expense.categories.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-slate-900">
              ${expense.amount.toFixed(2)}
            </span>
            {showActions && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(expense)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(expense)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
