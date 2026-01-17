import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Trash2, Edit2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

import { useApp } from '../context/AppContext';

export default function TransactionItem({ tx, onDelete, onEdit }) {
    const { catColors } = useApp();
    const [isSwiped, setIsSwiped] = useState(false);

    return (
        <div className="relative overflow-hidden rounded-2xl shadow-sm border border-gray-50">
            {/* Action buttons revealed on swipe */}
            <div className="absolute inset-0 flex items-center justify-end text-white">
                {/* Edit button (blue) */}
                <div className="h-full w-20 bg-indigo-500 flex items-center justify-center">
                    <button
                        onClick={() => {
                            setIsSwiped(false);
                            onEdit && onEdit(tx);
                        }}
                        className="flex flex-col items-center gap-1"
                    >
                        <Edit2 size={20} />
                        <span className="text-[10px] font-bold">Edit</span>
                    </button>
                </div>
                {/* Delete button (red) */}
                <div className="h-full w-20 bg-rose-500 flex items-center justify-center">
                    <button onClick={onDelete} className="flex flex-col items-center gap-1">
                        <Trash2 size={20} />
                        <span className="text-[10px] font-bold">Hapus</span>
                    </button>
                </div>
            </div>
            {/* Main content */}
            <div
                onClick={() => setIsSwiped(!isSwiped)}
                className={`relative bg-white p-4 flex items-center gap-4 transition-transform duration-300 cursor-pointer ${isSwiped ? '-translate-x-40' : 'translate-x-0'
                    }`}
            >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                    {tx.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                </div>
                <div className="flex-1">
                    <p className="font-bold text-gray-800 leading-tight mb-1 capitalize">{tx.title}</p>
                    <span
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white inline-block"
                        style={{ backgroundColor: catColors[tx.category] || '#9CA3AF' }}
                    >
                        {tx.category}
                    </span>
                </div>
                <div className="text-right">
                    <p className={`font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-800'}`}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount).replace('Rp', '').trim()}
                    </p>
                </div>
            </div>
        </div>
    );
}
