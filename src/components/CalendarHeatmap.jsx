import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function CalendarHeatmap({ transactions = [] }) {
    const [viewDate, setViewDate] = useState(new Date());
    const [hoveredDay, setHoveredDay] = useState(null);

    const { days, maxVal, daysInMonth, firstDay } = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const dailyData = {};
        let maxAbs = 0;

        // Initialize all days
        for (let i = 1; i <= daysInMonth; i++) {
            dailyData[i] = { income: 0, expense: 0, net: 0, count: 0 };
        }

        // Aggregate transactions
        transactions.forEach(t => {
            const d = new Date(t.date);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (dailyData[day]) {
                    if (t.type === 'income') dailyData[day].income += t.amount;
                    else dailyData[day].expense += t.amount;
                    dailyData[day].count++;
                }
            }
        });

        // Calculate Net and Max
        Object.values(dailyData).forEach(d => {
            d.net = d.income - d.expense;
            const absNet = Math.abs(d.net);
            if (absNet > maxAbs) maxAbs = absNet;
        });

        return { days: dailyData, maxVal: maxAbs, daysInMonth, firstDay };
    }, [transactions, viewDate]);

    const getDayStyle = (net, max) => {
        const baseClass = "relative aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group";

        if (net === 0) {
            return {
                className: `${baseClass} bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100`,
                style: {}
            };
        }

        const ratio = Math.abs(net) / (max || 1);
        // Minimum opacity 0.1, max 1
        const opacity = 0.1 + (ratio * 0.9);

        let color, borderColor, textColor;

        if (net > 0) { // Income (Emerald)
            // Emerald-500: #10b981 (16, 185, 129)
            color = `rgba(16, 185, 129, ${opacity})`;
            borderColor = `rgba(16, 185, 129, ${Math.min(1, opacity + 0.2)})`;
            textColor = opacity > 0.5 ? 'white' : 'rgb(4, 120, 87)'; // emerald-700
        } else { // Expense (Rose)
            // Rose-500: #f43f5e (244, 63, 94)
            color = `rgba(244, 63, 94, ${opacity})`;
            borderColor = `rgba(244, 63, 94, ${Math.min(1, opacity + 0.2)})`;
            textColor = opacity > 0.5 ? 'white' : 'rgb(190, 18, 60)'; // rose-700
        }

        return {
            className: baseClass,
            style: {
                backgroundColor: color,
                borderColor: borderColor,
                color: textColor
            }
        };
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
        setHoveredDay(null);
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
        setHoveredDay(null);
    };

    const handleResetMonth = () => {
        setViewDate(new Date());
        setHoveredDay(null);
    };

    return (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Kalender</h3>
                    <p className="text-xs text-gray-400">Heatmap Balance</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1.5 hover:bg-white rounded-full shadow-sm transition-all text-gray-600"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={handleResetMonth}
                        className="text-xs font-bold px-2 min-w-[100px] text-center text-gray-700"
                    >
                        {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-1.5 hover:bg-white rounded-full shadow-sm transition-all text-gray-600"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-4">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {/* Empty cells for start of month */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-transparent" />
                    ))}

                    {/* Actual Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const data = days[dayNum];
                        const { className, style } = getDayStyle(data.net, maxVal);

                        return (
                            <div
                                key={dayNum}
                                className={className}
                                style={style}
                                onMouseEnter={() => setHoveredDay(dayNum)}
                                onMouseLeave={() => setHoveredDay(null)}
                            >
                                <span className="text-xs sm:text-sm font-bold">{dayNum}</span>
                                {data.count > 0 && (
                                    <div className="w-1 h-1 rounded-full bg-current opacity-50 mt-1" />
                                )}

                                {/* Tooltip */}
                                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-48 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl pointer-events-none transition-all duration-200 ${hoveredDay === dayNum ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-1'}`}>
                                    <p className="font-bold mb-2 border-b border-gray-700 pb-1">
                                        {dayNum} {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                                    </p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-emerald-400">Pemasukan:</span>
                                            <span className="font-mono">{formatCurrency(data.income)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-rose-400">Pengeluaran:</span>
                                            <span className="font-mono">{formatCurrency(data.expense)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold pt-1 border-t border-gray-700 mt-1">
                                            <span>Net:</span>
                                            <span className={`${data.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatCurrency(data.net)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col items-center gap-2">
                <div className="flex w-full justify-between text-[10px] text-gray-400 font-medium px-1">
                    <span>Pengeluaran (Max)</span>
                    <span>Netral</span>
                    <span>Pemasukan (Max)</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex">
                    <div className="flex-1 bg-gradient-to-r from-[#f43f5e] to-white" />
                    <div className="w-px bg-gray-200" />
                    <div className="flex-1 bg-gradient-to-r from-white to-[#10b981]" />
                </div>
            </div>
        </div>
    );
}
