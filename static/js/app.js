import { setLanguage, t } from './i18n.js';
import { saveTranslation, getHistory, toggleFavorite, deleteEntry } from './history.js';

// DOM elements
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const settingsBtn = document.getElementById('settingsBtn');
const backBtn = document.getElementById('backBtn');
const translateBtn = document.getElementById('translateBtn');
const speakBtn = document.getElementById('speakBtn');
const stopSpeakBtn = document.getElementById('stopSpeakBtn');
const voiceBtn = document.getElementById('voiceBtn');
const shareBtn = document.getElementById('shareBtn');
const inputText = document.getElementById('inputText');
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const resultDiv = document.getElementById('result');
const themeSelect = document.getElementById('themeSelect');
const emailInput = document.getElementById('emailInput');
const textSizeSlider = document.getElementById('textSizeSlider');
const uiLangSelect = document.getElementById('uiLangSelect');
const saveSettings = document.getElementById('saveSettings');
const supportBtn = document.getElementById('supportBtn');
const installBtn = document.getElementById('installBtn');
const showHistoryBtn = document.getElementById('showHistoryBtn');
const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');
const closeModal = document.querySelector('#historyModal .close');

let currentTranslation = '';
let currentDetectedLang = null;

// ===== PWA Install =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});
installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        alert('App already installed or not installable.');
        installBtn.style.display = 'none';
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Install prompt outcome: ${outcome}`);
    deferredPrompt = null;
    installBtn.style.display = 'none';
});
window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installBtn.style.display = 'none';
});

// ===== Settings & Theme =====
function loadSettings() {
    const theme = localStorage.getItem('theme') || 'light';
    const email = localStorage.getItem('email') || '';
    const textSize = localStorage.getItem('textSize') || 16;
    const uiLang = localStorage.getItem('uiLang') || 'en';
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    themeSelect.value = theme;
    emailInput.value = email;
    textSizeSlider.value = textSize;
    resultDiv.style.fontSize = textSize + 'px';
    uiLangSelect.value = uiLang;
    setLanguage(uiLang);
}
loadSettings();

saveSettings.addEventListener('click', () => {
    const theme = themeSelect.value;
    const email = emailInput.value;
    const textSize = textSizeSlider.value;
    const uiLang = uiLangSelect.value;
    localStorage.setItem('theme', theme);
    localStorage.setItem('email', email);
    localStorage.setItem('textSize', textSize);
    localStorage.setItem('uiLang', uiLang);
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    resultDiv.style.fontSize = textSize + 'px';
    setLanguage(uiLang);
    alert('Settings saved!');
});

settingsBtn.addEventListener('click', () => {
    mainView.style.display = 'none';
    settingsView.classList.remove('hidden');
    settingsView.classList.add('visible');
});

backBtn.addEventListener('click', () => {
    mainView.style.display = 'block';
    settingsView.classList.remove('visible');
    settingsView.classList.add('hidden');
});

supportBtn.addEventListener('click', () => {
    window.location.href = 'mailto:allandavincs89@gmail.com?subject=UniTranslate%20Support';
});

// ===== Text Size Slider (live) =====
textSizeSlider.addEventListener('input', (e) => {
    resultDiv.style.fontSize = e.target.value + 'px';
});

// ===== Translation =====
translateBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) {
        resultDiv.innerHTML = '<span class="error">' + t('inputPlaceholder') + '</span>';
        return;
    }
    if (!targetLang.value) {
        resultDiv.innerHTML = '<span class="error">Select target language</span>';
        return;
    }

    resultDiv.innerHTML = '<span class="loading">' + t('translate') + '...</span>';
    speakBtn.disabled = true;
    shareBtn.style.display = 'none';

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
            currentDetectedLang = data.detected_source_language || null;
            // Display with detected language if present
            if (currentDetectedLang) {
                const langNames = {
                    'EN': 'English', 'FR': 'French', 'DE': 'German',
                    'ES': 'Spanish', 'IT': 'Italian', 'PT': 'Portuguese',
                    'RU': 'Russian', 'ZH': 'Chinese', 'JA': 'Japanese'
                };
                const detectedName = langNames[currentDetectedLang] || currentDetectedLang;
                resultDiv.innerHTML = `<small>${t('detected')}: ${detectedName}</small><br>${data.translation}`;
            } else {
                resultDiv.innerHTML = data.translation;
            }
            speakBtn.disabled = false;
            shareBtn.style.display = navigator.share ? 'inline-block' : 'none'; // show if Web Share exists
            // Save to history
            saveTranslation(
                text,
                data.translation,
                sourceLang.value || 'auto',
                targetLang.value,
                currentDetectedLang
            ).catch(console.error);
        } else {
            resultDiv.innerHTML = `<span class="error">Error: ${data.error}</span>`;
        }
    } catch (err) {
        resultDiv.innerHTML = '<span class="error">Network error</span>';
    }
});

// ===== Text-to-Speech =====
speakBtn.addEventListener('click', () => {
    if (!currentTranslation) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTranslation);
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

// ===== Voice Input =====
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // can be dynamic later

    recognition.onstart = () => {
        voiceBtn.classList.add('listening');
        voiceBtn.textContent = '⏺️';
    };
    recognition.onend = () => {
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = '🎤';
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputText.value = transcript;
    };
    recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = '🎤';
    };
    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('listening')) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
} else {
    voiceBtn.disabled = true;
    voiceBtn.title = 'Speech recognition not supported';
}

// ===== Share =====
shareBtn.addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: 'UniTranslate Translation',
            text: currentTranslation,
        }).catch(console.error);
    } else {
        // Fallback
        navigator.clipboard.writeText(currentTranslation).then(() => {
            alert('Translation copied to clipboard!');
        }).catch(console.error);
    }
});

// ===== History Modal =====
showHistoryBtn.addEventListener('click', async () => {
    const history = await getHistory(20);
    renderHistory(history);
    historyModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
    historyModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

function renderHistory(entries) {
    historyList.innerHTML = '';
    entries.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <div>
                <span class="favorite">${entry.favorite ? '★' : '☆'}</span>
                <strong>${entry.sourceText.substring(0, 50)}${entry.sourceText.length > 50 ? '…' : ''}</strong>
                → ${entry.translatedText.substring(0, 50)}${entry.translatedText.length > 50 ? '…' : ''}
                <br><small>${new Date(entry.timestamp).toLocaleString()}</small>
            </div>
        `;
        li.addEventListener('click', () => {
            // Fill the input and translate again? Or just show result?
            inputText.value = entry.sourceText;
            sourceLang.value = entry.sourceLang === 'auto' ? '' : entry.sourceLang;
            targetLang.value = entry.targetLang;
            translateBtn.click(); // trigger translation
            historyModal.style.display = 'none';
        });
        // Add favorite toggle (optional)
        const favSpan = li.querySelector('.favorite');
        favSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            const newFav = !entry.favorite;
            toggleFavorite(entry.id, newFav).then(() => {
                entry.favorite = newFav;
                favSpan.textContent = newFav ? '★' : '☆';
            });
        });
        historyList.appendChild(li);
    });
}

// ===== Offline indicator =====
window.addEventListener('offline', () => {
    if (!document.getElementById('offline-banner')) {
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.textContent = 'You are offline. Showing cached translations.';
        document.body.prepend(banner);
    }
});
window.addEventListener('online', () => {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.remove();
});

// Disable speak when input changes
inputText.addEventListener('input', () => speakBtn.disabled = true);
sourceLang.addEventListener('change', () => speakBtn.disabled = true);
targetLang.addEventListener('change', () => speakBtn.disabled = true);