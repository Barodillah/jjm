import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, TrendingUp, TrendingDown, PieChart, Wallet, Send, MessageCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { formatMessage } from '../utils/textFormatter';

const QUICK_QUESTIONS = [
    { id: 1, text: 'Total pengeluaran bulan ini?', icon: TrendingDown },
    { id: 2, text: 'Kategori paling boros?', icon: PieChart },
    { id: 3, text: 'Perbandingan income vs expense?', icon: Wallet },
    { id: 4, text: 'Tips hemat bulan depan?', icon: Sparkles },
];

export default function AIChatModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { transactions, stats, catColors } = useApp();
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    // Generate AI Analysis
    const analysis = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const incomes = transactions.filter(t => t.type === 'income');

        // Find top expense category
        const expenseByCategory = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const topExpenseCategory = Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])[0];

        // Find top income category
        const incomeByCategory = incomes.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const topIncomeCategory = Object.entries(incomeByCategory)
            .sort((a, b) => b[1] - a[1])[0];

        // Calculate savings rate
        const savingsRate = stats.totalIncome > 0
            ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1)
            : 0;

        return {
            topExpenseCategory,
            topIncomeCategory,
            savingsRate,
            totalTransactions: transactions.length,
            isPositive: stats.totalBalance >= 0,
        };
    }, [transactions, stats]);

    // Generate response based on question
    const getResponse = (questionId) => {
        switch (questionId) {
            case 1:
                return `Total pengeluaran bulan ini adalah **${formatCurrency(stats.totalExpense)}**. ${analysis.topExpenseCategory
                    ? `Kategori terbesar: ${analysis.topExpenseCategory[0]} (${formatCurrency(analysis.topExpenseCategory[1])})`
                    : 'Belum ada data pengeluaran.'
                    }`;
            case 2:
                return analysis.topExpenseCategory
                    ? `Kategori paling boros adalah **${analysis.topExpenseCategory[0]}** dengan total **${formatCurrency(analysis.topExpenseCategory[1])}**. Coba kurangi pengeluaran di kategori ini untuk menghemat lebih banyak!`
                    : 'Belum ada data pengeluaran untuk dianalisis.';
            case 3:
                const diff = stats.totalIncome - stats.totalExpense;
                const status = diff >= 0 ? 'surplus' : 'defisit';
                return `Income: **${formatCurrency(stats.totalIncome)}**\nExpense: **${formatCurrency(stats.totalExpense)}**\n\nKamu ${status} **${formatCurrency(Math.abs(diff))}** bulan ini. ${diff >= 0 ? '🎉 Great job!' : '⚠️ Coba kurangi pengeluaran!'
                    }`;
            case 4:
                if (!analysis.topExpenseCategory) {
                    return 'Tambahkan beberapa transaksi terlebih dahulu agar saya bisa memberikan tips yang relevan!';
                }
                return `💡 Tips untuk bulan depan:\n\n1. Kurangi pengeluaran di **${analysis.topExpenseCategory[0]}** (paling besar)\n2. Target savings rate: minimal 20%\n3. Catat setiap transaksi kecil\n4. Review pengeluaran mingguan`;
            default:
                return 'Pilih salah satu pertanyaan di atas untuk mendapatkan insight!';
        }
    };

    const handleQuestionClick = (question) => {
        setIsTyping(true);
        setSelectedQuestion(null);

        setTimeout(() => {
            setIsTyping(false);
            setSelectedQuestion(question);
        }, 800);
    };

    const handleGoToAIPage = () => {
        onClose();
        navigate('/ai');
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4" onClick={onClose}>
            {/* Modal */}
            <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[24px] overflow-hidden flex flex-col max-h-[95vh] shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">AI Financial Assistant</h3>
                                <p className="text-xs text-indigo-100">Powered by MIMO AI</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Auto Analysis Card */}
                <div className="p-4">
                    <div className={`p-4 rounded-2xl ${analysis.isPositive ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                        <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${analysis.isPositive ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                                {analysis.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            </div>
                            <div className="flex-1">
                                <p className={`text-xs font-bold uppercase tracking-wide ${analysis.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    Analisis Terbaru
                                </p>
                                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                    {analysis.isPositive
                                        ? `Keuanganmu sehat! Saldo positif dengan savings rate ${analysis.savingsRate}%.`
                                        : `Perhatian! Pengeluaran melebihi pemasukan. Coba evaluasi kembali.`
                                    }
                                    {analysis.topExpenseCategory && (
                                        <span className="block mt-1 text-gray-500">
                                            Pengeluaran terbesar: <strong>{analysis.topExpenseCategory[0]}</strong>
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Questions */}
                <div className="px-4 pb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Quick Questions</p>
                    <div className="grid grid-cols-2 gap-2">
                        {QUICK_QUESTIONS.map((q) => (
                            <button
                                key={q.id}
                                onClick={() => handleQuestionClick(q)}
                                className={`p-3 rounded-xl text-left transition-all ${selectedQuestion?.id === q.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-50 hover:bg-indigo-50 text-gray-700'
                                    }`}
                            >
                                <q.icon size={16} className={selectedQuestion?.id === q.id ? 'text-indigo-200' : 'text-indigo-500'} />
                                <p className="text-xs font-medium mt-2 leading-tight">{q.text}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Response Area */}
                <div className="p-4 min-h-[80px]">
                    {isTyping ? (
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-sm">AI sedang mengetik...</span>
                        </div>
                    ) : selectedQuestion ? (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <MessageCircle size={12} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-700">
                                        {formatMessage(getResponse(selectedQuestion.id))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-xs text-gray-400">Pilih pertanyaan di atas untuk mendapatkan insight 👆</p>
                        </div>
                    )}
                </div>

                {/* Manual Input - Navigate to AI Page */}
                <div className="p-4 pt-0">
                    <button
                        onClick={handleGoToAIPage}
                        className="w-full flex items-center gap-3 bg-gray-100 hover:bg-indigo-50 rounded-xl px-4 py-3 transition-all group"
                    >
                        <div className="flex-1 text-left">
                            <p className="text-sm text-gray-500 group-hover:text-indigo-600">Ketik pertanyaan manual...</p>
                        </div>
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowRight size={16} className="text-white" />
                        </div>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
