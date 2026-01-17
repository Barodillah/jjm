import { useMemo, useState } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function AnalysisCharts({ transactions }) {
    const [chartPeriod, setChartPeriod] = useState(6); // 6 months
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // 1. Prepare Monthly Data (Last 6-12 Months)
    const monthlyData = useMemo(() => {
        const today = new Date();
        const data = [];

        for (let i = chartPeriod - 1; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
            const label = d.toLocaleDateString('id-ID', { month: 'short' });

            data.push({
                key: monthKey,
                label: label,
                fullDate: d,
                income: 0,
                expense: 0
            });
        }

        transactions.forEach(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const monthData = data.find(m => m.key === key);
            if (monthData) {
                if (t.type === 'income') monthData.income += t.amount;
                else monthData.expense += t.amount;
            }
        });

        return data;
    }, [transactions, chartPeriod]);

    const maxMonthlyAmount = useMemo(() => {
        return Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 1);
    }, [monthlyData]);

    // 2. Prepare Daily Trend (Last 30 Days)
    const dailyData = useMemo(() => {
        const days = 30;
        const today = new Date();
        const data = [];

        // Initialize last 30 days
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            data.push({
                date: dateStr,
                label: d.getDate(),
                income: 0,
                expense: 0
            });
        }

        transactions.forEach(t => {
            const dateStr = t.date.split('T')[0]; // Assuming YYYY-MM-DD or ISO
            // Find if date exists in our range (ignoring time)
            // Ideally match exact date string if format is consistent
            // Converting both to ISO split for safety
            const tDate = new Date(t.date).toISOString().split('T')[0];
            const dayData = data.find(d => d.date === tDate);

            if (dayData) {
                if (t.type === 'income') dayData.income += t.amount;
                else dayData.expense += t.amount;
            }
        });

        return data;
    }, [transactions]);

    const maxDailyAmount = useMemo(() => {
        return Math.max(...dailyData.map(d => Math.max(d.income, d.expense)), 1);
    }, [dailyData]);

    // SVG Helper for Line Chart
    const getPoints = (type) => {
        const width = 100; // viewBox width percentile
        const height = 100; // viewBox height

        return dailyData.map((d, i) => {
            const x = (i / (dailyData.length - 1)) * width;
            const val = type === 'income' ? d.income : d.expense;
            const y = height - ((val / maxDailyAmount) * height * 0.8) - 10; // 10% padding bottom, max 80% height
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <div className="space-y-6">
            {/* Chart 1: Monthly Comparison (Bar Chart) */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Perbandingan Bulanan</h3>
                        <p className="text-xs text-gray-400">Pemasukan vs Pengeluaran ({chartPeriod} Bulan Terakhir)</p>
                    </div>
                    {/* Period Toggle - Optional if we want to expand functionality */}
                </div>

                <div className="h-48 flex items-end justify-between gap-2 sm:gap-4">
                    {monthlyData.map((data, index) => (
                        <div key={data.key} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Bars Container */}
                            <div className="w-full flex items-end justify-center gap-1 h-32 relative">
                                {/* Income Bar */}
                                <div
                                    className="w-full max-w-[16px] bg-emerald-400 rounded-t-sm hover:bg-emerald-500 transition-all duration-300 relative group/bar"
                                    style={{ height: `${(data.income / maxMonthlyAmount) * 100}%` }}
                                >
                                    {/* Tooltip Income */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/bar:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                        Masuk: {formatCurrency(data.income)}
                                    </div>
                                </div>
                                {/* Expense Bar */}
                                <div
                                    className="w-full max-w-[16px] bg-rose-400 rounded-t-sm hover:bg-rose-500 transition-all duration-300 relative group/bar"
                                    style={{ height: `${(data.expense / maxMonthlyAmount) * 100}%` }}
                                >
                                    {/* Tooltip Expense */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/bar:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                                        Keluar: {formatCurrency(data.expense)}
                                    </div>
                                </div>
                            </div>
                            {/* Label */}
                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">
                                {data.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-[10px] text-gray-500">Pemasukan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                        <span className="text-[10px] text-gray-500">Pengeluaran</span>
                    </div>
                </div>
            </div>

            {/* Chart 2: Daily Trend (Line Chart - SVG) */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Tren Harian</h3>
                        <p className="text-xs text-gray-400">30 Hari Terakhir</p>
                    </div>
                </div>

                <div className="relative h-64 w-full">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        {/* Grid Lines */}
                        <line x1="0" y1="20" x2="100" y2="20" stroke="#f3f4f6" strokeWidth="0.5" />
                        <line x1="0" y1="40" x2="100" y2="40" stroke="#f3f4f6" strokeWidth="0.5" />
                        <line x1="0" y1="60" x2="100" y2="60" stroke="#f3f4f6" strokeWidth="0.5" />
                        <line x1="0" y1="80" x2="100" y2="80" stroke="#f3f4f6" strokeWidth="0.5" />

                        {/* Income Line */}
                        <polyline
                            points={getPoints('income')}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-sm"
                        />
                        {/* Expense Line */}
                        <polyline
                            points={getPoints('expense')}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-sm"
                        />

                        {/* Interactive Area & Hover Effects */}
                        {dailyData.map((d, i) => {
                            const x = (i / (dailyData.length - 1)) * 100;
                            const incomeY = 100 - ((d.income / maxDailyAmount) * 100 * 0.8) - 10;
                            const expenseY = 100 - ((d.expense / maxDailyAmount) * 100 * 0.8) - 10;
                            const isHovered = hoveredIndex === i;

                            return (
                                <g key={i}>
                                    {/* Hover Line */}
                                    {isHovered && (
                                        <line
                                            x1={x} y1="0" x2={x} y2="100"
                                            stroke="#e5e7eb"
                                            strokeWidth="0.5"
                                            strokeDasharray="2 2"
                                        />
                                    )}

                                    {/* Data Points (Visible on Hover) */}
                                    {isHovered && (
                                        <>
                                            <circle cx={x} cy={incomeY} r="2" fill="#34d399" stroke="white" strokeWidth="0.5" />
                                            <circle cx={x} cy={expenseY} r="2" fill="#f43f5e" stroke="white" strokeWidth="0.5" />
                                        </>
                                    )}

                                    {/* Hit Area */}
                                    <rect
                                        x={i === 0 ? 0 : x - (50 / dailyData.length)}
                                        y="0"
                                        width={100 / dailyData.length}
                                        height="100"
                                        fill="transparent"
                                        onMouseEnter={() => setHoveredIndex(i)}
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Tooltip HTML Overlay */}
                    {hoveredIndex !== null && dailyData[hoveredIndex] && (
                        <div
                            className="absolute top-0 pointer-events-none z-10 p-3 bg-gray-900/90 backdrop-blur-sm text-white rounded-xl shadow-xl border border-white/10 text-xs transform -translate-x-1/2 transition-all duration-75"
                            style={{
                                left: `${(hoveredIndex / (dailyData.length - 1)) * 100}%`,
                                minWidth: '140px'
                            }}
                        >
                            <p className="font-bold border-b border-white/10 pb-2 mb-2">
                                {new Date(dailyData[hoveredIndex].date).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </p>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span className="text-gray-300">Masuk</span>
                                    </div>
                                    <span className="font-mono text-emerald-400 font-bold">
                                        {formatCurrency(dailyData[hoveredIndex].income)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                                        <span className="text-gray-300">Keluar</span>
                                    </div>
                                    <span className="font-mono text-rose-400 font-bold">
                                        {formatCurrency(dailyData[hoveredIndex].expense)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* X-Axis Labels (Showing just a few) */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-400 translate-y-6">
                        <span>{dailyData[0]?.label}</span>
                        <span>{dailyData[7]?.label}</span>
                        <span>{dailyData[14]?.label}</span>
                        <span>{dailyData[21]?.label}</span>
                        <span>{dailyData[dailyData.length - 1]?.label}</span>
                    </div>
                </div>
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-8">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-0.5 bg-emerald-400"></div>
                        <span className="text-[10px] text-gray-500">Pemasukan</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-0.5 bg-rose-400"></div>
                        <span className="text-[10px] text-gray-500">Pengeluaran</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
