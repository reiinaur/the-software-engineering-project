from flask import Blueprint, request, jsonify
import os
import json
from backend.routes.auth import admin_required

vocab = Blueprint('vocab', __name__)

TOPICS = [
    "Programming fundamentals",
    "Object-oriented programming",
    "Programming mechatronics",
    "Secure software architecture", 
    "Programming for the web",
    "Software automation"
]

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
JSON_FILEPATH = os.path.join(DATA_DIR, 'vocabulary.json')


def _load_json_data():
    if not os.path.exists(JSON_FILEPATH):
        return {"passages": []}
    try:
        with open(JSON_FILEPATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"passages": []}


def _save_json_data(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(JSON_FILEPATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


@vocab.route('/api/vocab/all', methods=['GET'])
def get_all_topics():
    return jsonify(TOPICS), 200


@vocab.route('/api/vocab/<topic_name>', methods=['GET'])
def get_words_by_topic(topic_name):
    if topic_name not in TOPICS:
        return jsonify({"message": f"Topic '{topic_name}' not found."}), 404

    data = _load_json_data()
    passages = data.get('passages', [])

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

    json_data = _load_json_data()
    json_data["passages"].append({
        "title": new_word,
        "topic": topic_name,
        "text": new_def
    })

    try:
        _save_json_data(json_data)
        return jsonify({"status": "success", "message": "Word successfully written!"}), 200
    except Exception:
        return jsonify({"message": "Failed writing payload to file store."}), 500


@vocab.route('/api/vocab/admin/update-word', methods=['PUT'])
@admin_required
def update_word_in_topic():
    """Admin-only: updates an existing word + definition match."""
    data        = request.get_json() or {}
    topic_name  = data.get('topicName', '').strip()
    target_word = data.get('targetWord', '').strip()  # The original title before editing
    new_word    = data.get('newWord', '').strip()
    new_def     = data.get('newDefinition', '').strip()

    if not target_word or not new_word or not new_def:
        return jsonify({"message": "All text parameters are required."}), 400

    json_data = _load_json_data()
    passages = json_data.get('passages', [])
    
    found = False
    for passage in passages:
        # Match topic and target item title key
        if passage.get('topic') == topic_name and passage.get('title') == target_word:
            passage['title'] = new_word
            passage['text'] = new_def
            found = True
            break

    if not found:
        return jsonify({"message": "Target term matching criteria was not found."}), 404

    try:
        _save_json_data(json_data)
        return jsonify({"status": "success", "message": "Word updated successfully."}), 200
    except Exception:
        return jsonify({"message": "Error committing updates to file system."}), 500


@vocab.route('/api/vocab/admin/delete-word', methods=['POST'])
@admin_required
def delete_word_from_topic():
    """Admin-only: deletes an item entry from the vocabulary passages array."""
    data        = request.get_json() or {}
    topic_name  = data.get('topicName', '').strip()
    target_word = data.get('targetWord', '').strip()

    json_data = _load_json_data()
    passages = json_data.get('passages', [])

    # Filter everything except the targeted entry item
    updated_passages = [
        p for p in passages 
        if not (p.get('topic') == topic_name and p.get('title') == target_word)
    ]

    if len(passages) == len(updated_passages):
         return jsonify({"message": "Target word variant not found."}), 404

    json_data['passages'] = updated_passages

    try:
        _save_json_data(json_data)
        return jsonify({"status": "success", "message": "Word removed successfully."}), 200
    except Exception:
        return jsonify({"message": "Failed updating content layout table configurations."}), 500