import os
from flask import Flask, request, jsonify, render_template, send_from_directory
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

DEEPL_API_KEY = os.getenv('DEEPL_API_KEY')
DEEPL_URL = "https://api-free.deepl.com/v2/translate"

# Serve static files (for PWA manifest, service worker, etc.)
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data.get('text')
    target_lang = data.get('target_lang')
    source_lang = data.get('source_lang')

    if not text or not target_lang:
        return jsonify({'error': 'Missing text or target language'}), 400

    headers = {
        'Authorization': f'DeepL-Auth-Key {DEEPL_API_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {'text': [text], 'target_lang': target_lang.upper()}
    if source_lang:
        payload['source_lang'] = source_lang.upper()

    try:
        response = requests.post(DEEPL_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        translation = result['translations'][0]['text']
        return jsonify({'translation': translation})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)