import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Send, TrendingUp, TrendingDown, MessageCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';

export default function AIPage() {
    const navigate = useNavigate();
    const { transactions, stats, catColors } = useApp();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Generate AI Analysis
    const analysis = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const incomes = transactions.filter(t => t.type === 'income');

        const expenseByCategory = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const topExpenseCategory = Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])[0];

        const incomeByCategory = incomes.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const topIncomeCategory = Object.entries(incomeByCategory)
            .sort((a, b) => b[1] - a[1])[0];

        const savingsRate = stats.totalIncome > 0
            ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1)
            : 0;

        return {
            topExpenseCategory,
            topIncomeCategory,
            savingsRate,
            isPositive: stats.totalBalance >= 0,
        };
    }, [transactions, stats]);

    // Add initial welcome message
    useEffect(() => {
        const welcomeMessage = {
            id: Date.now(),
            type: 'ai',
            text: `Halo! 👋 Saya AI Financial Assistant kamu.\n\n${analysis.isPositive
                ? `Keuanganmu sehat dengan savings rate ${analysis.savingsRate}%!`
                : 'Perhatian! Pengeluaran melebihi pemasukan.'
                }\n\nAda yang bisa saya bantu? Tanyakan saja tentang keuanganmu.`
        };
        setMessages([welcomeMessage]);
    }, []);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Generate AI response based on user question
    const generateResponse = (question) => {
        const q = question.toLowerCase();

        if (q.includes('pengeluaran') || q.includes('expense') || q.includes('keluar')) {
            return `Total pengeluaran bulan ini: **${formatCurrency(stats.totalExpense)}**\n\n${analysis.topExpenseCategory
                ? `Kategori terbesar: ${analysis.topExpenseCategory[0]} (${formatCurrency(analysis.topExpenseCategory[1])})`
                : 'Belum ada data pengeluaran.'
                }`;
        }

        if (q.includes('pemasukan') || q.includes('income') || q.includes('masuk') || q.includes('gaji')) {
            return `Total pemasukan bulan ini: **${formatCurrency(stats.totalIncome)}**\n\n${analysis.topIncomeCategory
                ? `Sumber terbesar: ${analysis.topIncomeCategory[0]} (${formatCurrency(analysis.topIncomeCategory[1])})`
                : 'Belum ada data pemasukan.'
                }`;
        }

        if (q.includes('saldo') || q.includes('balance') || q.includes('total')) {
            return `Saldo saat ini: **${formatCurrency(stats.totalBalance)}**\n\nIncome: ${formatCurrency(stats.totalIncome)}\nExpense: ${formatCurrency(stats.totalExpense)}`;
        }

        if (q.includes('boros') || q.includes('terbesar') || q.includes('paling')) {
            return analysis.topExpenseCategory
                ? `Kategori paling boros: **${analysis.topExpenseCategory[0]}** dengan total **${formatCurrency(analysis.topExpenseCategory[1])}**\n\nCoba kurangi pengeluaran di kategori ini!`
                : 'Belum ada data pengeluaran.';
        }

        if (q.includes('tips') || q.includes('saran') || q.includes('hemat')) {
            return `💡 Tips Keuangan:\n\n1. ${analysis.topExpenseCategory ? `Kurangi ${analysis.topExpenseCategory[0]}` : 'Catat semua transaksi'}\n2. Target savings rate: 20%\n3. Buat budget bulanan\n4. Review pengeluaran mingguan\n5. Hindari impulse buying`;
        }

        if (q.includes('halo') || q.includes('hai') || q.includes('hello') || q.includes('hi')) {
            return 'Halo! 👋 Ada yang bisa saya bantu tentang keuanganmu?';
        }

        return `Saya mengerti pertanyaan tentang "${question}".\n\nBerikut ringkasan keuanganmu:\n• Saldo: ${formatCurrency(stats.totalBalance)}\n• Income: ${formatCurrency(stats.totalIncome)}\n• Expense: ${formatCurrency(stats.totalExpense)}\n\nCoba tanya tentang: pengeluaran, pemasukan, saldo, tips hemat, atau kategori boros.`;
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Add user message
        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: inputValue.trim()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                id: Date.now() + 1,
                type: 'ai',
                text: generateResponse(userMessage.text)
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsTyping(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-700 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 pt-safe-area p-4 flex items-center gap-4 bg-gradient-to-r from-indigo-600 to-purple-700">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-lg">AI Financial Assistant</h1>
                        <p className="text-xs text-indigo-200">Always here to help</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-t-[32px] p-4 overflow-y-auto">
                <div className="space-y-4 pb-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-start gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.type === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                                    }`}>
                                    {msg.type === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                                </div>
                                <div className={`p-3 rounded-2xl ${msg.type === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-md'
                                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                                    }`}>
                                    <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                                <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-md">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 z-10 bg-white p-4 pb-safe-area border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ketik pertanyaan..."
                        className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
