from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
from unidecode import unidecode
import requests
import uuid
import os

app = Flask(__name__)
CORS(app)

nlp = None

mapping = {
    "Ind": "Indicativo",
    "Sub": "Subjuntivo",
    "Cnd": "Condicional",
    "Past": "Pretérito",
    "Fut": "Futuro",
    "Pres": "Presente",
    "Imp": "Imperfecto",
    "1": "Primera persona",
    "2": "Segunda persona",
    "3": "Tercera persona"
}

def load_spacy_model():
    global nlp
    if nlp is None:
        print("Loading SpaCy model...")
        nlp = spacy.load("es_core_news_sm")

def extract_verbs(spanish_sentence):
    print("extract first sentence \n")
    doc = nlp(spanish_sentence)

    verbs_info = {}
    verbs = []
    reconstructed_sentence = []  # List to hold the final reconstructed sentence

    for token in doc:
        print(f"Original: {token.text}, Lemma: {token.lemma_}")
        if token.pos_ == "VERB" or token.pos_ == "AUX":
            verbs.append(token.text)
            # Extract additional conjugation details
            tense = token.morph.get("Tense")
            mood = token.morph.get("Mood")
            person = token.morph.get("Person")
            number = token.morph.get("Number")
            verb_form = token.morph.get("VerbForm")

            print(mood, tense, person)

            # # Store verb details
            # verb_details = {
            #     "verb": token.text,
            #     "lemma": token.lemma_,
            #     "tense": tense_mapping[tense[0]] if tense else None,
            #     "mood": mood_mapping[mood[0]] if mood else None,
            #     "person": person[0] if person else None,
            #     "number": number[0] if number else None,
            #     "verb_form": verb_form[0] if verb_form else None
            # }
            # verbs_info[token.text] = verb_details

            # tense_mapping = {
            #     "Past": "Pretérito",
            #     "Present": "Presente",
            #     "Future": "Futuro",
            #     "Imp": "Imperfecto"
            # }
            
            # mood_mapping = {
            #     "Ind": "Indicativo",
            #     "Subj": "Subjuntivo",
            #     "Impe": "Imperativo",
            #     "Cond": "Condicional"
            # }
            
            # person_mapping = {
            #     "1": "Primera Persona",
            #     "2": "Segunda Persona",
            #     "3": "Tercera Persona"
            # }

            verb_details = {
                "verb": token.text,
                "lemma": token.lemma_,
                "tense": mapping[tense[0]] if tense else None,
                "mood": mapping[mood[0]] if mood else None,
                "person": mapping[person[0]] if person else None,
                "number": number[0] if number else None,
                "verb_form": verb_form[0] if verb_form else None
            }
            verbs_info[token.text] = verb_details

            # Create the input box HTML
            input_box = """
            <input type='text' 
                class='verb-input' 
                id='input-{id}' 
                placeholder='Fill in the verb' 
                maxLength='{size}' 
                data-mood='{mood}' 
                data-tense='{tense}' 
                data-person='{person}' 
                data-answer='{ans}'
            /> ({infinitive})
            """.format(
                id = uuid.uuid4(),
                size=(len(token.text) + 5),
                infinitive=token.lemma_,
                mood=mapping[mood[0]] if mood else "",
                tense=mapping[tense[0]] if tense else "",
                person=mapping[person[0]] if person else "",
                ans=token.text
            )

            # Add the input box to the reconstructed sentence
            reconstructed_sentence.append(input_box)
        else:
            # Avoid space before punc.
            if token.is_punct and reconstructed_sentence:
                reconstructed_sentence[-1] += token.text

            # Add the original token text to the reconstructed sentence
            else:
                reconstructed_sentence.append(token.text)

    # Join the reconstructed sentence
    final_sentence = " ".join(reconstructed_sentence)
    print(final_sentence)

    return verbs, final_sentence, verbs_info


@app.route('/translate', methods=['POST'])
def translate_and_process():
    data = request.json
    print("Incoming data:", data)  # Debugging log
    english_sentence = data.get('sentence')
    if not english_sentence:
        print("No sentence provided.")
        return jsonify({"error": "No sentence provided"}), 400

    try:
        # Call Server B for translation
        print("Sending request to Server B...")

        server_b_url = os.environ.get('SERVER_B_URL', 'https://server-b.onrender.com')
        response = requests.post(server_b_url, json={"sentence": english_sentence})
        print("Response from Server B:", response.text)
        if response.status_code != 200:
            print("Translation failed.")
            return jsonify({"error": "Translation failed", "details": response.json()}), 500

        translated_text = response.json().get("translated_text")
        print("Translated text:", translated_text)

        verbs, formatted_sentence, verbs_info = extract_verbs(translated_text)
        print("Extracted verbs:", verbs)
        print("Formatted sentence:", formatted_sentence)

        return jsonify({
            "translated_text": formatted_sentence,
            "omitted_verb": verbs,
            "info": verbs_info,
            "original_text": data,
            "error": None
        })
    except Exception as e:
        print("Exception occurred:", str(e))  # Log the exception
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    load_spacy_model()
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
