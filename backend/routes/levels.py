import os
import json
import random
from flask import Blueprint, request, jsonify
from routes.auth import token_required
from flask import g
from models import playerStats
 
levels = Blueprint('levels', __name__)
 
# maps each level number to its JSON source file and timer.
LEVEL_CONFIG = {
    1: {"source": "vocabulary", "timerDuration": 45}, # adjusted timer durations for better pacing based on playtesting feedback
    2: {"source": "vocabulary", "timerDuration": 40},
    3: {"source": "nesa",       "timerDuration": 60},
    4: {"source": "nesa",       "timerDuration": 55},
    5: {"source": "nesa",       "timerDuration": 50},
}
 
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
 
 
@levels.route('/api/levels/<int:level_number>', methods=['GET'])
@token_required
def get_level(level_number):
    # returns a random passage for the requested level.
    if level_number not in LEVEL_CONFIG:
        return jsonify({"message": "Level not found."}), 404
 
    # rank gate check: ensures players can only access levels appropriate to their rank
    stats = playerStats.query.filter_by(userId=g.user_id).first()
    if not stats:
        return jsonify({"message": "Player stats missing."}), 404
 
    if stats.rankLevel < level_number:
        return jsonify({"message": "Level locked. Keep playing to rank up!"}), 403
 
    # load passage from the correct JSON file
    config   = LEVEL_CONFIG[level_number]
    filepath = os.path.join(DATA_DIR, f"{config['source']}.json")
 
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        return jsonify({"message": f"Data file for level {level_number} not found."}), 500
 
    passages = data.get('passages', [])
    if not passages:
        return jsonify({"message": "No passages available for this level."}), 500
 
    chosen = random.choice(passages)
 
    return jsonify({
        "passage":       chosen["text"],
        "title":         chosen["title"],
        "topic":         chosen["topic"],
        "timerDuration": config["timerDuration"],
    }), 200