import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function DateInput({ value, onChange, placeholder = 'Pilih tanggal', className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) return new Date(value);
        return new Date();
    });
    const inputRef = useRef(null);
    const pickerRef = useRef(null);

    // Parse the current value
    const selectedDate = value ? new Date(value) : null;

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(e.target) &&
                inputRef.current &&
                !inputRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    // Get days in current month view
    const getDaysInMonth = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthLastDay - i)
            });
        }

        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }

        // Next month's days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return days;
    };

    const handleDateSelect = (date) => {
        // Use local date components instead of ISO string which uses UTC
        // This prevents the date from shifting to the previous day in positive timezones
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        onChange({ target: { value: formattedDate } });
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        const today = new Date();
        setViewDate(today);
        handleDateSelect(today);
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
        if (!selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const days = getDaysInMonth();

    return (
        <div className="relative">
            {/* Input Display */}
            <div
                ref={inputRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between transition-all hover:bg-gray-100 ${isOpen ? 'ring-2 ring-indigo-500' : ''} ${className}`}
            >
                <span className={`text-sm ${value ? 'text-gray-800' : 'text-gray-400'}`}>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
                <Calendar size={18} className="text-gray-400" />
            </div>

            {/* Hidden native input for form compatibility */}
            <input
                type="hidden"
                value={value || ''}
            />

            {/* Date Picker Dropdown */}
            {isOpen && createPortal(
                <div
                    ref={pickerRef}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
                >
                    <div className="bg-white rounded-3xl shadow-2xl p-4 w-full max-w-[320px] animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <ChevronLeft size={20} className="text-gray-600" />
                            </button>
                            <div className="text-center">
                                <p className="font-bold text-gray-800">
                                    {MONTHS[viewDate.getMonth()]}
                                </p>
                                <p className="text-xs text-gray-400">{viewDate.getFullYear()}</p>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <ChevronRight size={20} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS.map(day => (
                                <div key={day} className="text-center text-xs font-bold text-gray-400 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleDateSelect(item.date)}
                                    className={`
                                        aspect-square rounded-xl text-sm font-medium transition-all
                                        flex items-center justify-center
                                        ${!item.isCurrentMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-indigo-50'}
                                        ${isToday(item.date) && !isSelected(item.date) ? 'bg-gray-100 font-bold' : ''}
                                        ${isSelected(item.date) ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}
                                    `}
                                >
                                    {item.day}
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleToday}
                                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Hari Ini
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
