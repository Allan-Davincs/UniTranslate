const dbName = 'UniTranslateDB';
const storeName = 'history';
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp');
                store.createIndex('favorite', 'favorite');
            }
        };
    });
}

function ensureDB() {
    if (!db) return openDB();
    return Promise.resolve();
}

export async function saveTranslation(sourceText, translatedText, sourceLang, targetLang, detectedLang = null) {
    await ensureDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const entry = {
        sourceText,
        translatedText,
        sourceLang,
        targetLang,
        detectedLang,
        timestamp: Date.now(),
        favorite: false
    };
    store.add(entry);
    return tx.complete;
}

export async function getHistory(limit = 50) {
    await ensureDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index('timestamp');
    return new Promise((resolve, reject) => {
        const request = index.openCursor(null, 'prev');
        const results = [];
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && results.length < limit) {
                results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

export async function toggleFavorite(id, favorite) {
    await ensureDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const entry = await new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    if (entry) {
        entry.favorite = favorite;
        store.put(entry);
    }
    return tx.complete;
}

export async function deleteEntry(id) {
    await ensureDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    return tx.complete;
}