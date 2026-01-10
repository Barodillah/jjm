import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Palette, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';

const PRESET_COLORS = [
    '#F87171', '#FB923C', '#FBBF24', '#A3E635', '#34D399', '#2DD4BF',
    '#22D3EE', '#60A5FA', '#818CF8', '#A78BFA', '#E879F9', '#F472B6',
    '#9CA3AF', '#6B7280', '#374151',
];

export default function CategorySettingsPage() {
    const { categories, addCategory, updateCategory, deleteCategory } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
    const [newType, setNewType] = useState('expense');
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editType, setEditType] = useState('expense');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            await addCategory(newName.trim(), newColor, newType);
            toast.success('Kategori berhasil ditambahkan');
            setNewName('');
            setNewColor(PRESET_COLORS[0]);
            setNewType('expense');
            setIsAdding(false);
        } catch (err) {
            console.error('Failed to add category:', err);
            toast.error('Gagal menambah kategori. Coba lagi.');
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditColor(cat.color);
        setEditType(cat.type || 'expense');
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) return;
        try {
            await updateCategory(editingId, editName.trim(), editColor, editType);
            toast.success('Kategori berhasil diperbarui');
            setEditingId(null);
        } catch (err) {
            console.error('Failed to update category:', err);
            toast.error('Gagal mengupdate kategori. Coba lagi.');
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await deleteCategory(showDeleteConfirm);
            toast.success('Kategori berhasil dihapus');
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete category:', err);
            toast.error('Gagal menghapus kategori. Coba lagi.');
        }
    };

    const TypeSelector = ({ value, onChange, size = 'normal' }) => (
        <div className={`flex bg-gray-100 p-1 rounded-xl ${size === 'small' ? 'text-xs' : ''}`}>
            <button
                onClick={() => onChange('expense')}
                className={`flex-1 ${size === 'small' ? 'py-2 px-3' : 'py-2'} rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${value === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'
                    }`}
            >
                <ArrowDownLeft size={size === 'small' ? 14 : 16} />
                Pengeluaran
            </button>
            <button
                onClick={() => onChange('income')}
                className={`flex-1 ${size === 'small' ? 'py-2 px-3' : 'py-2'} rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${value === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'
                    }`}
            >
                <ArrowUpRight size={size === 'small' ? 14 : 16} />
                Pemasukan
            </button>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-lg text-gray-800">Pengaturan Kategori</h4>
                    <p className="text-sm text-gray-400">Kelola kategori transaksi kamu</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
                >
                    <Plus size={18} />
                    Tambah
                </button>
            </div>

            {/* Add New Category Form */}
            {isAdding && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <h5 className="font-bold text-gray-800">Kategori Baru</h5>
                        <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-gray-100 rounded-full">
                            <X size={18} className="text-gray-400" />
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Nama kategori..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />

                    {/* Type Selector */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            Jenis Kategori
                        </label>
                        <TypeSelector value={newType} onChange={setNewType} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            Pilih Warna
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setNewColor(color)}
                                    className={`w-8 h-8 rounded-full transition-all ${newColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleAdd}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Simpan
                        </button>
                    </div>
                </div>
            )}

            {/* Categories List */}
            <div className="space-y-3">
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 transition-all"
                    >
                        {editingId === cat.id ? (
                            // Edit Mode
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                                {/* Type Selector for Edit */}
                                <TypeSelector value={editType} onChange={setEditType} size="small" />

                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setEditColor(color)}
                                            className={`w-6 h-6 rounded-full transition-all ${editColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Normal View
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: cat.color + '20' }}
                                    >
                                        <Palette size={20} style={{ color: cat.color }} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{cat.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.type === 'income'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(cat)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                                    >
                                        <Edit2 size={18} className="text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(cat.id)}
                                        className="p-2 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} className="text-rose-400" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-12">
                    <Palette size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">Belum ada kategori</p>
                    <p className="text-sm text-gray-300">Klik tombol "Tambah" untuk membuat kategori baru</p>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Hapus Kategori?"
                message="Kategori yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?"
                confirmText="Hapus"
                isDestructive={true}
            />
        </div>
    );
}
