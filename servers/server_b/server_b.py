from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
from pymongo import MongoClient
import os
import uuid
import multiprocessing

multiprocessing.set_start_method("fork", force=True)

app = Flask(__name__)
CORS(app)

transformers_translator = None

def load_translation_model():
    global transformers_translator
    if transformers_translator is None:
        print("Loading Hugging Face translation model...")
        transformers_translator = pipeline("translation_en_to_es", model="Helsinki-NLP/opus-mt-en-es",device=-1)

# MongoDB setup
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(mongo_uri)

db = client["SpanglishSurfer"]
feedback_collection = db["Feedback"]

@app.route('/translate', methods=['POST'])
def translate_sentence():
    data = request.json
    english_sentence = data.get('sentence')
    if not english_sentence:
        print("here")
        return jsonify({"error": "No sentence provided"}), 400

    try:
        translated = transformers_translator(english_sentence)[0]['translation_text']
        print("translated text: ", translated)
        return jsonify({"translated_text": translated}), 200
    except Exception as e:
        print("error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/store-feedback', methods=['POST'])
def store_feedback():
    data = request.json
    required_fields = ["satisfaction", "question", "correctAnswer", "yourAnswer"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing field: {field}"}), 400

    feedback_document = {
        "satisfaction": data["satisfaction"],
        "question": data["question"],
        "correctAnswer": data["correctAnswer"],
        "userResponse": data["yourAnswer"],
    }
    result = feedback_collection.insert_one(feedback_document)
    print(result)
    return jsonify({"message": "Feedback stored successfully"}), 200

if __name__ == "__main__":
    load_translation_model()

    port = int(os.environ.get("PORT", 8081))
    app.run(host="0.0.0.0", port=port, debug=True)

