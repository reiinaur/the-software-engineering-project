from flask import Blueprint, request, jsonify
import os
import json
from routes.auth import admin_required

vocab = Blueprint('vocab', __name__)

# Hardcoded allowed topics for your select box menu
TOPICS = [
    "Object Oriented Programming",
    "Data Structures",
    "Web Development",
    "Databases",
    "Cybersecurity"
]

# Dynamically locate the path to your data/vocabulary.json file
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
JSON_FILEPATH = os.path.join(DATA_DIR, 'vocabulary.json')


def _load_json_data():
    """Helper method to read the JSON safely or initialize it if missing."""
    if not os.path.exists(JSON_FILEPATH):
        return {"passages": []}
    try:
        with open(JSON_FILEPATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"passages": []}


def _save_json_data(data):
    """Helper method to write data cleanly back out to the JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(JSON_FILEPATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


@vocab.route('/api/vocab/all', methods=['GET'])
def get_all_topics():
    """Returns the hardcoded TOPICS list to populate the Phaser selection box."""
    return jsonify(TOPICS), 200


@vocab.route('/api/vocab/<topic_name>', methods=['GET'])
def get_words_by_topic(topic_name):
    """
    Finds all entries inside vocabulary.json matching the selected topic
    and packs them into arrays for your admin panel layout to display.
    """
    if topic_name not in TOPICS:
        return jsonify({"message": f"Topic '{topic_name}' not found."}), 404

    data = _load_json_data()
    passages = data.get('passages', [])

    # Filter out entries matching this specific topic label
    filtered_words = []
    filtered_defs = []
    for passage in passages:
        if passage.get('topic') == topic_name:
            filtered_words.append(passage.get('title', ''))
            filtered_defs.append(passage.get('text', ''))

    return jsonify({
        "topic": topic_name,
        "words": filtered_words,
        "definitions": filtered_defs
    }), 200


@vocab.route('/api/vocab/admin/add-word', methods=['POST'])
@admin_required
def add_word_to_topic():
    """
    Admin-only: appends a brand new word + definition as a fresh passage
    directly inside vocabulary.json under the selected topic label.
    """
    data       = request.get_json() or {}
    topic_name = data.get('topicName', '').strip()
    new_word   = data.get('newWord', '').strip()
    new_def    = data.get('newDefinition', '').strip()

    if not new_word or not new_def or not topic_name:
        return jsonify({"message": "All fields are required."}), 400

    if topic_name not in TOPICS:
        return jsonify({"message": f"'{topic_name}' is not an authorized program topic."}), 400

    if len(new_word) > 50:
        return jsonify({"message": "Word must be 50 characters or fewer."}), 400

    # Load current file data contents
    json_data = _load_json_data()

    # Append the new entry matching the exact structure your levels look for!
    json_data["passages"].append({
        "title": new_word,
        "topic": topic_name,
        "text": new_def
    })

    # Commit modifications out to disk file
    try:
        _save_json_data(json_data)
        return jsonify({"status": "success", "message": "Word successfully written to vocabulary.json!"}), 200
    except Exception:
        return jsonify({"message": "Failed writing out payload data to JSON file store."}), 500