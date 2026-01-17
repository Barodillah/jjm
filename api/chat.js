import getPool from './db.js';

const AI_MODEL = 'xiaomi/mimo-v2-flash:free';

async function callOpenRouter(systemPrompt, userMessage) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.API_URL || 'http://localhost:3001',
                'X-Title': 'JJM - Jurnal Jeje Money'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        const data = await response.json();
        return data;
    } catch (e) {
        return { error: { message: e.message } };
    }
}

// ===== FUNGSI UNTUK MENGAMBIL DATA PASAR =====
async function getMarketData() {
    const marketData = {
        gold: null,
        btc: null,
        ihsg: null,
        usdIdr: null
    };

    // Ambil kurs USD ke IDR dari exchangerate-api (gratis)
    try {
        const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            signal: AbortSignal.timeout(5000)
        });
        if (usdResponse.ok) {
            const usdData = await usdResponse.json();
            marketData.usdIdr = usdData.rates?.IDR || 16000;
        }
    } catch (e) {
        marketData.usdIdr = 16000; // Default fallback
    }

    // Ambil harga emas dari goldapi.io (free tier)
    try {
        const goldResponse = await fetch('https://www.goldapi.io/api/XAU/USD', {
            headers: {
                'x-access-token': 'goldapi-demo', // Demo token untuk testing
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(5000)
        });
        if (goldResponse.ok) {
            const goldData = await goldResponse.json();
            if (goldData.price) {
                marketData.gold = {
                    priceUSD: goldData.price,
                    priceIDR: goldData.price * marketData.usdIdr,
                    change: goldData.ch || 0,
                    changePercent: goldData.chp || 0
                };
            }
        }
    } catch (e) {
        // Fallback: coba API lain
        try {
            const altGoldResponse = await fetch('https://api.metals.live/v1/spot/gold', {
                signal: AbortSignal.timeout(5000)
            });
            if (altGoldResponse.ok) {
                const altGoldData = await altGoldResponse.json();
                if (altGoldData && altGoldData[0]) {
                    marketData.gold = {
                        priceUSD: altGoldData[0].price,
                        priceIDR: altGoldData[0].price * marketData.usdIdr,
                        change: 0,
                        changePercent: 0
                    };
                }
            }
        } catch (e2) {
            console.log('Gold API failed:', e2.message);
        }
    }

    // Ambil harga Bitcoin dari CoinDesk API (free, no key)
    try {
        const btcResponse = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json', {
            signal: AbortSignal.timeout(5000)
        });
        if (btcResponse.ok) {
            const btcData = await btcResponse.json();
            const btcUSD = btcData.bpi?.USD?.rate_float;
            if (btcUSD) {
                marketData.btc = {
                    priceUSD: btcUSD,
                    priceIDR: btcUSD * marketData.usdIdr,
                    updatedAt: btcData.time?.updated
                };
            }
        }
    } catch (e) {
        // Fallback: Coinbase API
        try {
            const altBtcResponse = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
                signal: AbortSignal.timeout(5000)
            });
            if (altBtcResponse.ok) {
                const altBtcData = await altBtcResponse.json();
                const btcUSD = parseFloat(altBtcData.data?.amount);
                if (btcUSD) {
                    marketData.btc = {
                        priceUSD: btcUSD,
                        priceIDR: btcUSD * marketData.usdIdr
                    };
                }
            }
        } catch (e2) {
            console.log('BTC API failed:', e2.message);
        }
    }

    // Ambil data IHSG dari Yahoo Finance (gratis)
    try {
        const ihsgResponse = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&range=5d', {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            },
            signal: AbortSignal.timeout(5000)
        });
        if (ihsgResponse.ok) {
            const ihsgData = await ihsgResponse.json();
            const result = ihsgData.chart?.result?.[0];
            if (result) {
                const meta = result.meta;
                const quote = result.indicators?.quote?.[0];
                const closes = quote?.close?.filter(c => c !== null);

                if (closes && closes.length > 0) {
                    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1];
                    const prevClose = meta.chartPreviousClose || closes[closes.length - 2];
                    const change = currentPrice - prevClose;
                    const changePercent = (change / prevClose) * 100;

                    marketData.ihsg = {
                        price: currentPrice,
                        previousClose: prevClose,
                        change: change,
                        changePercent: changePercent
                    };
                }
            }
        }
    } catch (e) {
        console.log('IHSG API failed:', e.message);
    }

    return marketData;
}

