import { useMemo, useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Calendar, ChevronDown, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import DateInput from '../components/DateInput';

export default function AnalysisPage() {
    const { transactions, catColors } = useApp();
    const [activeTab, setActiveTab] = useState('expense');
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [dateFilter, setDateFilter] = useState('month'); // 'week' | 'month' | 'year' | 'all' | 'custom'
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

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
            default: // 'all'
                return { start: null, end: null };
        }
    };

    // Filter transactions by date range
    const filteredTransactions = useMemo(() => {
        const range = getDateRange();
        if (!range.start && !range.end) return transactions;

        return transactions.filter(t => {
            const txDate = new Date(t.date);
            if (range.start && txDate < range.start) return false;
            if (range.end && txDate > range.end) return false;
            return true;
        });
    }, [transactions, dateFilter, customRange]);

    const expenseData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.type === 'expense');
        const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        const groups = expenses.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});

        let lastPercentage = 0;
        return Object.entries(groups)
            .map(([name, amount]) => {
                const percent = total > 0 ? (amount / total) * 100 : 0;
                const start = lastPercentage;
                lastPercentage += percent;
                return { name, amount, percent, color: catColors[name] || '#CBD5E1', start };
            })
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions, catColors]);

    const incomeData = useMemo(() => {
        const incomes = filteredTransactions.filter(t => t.type === 'income');
        const total = incomes.reduce((acc, curr) => acc + curr.amount, 0);

        const groups = incomes.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});

        let lastPercentage = 0;
        return Object.entries(groups)
            .map(([name, amount]) => {
                const percent = total > 0 ? (amount / total) * 100 : 0;
                const start = lastPercentage;
                lastPercentage += percent;
                return { name, amount, percent, color: catColors[name] || '#34D399', start };
            })
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions, catColors]);

    const activeData = activeTab === 'expense' ? expenseData : incomeData;
    const totalAmount = activeData.reduce((acc, curr) => acc + curr.amount, 0);

    // Recalculate start positions based on sorted order
    const sortedData = useMemo(() => {
        let lastPercentage = 0;
        return activeData.map(d => {
            const start = lastPercentage;
            lastPercentage += d.percent;
            return { ...d, start };
        });
    }, [activeData]);

    // Calculate SVG arc path for interactive segments
    const getArcPath = (startAngle, endAngle, innerRadius, outerRadius) => {
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = 100 + outerRadius * Math.cos(startRad);
        const y1 = 100 + outerRadius * Math.sin(startRad);
        const x2 = 100 + outerRadius * Math.cos(endRad);
        const y2 = 100 + outerRadius * Math.sin(endRad);
        const x3 = 100 + innerRadius * Math.cos(endRad);
        const y3 = 100 + innerRadius * Math.sin(endRad);
        const x4 = 100 + innerRadius * Math.cos(startRad);
        const y4 = 100 + innerRadius * Math.sin(startRad);

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    };

    const hoveredItem = sortedData.find(d => d.name === hoveredSegment);

    // Get transactions for selected/hovered category
    const categoryTransactions = useMemo(() => {
        const categoryName = selectedCategory || hoveredSegment;
        if (!categoryName) return [];

        const type = activeTab === 'expense' ? 'expense' : 'income';
        const categoryTxs = filteredTransactions.filter(
            t => t.type === type && t.category === categoryName
        );

        const categoryTotal = categoryTxs.reduce((acc, curr) => acc + curr.amount, 0);

        return categoryTxs
            .map(tx => ({
                ...tx,
                percentOfCategory: categoryTotal > 0 ? (tx.amount / categoryTotal) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions, activeTab, selectedCategory, hoveredSegment]);

    const activeCategoryName = selectedCategory || hoveredSegment;
    const activeCategoryData = sortedData.find(d => d.name === activeCategoryName);

    const quickFilters = [
        { key: 'week', label: 'Minggu Ini' },
        { key: 'month', label: 'Bulan Ini' },
        { key: 'year', label: 'Tahun Ini' },
        { key: 'all', label: 'Semua' },
    ];

    const getFilterLabel = () => {
        const filter = quickFilters.find(f => f.key === dateFilter);
        if (filter) return filter.label;
        if (dateFilter === 'custom' && customRange.start && customRange.end) {
            return `${customRange.start} - ${customRange.end}`;
        }
        return 'Pilih Tanggal';
    };

    const handleApplyCustomRange = () => {
        if (customRange.start && customRange.end) {
            setDateFilter('custom');
            setShowDatePicker(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Date Filter */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-gray-800">Analisis Keuangan</h4>
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        <Calendar size={14} />
                        <span className="max-w-[100px] truncate">{getFilterLabel()}</span>
                        <ChevronDown size={14} className={`transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Date Filter Panel */}
                {showDatePicker && (
                    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Quick Filters */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Filter</p>
                            <div className="flex flex-wrap gap-2">
                                {quickFilters.map(filter => (
                                    <button
                                        key={filter.key}
                                        onClick={() => { setDateFilter(filter.key); setShowDatePicker(false); }}
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
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Range</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-400 mb-1 block">Dari</label>
                                    <DateInput
                                        value={customRange.start}
                                        onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                        placeholder="Pilih tanggal"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-400 mb-1 block">Sampai</label>
                                    <DateInput
                                        value={customRange.end}
                                        onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                        placeholder="Pilih tanggal"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleApplyCustomRange}
                                        disabled={!customRange.start || !customRange.end}
                                        className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                                    >
                                        Terapkan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setShowDatePicker(false)}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X size={16} className="text-gray-400" />
                        </button>
                    </div>
                )}

                {/* Active Filter Badge */}
                {dateFilter === 'custom' && customRange.start && customRange.end && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Filter aktif:</span>
                        <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                            <Calendar size={12} />
                            <span>{customRange.start} → {customRange.end}</span>
                            <button
                                onClick={() => { setDateFilter('month'); setCustomRange({ start: '', end: '' }); }}
                                className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                    onClick={() => { setActiveTab('expense'); setHoveredSegment(null); setSelectedCategory(null); }}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'
                        }`}
                >
                    <ArrowDownLeft size={18} />
                    Pengeluaran
                </button>
                <button
                    onClick={() => { setActiveTab('income'); setHoveredSegment(null); setSelectedCategory(null); }}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'
                        }`}
                >
                    <ArrowUpRight size={18} />
                    Pemasukan
                </button>
            </div>

            {/* Pie Chart Container */}
            <div className="bg-white rounded-[32px] p-4 sm:p-8 shadow-sm border border-gray-50 flex flex-col items-center relative">
                {/* Interactive SVG Pie Chart */}
                <div className="relative w-full max-w-[280px] aspect-square">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
                        {/* Background circle */}
                        <circle cx="100" cy="100" r="90" fill="#F3F4F6" />

                        {/* Pie segments */}
                        {sortedData.map((item, index) => {
                            const startAngle = (item.start / 100) * 360;
                            const endAngle = ((item.start + item.percent) / 100) * 360;
                            const isHovered = hoveredSegment === item.name;
                            const innerRadius = isHovered ? 52 : 55;
                            const outerRadius = isHovered ? 95 : 90;

                            return (
                                <path
                                    key={item.name}
                                    d={getArcPath(startAngle, endAngle, innerRadius, outerRadius)}
                                    fill={item.color}
                                    className="transition-all duration-300 cursor-pointer"
                                    style={{
                                        filter: isHovered ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' : 'none',
                                        opacity: hoveredSegment && !isHovered ? 0.5 : 1,
                                    }}
                                    onMouseEnter={() => setHoveredSegment(item.name)}
                                    onMouseLeave={() => setHoveredSegment(null)}
                                    onTouchStart={() => setHoveredSegment(item.name)}
                                    onTouchEnd={() => setHoveredSegment(null)}
                                />
                            );
                        })}

                        {/* Inner white circle for doughnut effect */}
                        <circle cx="100" cy="100" r="50" fill="white" className="drop-shadow-inner" />
                    </svg>

                    {/* Center content - changes on hover */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center transition-all duration-300">
                            {hoveredItem ? (
                                <>
                                    <div
                                        className="w-3 h-3 rounded-full mx-auto mb-1"
                                        style={{ backgroundColor: hoveredItem.color }}
                                    />
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide max-w-[80px] truncate">
                                        {hoveredItem.name}
                                    </p>
                                    <p className="text-lg font-black text-gray-800">
                                        {hoveredItem.percent.toFixed(1)}%
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        {formatCurrency(hoveredItem.amount)}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {activeTab === 'expense' ? 'Total Out' : 'Total In'}
                                    </p>
                                    <p className={`text-lg sm:text-xl font-black ${activeTab === 'expense' ? 'text-gray-800' : 'text-emerald-600'}`}>
                                        {formatCurrency(totalAmount)}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {sortedData.length} kategori
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Legend - Interactive */}
                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                    {sortedData.map(item => (
                        <div
                            key={item.name}
                            className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-200 cursor-pointer ${selectedCategory === item.name
                                ? `ring-2 ${activeTab === 'expense' ? 'ring-rose-400 bg-rose-50' : 'ring-emerald-400 bg-emerald-50'} scale-[1.02] shadow-sm`
                                : hoveredSegment === item.name
                                    ? 'bg-gray-50 scale-[1.02] shadow-sm'
                                    : (hoveredSegment || selectedCategory) ? 'opacity-50' : 'hover:bg-gray-50'
                                }`}
                            onMouseEnter={() => setHoveredSegment(item.name)}
                            onMouseLeave={() => setHoveredSegment(null)}
                            onClick={() => setSelectedCategory(prev => prev === item.name ? null : item.name)}
                        >
                            <div
                                className={`w-4 h-4 rounded-full transition-transform duration-200 ${(hoveredSegment === item.name || selectedCategory === item.name) ? 'scale-125' : ''}`}
                                style={{ backgroundColor: item.color }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 leading-none mb-1 truncate">{item.name}</p>
                                <div className="flex justify-between items-end gap-2">
                                    <p className="text-[10px] text-gray-400 font-medium truncate">{formatCurrency(item.amount)}</p>
                                    <p className={`text-[10px] font-black flex-shrink-0 ${activeTab === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {item.percent.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Category Transaction List */}
                {(activeCategoryName && categoryTransactions.length > 0) && (
                    <div className="w-full mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: activeCategoryData?.color }}
                                />
                                <p className="text-sm font-bold text-gray-800">
                                    {activeCategoryName}
                                </p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeTab === 'expense'
                                    ? 'bg-rose-100 text-rose-600'
                                    : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {activeCategoryData?.percent.toFixed(1)}%
                                </span>
                            </div>
                            {selectedCategory && (
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                                >
                                    <X size={14} />
                                    Tutup
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {categoryTransactions.map((tx, index) => (
                                <div
                                    key={tx.id || index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-700 truncate">
                                            {tx.description || tx.name || 'Transaksi'}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(tx.date).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className={`text-xs font-bold ${activeTab === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                                            }`}>
                                            {formatCurrency(tx.amount)}
                                        </p>
                                        <div className="flex items-center justify-end gap-1">
                                            <div
                                                className={`h-1 rounded-full ${activeTab === 'expense' ? 'bg-rose-400' : 'bg-emerald-400'
                                                    }`}
                                                style={{ width: `${Math.max(tx.percentOfCategory, 5)}%`, maxWidth: '40px' }}
                                            />
                                            <p className={`text-[10px] font-bold ${activeTab === 'expense' ? 'text-rose-500' : 'text-emerald-500'
                                                }`}>
                                                {tx.percentOfCategory.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <p className="text-[10px] text-gray-400">
                                {categoryTransactions.length} transaksi
                            </p>
                            <p className={`text-xs font-bold ${activeTab === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                                }`}>
                                Total: {formatCurrency(activeCategoryData?.amount || 0)}
                            </p>
                        </div>
                    </div>
                )}

                {activeData.length === 0 && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            {activeTab === 'expense' ? <ArrowDownLeft size={32} className="text-gray-300" /> : <ArrowUpRight size={32} className="text-gray-300" />}
                        </div>
                        <p className="text-gray-400 font-medium">Belum ada data {activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'}</p>
                        <p className="text-gray-300 text-sm mt-1">untuk periode {getFilterLabel().toLowerCase()}</p>
                    </div>
                )}
            </div>

            {/* Summary Insights */}
            {activeData[0] && (
                <div className={`${activeTab === 'expense' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500'} rounded-3xl p-6 text-white flex items-center gap-4 shadow-lg`}>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className={`text-xs font-bold ${activeTab === 'expense' ? 'text-indigo-100' : 'text-emerald-100'}`}>
                            Insight Keuangan ({getFilterLabel()})
                        </p>
                        <p className="text-sm font-medium leading-relaxed">
                            {activeTab === 'expense'
                                ? <>Pengeluaran terbesarmu ada pada kategori <span className="font-bold underline">"{activeData[0]?.name}"</span> ({activeData[0]?.percent.toFixed(1)}%). Coba kurangi sedikit di bulan depan!</>
                                : <>Sumber pemasukan terbesarmu ada pada kategori <span className="font-bold underline">"{activeData[0]?.name}"</span> ({activeData[0]?.percent.toFixed(1)}%). Pertahankan dan tingkatkan!</>
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
