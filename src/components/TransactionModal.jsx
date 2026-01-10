import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';

export default function TransactionModal({ isOpen, onClose }) {
    const { categories, catColors, addTransaction } = useApp();
    const [display, setDisplay] = useState('0');
    const [title, setTitle] = useState('');;
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');

    // Filter categories based on selected type
    const filteredCategories = useMemo(() => {
        return categories.filter(cat => cat.type === type);
    }, [categories, type]);

    // Reset category when type changes
    useEffect(() => {
        const firstCat = filteredCategories[0];
        if (firstCat) {
            setCategory(firstCat.name);
        } else {
            setCategory('');
        }
    }, [type, filteredCategories]);

    if (!isOpen) return null;

    const handleNumpad = (val) => {
        if (val === 'DEL') {
            setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        } else if (val === 'C') {
            setDisplay('0');
        } else {
            setDisplay(prev => prev === '0' && val !== '+' ? val : prev + val);
        }
    };

    const calculateTotal = () => {
        try {
            const total = display.split('+').reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
            return total;
        } catch { return 0; }
    };

    const currentTotal = calculateTotal();

    const handleSave = async () => {
        if (currentTotal === 0 || !title || !category) return;
        try {
            await addTransaction({
                title,
                amount: currentTotal,
                category,
                type,
                date: new Date().toISOString().split('T')[0]
            });
            toast.success('Transaksi berhasil disimpan');
            setDisplay('0');
            setTitle('');
            onClose();
        } catch (err) {
            console.error('Failed to save transaction:', err);
            toast.error('Gagal menyimpan transaksi. Coba lagi.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
            <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[24px] overflow-hidden flex flex-col max-h-[95vh] shadow-2xl">
                <div className="p-6 flex justify-between items-center border-b border-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Entry Keuangan</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="text-right py-4 border-b-2 border-indigo-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nilai Input</p>
                        <div className="text-4xl font-black text-gray-900 break-all">
                            {display.includes('+') ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-lg text-gray-300">{display}</span>
                                    <span>{formatCurrency(currentTotal)}</span>
                                </div>
                            ) : formatCurrency(parseFloat(display) || 0)}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setType('expense')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'
                                    }`}
                            >
                                Pengeluaran
                            </button>
                            <button
                                onClick={() => setType('income')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'
                                    }`}
                            >
                                Pemasukan
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Catatan transaksi..."
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.name)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${category === cat.name ? 'text-white shadow-md' : 'text-gray-600 opacity-60'
                                            }`}
                                        style={{
                                            backgroundColor: category === cat.name
                                                ? (catColors[cat.name] || '#6366F1')
                                                : `${catColors[cat.name] || '#6366F1'}30`
                                        }}
                                    >
                                        {cat.name}
                                    </button>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 py-2">
                                    Belum ada kategori untuk {type === 'expense' ? 'pengeluaran' : 'pemasukan'}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, '+', 4, 5, 6, 'C', 7, 8, 9, 'DEL', '000', 0, '.', 'OK'].map((key) => (
                            <button
                                key={key}
                                onClick={() => key === 'OK' ? handleSave() : handleNumpad(key.toString())}
                                className={`h-14 rounded-2xl text-xl font-bold transition-all flex items-center justify-center ${key === 'OK'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : key === '+' || key === 'C' || key === 'DEL'
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