async function getTransactionContext(pool) {
    try {
        // ===== DATA BULAN INI =====
        const [summaryThisMonth] = await pool.execute(`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                COUNT(*) as total_transactions
            FROM transactions
            WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
        `);

        // ===== DATA BULAN LALU (untuk perbandingan) =====
        const [summaryLastMonth] = await pool.execute(`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                COUNT(*) as total_transactions
            FROM transactions
            WHERE MONTH(date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
            AND YEAR(date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        `);

        // ===== DATA HARI INI =====
        const [todaySummary] = await pool.execute(`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                COUNT(*) as total_transactions
            FROM transactions
            WHERE DATE(date) = CURDATE()
        `);

        const [todayTransactions] = await pool.execute(`
            SELECT title, amount, type, category, TIME_FORMAT(created_at, '%H:%i') as jam
            FROM transactions
            WHERE DATE(date) = CURDATE()
            ORDER BY created_at DESC
        `);

        // ===== DATA 7 HARI TERAKHIR =====
        const [weekSummary] = await pool.execute(`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                COUNT(*) as total_transactions
            FROM transactions
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `);

        // Data per hari dalam 7 hari terakhir
        const [dailyBreakdown] = await pool.execute(`
            SELECT 
                DATE_FORMAT(date, '%a %d %b') as hari,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as pemasukan,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as pengeluaran,
                COUNT(*) as jumlah_transaksi
            FROM transactions
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY date
            ORDER BY date DESC
        `);

        // ===== KATEGORI PENGELUARAN TERBESAR BULAN INI =====
        const [topExpenseCategories] = await pool.execute(`
            SELECT category, SUM(amount) as total, COUNT(*) as count
            FROM transactions
            WHERE type = 'expense' 
            AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
            GROUP BY category
            ORDER BY total DESC
            LIMIT 5
        `);

        // ===== KATEGORI PEMASUKAN TERBESAR BULAN INI =====
        const [topIncomeCategories] = await pool.execute(`
            SELECT category, SUM(amount) as total, COUNT(*) as count
            FROM transactions
            WHERE type = 'income' 
            AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
            GROUP BY category
            ORDER BY total DESC
            LIMIT 5
        `);

        // ===== 10 TRANSAKSI TERAKHIR =====
        const [recentTransactions] = await pool.execute(`
            SELECT title, amount, type, category, DATE_FORMAT(date, '%d %b %Y') as tanggal
            FROM transactions
            ORDER BY date DESC, created_at DESC
            LIMIT 10
        `);

        // ===== RATA-RATA HARIAN BULAN INI =====
        const [dailyAverage] = await pool.execute(`
            SELECT 
                AVG(daily_expense) as avg_expense,
                AVG(daily_income) as avg_income
            FROM (
                SELECT 
                    date,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as daily_expense,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as daily_income
                FROM transactions
                WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
                GROUP BY date
            ) as daily_data
        `);

        // ===== TRANSAKSI TERBESAR BULAN INI =====
        const [biggestExpense] = await pool.execute(`
            SELECT title, amount, category, DATE_FORMAT(date, '%d %b') as tanggal
            FROM transactions
            WHERE type = 'expense' 
            AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
            ORDER BY amount DESC
            LIMIT 1
        `);

        const [biggestIncome] = await pool.execute(`
            SELECT title, amount, category, DATE_FORMAT(date, '%d %b') as tanggal
            FROM transactions
            WHERE type = 'income' 
            AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
            ORDER BY amount DESC
            LIMIT 1
        `);

        // ===== TOTAL KESELURUHAN (ALL TIME) =====
        const [allTimeSummary] = await pool.execute(`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                COUNT(*) as total_transactions,
                MIN(date) as first_transaction_date
            FROM transactions
        `);

        return {
            thisMonth: summaryThisMonth[0],
            lastMonth: summaryLastMonth[0],
            today: {
                summary: todaySummary[0],
                transactions: todayTransactions
            },
            week: {
                summary: weekSummary[0],
                dailyBreakdown
            },
            categories: {
                topExpense: topExpenseCategories,
                topIncome: topIncomeCategories
            },
            recentTransactions,
            dailyAverage: dailyAverage[0],
            biggest: {
                expense: biggestExpense[0],
                income: biggestIncome[0]
            },
            allTime: allTimeSummary[0]
        };
    } catch (err) {
        console.error('Error getting transaction context:', err);
        return null;
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const pool = getPool();

    // GET - Get chat history
    if (req.method === 'GET') {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 50'
            );
            return res.status(200).json(rows.reverse());
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    // POST - Send message
    if (req.method === 'POST') {
        try {
            const { message } = req.body;

            await pool.execute(
                'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
                ['user', message]
            );

            const context = await getTransactionContext(pool);
            const marketData = await getMarketData();

            // Dapatkan waktu Jakarta (WIB - UTC+7)
            const now = new Date();
            const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };
            const waktuJakarta = jakartaTime.toLocaleDateString('id-ID', options);

            const systemPrompt = `Kamu adalah **BABA**, asisten keuangan pribadi sekaligus Financial Advisor untuk **Kanjeng Jihan Mutia**. 
Selalu panggil user dengan nama "Jeje" dalam percakapan.

📋 PERAN KAMU:
1. **Financial Advisor Profesional** - Kamu adalah ahli keuangan yang berpengalaman. Bisa menjawab pertanyaan seputar:
   - Investasi (saham, reksadana, obligasi, crypto, emas, properti)
   - Perencanaan keuangan & budgeting
   - Menabung & dana darurat
   - Manajemen utang & cicilan
   - Asuransi & proteksi finansial
   - Pajak & perencanaan pensiun
   - Tips hemat & cara mengelola uang
   
2. **Personal Money Manager** - Menganalisis data keuangan pribadi Jeje dan memberikan insight

💡 GAYA KOMUNIKASI:
- Santai, hangat, dan suportif seperti teman dekat 💕
- Gunakan emoji untuk membuat percakapan lebih hidup
- Jelaskan konsep keuangan dengan bahasa sederhana yang mudah dipahami
- Berikan contoh konkret dan actionable tips
- Jika Jeje tanya hal di luar keuangan, tetap ramah dan arahkan kembali ke topik finansial

🕐 WAKTU SEKARANG (Jakarta/WIB):
${waktuJakarta}

${context ? `
══════════════════════════════════════
📊 DATA KEUANGAN LENGKAP JEJE
══════════════════════════════════════

📅 HARI INI:
- Pemasukan: Rp ${(context.today?.summary?.total_income || 0).toLocaleString('id-ID')}
- Pengeluaran: Rp ${(context.today?.summary?.total_expense || 0).toLocaleString('id-ID')}
- Jumlah Transaksi: ${context.today?.summary?.total_transactions || 0}
${context.today?.transactions?.length > 0 ? `
📝 Detail Transaksi Hari Ini:
${context.today.transactions.map(t => `   • [${t.jam}] ${t.title}: Rp ${t.amount.toLocaleString('id-ID')} (${t.type === 'income' ? '📈 Masuk' : '📉 Keluar'} - ${t.category})`).join('\n')}
` : '   Belum ada transaksi hari ini'}

──────────────────────────────────────
📆 7 HARI TERAKHIR:
- Total Pemasukan: Rp ${(context.week?.summary?.total_income || 0).toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${(context.week?.summary?.total_expense || 0).toLocaleString('id-ID')}
- Jumlah Transaksi: ${context.week?.summary?.total_transactions || 0}
${context.week?.dailyBreakdown?.length > 0 ? `
📊 Breakdown Per Hari:
${context.week.dailyBreakdown.map(d => `   • ${d.hari}: +Rp ${(d.pemasukan || 0).toLocaleString('id-ID')} / -Rp ${(d.pengeluaran || 0).toLocaleString('id-ID')} (${d.jumlah_transaksi} transaksi)`).join('\n')}
` : ''}

──────────────────────────────────────
📈 BULAN INI:
- Total Pemasukan: Rp ${(context.thisMonth?.total_income || 0).toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${(context.thisMonth?.total_expense || 0).toLocaleString('id-ID')}
- Saldo Bulan Ini: Rp ${((context.thisMonth?.total_income || 0) - (context.thisMonth?.total_expense || 0)).toLocaleString('id-ID')}
- Jumlah Transaksi: ${context.thisMonth?.total_transactions || 0}
- Rata-rata Pengeluaran/Hari: Rp ${Math.round(context.dailyAverage?.avg_expense || 0).toLocaleString('id-ID')}
- Rata-rata Pemasukan/Hari: Rp ${Math.round(context.dailyAverage?.avg_income || 0).toLocaleString('id-ID')}

📊 PERBANDINGAN DENGAN BULAN LALU:
- Pemasukan Bulan Lalu: Rp ${(context.lastMonth?.total_income || 0).toLocaleString('id-ID')}
- Pengeluaran Bulan Lalu: Rp ${(context.lastMonth?.total_expense || 0).toLocaleString('id-ID')}
- Perubahan Pemasukan: ${context.lastMonth?.total_income ? ((((context.thisMonth?.total_income || 0) - context.lastMonth.total_income) / context.lastMonth.total_income) * 100).toFixed(1) : 0}%
- Perubahan Pengeluaran: ${context.lastMonth?.total_expense ? ((((context.thisMonth?.total_expense || 0) - context.lastMonth.total_expense) / context.lastMonth.total_expense) * 100).toFixed(1) : 0}%

${context.categories?.topExpense?.length > 0 ? `
🏷️ TOP 5 KATEGORI PENGELUARAN BULAN INI:
${context.categories.topExpense.map((c, i) => `   ${i + 1}. ${c.category}: Rp ${c.total.toLocaleString('id-ID')} (${c.count}x)`).join('\n')}
` : ''}
${context.categories?.topIncome?.length > 0 ? `
� TOP 5 SUMBER PEMASUKAN BULAN INI:
${context.categories.topIncome.map((c, i) => `   ${i + 1}. ${c.category}: Rp ${c.total.toLocaleString('id-ID')} (${c.count}x)`).join('\n')}
` : ''}
${context.biggest?.expense ? `
🔥 PENGELUARAN TERBESAR BULAN INI:
   ${context.biggest.expense.title}: Rp ${context.biggest.expense.amount.toLocaleString('id-ID')} (${context.biggest.expense.category}) - ${context.biggest.expense.tanggal}
` : ''}
${context.biggest?.income ? `
🌟 PEMASUKAN TERBESAR BULAN INI:
   ${context.biggest.income.title}: Rp ${context.biggest.income.amount.toLocaleString('id-ID')} (${context.biggest.income.category}) - ${context.biggest.income.tanggal}
` : ''}

──────────────────────────────────────
🏦 RINGKASAN ALL-TIME:
- Total Pemasukan Sepanjang Masa: Rp ${(context.allTime?.total_income || 0).toLocaleString('id-ID')}
- Total Pengeluaran Sepanjang Masa: Rp ${(context.allTime?.total_expense || 0).toLocaleString('id-ID')}
- Saldo Bersih All-Time: Rp ${((context.allTime?.total_income || 0) - (context.allTime?.total_expense || 0)).toLocaleString('id-ID')}
- Total Transaksi: ${context.allTime?.total_transactions || 0}
${context.allTime?.first_transaction_date ? `- Mulai Tercatat Sejak: ${new Date(context.allTime.first_transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}

──────────────────────────────────────
📝 10 TRANSAKSI TERAKHIR:
${context.recentTransactions?.map(t => `• ${t.tanggal} - ${t.title}: Rp ${t.amount.toLocaleString('id-ID')} (${t.type === 'income' ? '📈' : '📉'} ${t.category})`).join('\n') || 'Belum ada transaksi'}

══════════════════════════════════════
` : 'Belum ada data keuangan.'}

══════════════════════════════════════
📈 DATA PASAR HARI INI (REAL-TIME)
══════════════════════════════════════
${marketData.usdIdr ? `
💵 KURS USD/IDR: Rp ${Math.round(marketData.usdIdr).toLocaleString('id-ID')}
` : ''}
${marketData.gold ? `
🥇 HARGA EMAS (XAU):
- Per Troy Ounce: $${marketData.gold.priceUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })} (Rp ${Math.round(marketData.gold.priceIDR).toLocaleString('id-ID')})
- Per Gram: ~Rp ${Math.round(marketData.gold.priceIDR / 31.1035).toLocaleString('id-ID')}
${marketData.gold.changePercent ? `- Perubahan: ${marketData.gold.changePercent >= 0 ? '📈' : '📉'} ${marketData.gold.changePercent.toFixed(2)}%` : ''}
` : '- Harga Emas: Data tidak tersedia'}

${marketData.btc ? `
₿ BITCOIN (BTC):
- Harga: $${marketData.btc.priceUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })} (Rp ${Math.round(marketData.btc.priceIDR).toLocaleString('id-ID')})
` : '- Bitcoin: Data tidak tersedia'}

${marketData.ihsg ? `
📊 IHSG (Indeks Harga Saham Gabungan):
- Harga: ${marketData.ihsg.price.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
- Perubahan: ${marketData.ihsg.change >= 0 ? '📈' : '📉'} ${marketData.ihsg.change.toFixed(2)} (${marketData.ihsg.changePercent.toFixed(2)}%)
- Penutupan Sebelumnya: ${marketData.ihsg.previousClose.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
` : '- IHSG: Data tidak tersedia (pasar tutup atau error)'}

══════════════════════════════════════`;

            const aiResponse = await callOpenRouter(systemPrompt, message);

            if (aiResponse.error) {
                return res.status(200).json({
                    response: 'Maaf Jeje, ada kendala pada sistem. Coba lagi ya! 🙏'
                });
            }

            const aiMessage = aiResponse.choices?.[0]?.message?.content || 'Maaf, tidak ada respon.';

            await pool.execute(
                'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
                ['assistant', aiMessage]
            );

            return res.status(200).json({ response: aiMessage });

        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    // DELETE - Clear history
    if (req.method === 'DELETE') {
        try {
            await pool.execute('DELETE FROM chat_messages');
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
