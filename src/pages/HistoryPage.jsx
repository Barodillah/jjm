import { useState, useMemo } from 'react';
import { Filter, X, Calendar, ChevronDown, ArrowUpRight, ArrowDownLeft, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BalanceCard from '../components/BalanceCard';
import TransactionItem from '../components/TransactionItem';
import EditTransactionModal from '../components/EditTransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import DateInput from '../components/DateInput';

export default function HistoryPage() {
    const { transactions, deleteTransaction, categories, catColors } = useApp();
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const handleDelete = async () => {
        if (transactionToDelete) {
            await deleteTransaction(transactionToDelete);
            toast.success('Transaksi berhasil dihapus');
            setTransactionToDelete(null);
        }
    };

    // Filter states
    const [dateFilter, setDateFilter] = useState('all'); // 'week' | 'month' | 'year' | 'all' | 'custom'
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
    const [selectedCategories, setSelectedCategories] = useState([]);

    // Get date range based on filter
    const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (dateFilter) {
            case 'week': {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                return { start: startOfWeek, end: now };
            }
            case 'month': {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return { start: startOfMonth, end: now };
            }
            case 'year': {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                return { start: startOfYear, end: now };
            }
            case 'custom': {
                return {
                    start: customRange.start ? new Date(customRange.start) : null,
                    end: customRange.end ? new Date(customRange.end + 'T23:59:59') : null
                };
            }
            default:
                return { start: null, end: null };
        }
    };

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        const range = getDateRange();

        return transactions.filter(t => {
            // Date filter
            if (range.start || range.end) {
                const txDate = new Date(t.date);
                if (range.start && txDate < range.start) return false;
                if (range.end && txDate > range.end) return false;
            }

            // Type filter
            if (typeFilter !== 'all' && t.type !== typeFilter) return false;

            // Category filter
            if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;

            return true;
        });
    }, [transactions, dateFilter, customRange, typeFilter, selectedCategories]);

    // Get unique categories from transactions
    const availableCategories = useMemo(() => {
        const cats = new Set(transactions.map(t => t.category));
        return [...cats];
    }, [transactions]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (dateFilter !== 'all') count++;
        if (typeFilter !== 'all') count++;
        if (selectedCategories.length > 0) count++;
        return count;
    }, [dateFilter, typeFilter, selectedCategories]);

    const toggleCategory = (cat) => {
        setSelectedCategories(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
    };

    const clearAllFilters = () => {
        setDateFilter('all');
        setCustomRange({ start: '', end: '' });
        setTypeFilter('all');
        setSelectedCategories([]);
    };

    const quickFilters = [
        { key: 'all', label: 'Semua' },
        { key: 'week', label: 'Minggu Ini' },
        { key: 'month', label: 'Bulan Ini' },
        { key: 'year', label: 'Tahun Ini' },
    ];

    const handleApplyCustomRange = () => {
        if (customRange.start && customRange.end) {
            setDateFilter('custom');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <BalanceCard />

            {/* Header with Filter Button */}
            <div className="flex items-center justify-between sticky top-16 md:top-24 bg-[#F9FAFB]/90 backdrop-blur-sm z-20 py-2">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-gray-800">Riwayat</h4>
                    {activeFilterCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg border transition-all ${showFilters
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'
                        }`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h5 className="font-bold text-gray-800">Filter Transaksi</h5>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs font-medium text-rose-500 hover:text-rose-600"
                            >
                                Reset Semua
                            </button>
                        )}
                    </div>

                    {/* Transaction Type Filter */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tipe Transaksi</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTypeFilter('all')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${typeFilter === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setTypeFilter('expense')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${typeFilter === 'expense'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                <ArrowDownLeft size={16} />
                                Keluar
                            </button>
                            <button
                                onClick={() => setTypeFilter('income')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${typeFilter === 'income'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                <ArrowUpRight size={16} />
                                Masuk
                            </button>
                        </div>
                    </div>

                    {/* Date Quick Filters */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            <Calendar size={12} className="inline mr-1" />
                            Periode
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {quickFilters.map(filter => (
                                <button
                                    key={filter.key}
                                    onClick={() => { setDateFilter(filter.key); setCustomRange({ start: '', end: '' }); }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${dateFilter === filter.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Range Tanggal</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                                <DateInput
                                    value={customRange.start}
                                    onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                    placeholder="Dari"
                                />
                            </div>
                            <div className="flex-1">
                                <DateInput
                                    value={customRange.end}
                                    onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                    placeholder="Sampai"
                                />
                            </div>
                            <button
                                onClick={handleApplyCustomRange}
                                disabled={!customRange.start || !customRange.end}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kategori</p>
                            {selectedCategories.length > 0 && (
                                <button
                                    onClick={() => setSelectedCategories([])}
                                    className="text-[10px] font-medium text-indigo-500"
                                >
                                    Clear ({selectedCategories.length})
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pb-1">
                            {availableCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => toggleCategory(cat)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${selectedCategories.includes(cat)
                                        ? 'text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    style={{
                                        backgroundColor: selectedCategories.includes(cat)
                                            ? (catColors[cat] || '#6366F1')
                                            : undefined
                                    }}
                                >
                                    {selectedCategories.includes(cat) && <Check size={12} />}
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={() => setShowFilters(false)}
                        className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={16} />
                        Tutup Filter
                    </button>
                </div>
            )}

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && !showFilters && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
                    <span className="text-xs text-gray-400">Filter aktif:</span>

                    {typeFilter !== 'all' && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeFilter === 'expense' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {typeFilter === 'expense' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {typeFilter === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
                            <button onClick={() => setTypeFilter('all')} className="hover:bg-black/10 rounded-full p-0.5">
                                <X size={10} />
                            </button>
                        </span>
                    )}

                    {dateFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium">
                            <Calendar size={12} />
                            {dateFilter === 'custom'
                                ? `${customRange.start} - ${customRange.end}`
                                : quickFilters.find(f => f.key === dateFilter)?.label
                            }
                            <button onClick={() => { setDateFilter('all'); setCustomRange({ start: '', end: '' }); }} className="hover:bg-black/10 rounded-full p-0.5">
                                <X size={10} />
                            </button>
                        </span>
                    )}

                    {selectedCategories.length > 0 && (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                            {selectedCategories.length} kategori
                            <button onClick={() => setSelectedCategories([])} className="hover:bg-black/10 rounded-full p-0.5">
                                <X size={10} />
                            </button>
                        </span>
                    )}

                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-medium text-gray-400 hover:text-rose-500 underline"
                    >
                        Hapus semua
                    </button>
                </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                    Menampilkan <span className="font-bold text-gray-600">{filteredTransactions.length}</span> dari {transactions.length} transaksi
                </p>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                        <TransactionItem
                            key={tx.id}
                            tx={tx}
                            onDelete={() => setTransactionToDelete(tx.id)}
                            onEdit={(tx) => setEditingTransaction(tx)}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Filter size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Tidak ada transaksi</p>
                        <p className="text-gray-400 text-sm mt-1">Coba ubah filter untuk hasil berbeda</p>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                )}
            </div>

            <EditTransactionModal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                transaction={editingTransaction}
            />

            <ConfirmDialog
                isOpen={!!transactionToDelete}
                onClose={() => setTransactionToDelete(null)}
                onConfirm={handleDelete}
                title="Hapus Transaksi?"
                message="Transaksi yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?"
                confirmText="Hapus"
                isDestructive={true}
            />
        </div>
    );
}
