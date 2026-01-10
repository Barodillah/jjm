import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import EditTransactionModal from './EditTransactionModal';
import ChangePinModal from './ChangePinModal';

export default function Header() {
    const { isScrolled, transactions, catColors } = useApp();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isChangePinOpen, setIsChangePinOpen] = useState(false);
    const inputRef = useRef(null);

    // Focus input when search opens
    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Filter transactions by keyword
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return transactions.filter(t =>
            t.title.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query)
        ).slice(0, 5); // Limit to 5 results
    }, [searchQuery, transactions]);

    const handleClose = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    const handleTransactionClick = (tx) => {
        setEditingTransaction(tx);
        handleClose();
    };

    return (
        <>
            <header className={`sticky top-0 z-30 transition-all duration-300 w-full px-4 pt-2 pb-2 pt-safe-area ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
                }`}>
                <div className="flex items-center justify-between max-w-md mx-auto md:max-w-none">
                    {/* Left side - Logo/Profile - Clickable for PIN change */}
                    <div
                        onClick={() => setIsChangePinOpen(true)}
                        className={`flex items-center gap-3 transition-all duration-300 cursor-pointer hover:opacity-80 ${isSearchOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">JJ</div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter leading-none">Hello,</p>
                            <p className="text-sm font-black text-gray-800">Jeje</p>
                        </div>
                    </div>

                    {/* Search Area */}
                    <div className={`flex items-center gap-2 transition-all duration-300 ${isSearchOpen ? 'flex-1' : ''}`}>
                        {isSearchOpen ? (
                            <div className="flex-1 flex items-center gap-2 bg-white rounded-full shadow-lg border border-gray-100 px-4 py-2">
                                <Search size={18} className="text-gray-400 flex-shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari transaksi..."
                                    className="flex-1 outline-none text-sm bg-transparent"
                                />
                                <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={18} className="text-gray-400" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-all"
                            >
                                <Search size={20} className="text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && searchQuery.trim() && (
                    <div className="absolute left-4 right-4 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-md mx-auto md:max-w-none">
                        {searchResults.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {searchResults.map(tx => (
                                    <div
                                        key={tx.id}
                                        onClick={() => handleTransactionClick(tx)}
                                        className="p-3 flex items-center gap-3 hover:bg-indigo-50 transition-colors cursor-pointer active:bg-indigo-100"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${catColors[tx.category] || '#6366F1'}20` }}
                                        >
                                            {tx.type === 'income'
                                                ? <TrendingUp size={18} style={{ color: catColors[tx.category] || '#10B981' }} />
                                                : <TrendingDown size={18} style={{ color: catColors[tx.category] || '#EF4444' }} />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{tx.title}</p>
                                            <p className="text-xs text-gray-400">{tx.category} • {formatDate(tx.date)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </p>
                                            <p className="text-[10px] text-indigo-500 font-medium">Tap untuk edit</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center">
                                <p className="text-gray-400 text-sm">Tidak ada transaksi ditemukan</p>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Edit Transaction Modal */}
            <EditTransactionModal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                transaction={editingTransaction}
            />

            {/* Change PIN Modal */}
            <ChangePinModal
                isOpen={isChangePinOpen}
                onClose={() => setIsChangePinOpen(false)}
            />
        </>
    );
}
