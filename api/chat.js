// Vercel Serverless Function for AI Chat
import mysql from 'mysql2/promise';

const dbConfig = {
    host: '153.92.15.23',
    port: 3306,
    user: 'u444914729_jjm',
    password: 'Sagala.4321',
    database: 'u444914729_jjm'
};

const OPENROUTER_API_KEY = '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';
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
            const { message, context } = req.body;

            const systemPrompt = `Kamu adalah asisten keuangan pribadi bernama JJ. Kamu membantu user mengelola keuangan mereka dengan ramah dan profesional dalam Bahasa Indonesia.

Konteks keuangan user saat ini:
${context || 'Tidak ada data keuangan tersedia.'}

Berikan saran yang relevan berdasarkan data di atas. Jawab dengan singkat, padat, dan ramah. Gunakan emoji untuk membuat percakapan lebih menarik.`;

            // Save user message
            await conn.execute(
                'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
                ['user', message]
            );

            // Call OpenRouter
            const aiResponse = await callOpenRouter(systemPrompt, message);

            // Check for OpenRouter specific errors
            if (aiResponse.error) {
                console.error('OpenRouter Error:', aiResponse.error);
                await conn.execute(
                    'INSERT INTO chat_messages (role, content) VALUES (?, ?)',
                    ['assistant', `Error: ${aiResponse.error.message}`]
                );
                return res.status(200).json({
                    response: 'Maaf, ada kendala pada sistem AI.',
                    debug: aiResponse.error
                });
            }

            const aiMessage = aiResponse.choices?.[0]?.message?.content;

            if (!aiMessage) {
                return res.status(200).json({
                    response: 'Maaf, tidak ada respon dari AI.',
                    debug: aiResponse
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
