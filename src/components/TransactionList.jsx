import { useMemo } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import TransactionItem from './TransactionItem';

export default function TransactionList({ transactions, onDelete, onEdit }) {
    const groupedTransactions = useMemo(() => {
        const groups = {};

        transactions.forEach(tx => {
            const dateKey = new Date(tx.date).toLocaleDateString();
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: tx.date,
                    items: [],
                    totalIncome: 0,
                    totalExpense: 0
                };
            }
            groups[dateKey].items.push(tx);
            if (tx.type === 'income') {
                groups[dateKey].totalIncome += Number(tx.amount);
            } else {
                groups[dateKey].totalExpense += Number(tx.amount);
            }
        });

        // Sort groups by date descending (assuming recent first)
        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions]);

    if (!transactions || transactions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            {groupedTransactions.map((group) => {
                const balance = group.totalIncome - group.totalExpense;

                return (
                    <div key={group.date} className="space-y-3">
                        {/* Group Header */}
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div>
                                <p className="font-bold text-gray-700 text-sm">
                                    {formatDate(group.date)}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                                <div className="text-right">
                                    <p className="text-emerald-500">+{formatCurrency(group.totalIncome).replace('Rp', '').trim()}</p>
                                    <p className="text-rose-500">-{formatCurrency(group.totalExpense).replace('Rp', '').trim()}</p>
                                </div>
                                <div className="text-right border-l pl-4 border-gray-200">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Balance</p>
                                    <p className={`text-sm ${balance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                        {formatCurrency(balance)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transactions List */}
                        <div className="space-y-3">
                            {group.items.map((tx) => (
                                <TransactionItem
                                    key={tx.id}
                                    tx={tx}
                                    onDelete={() => onDelete(tx.id)}
                                    onEdit={() => onEdit(tx)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
