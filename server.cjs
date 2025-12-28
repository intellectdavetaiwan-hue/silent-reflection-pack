
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// 啟用 CORS 和 JSON 解析
app.use(cors());
app.use(express.json());

// 靜態檔案服務 (提供前端網頁)
app.use(express.static(path.join(__dirname)));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));
// 確保 node_modules 裡的 Vite 資源也能被讀取 (如果有的話)
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// ✅ API 路由：這裡是最安全的地方，因為它是在後端執行
app.post('/api/generate', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('❌ 後端錯誤：找不到 GEMINI_API_KEY');
            return res.status(500).json({ error: { message: 'Server API Key Config Error' } });
        }

        // 使用 gemini-2.5-flash (根據使用者截圖確認的最新模型)
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        console.log('⚡️ 正在向 Google 發送請求 (Model: gemini-2.5-flash)...');

        const response = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Google API 回傳錯誤:', data);
            return res.status(response.status).json(data);
        }

        console.log('✅ 成功取得回應');
        res.json(data);

    } catch (error) {
        console.error('❌ 伺服器內部錯誤:', error);
        res.status(500).json({ error: { message: error.message } });
    }
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`
    🚀 伺服器已啟動！ (使用 CommonJS 模式)
    -----------------------------------
    👉 請在瀏覽器打開： http://localhost:${PORT}
    -----------------------------------
    `);
});
