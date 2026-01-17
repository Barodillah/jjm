import express from 'express';
import getPool from './db.js';

const router = express.Router();
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
        if (!response.ok) {
            console.error('OpenRouter Error:', data);
        }
        return data;
    } catch (e) {
        console.error('Fetch Error:', e);
        return { error: { message: e.message } };
    }
}

// Get recent transaction data for context
async function getTransactionContext(pool) {
    try {
        const [summary] = await pool.execute(`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
                COUNT(*) as total_transactions
            FROM transactions
            WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
        `);

        const [categories] = await pool.execute(`
            SELECT category, type, SUM(amount) as total, COUNT(*) as count
            FROM transactions
            WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
            GROUP BY category, type
            ORDER BY total DESC
            LIMIT 10
        `);

        const [recent] = await pool.execute(`
            SELECT title, amount, type, category, DATE_FORMAT(date, '%d %b %Y') as tanggal
            FROM transactions
            ORDER BY date DESC, created_at DESC
            LIMIT 10
        `);

        const [today] = await pool.execute(`
            SELECT title, amount, type, category
            FROM transactions
            WHERE DATE(date) = CURDATE()
        `);

        return {
            summary: summary[0],
            categories,
            recent,
            today
        };
    } catch (err) {
        console.error('Error getting context:', err);
        return null;
    }
}

// GET / - Get chat history
router.get('/', async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 50'
        );
        return res.status(200).json(rows.reverse());
    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// POST / - Send message
router.post('/', async (req, res) => {
    try {
        const pool = getPool();
        const { message } = req.body;

        await pool.execute(
            'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
            ['user', message]
        );

        const context = await getTransactionContext(pool);

        const systemPrompt = `Kamu adalah asisten keuangan pribadi bernama JJ untuk **Kanjeng Jihan Mutia**. 
Selalu panggil user dengan nama "Jeje" dalam percakapan.

Kamu adalah **ahli keuangan** yang berpengalaman. Selain mengelola data keuangan Jeje, kamu juga sangat menguasai topik literasi keuangan, investasi, budgeting, dan ekonomi.
Tugas utama kamu:
1. Analisis keuangan Jeje berdasarkan data transaksi pribadinya.
2. Jawab pertanyaan umum tentang dunia keuangan (tips hemat, investasi, saham, perencanaan keuangan, dll) dengan wawasan luas.

Jawab dengan gaya bahasa santai, hangat, suportif, dan gunakan emoji. 💕

DATA KEUANGAN JEJE BULAN INI:
${context ? `
📊 RINGKASAN:
- Total Pemasukan: Rp ${(context.summary?.total_income || 0).toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${(context.summary?.total_expense || 0).toLocaleString('id-ID')}
- Saldo: Rp ${((context.summary?.total_income || 0) - (context.summary?.total_expense || 0)).toLocaleString('id-ID')}
- Jumlah Transaksi: ${context.summary?.total_transactions || 0}

📂 KATEGORI:
${context.categories?.map(c => `- ${c.category} (${c.type}): Rp ${Number(c.total).toLocaleString('id-ID')} (${c.count}x)`).join('\n') || 'Belum ada data'}

📝 TRANSAKSI TERAKHIR:
${context.recent?.map(t => `- ${t.tanggal}: ${t.title} - Rp ${Number(t.amount).toLocaleString('id-ID')} (${t.type === 'income' ? '💰' : '💸'} ${t.category})`).join('\n') || 'Belum ada transaksi'}

📅 TRANSAKSI HARI INI:
${context.today?.length ? context.today.map(t => `- ${t.title}: Rp ${Number(t.amount).toLocaleString('id-ID')} (${t.type === 'income' ? '💰' : '💸'})`).join('\n') : 'Belum ada transaksi hari ini'}
` : 'Belum ada data keuangan.'}

Panduan Menjawab:
- Jika pertanyaan Jeje berkaitan dengan data keuangannya, analisis data di atas secara tajam.
- Jika pertanyaan bersifat umum (misal: "cara investasi?", "apa itu inflasi?"), jawablah sebagai konsultan keuangan profesional tanpa memaksakan koneksi ke data transaksi.
- Fokuslah hanya pada topik keuangan. Jika ditanya di luar topik keuangan (misal: resep masakan, politik), tolak dengan halus dan arahkan kembali ke keuangan.`;

        const aiResponse = await callOpenRouter(systemPrompt, message);

        if (aiResponse.error) {
            console.error('OpenRouter Error:', aiResponse.error);
            return res.status(200).json({
                response: 'Maaf Jeje, ada kendala pada sistem. Coba lagi ya! 🙏'
            });
        }

        const aiMessage = aiResponse.choices?.[0]?.message?.content;

        if (!aiMessage) {
            return res.status(200).json({
                response: 'Maaf Jeje, tidak ada respon. Coba lagi ya! 🙏'
            });
        }

        await pool.execute(
            'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
            ['assistant', aiMessage]
        );

        return res.status(200).json({ response: aiMessage });

    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// DELETE / - Clear history
router.delete('/', async (req, res) => {
    try {
        const pool = getPool();
        await pool.execute('DELETE FROM chat_messages');
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

export default router;
