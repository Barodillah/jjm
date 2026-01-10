import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Send, TrendingUp, TrendingDown, User, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { chatApi } from '../services/api';

export default function AIPage() {
    const navigate = useNavigate();
    const { transactions, stats } = useApp();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const QUICK_QUESTIONS = [
        "Analisis pengeluaran bulan ini 📊",
        "Apakah keuanganku sehat? 🏥",
        "Saran berhemat dong 💡",
        "Total tabungan saat ini 💰"
    ];

    // Generate financial context for AI
    const financialContext = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const incomes = transactions.filter(t => t.type === 'income');

        const expenseByCategory = expenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const incomeByCategory = incomes.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const topExpenseCategory = Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])[0];

        const topIncomeCategory = Object.entries(incomeByCategory)
            .sort((a, b) => b[1] - a[1])[0];

        const savingsRate = stats.totalIncome > 0
            ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1)
            : 0;

        return `
- Total Saldo: ${formatCurrency(stats.totalBalance)}
- Total Pemasukan: ${formatCurrency(stats.totalIncome)}
- Total Pengeluaran: ${formatCurrency(stats.totalExpense)}
- Savings Rate: ${savingsRate}%
- Kategori pengeluaran terbesar: ${topExpenseCategory ? `${topExpenseCategory[0]} (${formatCurrency(topExpenseCategory[1])})` : 'Belum ada'}
- Kategori pemasukan terbesar: ${topIncomeCategory ? `${topIncomeCategory[0]} (${formatCurrency(topIncomeCategory[1])})` : 'Belum ada'}
- Jumlah transaksi: ${transactions.length}
`;
    }, [transactions, stats]);

    // Add initial welcome message
    useEffect(() => {
        const savingsRate = stats.totalIncome > 0
            ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1)
            : 0;
        const isPositive = stats.totalBalance >= 0;

        const welcomeMessage = {
            id: Date.now(),
            type: 'ai',
            text: `Halo! 👋 Saya AI Financial Assistant kamu.\n\n${isPositive
                ? `Keuanganmu sehat dengan savings rate ${savingsRate}%!`
                : 'Perhatian! Pengeluaran melebihi pemasukan.'
                }\n\nAda yang bisa saya bantu? Tanyakan saja tentang keuanganmu.`
        };
        setMessages([welcomeMessage]);
    }, [stats]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message to AI API
    const handleSend = async (text = null) => {
        const messageText = text || inputValue.trim();
        if (!messageText || isTyping) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: messageText
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await chatApi.sendMessage(userMessage.text, financialContext);
            console.log('✅ AI Raw Response:', response); // Debugging

            // API chat.js returns { response: "..." }
            // API chat.php (if exists) might return { message: "..." }
            const replyText = response.response || response.message;

            // Check if there is debug info from backend
            if (response.debug) {
                console.warn('⚠️ Backend Debug Info:', response.debug);
            }

            if (!replyText) {
                console.error('❌ Invalid response format:', response);
                throw new Error('Format respon tidak dikenali');
            }

            const aiResponse = {
                id: Date.now() + 1,
                type: 'ai',
                text: replyText
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('❌ AI Chat Error Detail:', error);
            const errorResponse = {
                id: Date.now() + 1,
                type: 'ai',
                text: `❌ Maaf, terjadi kesalahan.\nDebug: ${error.message}`
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = async () => {
        try {
            await chatApi.clearHistory();
            setMessages([{
                id: Date.now(),
                type: 'ai',
                text: 'Chat dibersihkan! 🧹 Ada yang bisa saya bantu?'
            }]);
        } catch (error) {
            console.error('Failed to clear chat:', error);
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
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-lg">AI Financial Assistant</h1>
                        <p className="text-xs text-indigo-200">Powered by MIMO AI</p>
                    </div>
                </div>
                <button
                    onClick={handleClearChat}
                    className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    title="Clear chat"
                >
                    <Trash2 size={18} />
                </button>
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

            {/* Quick Questions & Input Area */}
            <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100">
                {/* Quick Questions (Horizontal Scroll) */}
                <div className="px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2">
                        {QUICK_QUESTIONS.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(q)}
                                disabled={isTyping}
                                className="whitespace-nowrap px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 pb-safe-area">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ketik pertanyaan..."
                            disabled={isTyping}
                            className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
