import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Check, Eye, EyeOff } from 'lucide-react';

/**
 * Change PIN Modal - accessed from profile
 */
export default function ChangePinModal({ isOpen, onClose }) {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        // Validation
        if (currentPin.length !== 4 || !(/^\d{4}$/.test(currentPin))) {
            setError('PIN saat ini harus 4 digit angka');
            return;
        }
        if (newPin.length !== 4 || !(/^\d{4}$/.test(newPin))) {
            setError('PIN baru harus 4 digit angka');
            return;
        }
        if (newPin !== confirmPin) {
            setError('Konfirmasi PIN tidak cocok');
            return;
        }
        if (currentPin === newPin) {
            setError('PIN baru harus berbeda dari PIN saat ini');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPin, newPin })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess('PIN berhasil diubah!');
                sessionStorage.setItem('jjm_pin', newPin);
                setTimeout(() => {
                    onClose();
                    setCurrentPin('');
                    setNewPin('');
                    setConfirmPin('');
                    setSuccess('');
                }, 1500);
            } else {
                setError(data.error || 'Gagal mengubah PIN');
            }
        } catch (err) {
            setError('Koneksi gagal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNumInput = (setter, value) => {
        // Only allow digits
        const cleaned = value.replace(/\D/g, '').slice(0, 4);
        setter(cleaned);
        setError('');
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[24px] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Ubah PIN</h3>
                                <p className="text-xs text-indigo-200">Ganti PIN keamanan Anda</p>
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

                {/* Form */}
                <div className="p-6 space-y-4">
                    {/* Current PIN */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            PIN Saat Ini
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPin}
                                onChange={(e) => handleNumInput(setCurrentPin, e.target.value)}
                                placeholder="••••"
                                maxLength={4}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl font-bold tracking-[0.5em] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* New PIN */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            PIN Baru
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                value={newPin}
                                onChange={(e) => handleNumInput(setNewPin, e.target.value)}
                                placeholder="••••"
                                maxLength={4}
                                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl font-bold tracking-[0.5em] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm PIN */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            Konfirmasi PIN Baru
                        </label>
                        <input
                            type="password"
                            value={confirmPin}
                            onChange={(e) => handleNumInput(setConfirmPin, e.target.value)}
                            placeholder="••••"
                            maxLength={4}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl font-bold tracking-[0.5em] transition-all"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                            <Check size={18} />
                            {success}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !currentPin || !newPin || !confirmPin}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Lock size={20} />
                                Simpan PIN Baru
                            </>
                        )}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                        PIN cadangan: 2098 (untuk pemulihan)
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
