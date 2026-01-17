import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sparkles, Plus } from 'lucide-react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import TransactionModal from './components/TransactionModal';
import AIChatModal from './components/AIChatModal';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AnalysisPage from './pages/AnalysisPage';
import CategorySettingsPage from './pages/CategorySettingsPage';
import AIPage from './pages/AIPage';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const { setIsScrolled } = useApp();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setIsScrolled]);

  // Check if on AI page (fullscreen mode)
  const isAIPage = location.pathname === '/ai';

  // Hide balance card on analysis and categories page
  const showBalanceCard = !['analysis', 'categories'].includes(location.pathname.replace('/', '') || 'home');

  // Fullscreen layout for AI page
  if (isAIPage) {
    return (
      <Routes>
        <Route path="/ai" element={<AIPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 pb-24 md:pb-8 flex flex-col items-center">
        <div className="w-full max-w-[1200px] px-0 md:px-8">
          <Header />

          <div className="max-w-md mx-auto md:max-w-none w-full space-y-6 px-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/categories" element={<CategorySettingsPage />} />
            </Routes>
          </div>
        </div>
      </main>

      {/* Add Transaction FAB - Desktop only */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="hidden md:flex fixed bottom-8 right-12 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-300 items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
      >
        <Plus size={32} />
      </button>

      {/* AI FAB - Right side (Mobile only) */}
      <button
        onClick={() => setIsAIOpen(true)}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-purple-300 flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
      >
        <Sparkles size={24} />
      </button>

      <BottomNav onAddClick={() => setIsModalOpen(true)} />
      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <AIChatModal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}


