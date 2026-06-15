from flask import Blueprint, request, jsonify
from models import db, vocabData
from routes.auth import admin_required
 
vocab = Blueprint('vocab', __name__)
 
 
@vocab.route('/api/vocab/<topic_name>', methods=['GET'])
def get_words_by_topic(topic_name):
    """
    Public endpoint — no token needed.
    The game needs to load vocab to display a level, and vocab itself
    isn't sensitive data, so it doesn't need authentication.
    """
    topic = vocabData.query.filter_by(topicName=topic_name).first()
    if not topic:
        return jsonify({"message": f"Topic '{topic_name}' not found."}), 404
 
    return jsonify({
        "topic":       topic.topicName,
        "words":       topic.words,
        "definitions": topic.definitions
    }), 200
 
 
@vocab.route('/api/vocab/admin/create', methods=['POST'])
@admin_required
def create_topic():
    """Admin-only: create a new vocabulary topic."""
    data            = request.get_json() or {}
    topic           = data.get('topicName')
    words_list      = data.get('words')
    definitions_list = data.get('definitions')
 
    if not topic or not isinstance(words_list, list) or not isinstance(definitions_list, list):
        return jsonify({"message": "Invalid request structure."}), 400
 
    try:
        new_topic = vocabData(
            topicName=topic,
            words=words_list,
            definitions=definitions_list
        )
        new_topic.validate_vocab_lengths()  # manual call — checks arrays match
        db.session.add(new_topic)
        db.session.commit()
        return jsonify({"status": "success", "message": f"Topic '{topic}' created."}), 201
 
    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Topic already exists or DB error."}), 400
 
 
@vocab.route('/api/vocab/admin/add-word', methods=['POST'])
@admin_required
def add_word_to_topic():
    """Admin-only: append a single word+definition to an existing topic."""
    data       = request.get_json() or {}
    topic_name = data.get('topicName', '').strip()
    new_word   = data.get('newWord', '').strip()
    new_def    = data.get('newDefinition', '').strip()
 
    if not new_word or not new_def or not topic_name:
        return jsonify({"message": "All fields are required."}), 400
 
    if len(new_word) > 50:
        return jsonify({"message": "Word must be 50 characters or fewer."}), 400
 
    topic = vocabData.query.filter_by(topicName=topic_name).first()
    if not topic:
        return jsonify({"message": f"Topic '{topic_name}' not found. Create it first."}), 404
 
    try:
        updated_words = list(topic.words)
        updated_defs  = list(topic.definitions)
        updated_words.append(new_word)
        updated_defs.append(new_def)
        topic.words       = updated_words
        topic.definitions = updated_defs
        topic.validate_vocab_lengths()
        db.session.commit()
        return jsonify({"status": "success", "message": "Word added."}), 200
 
    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400