from functools import wraps
from flask import Blueprint, request, jsonify, app
from models import db, playerStats

game = Blueprint('game', __name__)

@game.route('/level-select', methods=['POST'])
def loadLevel():   
    levelUnlocked = True
    if rankLevel < levelNumber:
        levelUnlocked = False
        return jsonify({"message": "Minimum level requirement not met."}), 400
    
    selectedPassage = response.passage
    articleName = response.title
