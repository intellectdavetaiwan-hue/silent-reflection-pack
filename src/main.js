
// State Management
let currentSection = 'root';

// -------------------------------------------------------------
// UI / Navigation Logic
// -------------------------------------------------------------

window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (sidebar.classList.contains('-translate-x-full')) {
        // Open
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        // Close
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

window.showSection = function (id) {
    // 1. Update State
    currentSection = id;

    // 2. Hide all main sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.add('hidden');
    });

    // 3. Show target section with fade-in animation
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-fade-in-up');
        // Reset animation after it plays
        setTimeout(() => target.classList.remove('animate-fade-in-up'), 600);
    }

    // 4. Update Navigation Active State
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.getElementById('link-' + id);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // 5. Scroll to top
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }

    // 6. Auto-close sidebar on mobile
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// -------------------------------------------------------------
// AI Assistant Logic (Backend Integrated)
// -------------------------------------------------------------

// 前端呼叫後端 API，不再直接連 Google，保護 Key 安全
async function callGemini(prompt, systemInstruction = "") {
    try {
        // v1 API (gemini-pro / 1.5-flash) 可能不支援 systemInstruction 獨立欄位
        // 因此我們採用「合併 Prompt」的通用寫法，保證相容性
        const finalPrompt = systemInstruction ? `${systemInstruction}\n\n----------------\n\n${prompt}` : prompt;

        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: finalPrompt }]
            }]
        };

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'API Error');
        }

        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("AI Error:", error);
        alert(`生成失敗：${error.message}\n如果收到 500/404 錯誤，請確認您執行的是 'node server.js' 而非 npm run dev。`);
        return null;
    }
}

window.generateAIScript = async function () {
    const activity = document.getElementById('ai-activity').value;
    const context = document.getElementById('ai-context').value;
    if (!context) return alert("請描述今天的班級情境，讓 AI 更有溫度。");

    const loading = document.getElementById('ai-loading');
    const result = document.getElementById('ai-result');

    loading.classList.remove('hidden');

    const actInfo = {
        "A1": "主題：在黑暗中感覺重量。重點在於協助學生連結身體與當下的壓力。",
        "A2": "主題：看不見彼此的善意。重點在於觀察班級中的非語言互動與溫暖瞬間。",
        "A3": "主題：寫給未來的情書。重點在於穿越時間的自我慈悲與鼓勵。",
        "A4": "主題：選擇放下的勇氣。重點在於心理邊界的建立與能量管理。",
        "General": "主題：隨機引導。重點在於整體的沉澱與呼吸。"
    };

    const system = `你是一位充滿哲學思維、溫潤、像詩人般的教育引導者。
你正協助一位中學導師進行「靜默反思」活動。
目標單元是：${actInfo[activity]}。
當前班級情境為：${context}。
請根據以上資訊，撰寫一段約 300-400 字的『引導語』。
要求：
1. 語速要慢，文字要有落地感。
2. 必須包含 [停頓 10秒] 或 [停頓 15秒] 的提示標籤（約 3-4 處）。
3. 具備視覺化的比喻，避免教條式的說教。
4. 結尾請給予一個溫柔的收尾。`;

    const prompt = `請根據以上情境與主題設定，生成一段引導逐字稿。`;

    const text = await callGemini(prompt, system);
    loading.classList.add('hidden');

    if (text) {
        result.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <span class="text-xs font-bold text-amber-500 uppercase tracking-widest">引導活動：${activity} 專屬逐字稿</span>
                <button onclick="copyAIScript()" class="text-xs bg-white/10 hover:bg-amber-400 hover:text-slate-900 px-3 py-1.5 rounded-lg transition-all text-white font-bold">複製文本</button>
            </div>
            <div id="ai-text-content" class="leading-loose text-justify">${text.replace(/\n/g, '<br>')}</div>
        `;
    }
}

window.copyAIScript = function () {
    const text = document.getElementById('ai-text-content').innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert("引導文字已複製，您可以貼到教案或手機備忘錄中使用！");
    });
}

window.toggleApiKeyInput = function () {
    alert("目前使用後端安全連線，API Key 受伺服器保護，前端無需輸入。");
}

// -------------------------------------------------------------
// PDF Preview & Download Logic
// -------------------------------------------------------------

// Map IDs to output filenames
const filenameMap = {
    'print-combined-1-2': '靜默反思_工作紙A_S1+S2.pdf',
    'print-combined-3-4': '靜默反思_工作紙B_S3+S4.pdf'
};

window.triggerDownload = function (id) {
    const element = document.getElementById(id);
    if (!element) return alert("找不到檔案來源");

    // 顯示下載中的提示
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ 處理中...';
    btn.disabled = true;

    const opt = {
        margin: 0,
        filename: filenameMap[id] || 'download.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

window.openPreview = function (id, title) {
    const modal = document.getElementById('preview-modal');
    const container = document.getElementById('preview-container');
    const modalTitle = document.getElementById('modal-title');
    const sourceElement = document.getElementById(id);

    if (!sourceElement) return;

    modalTitle.innerText = title || '預覽';
    // Use 'active' class to trigger CSS transition visibility
    modal.classList.add('active');

    // Clear previous content
    container.innerHTML = '';

    // Clone the print content for preview
    const clone = sourceElement.cloneNode(true);

    // Remove "hidden" class just in case the source had it (though the wrapper hides it)
    clone.classList.remove('hidden');

    // Apply scaling for preview (A4 is big, so we scale it down to fit screen)
    // We wrap it in a scaler div
    const wrapper = document.createElement('div');
    wrapper.className = "flex justify-center bg-slate-100/50 p-4 overflow-auto custom-scrollbar";
    wrapper.style.minHeight = "400px";

    // CSS Zoom or Scale
    // Creating a container that mimics the A4 ratio
    clone.style.transform = "scale(0.55)";
    clone.style.transformOrigin = "top center";
    clone.style.display = "block"; // 強制顯示
    clone.style.backgroundColor = "white"; // 強制白底
    clone.style.margin = "0 auto"; // 居中
    clone.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";

    // 確保父容器有足夠高度來容納縮放後的 A4
    // A4 height ~1123px * 0.55 ~ 617px
    wrapper.style.height = "650px";

    wrapper.appendChild(clone);
    container.appendChild(wrapper);
}

window.closePreview = function () {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('active');
}

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------

// Only show root on load
document.addEventListener('DOMContentLoaded', () => {
    // Check if URL has hash
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
        showSection(hash);
    } else {
        showSection('root');
    }

    // Setup AI Context placeholders
    const contextInput = document.getElementById('ai-context');
    if (contextInput) {
        contextInput.value = "高中二年級，段考剛結束，班上氣氛有些浮躁，但大家大致上相處融洽。";
    }
});
