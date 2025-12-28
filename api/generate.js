
// Vercel Serverless Function: /api/generate
export default async function handler(req, res) {
    // 設置 CORS 標頭，允許跨域請求（視需求，生產環境可限制 Origin）
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // 處理預檢請求 (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只允許 POST 方法
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('❌ 後端錯誤：找不到 GEMINI_API_KEY');
            return res.status(500).json({ error: { message: 'Server Configuration Error: Missing API Key' } });
        }

        // 使用 gemini-2.5-flash (與用戶最後確認的最新模型)
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        console.log('⚡️ Vercel Function: Forwarding request to Google (Standard)...');

        // 向 Google 發送請求
        const response = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Google API Error:', data);
            return res.status(response.status).json(data);
        }

        // 回傳成功結果
        res.status(200).json(data);

    } catch (error) {
        console.error('❌ Serverless Function Error:', error);
        res.status(500).json({ error: { message: error.message } });
    }
}
