import uuid
from flask import Blueprint, request, jsonify, g
from models import db, playerStats, scoreHistory
from routes.auth import token_required
 
statsBP = Blueprint('stats', __name__)
 
# XP thresholds for rank progression.
RANK_THRESHOLDS = [0, 100, 300, 600, 1000, 1500]
 
 
@statsBP.route('/api/stats/submit-score', methods=['POST'])
@token_required
def submit_level_score():
    data = request.get_json() or {}
 
    level_num    = data.get('levelNumber')
    wpm          = data.get('wpm')
    accuracy     = data.get('accuracy')
    xp_gain      = data.get('xpGain')
    coins_earned = data.get('coinsEarned')
    deadline_met = data.get('deadlineMet')
 
    if None in [level_num, wpm, accuracy, xp_gain, coins_earned, deadline_met]:
        return jsonify({"message": "Missing score data fields."}), 400
 
    player = playerStats.query.filter_by(userId=g.user_id).first()
    if not player:
        return jsonify({"message": "Player statistics not found."}), 404
 
    try:
        # check PB for this level
        current_pbs = dict(player.PBs)
        old_pb      = current_pbs.get(str(level_num), 0)
        is_new_pb   = wpm > old_pb
 
        if is_new_pb:
            current_pbs[str(level_num)] = wpm
            player.PBs = current_pbs
 
        # track completed levels
        current_finished = list(player.finLevels)
        if level_num not in current_finished:
            current_finished.append(level_num)
            player.finLevels = current_finished
 
        # update player stats
        player.xpTotal     += xp_gain
        player.coinBalance += coins_earned
 
        # recalculate rank: find the highest threshold the player has passed
        new_rank = 1
        for i, threshold in enumerate(RANK_THRESHOLDS):
            if player.xpTotal >= threshold:
                new_rank = i + 1
        player.rankLevel = min(new_rank, 5)  # Cap at 5
 
        # write score history row
        history_entry = scoreHistory(
            scoreId=f"sc-{uuid.uuid4().hex[:8]}",
            userId=g.user_id,
            levelNumber=level_num,
            wpm=wpm,
            acc=accuracy,
            xpGain=xp_gain,
            deadlineMet=deadline_met,
            isPB=is_new_pb,
            coinsEarned=coins_earned
        )
        db.session.add(history_entry)
        db.session.commit()
 
        return jsonify({
            "status":   "success",
            "isPB":     is_new_pb,
            "newRank":  player.rankLevel,
            "new_balances": {
                "coinBalance":     player.coinBalance,
                "xpTotal":         player.xpTotal,
                "unlockedLevels":  player.finLevels,
            }
        }), 200
 
    except ValueError as val_err:
        db.session.rollback()
        return jsonify({"message": str(val_err)}), 400