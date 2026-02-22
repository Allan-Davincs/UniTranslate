
const translations = {
    en: {
        title: 'UniTranslate',
        inputPlaceholder: 'Enter text to translate...',
        translate: 'Translate',
        speak: 'Speak',
        stop: 'Stop',
        settings: 'Settings',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        textSize: 'Text Size',
        uiLanguage: 'Language',
        email: 'Email (for support)',
        support: 'Contact Support',
        install: 'Install App',
        save: 'Save Settings',
        share: 'Share',
        history: 'Translation History',
        detected: 'Detected',
        favorite: 'Favorite',
        delete: 'Delete'
    },
    es: {
        title: 'UniTranslate',
        inputPlaceholder: 'Introduce texto para traducir...',
        translate: 'Traducir',
        speak: 'Hablar',
        stop: 'Parar',
        settings: 'Ajustes',
        theme: 'Tema',
        light: 'Claro',
        dark: 'Oscuro',
        textSize: 'Tamaño de texto',
        uiLanguage: 'Idioma',
        email: 'Correo (para soporte)',
        support: 'Contactar Soporte',
        install: 'Instalar App',
        save: 'Guardar Ajustes',
        share: 'Compartir',
        history: 'Historial',
        detected: 'Detectado',
        favorite: 'Favorito',
        delete: 'Eliminar'
    }
};

let currentLang = 'en';

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        applyTranslations();
        localStorage.setItem('uiLang', lang);
    }
}

export function t(key) {
    return translations[currentLang]?.[key] || translations.en[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
        const key = el.getAttribute('data-i18n-value');
        el.value = t(key);
    });
}

// Load saved language
const savedLang = localStorage.getItem('uiLang');
if (savedLang && translations[savedLang]) {
    currentLang = savedLang;
}

// Apply on DOM load
document.addEventListener('DOMContentLoaded', applyTranslations);