import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BalanceCard from '../components/BalanceCard';
import TransactionList from '../components/TransactionList';
import EditTransactionModal from '../components/EditTransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export default function HomePage() {
    const { transactions, deleteTransaction } = useApp();
    const navigate = useNavigate();
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const handleDelete = async () => {
        if (transactionToDelete) {
            await deleteTransaction(transactionToDelete);
            toast.success('Transaksi berhasil dihapus');
            setTransactionToDelete(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <BalanceCard />

            <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-gray-800">Transaksi Terbaru</h4>
                <button
                    onClick={() => navigate('/history')}
                    className="text-indigo-600 text-sm font-bold flex items-center gap-1"
                >
                    Lihat Semua <ChevronRight size={16} />
                </button>
            </div>

            <TransactionList
                transactions={transactions.slice(0, 5)}
                onDelete={(id) => setTransactionToDelete(id)}
                onEdit={(tx) => setEditingTransaction(tx)}
            />

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
