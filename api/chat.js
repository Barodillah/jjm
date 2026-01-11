// Vercel Serverless Function for AI Chat
import mysql from 'mysql2/promise';

const dbConfig = {
    host: '153.92.15.23',
    port: 3306,
    user: 'u444914729_jjm',
    password: 'Sagala.4321',
    database: 'u444914729_jjm'
};

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = 'xiaomi/mimo-v2-flash:free';

async function getConnection() {
    return mysql.createConnection(dbConfig);
}

async function callOpenRouter(systemPrompt, userMessage) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://jejemoney.vercel.app',
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
    return response.json();
}

// Step 1: Generate SQL query from natural language
async function generateSQLQuery(userQuestion) {
    const queryPrompt = `Kamu adalah ahli SQL yang mengkonversi pertanyaan bahasa Indonesia menjadi query MySQL.

Tabel yang tersedia: transactions
Kolom:
- id (INT, primary key)
- title (VARCHAR) - nama/deskripsi transaksi
- amount (DECIMAL) - jumlah uang dalam Rupiah
- type (VARCHAR) - "income" untuk pemasukan, "expense" untuk pengeluaran
- category (VARCHAR) - kategori transaksi
- date (DATE) - tanggal transaksi format YYYY-MM-DD
- created_at (TIMESTAMP) - waktu dibuat

ATURAN PENTING:
1. HANYA kembalikan query SQL murni, tanpa penjelasan, tanpa markdown, tanpa backticks
2. Query harus SELECT only (tidak boleh UPDATE, DELETE, INSERT, DROP, dll)
3. Jika pertanyaan tidak memerlukan data (seperti sapaan), kembalikan: NONE
4. Gunakan alias yang mudah dibaca untuk kolom
5. Format tanggal dengan DATE_FORMAT jika perlu
6. Untuk pertanyaan tentang "bulan ini", gunakan MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
7. Untuk pertanyaan tentang "minggu ini", gunakan YEARWEEK(date) = YEARWEEK(CURDATE())
8. Untuk pertanyaan tentang "hari ini", gunakan DATE(date) = CURDATE()

Contoh:
- "Berapa total pengeluaran bulan ini?" -> SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
- "Kategori apa yang paling banyak?" -> SELECT category, COUNT(*) as jumlah, SUM(amount) as total FROM transactions GROUP BY category ORDER BY jumlah DESC LIMIT 5
- "Halo JJ" -> NONE`;

    const response = await callOpenRouter(queryPrompt, userQuestion);
    const sqlQuery = response.choices?.[0]?.message?.content?.trim();
    return sqlQuery;
}

// Step 2: Analyze data and generate human-readable response
async function analyzeAndRespond(userQuestion, queryResult, sqlQuery) {
    const analysisPrompt = `Kamu adalah asisten keuangan pribadi bernama JJ untuk **Kanjeng Jihan Mutia**. 
Selalu panggil user dengan nama "Kanjeng Jihan Mutia" atau "Kanjeng" saja.

Kamu baru saja mengambil data dari database untuk menjawab pertanyaan Kanjeng.

PERTANYAAN KANJENG:
"${userQuestion}"

QUERY YANG DIJALANKAN:
${sqlQuery}

HASIL DATA:
${JSON.stringify(queryResult, null, 2)}

TUGAS:
1. Analisis data di atas
2. Jelaskan hasilnya dalam bahasa Indonesia yang mudah dipahami
3. Berikan insight atau saran keuangan jika relevan
4. Format angka uang dengan format Rupiah (contoh: Rp 1.500.000)
5. Gunakan emoji untuk membuat percakapan hangat dan menarik 💕
6. Jawab dengan ramah dan personal untuk Kanjeng Jihan Mutia

Jika data kosong, jelaskan bahwa belum ada data yang sesuai.`;

    const response = await callOpenRouter(analysisPrompt, "Tolong analisis dan jelaskan data di atas untuk Kanjeng.");
    return response.choices?.[0]?.message?.content;
}

// Simple response for non-data questions
async function simpleResponse(userQuestion) {
    const simplePrompt = `Kamu adalah asisten keuangan pribadi bernama JJ untuk **Kanjeng Jihan Mutia**. 
Selalu panggil user dengan nama "Kanjeng Jihan Mutia" atau "Kanjeng" saja dalam percakapan.

Kamu membantu Kanjeng Jihan Mutia mengelola keuangan dengan ramah, profesional, dan penuh perhatian.
Jawab dengan singkat, hangat, dan gunakan emoji. 💕

Jika Kanjeng bertanya tentang data keuangan, beritahu bahwa kamu bisa membantu menganalisis:
- Total pemasukan/pengeluaran
- Kategori terbanyak
- Transaksi terbesar
- Ringkasan keuangan harian/mingguan/bulanan
- Dan pertanyaan keuangan lainnya`;

    const response = await callOpenRouter(simplePrompt, userQuestion);
    return response.choices?.[0]?.message?.content;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let conn;
    try {
        conn = await getConnection();

        if (req.method === 'GET') {
            const [rows] = await conn.execute(
                'SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 50'
            );
            return res.status(200).json(rows.reverse());
        }

        if (req.method === 'POST') {
            const { message } = req.body;

            // Save user message
            await conn.execute(
                'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
                ['user', message]
            );

            let aiMessage;

            try {
                // Step 1: Generate SQL query from user question
                console.log('Step 1: Generating SQL query...');
                const sqlQuery = await generateSQLQuery(message);
                console.log('Generated SQL:', sqlQuery);

                if (sqlQuery && sqlQuery !== 'NONE' && sqlQuery.toUpperCase().startsWith('SELECT')) {
                    // Validate query is safe (SELECT only)
                    const upperQuery = sqlQuery.toUpperCase();
                    if (upperQuery.includes('DROP') || upperQuery.includes('DELETE') ||
                        upperQuery.includes('UPDATE') || upperQuery.includes('INSERT') ||
                        upperQuery.includes('TRUNCATE') || upperQuery.includes('ALTER')) {
                        throw new Error('Query tidak diizinkan');
                    }

                    // Step 2: Execute the query
                    console.log('Step 2: Executing query...');
                    const [queryResult] = await conn.execute(sqlQuery);
                    console.log('Query result:', queryResult);

                    // Step 3: Analyze and generate response
                    console.log('Step 3: Analyzing data...');
                    aiMessage = await analyzeAndRespond(message, queryResult, sqlQuery);
                } else {
                    // Non-data question, use simple response
                    console.log('Non-data question, using simple response...');
                    aiMessage = await simpleResponse(message);
                }
            } catch (queryError) {
                console.error('Query/Analysis error:', queryError);
                // Fallback to simple response if query fails
                aiMessage = await simpleResponse(message);
            }

            if (!aiMessage) {
                return res.status(200).json({
                    response: 'Maaf Kanjeng, ada kendala saat memproses pertanyaan. Coba lagi ya! 🙏'
                });
            }

            // Save AI response
            await conn.execute(
                'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
                ['assistant', aiMessage]
            );

            return res.status(200).json({ response: aiMessage });
        }

        if (req.method === 'DELETE') {
            await conn.execute('DELETE FROM chat_messages');
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    } finally {
        if (conn) await conn.end();
    }
}
