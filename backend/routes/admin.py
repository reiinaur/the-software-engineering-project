from functools import wraps
from flask import Blueprint, request, jsonify, app
from models import db, User

admin = Blueprint('admin', __name__)

@admin.route('/admin', methods=['POST'])
def adminVocabEditor():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Missing request body"}), 400

    selectedTopic = data.get('selectedTopic')
    newWord = data.get('newWord')
    newDefinition = data.get('newDefinition')