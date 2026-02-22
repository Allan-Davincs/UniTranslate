// DOM elements
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const settingsBtn = document.getElementById('settingsBtn');
const backBtn = document.getElementById('backBtn');
const translateBtn = document.getElementById('translateBtn');
const speakBtn = document.getElementById('speakBtn');
const stopSpeakBtn = document.getElementById('stopSpeakBtn');
const inputText = document.getElementById('inputText');
const sourceLang = document.getElementById('sourceLang');
const targetLang = document.getElementById('targetLang');
const resultDiv = document.getElementById('result');
const themeSelect = document.getElementById('themeSelect');
const emailInput = document.getElementById('emailInput');
const saveSettings = document.getElementById('saveSettings');
const supportBtn = document.getElementById('supportBtn');
const installBtn = document.getElementById('installBtn');

let currentTranslation = '';

// ----- PWA Install Logic -----
let deferredPrompt;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Show the install button
    installBtn.style.display = 'block';
});

// When the install button is clicked
installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        alert('App is already installed or not installable.');
        installBtn.style.display = 'none';
        return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    // Clear the prompt and hide the button
    deferredPrompt = null;
    installBtn.style.display = 'none';
});

// If the app is installed, hide the button
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed.');
    deferredPrompt = null;
    installBtn.style.display = 'none';
});

// ----- Settings & Theme -----
function loadSettings() {
    const theme = localStorage.getItem('theme') || 'light';
    const email = localStorage.getItem('email') || '';
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
    themeSelect.value = theme;
    emailInput.value = email;
}
loadSettings();

saveSettings.addEventListener('click', () => {
    const theme = themeSelect.value;
    const email = emailInput.value;
    localStorage.setItem('theme', theme);
    localStorage.setItem('email', email);
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
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

// ----- Translation -----
translateBtn.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) {
        resultDiv.innerHTML = '<span class="error">Please enter text</span>';
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
        resultDiv.innerHTML = '<span class="error">Network error</span>';
    }
});

// ----- Text-to-Speech -----
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

// Disable speak when input changes
inputText.addEventListener('input', () => speakBtn.disabled = true);
sourceLang.addEventListener('change', () => speakBtn.disabled = true);
targetLang.addEventListener('change', () => speakBtn.disabled = true);