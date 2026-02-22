// DOM elements
const translateBtn = document.getElementById('translateBtn');
const speakBtn = document.getElementById('speakBtn');
const stopSpeakBtn = document.getElementById('stopSpeakBtn');
const inputText = document.getElementById('inputText');
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const resultDiv = document.getElementById('result');
const settingsBtn = document.getElementById('settingsBtn');
const modal = document.getElementById('settingsModal');
const closeModal = document.querySelector('.close');
const themeSelect = document.getElementById('themeSelect');
const emailInput = document.getElementById('emailInput');
const saveSettings = document.getElementById('saveSettings');

let currentTranslation = '';

// Load settings from localStorage
function loadSettings() {
    const theme = localStorage.getItem('theme') || 'light';
    const email = localStorage.getItem('email') || '';
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    themeSelect.value = theme;
    emailInput.value = email;
}
loadSettings();

// Save settings
saveSettings.addEventListener('click', () => {
    const theme = themeSelect.value;
    const email = emailInput.value;
    localStorage.setItem('theme', theme);
    localStorage.setItem('email', email);
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    modal.style.display = 'none';
});

// Modal handling
settingsBtn.onclick = () => modal.style.display = 'block';
closeModal.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

// Translation
translateBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) {
        resultDiv.innerHTML = '<span class="error">Enter text</span>';
        return;
    }
    if (!targetLang.value) {
        resultDiv.innerHTML = '<span class="error">Select target language</span>';
        return;
    }

    resultDiv.innerHTML = '<span class="loading">Translating...</span>';
    speakBtn.disabled = true;

    try {
        const res = await fetch('/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                source_lang: sourceLang.value || undefined,
                target_lang: targetLang.value
            })
        });
        const data = await res.json();
        if (res.ok) {
            currentTranslation = data.translation;
            resultDiv.innerHTML = currentTranslation;
            speakBtn.disabled = false;
        } else {
            resultDiv.innerHTML = `<span class="error">Error: ${data.error}</span>`;
        }
    } catch (err) {
        resultDiv.innerHTML = `<span class="error">Network error</span>`;
    }
});

// Text-to-speech
speakBtn.addEventListener('click', () => {
    if (!currentTranslation) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTranslation);
    // Map target language to BCP 47
    const langMap = {
        'EN': 'en-US', 'FR': 'fr-FR', 'DE': 'de-DE',
        'ES': 'es-ES', 'IT': 'it-IT', 'PT': 'pt-PT',
        'RU': 'ru-RU', 'ZH': 'zh-CN', 'JA': 'ja-JP'
    };
    utterance.lang = langMap[targetLang.value] || 'en-US';
    window.speechSynthesis.speak(utterance);
});

stopSpeakBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
});

// Disable speak when input changes
inputText.addEventListener('input', () => speakBtn.disabled = true);
sourceLang.addEventListener('change', () => speakBtn.disabled = true);
targetLang.addEventListener('change', () => speakBtn.disabled = true);