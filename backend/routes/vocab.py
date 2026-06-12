from flask import Blueprint, request, jsonify
from models import db, vocabData
from routes.auth import admin_required # Uses our security decorator to protect configuration pathways

vocab = Blueprint('vocab', __name__)

@vocab.route('/api/vocab/<topic_name>', methods=['GET'])
def get_words_by_topic(topic_name):
    # Public endpoint: anyone can load words to play a level
    vocab = vocabData.query.filter_by(topicName=topic_name).first()
    if not vocab:
        return jsonify({"message": f"Vocabulary topic categorization content clear database miss: '{topic_name}'."}), 404

    return jsonify({
        "topic": vocab.topicName,
        "words": vocab.words,
        "definitions": vocab.definitions
    }), 200

@vocab.route('/api/vocab/admin/create', methods=['POST'])
@admin_required # Locks out normal players from sneaking custom datasets in
def administrative_create_topic():
    data = request.get_json() or {}
    topic = data.get('topicName')
    words_list = data.get('words')
    definitions_list = data.get('definitions')

    if not topic or not isinstance(words_list, list) or not isinstance(definitions_list, list):
        return jsonify({"message": "Invalid vocab layout request schema data definitions structures."}), 400

    try:
        new_topic = vocabData(
            topicName=topic,
            words=words_list,
            definitions=definitions_list
        )
        
        # Call our length validation utility built directly into models.py
        new_topic.validate_vocab_lengths()
        
        db.session.add(new_topic)
        db.session.commit()

        return jsonify({"status": "success", "message": f"New dictionary template topic '{topic}' appended successfully."}), 201

    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Topic database identifier conflict: category may already exist."}), 400
