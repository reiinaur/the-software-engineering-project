import os
import json
import random
from flask import Blueprint, request, jsonify
from backend.routes.auth import token_required
from flask import g
from models import playerStats
 
levels = Blueprint('levels', __name__)
 
# maps each level number to its JSON source file and timer.
LEVEL_CONFIG = { 
    2: {"source": "vocabulary", "timerDuration": 45}, # adjusted timer durations for better pacing
    3: {"source": "nesa",       "timerDuration": 50},
    4: {"source": "nesa",       "timerDuration": 55},
    5: {"source": "nesa",       "timerDuration": 60},
}

# resolves the absolute path to the data folder one level up from this routes directory 
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
 
 
@levels.route('/api/levels/<int:level_number>', methods=['GET'])
@token_required
def get_level(level_number):
    # returns a randomly selected passage for the requested level number
    if level_number not in LEVEL_CONFIG:
        return jsonify({"message": "Level not found."}), 404
 
    # fetch the player's stats to check whether they've ranked up enough to access this level
    stats = playerStats.query.filter_by(userId=g.user_id).first()
    if not stats:
        return jsonify({"message": "Player stats missing."}), 404
 
    # rankLevel must be >= the requested level
    # prevents players from skipping ahead
    if stats.rankLevel < level_number:
        return jsonify({"message": "Level locked. Keep playing to rank up!"}), 403
 
    # look up the config entry and build the full path to the correct JSON file
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
 
    # pick one passage at random so the player gets variety on repeated attempts
    chosen = random.choice(passages)
 
    return jsonify({
        "passage":       chosen["text"],
        "title":         chosen["title"],
        "topic":         chosen["topic"],
        "timerDuration": config["timerDuration"],
    }), 200